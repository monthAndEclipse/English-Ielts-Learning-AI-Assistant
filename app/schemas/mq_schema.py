"""
消息模型定义
定义所有消息队列中使用的数据结构
"""
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
from enum import Enum

class EventType(str, Enum):
    """事件类型枚举"""
    IMAGE_TRANSLATION = "image_translation"
    DOC_TRANSLATION = "doc_translation"
    VIDEO_TRANSLATION = "video_translation"


class TranslationRequest(BaseModel):
    """翻译请求消息体"""
    file_path: str = Field(..., description="文件路径")
    filename: str = Field(..., description="文件名")
    user_id: str = Field(..., description="user_id")
    uuid: str = Field(..., description="任务ID")
    event_type: EventType = Field(..., description="事件类型")
    prompt_template: str = Field(..., description="提示模板")
    target_language: str = Field(..., description="目标语言")
    instruction: Optional[str] = Field(..., description="额外指令")
    start_time: Optional[str] = Field(..., description="发起时间 YYYY-MM-DD HH24:mm:SS")

    class Config:
        use_enum_values = True


class TranslationContent(BaseModel):
    """翻译内容数据结构"""
    texts: List[str] = Field(..., description="待翻译文本列表")


class TranslationResult(BaseModel):
    """翻译结果消息体"""
    uuid: str = Field(..., description="任务ID")
    user_id: str = Field(..., description="user_id")
    file_path: str = Field(..., description="新的文件路径")
    translation_end_time: str = Field(..., description="翻译结束时间 YYYY-MM-DD HH24:mm:SS")


class QueueConfig:
    """队列配置"""
    # 输入队列
    C_TRANSLATION_QUEUE = "llm.translation.queue"

    # 结果队列映射
    P_RESULT_QUEUES = {
        EventType.DOC_TRANSLATION: "doc.translation.result.queue",
        EventType.IMAGE_TRANSLATION: "image.translation.result.queue",
        EventType.VIDEO_TRANSLATION: "video.translation.result.queue",
    }
