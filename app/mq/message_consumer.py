"""
消息消费器
负责监听RabbitMQ队列并处理接收到的消息
"""
import json
import logging
import asyncio
from typing import Callable, Optional, Dict, Any
from aio_pika import IncomingMessage
from aio_pika.abc import AbstractIncomingMessage
from .connection_manager import RabbitMQConnectionManager
from app.schemas.mq_schema import TranslationRequest, QueueConfig

logger = logging.getLogger(__name__)

MAX_RETRY = 3

class MessageConsumer:
    """消息消费器"""

    def __init__(self, connection_manager: RabbitMQConnectionManager):
        self.connection_manager = connection_manager
        self._consuming = False
        self._consumer_tags: Dict[str, str] = {}

    async def start_consuming(
            self,
            queue_name: str,
            message_handler: Callable[[TranslationRequest], None],
            max_concurrent_messages: int = 5
    ) -> None:
        """
        开始消费指定队列的消息

        Args:
            queue_name: 队列名称
            message_handler: 消息处理函数
            max_concurrent_messages: 最大并发处理消息数
        """
        if self._consuming:
            logger.warning(f"队列 {queue_name} 已在消费中")
            return

        try:
            channel = await self.connection_manager.get_channel()

            # 声明队列
            queue = await channel.declare_queue(
                queue_name,
                durable=True,
                auto_delete=False
            )

            # 设置QoS，控制并发数量
            await channel.set_qos(prefetch_count=max_concurrent_messages)

            # 创建消息处理函数的包装器
            async def message_wrapper(message: AbstractIncomingMessage):
                await self._process_message(message, message_handler)

            # 开始消费
            consumer_tag = await queue.consume(message_wrapper)
            self._consumer_tags[queue_name] = consumer_tag
            self._consuming = True

            logger.info(f"开始消费队列 {queue_name}，最大并发数: {max_concurrent_messages}")

        except Exception as e:
            logger.error(f"开始消费队列 {queue_name} 失败: {e}")
            raise

    async def _process_message(
            self,
            message: AbstractIncomingMessage,
            handler: Callable[[TranslationRequest], None]
    ) -> None:
        """
        处理单个消息

        Args:
            message: 接收到的消息
            handler: 消息处理函数
        """
        try:
            # 解析消息体
            message_body = json.loads(message.body.decode('utf-8'))
            logger.info(f"接收到消息: {message_body.get('uuid', 'unknown')}")

            # 验证消息格式
            translation_request = TranslationRequest(**message_body)

            # 调用处理函数（异步处理）
            if asyncio.iscoroutinefunction(handler):
                await handler(translation_request)
            else:
                # 如果处理函数不是协程，在线程池中执行
                loop = asyncio.get_event_loop()
                await loop.run_in_executor(None, handler, translation_request)

            # 确认消息
            await message.ack()
            logger.info(f"消息处理完成: {translation_request.uuid}")

        except json.JSONDecodeError as e:
            logger.error(f"消息JSON解析失败: {e}")
            await message.reject(requeue=False)  # 不重新入队

        except Exception as e:
            body = json.loads(message.body.decode('utf-8'))
            retry_count = body.get("retry_count", 0)
            if retry_count < MAX_RETRY:
                body["retry_count"] = retry_count + 1
                logger.warning(f"消息重试中，第 {body['retry_count']} 次: {e}")
                await message.reject(requeue=False)
                # 重新投递消息（模拟重试）
                await self._retry_publish(body, message.routing_key)
            else:
                logger.error(f"消息超过最大重试次数，丢弃: {e}")
                await message.reject(requeue=False)  # 可进入死信队列

    async def start_translation_consumer(
            self,
            message_handler: Callable[[TranslationRequest], None],
            max_concurrent_messages: int = 5
    ) -> None:
        """
        开始消费翻译队列

        Args:
            message_handler: 消息处理函数
            max_concurrent_messages: 最大并发处理消息数
        """
        await self.start_consuming(
            QueueConfig.TRANSLATION_QUEUE,
            message_handler,
            max_concurrent_messages
        )

    async def stop_consuming(self, queue_name: Optional[str] = None) -> None:
        """
        停止消费

        Args:
            queue_name: 队列名称，为None时停止所有消费
        """
        try:
            channel = await self.connection_manager.get_channel()

            if queue_name:
                # 停止特定队列的消费
                if queue_name in self._consumer_tags:
                    await channel.basic_cancel(self._consumer_tags[queue_name])
                    del self._consumer_tags[queue_name]
                    logger.info(f"停止消费队列: {queue_name}")
            else:
                # 停止所有队列的消费
                for queue, tag in self._consumer_tags.items():
                    await channel.basic_cancel(tag)
                    logger.info(f"停止消费队列: {queue}")
                self._consumer_tags.clear()
                self._consuming = False

        except Exception as e:
            logger.error(f"停止消费失败: {e}")

    @property
    def is_consuming(self) -> bool:
        """检查是否正在消费"""
        return self._consuming and len(self._consumer_tags) > 0