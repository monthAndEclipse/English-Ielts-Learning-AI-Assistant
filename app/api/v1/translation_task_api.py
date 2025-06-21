from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session
from uuid import UUID

from app.db.database import get_session
from app.schemas.translation_task import TranslationTaskCreate, TranslationTaskRead

router = APIRouter(prefix="/translation_tasks", tags=["TranslationTasks"])

@router.post("/", response_model=TranslationTaskRead)
def create(data: TranslationTaskCreate, session: Session = Depends(get_session)):
    pass

@router.get("/", response_model=list[TranslationTaskRead])
def list_all(session: Session = Depends(get_session)):
    pass
@router.get("/{obj_id}", response_model=TranslationTaskRead)
def get_one(obj_id: UUID, session: Session = Depends(get_session)):
    pass

@router.put("/{obj_id}", response_model=TranslationTaskRead)
def update_one(obj_id: UUID, data: TranslationTaskCreate, session: Session = Depends(get_session)):
    pass

@router.delete("/{obj_id}")
def delete_one(obj_id: UUID, session: Session = Depends(get_session)):
    pass