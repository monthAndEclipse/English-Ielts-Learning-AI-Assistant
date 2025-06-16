"""
消息发布器
负责向RabbitMQ发送消息
"""
import json
import logging
from typing import Dict, Any
from aio_pika import Message, DeliveryMode
from .connection_manager import RabbitMQConnectionManager
from app.schemas.mq_schema import TranslationResult, EventType, QueueConfig

logger = logging.getLogger(__name__)


class MessagePublisher:
    """消息发布器"""

    def __init__(self, connection_manager: RabbitMQConnectionManager):
        self.connection_manager = connection_manager

    async def publish_message(
            self,
            queue_name: str,
            message_body: Dict[str, Any],
            routing_key: str = None,
            exchange_name: str = ""
    ) -> bool:
        """
        发布消息到指定队列

        Args:
            queue_name: 队列名称
            message_body: 消息体
            routing_key: 路由键，默认使用队列名
            exchange_name: 交换器名称，默认为空

        Returns:
            bool: 发送成功返回True
        """
        try:
            channel = await self.connection_manager.get_channel()

            # 声明队列（确保队列存在）
            await channel.declare_queue(
                queue_name,
                durable=True,  # 队列持久化
                auto_delete=False
            )

            # 构建消息
            message = Message(
                json.dumps(message_body, ensure_ascii=False).encode('utf-8'),
                delivery_mode=DeliveryMode.PERSISTENT,  # 消息持久化
                content_type='application/json',
                content_encoding='utf-8'
            )

            # 发送消息
            await channel.default_exchange.publish(
                message,
                routing_key=routing_key or queue_name
            )

            logger.info(f"消息已发送到队列 {queue_name}: {message_body.get('uuid', 'unknown')}")
            return True

        except Exception as e:
            logger.error(f"发送消息到队列 {queue_name} 失败: {e}")
            return False

    async def publish_translation_result(
            self,
            event_type: EventType,
            result: TranslationResult
    ) -> bool:
        """
        发布翻译结果消息

        Args:
            event_type: 事件类型
            result: 翻译结果

        Returns:
            bool: 发送成功返回True
        """
        queue_name = QueueConfig.get_result_queue(event_type)
        message_body = result.dict()

        return await self.publish_message(queue_name, message_body)

    async def publish_error_message(
            self,
            error_queue: str,
            original_message: Dict[str, Any],
            error_info: str
    ) -> bool:
        """
        发布错误消息

        Args:
            error_queue: 错误队列名称
            original_message: 原始消息
            error_info: 错误信息

        Returns:
            bool: 发送成功返回True
        """
        error_message = {
            "original_message": original_message,
            "error": error_info,
            "error_time": logging.Formatter().formatTime(logging.LogRecord(
                name="", level=0, pathname="", lineno=0, msg="", args=(), exc_info=None
            ))
        }

        return await self.publish_message(error_queue, error_message)