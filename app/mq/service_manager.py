"""
服务管理器
使用单例模式管理RabbitMQ服务实例，确保全局只有一个连接
"""
import asyncio
import logging
from typing import Optional, Callable
from .rabbitmq_service import RabbitMQService
from app.schemas.mq_schema import TranslationRequest, TranslationResult, EventType
from app.config import get_settings

logger = logging.getLogger(__name__)


class ServiceManager:
    """服务管理器 - 单例模式"""

    _instance: Optional['ServiceManager'] = None
    _lock = asyncio.Lock()

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    def __init__(self):
        # 防止重复初始化
        if hasattr(self, '_initialized'):
            return

        self._rabbitmq_service: Optional[RabbitMQService] = None
        self._initialized = False
        self._translation_handler: Optional[Callable] = None

    async def initialize(self) -> None:
        """初始化服务管理器"""
        settings = get_settings()
        async with self._lock:
            if self._initialized:
                return

            try:
                # 创建RabbitMQ服务实例
                self._rabbitmq_service = RabbitMQService(
                    host=settings.host,
                    port=settings.port,
                    username=settings.username,
                    password=settings.password,
                    virtual_host=settings.virtual_host
                )

                await self._rabbitmq_service.initialize()
                self._initialized = True
                logger.info("服务管理器初始化成功")

            except Exception as e:
                logger.error(f"服务管理器初始化失败: {e}")
                raise

    async def start_translation_service(
            self,
            translation_handler: Callable[[TranslationRequest], None]
    ) -> None:
        """
        启动翻译服务

        Args:
            translation_handler: 翻译处理函数
        """
        if not self._initialized:
            await self.initialize()

        self._translation_handler = translation_handler
        await self._rabbitmq_service.start_translation_service(
            translation_handler,
            get_settings().max_concurrent_messages
        )
        logger.info("翻译服务已启动")

    async def publish_translation_result(
            self,
            event_type: EventType,
            result: TranslationResult
    ) -> bool:
        """发布翻译结果"""
        if not self._initialized:
            await self.initialize()

        return await self._rabbitmq_service.publish_translation_result(event_type, result)

    async def health_check(self) -> bool:
        """健康检查"""
        if not self._initialized:
            return False

        return await self._rabbitmq_service.health_check()

    async def stop(self) -> None:
        """停止服务"""
        if self._rabbitmq_service:
            await self._rabbitmq_service.stop()
        self._initialized = False
        logger.info("服务管理器已停止")

    @property
    def is_initialized(self) -> bool:
        """检查是否已初始化"""
        return self._initialized


# 全局服务管理器实例
service_manager = ServiceManager()