from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func

import models, schemas
from database import get_db

router = APIRouter(prefix="/vitals", tags=["summary"])

def _date_window(range_param: str):
    if range_param == "7d":
        return datetime.utcnow() - timedelta(days=7)
    if range_param == "30d":
        return datetime.utcnow() - timedelta(days=30)
    return None  # all

@router.get("/summary", response_model=schemas.SummaryResponse)
def get_summary(
    user_id: int = Query(1, description="TEMP: replace with current_user.id once you add auth"),
    range: str = Query("7d", enum=["7d", "30d", "all"]),
    db: Session = Depends(get_db),
):
    start = _date_window(range)

    q = db.query(models.Vital).filter(models.Vital.user_id == user_id)
    if start:
        q = q.filter(models.Vital.recorded_at >= start)

    vitals = q.all()

    if not vitals:
        return schemas.SummaryResponse(
            avg_bp=None,
            max_hr=None,
            avg_temp=None,
            temp_trend=None,
            entries_this_week=0,
            last_entry_at=None,
            flagged_entries=0,
        )

    # Compute averages
    systolics = [v.systolic_bp for v in vitals if v.systolic_bp is not None]
    diastolics = [v.diastolic_bp for v in vitals if v.diastolic_bp is not None]
    heart_rates = [v.heart_rate for v in vitals if v.heart_rate is not None]
    temperatures = [v.temperature for v in vitals if v.temperature is not None]

    avg_bp = None
    if systolics and diastolics:
        avg_bp = schemas.AvgBP(
            systolic=round(sum(systolics) / len(systolics), 1),
            diastolic=round(sum(diastolics) / len(diastolics), 1),
        )

    max_hr = max(heart_rates) if heart_rates else None
    avg_temp = round(sum(temperatures) / len(temperatures), 1) if temperatures else None

    # temp trend: compare avg temp last N days vs previous N days (same window length)
    temp_trend = None
    if range in ["7d", "30d"] and temperatures:
        window_days = 7 if range == "7d" else 30
        now = datetime.utcnow()
        prev_start = now - timedelta(days=2 * window_days)
        mid = now - timedelta(days=window_days)

        prev_q = db.query(models.Vital).filter(
            models.Vital.user_id == user_id,
            models.Vital.recorded_at >= prev_start,
            models.Vital.recorded_at < mid,
            models.Vital.temperature.isnot(None),
        )
        curr_q = db.query(models.Vital).filter(
            models.Vital.user_id == user_id,
            models.Vital.recorded_at >= mid,
            models.Vital.temperature.isnot(None),
        )

        prev_vals = [v.temperature for v in prev_q.all()]
        curr_vals = [v.temperature for v in curr_q.all()]

        if prev_vals and curr_vals:
            if sum(curr_vals) / len(curr_vals) > sum(prev_vals) / len(prev_vals):
                temp_trend = "up"
            else:
                temp_trend = "down"

    # entries this week
    week_start = datetime.utcnow() - timedelta(days=7)
    entries_this_week = (
        db.query(models.Vital)
        .filter(models.Vital.user_id == user_id, models.Vital.recorded_at >= week_start)
        .count()
    )

    # last entry
    last_entry_at = max(v.recorded_at for v in vitals)

    # flagged entries: simple heuristic
    flagged_entries = sum(
        1 for v in vitals if
        (v.systolic_bp is not None and v.systolic_bp >= 140) or
        (v.temperature is not None and v.temperature >= 100.4)
    )

    return schemas.SummaryResponse(
        avg_bp=avg_bp,
        max_hr=max_hr,
        avg_temp=avg_temp,
        temp_trend=temp_trend,
        entries_this_week=entries_this_week,
        last_entry_at=last_entry_at,
        flagged_entries=flagged_entries,
    )
