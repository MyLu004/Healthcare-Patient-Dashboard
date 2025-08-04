from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

import models, schemas, oauth2
from database import get_db

# PURPOSE : Returns a time series of all points for the frontend to plot trends.

# API router for /vitals endpoints, tagged "trends"
router = APIRouter(prefix="/vitals", tags=["trends"])

# helper function : returns the start data for a given range (7d, 30d, or all)
def _date_window(range_param: str):
    if range_param == "7d":
        return datetime.utcnow() - timedelta(days=7)
    if range_param == "30d":
        return datetime.utcnow() - timedelta(days=30)
    return None  # If 'all', return None to not filter by date

# GET /vitals/trends endpoint
# Returns vitals trend data (time series) for a user
@router.get("/trends", response_model=schemas.TrendsResponse)
def get_trends(
    current_user: models.User = Depends(oauth2.get_current_user),
    range: str = Query("7d", enum=["7d", "30d", "all"]),
    db: Session = Depends(get_db),
):
    
    user_id = current_user.id
    start = _date_window(range)

    # Build query: get all vitals for the user, sorted by date ascending
    q = (
        db.query(models.Vital)
        .filter(models.Vital.user_id == user_id)
        .order_by(models.Vital.recorded_at.asc())
    )

    # If start is set, only include records on or after that date
    if start:
        q = q.filter(models.Vital.recorded_at >= start)

    rows = q.all()

    # Build points + 7-point rolling systolic avg
    points = [] # list to store output points
    window = [] # rolling window for calculating average
    for v in rows:
        # update rolling window for systolic BP
        if v.systolic_bp is not None:
            window.append(v.systolic_bp)
            if len(window) > 7:
                window.pop(0)
            systolic_roll7 = sum(window) / len(window)
        else:
            systolic_roll7 = None

        # Create and append the TrendPoint for this record
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
    # Return all computed points as a TrendsResponse (ready for charting in frontend)
    return schemas.TrendsResponse(points=points)
