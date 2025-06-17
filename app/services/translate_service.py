from app.schemas.mq_schema import TranslationRequest
import logging
from app.llm_client.factory import get_llm_client
from app.config import get_settings
from app.db.database import get_session
from app.services.db.translation_task_service import create_translation_task,update_translation_complete,update_translation_start
from app.utils.storage_utils import download_file_text_from_storage
from app.utils.texts_utils import split_json_chunks,format_prompts

logger = logging.getLogger(__name__)

class TranslateService:

    # 定义消息处理函数
    def __init__(self):
        self.db_session = None
        self.settings = None
        self.client = None

    # 处理翻译逻辑
    async def translate_wrapper(self,payload: TranslationRequest):
        try:
            self.settings = get_settings()
            self.client = get_llm_client(self.settings.llm_default_provider,self.settings.llm_default_model)
            self.db_session = get_session()

            task_id = payload.uuid
            # 步骤1: 创建任务记录
            create_translation_task(self.db_session,payload)
            # 步骤2: 下载并解析内容文件
            original_json = await download_file_text_from_storage(payload.file_path,payload.jwt)
            if not original_json:
                update_translation_complete(self.db_session,task_id, error_message="内容文件为空")
                return False
            chunks = split_json_chunks(original_json,self.settings.llm_prompt_max_chars)

            if not chunks:
                update_translation_complete(self.db_session,task_id, error_message="文本切割后为空")
                return False
            prompts = format_prompts(chunks, payload.prompt_template)

            # 步骤5&6: 开启并发控制并记录到数据库 (技术细节第5-6点)
            logger.info(f"[步骤5-6] 开始并发翻译，更新数据库状态")
            update_translation_start(self.db_session,task_id)

            logger.info(f"翻译任务完成: {task_id}")
            return True

        except Exception as e:
            logger.error(f"翻译任务处理失败: {task_id}, 错误: {e}")
            update_translation_complete(task_id, error_message=str(e))
            return False


async def handle_translation_request(request: TranslationRequest) -> None:
    await TranslateService().translate_wrapper(request)