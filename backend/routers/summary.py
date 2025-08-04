from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func

import models, schemas, oauth2
from database import get_db


# the API router for vitals endpoints
router = APIRouter(prefix="/vitals", tags=["summary"])

# [Helper function] : get the date N days ago, or None for 'all'
def _date_window(range_param: str):
    if range_param == "7d":
        return datetime.utcnow() - timedelta(days=7)
    if range_param == "30d":
        return datetime.utcnow() - timedelta(days=30)
    return None  # all

# Main endpoint: Returns a summary of the user's vitals over a selected time range
@router.get("/summary", response_model=schemas.SummaryResponse)
def get_summary(
    current_user: models.User = Depends(oauth2.get_current_user),   # get user from auth token
    range: str = Query("7d", enum=["7d", "30d", "all"]),            # time window for the summary display
    db: Session = Depends(get_db),                                  # database session
):
    user_id = current_user.id
    start = _date_window(range) # Determine the start date for filtering

    # Query all vitals for this user (optionally filter by date window)
    q = db.query(models.Vital).filter(models.Vital.user_id == user_id)
    if start:
        q = q.filter(models.Vital.recorded_at >= start)
    vitals = q.all()

    # If there are no vitals, return an empty summary response
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

    # --- Compute averages and summary stats ---
    systolics = [v.systolic_bp for v in vitals if v.systolic_bp is not None]
    diastolics = [v.diastolic_bp for v in vitals if v.diastolic_bp is not None]
    heart_rates = [v.heart_rate for v in vitals if v.heart_rate is not None]
    temperatures = [v.temperature for v in vitals if v.temperature is not None]

    # Calculate average blood pressure, if enough data
    avg_bp = None
    if systolics and diastolics:
        avg_bp = schemas.AvgBP(
            systolic=round(sum(systolics) / len(systolics), 1),
            diastolic=round(sum(diastolics) / len(diastolics), 1),
        )
    
    # Maximum heart rate and average temperature
    max_hr = max(heart_rates) if heart_rates else None
    avg_temp = round(sum(temperatures) / len(temperatures), 1) if temperatures else None

    # --- Temperature trend calculation ---
    # Compares average temperature in this window vs previous window of same size
    temp_trend = None
    if range in ["7d", "30d"] and temperatures:
        window_days = 7 if range == "7d" else 30
        now = datetime.utcnow()
        prev_start = now - timedelta(days=2 * window_days)  # start of previous window
        mid = now - timedelta(days=window_days)             # start of current window

        # previous window query
        prev_q = db.query(models.Vital).filter(
            models.Vital.user_id == user_id,
            models.Vital.recorded_at >= prev_start,
            models.Vital.recorded_at < mid,
            models.Vital.temperature.isnot(None),
        )

        # Current window query
        curr_q = db.query(models.Vital).filter(
            models.Vital.user_id == user_id,
            models.Vital.recorded_at >= mid,
            models.Vital.temperature.isnot(None),
        )

        # List of previous and current window temperature values
        prev_vals = [v.temperature for v in prev_q.all()]
        curr_vals = [v.temperature for v in curr_q.all()]

        # Compare the two averages to set the trend
        if prev_vals and curr_vals:
            if sum(curr_vals) / len(curr_vals) > sum(prev_vals) / len(prev_vals):
                temp_trend = "up"
            else:
                temp_trend = "down"

      # --- Entries in the last week ---
    week_start = datetime.utcnow() - timedelta(days=7)
    entries_this_week = (
        db.query(models.Vital)
        .filter(models.Vital.user_id == user_id, models.Vital.recorded_at >= week_start)
        .count()
    )

    # --- Find the date/time of the latest entry ---
    last_entry_at = max(v.recorded_at for v in vitals)

    # --- Count "flagged" entries (e.g., high blood pressure or fever) ---
    flagged_entries = sum(
        1 for v in vitals if
        (v.systolic_bp is not None and v.systolic_bp >= 140) or
        (v.temperature is not None and v.temperature >= 100.4)
    )

    # --- Return summary as a Pydantic response object ---
    return schemas.SummaryResponse(
        avg_bp=avg_bp,
        max_hr=max_hr,
        avg_temp=avg_temp,
        temp_trend=temp_trend,
        entries_this_week=entries_this_week,
        last_entry_at=last_entry_at,
        flagged_entries=flagged_entries,
    )
