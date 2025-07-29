from fastapi import APIRouter, Depends, HTTPException, Query, Body, status
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


@router.put("/{vital_id}", response_model=schemas.VitalsOut)
def update_vital(
    vital_id: int,
    user_id: int = Query(..., description="TEMP: pass current user id until auth is wired"),
    payload: schemas.VitalUpdate = Body(...),
    db: Session = Depends(get_db),
):
    v = db.query(models.Vital).filter(models.Vital.id == vital_id).first()
    if not v or v.user_id != user_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vital not found")

    for field, value in payload.dict(exclude_unset=True).items():
        setattr(v, field, value)

    db.commit()
    db.refresh(v)
    return v


@router.delete("/{vital_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_vital(
    vital_id: int,
    user_id: int = Query(...),
    db: Session = Depends(get_db),
):
    v = db.query(models.Vital).filter(models.Vital.id == vital_id).first()
    if not v or v.user_id != user_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vital not found")

    db.delete(v)
    db.commit()
    return