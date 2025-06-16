"""
RabbitMQ 工具函数
提供便捷的函数接口，简化使用
"""
import logging
from typing import Callable
from app.mq.service_manager import service_manager
from app.schemas.mq_schema import TranslationRequest, TranslationResult, EventType

logger = logging.getLogger(__name__)


async def init_rabbitmq() -> None:
    """
    初始化RabbitMQ服务
    应用启动时调用一次即可
    """
    await service_manager.initialize()
    logger.info("RabbitMQ服务初始化完成")


async def start_translation_listener(
        translation_handler: Callable[[TranslationRequest], None]
) -> None:
    """
    启动翻译消息监听器

    Args:
        translation_handler: 翻译处理函数
    """
    await service_manager.start_translation_service(translation_handler)


async def send_translation_result(
        event_type: EventType,
        task_id: str,
        jwt_token: str,
        file_path: str,
        end_time: str
) -> bool:
    """
    发送翻译结果消息

    Args:
        event_type: 事件类型
        task_id: 任务ID
        jwt_token: JWT token
        file_path: 文件路径
        end_time: 结束时间

    Returns:
        bool: 发送成功返回True
    """
    result = TranslationResult(
        uuid=task_id,
        jwt=jwt_token,
        file_path=file_path,
        translation_end_time=end_time
    )

    return await service_manager.publish_translation_result(event_type, result)


async def check_rabbitmq_health() -> bool:
    """
    检查RabbitMQ服务健康状态

    Returns:
        bool: 健康返回True
    """
    return await service_manager.health_check()


async def stop_rabbitmq() -> None:
    """
    停止RabbitMQ服务
    应用关闭时调用
    """
    await service_manager.stop()
    logger.info("RabbitMQ服务已停止")


def is_rabbitmq_ready() -> bool:
    """
    检查RabbitMQ是否已准备就绪

    Returns:
        bool: 已初始化返回True
    """
    return service_manager.is_initialized