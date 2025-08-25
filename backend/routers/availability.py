# routers/availability.py
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import Optional, List
from datetime import datetime

import models, schemas, oauth2
from database import get_db

router = APIRouter(prefix="/availability", tags=["Availability"])

# ---- role guard (keep here or move to a deps.py) ----
def require_provider(u: models.User = Depends(oauth2.get_current_user)):
    if getattr(u, "role", "patient") != "provider":
        raise HTTPException(status_code=403, detail="Provider only")
    return u

@router.get("/", response_model=List[schemas.AvailabilityOut])
def list_availability(
    provider_id: Optional[int] = Query(None),
    visit_type: Optional[models.VisitType] = Query(None),
    start_from: Optional[datetime] = Query(None),
    db: Session = Depends(get_db),
):
    q = db.query(models.Availability)
    if provider_id is not None:
        q = q.filter(models.Availability.provider_id == provider_id)
    if visit_type is not None:
        q = q.filter(models.Availability.visit_type == visit_type)
    if start_from is not None:
        q = q.filter(models.Availability.start_at >= start_from)
    return q.order_by(models.Availability.start_at.asc()).limit(500).all()

@router.get("/mine", response_model=List[schemas.AvailabilityOut])
def my_availability(
    current: models.User = Depends(require_provider),
    db: Session = Depends(get_db),
):
    return (db.query(models.Availability)
              .filter(models.Availability.provider_id == current.id)
              .order_by(models.Availability.start_at.asc())
              .all())

@router.post("/", response_model=schemas.AvailabilityOut, status_code=status.HTTP_201_CREATED)
def create_availability(
    payload: schemas.AvailabilityCreate,   # <-- in this option, remove provider_id from the schema
    current: models.User = Depends(require_provider),
    db: Session = Depends(get_db),
):
    row = models.Availability(
        provider_id=current.id,                         # derive from token
        **payload.model_dump(exclude={"provider_id"})                          # everything else from body
    )
    db.add(row); db.commit(); db.refresh(row)
    return row

@router.patch("/{availability_id}", response_model=schemas.AvailabilityOut)
def update_availability(
    availability_id: int,
    payload: schemas.AvailabilityUpdate,
    current: models.User = Depends(require_provider),
    db: Session = Depends(get_db),
):
    row = (db.query(models.Availability)
             .filter(models.Availability.id == availability_id,
                     models.Availability.provider_id == current.id)
             .first())
    if not row:
        raise HTTPException(status_code=404, detail="Availability not found")
    for k, v in payload.model_dump(exclude_unset=True).items():
        setattr(row, k, v)
    db.commit(); db.refresh(row)
    return row

@router.delete("/{availability_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_availability(
    availability_id: int,
    current: models.User = Depends(require_provider),
    db: Session = Depends(get_db),
):
    row = (db.query(models.Availability)
             .filter(models.Availability.id == availability_id,
                     models.Availability.provider_id == current.id)
             .first())
    if not row:
        raise HTTPException(status_code=404, detail="Availability not found")
    db.delete(row); db.commit()
