from app.schemas.mq_schema import TranslationRequest, EventType, TranslationResult
import logging
from app.llm_client.factory import get_llm_client
from app.config import get_settings
from app.schemas.mq_schema import QueueConfig
from app.services.db.translation_task_service import create_translation_task, update_translation_task_fields
from app.utils.storage_utils import download_file_text_from_storage_sync, upload_file_to_storage_sync
from app.utils.texts_utils import split_json_chunks, format_prompts
import json
from typing import List
import asyncio
from app.mq.service_manager import service_manager
from datetime import datetime, timezone
from app.schemas.translation_task import TaskStatus

logger = logging.getLogger(__name__)


class TranslateService:
    # 定义消息处理函数
    def __init__(self):
        self.settings = get_settings()
        self.client = get_llm_client(self.settings.llm_default_provider, self.settings.llm_default_model)

    async def create_task_record(self, payload: TranslationRequest) -> bool:
        """创建任务记录"""
        try:
            create_translation_task(payload)
            logger.info(f"任务记录创建成功: {payload.uuid}")
            return True
        except Exception as e:
            logger.error(f"创建任务记录失败: {payload.uuid}, 错误: {e}")
            logger.exception("创建任务记录失败")
            return False

    def run_translation_in_background(self, payload: TranslationRequest):
        """
        在当前事件循环中异步运行翻译任务。
        这样可以确保 aio_pika 和其他资源都在同一个 loop 中运行。
        """
        try:
            # 获取当前事件循环
            loop = asyncio.get_event_loop()
            # 创建后台任务，不阻塞主流程（如MQ ack）
            loop.create_task(self.execute_translation_task(payload))
            logger.info(f"翻译任务已提交到后台执行: {payload.uuid}")
        except Exception as e:
            logger.exception(f"事件循环异常")

    async def execute_translation_task(self, payload: TranslationRequest) -> bool:
        """执行实际的翻译任务"""
        task_id = payload.uuid
        try:
            # 步骤1: 下载并解析内容文件
            original_json = download_file_text_from_storage_sync(payload.file_path, payload.jwt)
            if not original_json:
                update_translation_task_fields(task_id, {"status":TaskStatus.FAIL,"error_message":"内容文件为空"})
                return False
            # 切割
            chunks = split_json_chunks(original_json["texts"], self.settings.llm_prompt_max_chars)
            if not chunks:
                update_translation_task_fields(task_id, {"status":TaskStatus.FAIL,"error_message": "文本切割后为空"})
                return False
            # 拼成一个个成品prompt
            prompts = format_prompts(chunks, payload.prompt_template)
            logger.info(f"prompts:{prompts}")
            # 并发翻译
            update_translation_task_fields(task_id, {
                "translation_start_time": datetime.now(timezone.utc).isoformat(),
                "status": TaskStatus.PROCESSING
            })
            translated_contents = await self.translate_large_text(prompts)
            # 填回原内容
            original_json["texts"] = translated_contents
            # 转成字符数组上传
            object_info = upload_file_to_storage_sync(payload.jwt,
                                                      json.dumps(original_json, ensure_ascii=False).encode("utf-8"),
                                                      f"translated_{payload.filename}")
            # 更新数据库
            if not object_info or not object_info["data"]:
                update_translation_task_fields(task_id, {"status":TaskStatus.FAIL,"error_message": "翻译后的文件上传云存储失败"})
                return False

            # 发送完成的消息到mq
            result = json.dumps(TranslationResult(
                uuid=payload.uuid,
                jwt=payload.jwt,
                file_path=object_info["data"]["file_path"],
                translation_end_time=datetime.now(timezone.utc).isoformat()
            ).model_dump(),ensure_ascii=False)

            if payload.event_type.lower() ==  EventType.DOC_TRANSLATION :
                await service_manager.publish_msg(QueueConfig.P_RESULT_QUEUES[EventType.DOC_TRANSLATION], result)
            elif payload.event_type.lower() ==  EventType.IMAGE_TRANSLATION :
                await service_manager.publish_msg(QueueConfig.P_RESULT_QUEUES[EventType.IMAGE_TRANSLATION], result)
            elif payload.event_type.lower() == EventType.VIDEO_TRANSLATION:
                await service_manager.publish_msg(QueueConfig.P_RESULT_QUEUES[EventType.VIDEO_TRANSLATION],result)
            update_translation_task_fields(task_id, {
                "result_file_path": object_info["data"]["file_path"],
                "status": TaskStatus.COMPLETE,
                "translation_end_time": datetime.now(timezone.utc).isoformat()
            })
            logger.info(f"翻译任务完成: {task_id}")
            return True
        except Exception as e:
            logger.exception(f"翻译任务处理失败详情")
            update_translation_task_fields(task_id, {
                "error_message": f"{str(e)}",
                "status":TaskStatus.FAIL
                })
            return False

    async def translate_large_text(self, prompts: List[str]):
        max_concurrent_tasks = int(self.settings.llm_max_concurrent_task)
        semaphore = asyncio.Semaphore(max_concurrent_tasks)
        tasks = [
            self.translate_prompt_with_semaphore(prompt, semaphore)
            for prompt in prompts
        ]
        translated_prompts = await asyncio.gather(*tasks)
        # 合并翻译结果
        final_result = []
        for prompt_result in translated_prompts:
            try:
                # 每个prompt_result是一个包含 "translation" 字段的JSON字符串
                parsed = json.loads(prompt_result)
                final_result.extend(parsed.get("translation", []))
            except json.JSONDecodeError as e:
                logger.error(f"解析失败：{prompt_result}")
                # 有一个失败说明某一段其实没翻译完成，其实也算整体失败了，继续往外抛
                raise e
        return final_result

    # 加上 semaphore 的受控任务
    async def translate_prompt_with_semaphore(self, prompt, semaphore):
        async with semaphore:
            return await self.retry_translate(prompt)

    # 异步重试逻辑
    async def retry_translate(self, prompt):
        retries = int(self.settings.llm_max_retries)
        retry_delay = int(self.settings.llm_retry_delay)
        for attempt in range(1, retries + 1):
            try:
                result = await asyncio.to_thread(self.client.translate, prompt)
                return result
            except Exception as e:
                logger.error(f"翻译失败（尝试 {attempt}/{retries}）：{e}")
                logger.exception(f"翻译失败详情")
                if attempt < retries:
                    retry_delay = int(retry_delay)
                    await asyncio.sleep(retry_delay)
                    continue
                else:
                    # 继续向外抛
                    raise e
        return None

    def __del__(self):
        pass

# 创建全局服务实例
translate_service = TranslateService()


async def handle_translation_request(request: TranslationRequest) -> None:
    try:
        #立即创建任务记录入库,task_id唯一，这里后期可以考虑加入分布式锁，但数据库压力感觉不会太大
        task_created = await translate_service.create_task_record(request)
        if not task_created:
            logger.error(f"入库失败")
            return
        # 启动后台线程处理翻译任务
        translate_service.run_translation_in_background(request)
        # 立即返回成功响应
        logger.info(f"翻译请求已接收并开始处理: {request.uuid}")
    except Exception as e:
        logger.error(f"处理翻译请求异常: {getattr(request, 'uuid', 'unknown')}, 错误: {e}")
