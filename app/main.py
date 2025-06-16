from fastapi import FastAPI
# from app.api.v1.storage_router import router as store_router
from app.utils.consul_utils import ConsulServiceRegistrar, set_global_config
from sqlmodel import SQLModel
from contextlib import asynccontextmanager
from app.db.database import engine
from app.db.models import *
import os
# 导入RabbitMQ相关模块
from app.utils.rabbitmq_utils import (
    init_rabbitmq,
    start_translation_listener,
    send_translation_result,
    check_rabbitmq_health,
    stop_rabbitmq,
    is_rabbitmq_ready
)
from app.schemas.mq_schema import TranslationRequest, EventType
import logging
from app.services.translate_service import handle_translation_request

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """FastAPI 应用生命周期管理"""
    logger.info("启动应用...")
    try:
        # 数据库初始化
        SQLModel.metadata.create_all(engine)
        # 初始化RabbitMQ
        await init_rabbitmq()

        # 启动翻译服务监听器
        await start_translation_listener(handle_translation_request)

        logger.info("应用启动完成")
        yield

    except Exception as e:
        logger.error(f"应用启动失败: {e}")
        raise
    finally:
        # 应用关闭时执行
        logger.info("关闭应用...")
        await stop_rabbitmq()
        logger.info("应用已关闭")

app = FastAPI(lifespan=lifespan)

# 启动 Consul 注册 + 配置拉取
consul_client = ConsulServiceRegistrar(
    service_name=os.getenv("SERVICE_NAME"),
    service_port=int(os.getenv("SERVICE_PORT")),
    consul_host=os.getenv("CONSUL_HOST"),
    config_prefix=os.getenv("CONSUL_CONFIG_PREFIX"),
    update_interval=59,
    hostname=os.getenv("HOSTNAME"),
)
consul_client.register_service()
consul_client.start_config_updater()
set_global_config(consul_client)

#路由设置
# app.include_router(log_router, prefix="/api/v1/log", tags=["Logs"])

# uvicorn app.main:app --reload
# pip freeze > requirements.txt

