# """
# RabbitMQ模块初始化文件
# 导出主要的类和函数供外部使用
# """
#
# from .connection_manager import RabbitMQConnectionManager
# from .message_publisher import MessagePublisher
# from .message_consumer import MessageConsumer
# from .rabbitmq_service import RabbitMQService
# from app.schemas.mq_schema import (
#     TranslationRequest,
#     TranslationResult,
#     TranslationContent,
#     EventType,
#     QueueConfig
# )
#
# __all__ = [
#     # 核心服务类
#     "RabbitMQService",
#     "RabbitMQConnectionManager",
#     "MessagePublisher",
#     "MessageConsumer",
#
#     # 数据模型
#     "TranslationRequest",
#     "TranslationResult",
#     "TranslationContent",
#     "EventType",
#     "QueueConfig",
#
#     # 配置
#     "config",
#     "RabbitMQConfig",
#     "AppConfig"
# ]
#
# __version__ = "1.0.0"
# __author__ = "LLM Translation Service Team"