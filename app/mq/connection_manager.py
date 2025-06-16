"""
RabbitMQ连接管理器
负责管理RabbitMQ连接的创建、维护和释放
"""
import asyncio
import logging
from typing import Optional
from aio_pika import connect_robust, Connection, Channel
from aio_pika.abc import AbstractRobustConnection
from urllib.parse import quote_plus

logger = logging.getLogger(__name__)


class RabbitMQConnectionManager:
    """RabbitMQ连接管理器"""

    def __init__(self, host: str, port: int, username: str, password: str, virtual_host: str = "/"):
        self.host = host
        self.port = port
        self.username = username
        self.password = password
        self.virtual_host = virtual_host
        self._connection: Optional[AbstractRobustConnection] = None
        self._channel: Optional[Channel] = None
        self._connection_lock = asyncio.Lock()

    @property
    def connection_url(self) -> str:
        """构建连接URL"""
        return (
            f"amqp://{quote_plus(self.username)}:{quote_plus(self.password)}"
            f"@{self.host}:{self.port}{self.virtual_host}"
        )

    async def connect(self) -> None:
        """建立连接"""
        async with self._connection_lock:
            if self._connection is None or self._connection.is_closed:
                try:
                    logger.info(f"正在连接到RabbitMQ: {self.host}:{self.port}")
                    self._connection = await connect_robust(
                        self.connection_url,
                        heartbeat=30,
                        blocked_connection_timeout=300,
                    )
                    logger.info("RabbitMQ连接成功建立")
                except Exception as e:
                    logger.error(f"RabbitMQ连接失败: {e}")
                    raise

    async def get_channel(self) -> Channel:
        """获取频道"""
        if self._connection is None or self._connection.is_closed:
            await self.connect()

        if self._channel is None or self._channel.is_closed:
            self._channel = await self._connection.channel()
            # 设置QoS，控制未确认消息数量
            await self._channel.set_qos(prefetch_count=10)
            logger.info("RabbitMQ频道创建成功")

        return self._channel

    async def close(self) -> None:
        """关闭连接"""
        if self._channel and not self._channel.is_closed:
            await self._channel.close()
            logger.info("RabbitMQ频道已关闭")

        if self._connection and not self._connection.is_closed:
            await self._connection.close()
            logger.info("RabbitMQ连接已关闭")

    async def is_connected(self) -> bool:
        """检查连接状态"""
        return (
                self._connection is not None
                and not self._connection.is_closed
                and self._channel is not None
                and not self._channel.is_closed
        )