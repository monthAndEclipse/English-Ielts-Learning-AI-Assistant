from pydantic_settings import BaseSettings
from pydantic import  Field
from app.utils.consul_utils import get_config
import os

"""
统一配置，有些是os.getenv 有些是从consul获取的，统一在这里调整吧
不是和启动强关联的配置项，有些不敏感的可以存consul,有些敏感的直接os.getenv()
"""
class Settings(BaseSettings):
    # 应用配置
    app_name: str = "LLM Service"
    app_version: str = "1.0.0"
    debug: bool = False

    # 云存储服务配置
    storage_service_container: str = Field(default="placeholder")

    """RabbitMQ配置"""
    host: str = Field(default="localhost")
    port: int =  Field(default=5672)
    username: str = Field(default="admin")
    password: str = Field(default="admin")
    virtual_host: str = Field(default="/")

    # 连接配置
    heartbeat: int = Field(default=30)
    blocked_connection_timeout: int = Field(default=300)

    # 消费者配置
    max_concurrent_messages: int = Field(default=5)
    prefetch_count: int = Field(default=10)

    # 翻译服务配置
    max_concurrent_translations: int = Field(default=3)
    max_chunk_size: int = Field(default=1000)

    def load_lazy(self):
        self.max_concurrent_messages = int(get_config("/max_concurrent_messages", self.max_concurrent_messages))
        self.prefetch_count = int(get_config("/prefetch_count", self.prefetch_count))
        self.max_concurrent_translations = int(get_config("/max_concurrent_translations", self.max_concurrent_translations))
        self.max_chunk_size = int(get_config("/max_chunk_size", self.max_chunk_size))
        self.virtual_host = get_config("/virtual_host", "/")
        self.storage_service_container = get_config("/storage_service_container", self.storage_service_container)
        """RabbitMQ配置"""
        self.host: str = os.getenv("RABBITMQ_HOST")
        self.port: int = int(os.getenv("RABBITMQ_PORT"))
        self.username: str = os.getenv("RABBITMQ_USERNAME")
        self.password: str = os.getenv("RABBITMQ_PASSWORD")

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


def get_settings():
    settings = Settings()
    # 全局配置实例,延迟加载
    settings.load_lazy()
    return settings