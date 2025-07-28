from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
import models, schemas
from datetime import datetime

router = APIRouter(
    prefix="/vitals",
    tags=["Vitals"]
)

@router.post("/", response_model=schemas.VitalsOut)
def create_vital(
    user_id: int,
    vital: schemas.VitalsCreate,
    db: Session = Depends(get_db)
):
    db_vital = models.Vital(
        user_id=user_id,
        recorded_at=vital.recorded_at,
        systolic_bp=vital.systolic_bp,
        diastolic_bp=vital.diastolic_bp,
        heart_rate=vital.heart_rate,
        temperature=vital.temperature,
        glucose=vital.glucose,
        notes=vital.notes,
        created_at=datetime.utcnow()
    )
    db.add(db_vital)
    db.commit()
    db.refresh(db_vital)
    return db_vital
