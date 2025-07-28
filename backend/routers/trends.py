from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

import models, schemas
from database import get_db

router = APIRouter(prefix="/vitals", tags=["trends"])

def _date_window(range_param: str):
    if range_param == "7d":
        return datetime.utcnow() - timedelta(days=7)
    if range_param == "30d":
        return datetime.utcnow() - timedelta(days=30)
    return None  # all

@router.get("/trends", response_model=schemas.TrendsResponse)
def get_trends(
    user_id: int = Query(1),
    range: str = Query("7d", enum=["7d", "30d", "all"]),
    db: Session = Depends(get_db),
):
    start = _date_window(range)

    q = (
        db.query(models.Vital)
        .filter(models.Vital.user_id == user_id)
        .order_by(models.Vital.recorded_at.asc())
    )
    if start:
        q = q.filter(models.Vital.recorded_at >= start)

    rows = q.all()

    # Build points + 7-point rolling systolic avg
    points = []
    window = []
    for v in rows:
        if v.systolic_bp is not None:
            window.append(v.systolic_bp)
            if len(window) > 7:
                window.pop(0)
            systolic_roll7 = sum(window) / len(window)
        else:
            systolic_roll7 = None

        points.append(
            schemas.TrendPoint(
                date=v.recorded_at,
                systolic=v.systolic_bp,
                diastolic=v.diastolic_bp,
                heart_rate=v.heart_rate,
                temperature=v.temperature,
                systolic_roll7=round(systolic_roll7, 1) if systolic_roll7 else None,
            )
        )

    return schemas.TrendsResponse(points=points)
