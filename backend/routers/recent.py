from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

import models, schemas, oauth2
from database import get_db

# API router
router = APIRouter(prefix="/vitals", tags=["recent"])

# GET /vitals/recent endpoint
# Returns the most recent vitals entries for a user
@router.get("/recent", response_model=schemas.RecentResponse)
def get_recent(
    current_user: models.User = Depends(oauth2.get_current_user),
    limit: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db),
):
    user_id = current_user.id

     # Query the latest 'limit' vitals for the specified user, ordered by recorded date (most recent first)
    rows = (
        db.query(models.Vital)
        .filter(models.Vital.user_id == user_id)
        .order_by(models.Vital.recorded_at.desc())
        .limit(limit)
        .all()
    )

      # Convert each database record into a RecentEntry schema object for the response
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

    # return the recent entries wrapped in a RecentResponse schema
    return schemas.RecentResponse(items=items)
