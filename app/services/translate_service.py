from app.schemas.mq_schema import TranslationRequest
import logging
logger = logging.getLogger(__name__)

class TranslateService:
    # 定义消息处理函数
    async def translate(self,request: TranslationRequest):
        # 处理翻译逻辑
        logger.info(f"in")


async def handle_translation_request(request: TranslationRequest) -> None:
    await TranslateService().translate(request)