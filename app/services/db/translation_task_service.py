import json
from datetime import datetime,timezone
from typing import Optional,Dict,Any
from sqlalchemy import update
from app.db.models.translation_task import  TranslationTask
from app.schemas.mq_schema import TranslationRequest
from sqlmodel import Session
import logging
from app.db.database import get_session
from app.schemas.translation_task import TaskStatus

logger = logging.getLogger(__name__)


def create_translation_task(session:Session,payload: TranslationRequest) -> TranslationTask:
    """创建翻译任务记录"""
    task = TranslationTask(
        task_id=payload.uuid,
        event_type=payload.event_type,
        prompt_template=payload.prompt_template,
        target_language=payload.target_language,
        instruction=payload.instruction,
        receive_time=datetime.now(timezone.utc).isoformat(),
        status=TaskStatus.PENDING,
        message_payload= json.dumps(payload.model_dump(), ensure_ascii=False)
    )
    session.add(task)
    logger.info(f"创建翻译任务记录: {task.task_id}")
    return task


def update_translation_task_fields(
    session:Session,
    task_id: str,
    fields_to_update: Dict[str, Any]
) -> bool:
    """
    Args:
        session: 会话
        task_id (str): 要更新的任务ID
        fields_to_update (Dict[str, Any]): 要更新的字段和值，如 {"status": "COMPLETE", "file_path": "/path/to/file"}
    Returns:
        bool: 是否成功更新
    """
    try:
        # 自动更新时间
        fields_to_update["updated_at"] = datetime.now()

        stmt = (
            update(TranslationTask)
            .where(TranslationTask.task_id == task_id)
            .values(**fields_to_update)
        )
        result = session.execute(stmt)
        logger.info(f"[更新任务] 成功更新 task_id={task_id}, 更新字段={list(fields_to_update.keys())}")
        return result.rowcount > 0
    except Exception as e:
        session.rollback()
        logger.error(f"[更新任务] 更新失败 task_id={task_id}: {e}")
        return False