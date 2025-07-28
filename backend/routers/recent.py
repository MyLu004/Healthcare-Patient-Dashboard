from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

import models, schemas
from database import get_db

router = APIRouter(prefix="/vitals", tags=["recent"])

@router.get("/recent", response_model=schemas.RecentResponse)
def get_recent(
    user_id: int = Query(1),
    limit: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db),
):
    rows = (
        db.query(models.Vital)
        .filter(models.Vital.user_id == user_id)
        .order_by(models.Vital.recorded_at.desc())
        .limit(limit)
        .all()
    )

    items = [
        schemas.RecentEntry(
            id=v.id,
            date=v.recorded_at,
            systolic=v.systolic_bp,
            diastolic=v.diastolic_bp,
            heart_rate=v.heart_rate,
            temperature=v.temperature,
            notes=v.notes,
        )
        for v in rows
    ]

    return schemas.RecentResponse(items=items)
