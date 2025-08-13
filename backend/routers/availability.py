from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import Optional, List
from datetime import datetime

import models, schemas, oauth2
from database import get_db

router = APIRouter(prefix="/availability", tags=["Availability"])

@router.get("/", response_model=List[schemas.AvailabilityOut])
def list_availability(
    provider_id: Optional[int] = Query(None),
    visit_type: Optional[models.VisitType] = Query(None),
    start_from: Optional[datetime] = Query(None),
    db: Session = Depends(get_db),
):
    q = db.query(models.Availability)
    if provider_id:
        q = q.filter(models.Availability.provider_id == provider_id)
    if visit_type:
        q = q.filter(models.Availability.visit_type == visit_type)
    if start_from:
        q = q.filter(models.Availability.start_at >= start_from)
    return q.order_by(models.Availability.start_at.asc()).limit(500).all()

@router.post("/", response_model=schemas.AvailabilityOut, status_code=status.HTTP_201_CREATED)
def create_availability(
    payload: schemas.AvailabilityCreate,
    current_user: models.User = Depends(oauth2.get_current_user),
    db: Session = Depends(get_db),
):
    # only allow providers to publish their own availability (adjust if you have roles/staff)
    if payload.provider_id != current_user.id:
        raise HTTPException(status_code=403, detail="Can only publish your own availability")

    row = models.Availability(**payload.model_dump())
    db.add(row)
    db.commit()
    db.refresh(row)
    return row

@router.patch("/{availability_id}", response_model=schemas.AvailabilityOut)
def update_availability(
    availability_id: int,
    payload: schemas.AvailabilityUpdate,
    current_user: models.User = Depends(oauth2.get_current_user),
    db: Session = Depends(get_db),
):
    row = db.query(models.Availability).filter(
        models.Availability.id == availability_id,
        models.Availability.provider_id == current_user.id
    ).first()
    if not row:
        raise HTTPException(status_code=404, detail="Availability not found")

    for k, v in payload.model_dump(exclude_unset=True).items():
        setattr(row, k, v)

    db.commit()
    db.refresh(row)
    return row

@router.delete("/{availability_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_availability(
    availability_id: int,
    current_user: models.User = Depends(oauth2.get_current_user),
    db: Session = Depends(get_db),
):
    row = db.query(models.Availability).filter(
        models.Availability.id == availability_id,
        models.Availability.provider_id == current_user.id
    ).first()
    if not row:
        raise HTTPException(status_code=404, detail="Availability not found")

    db.delete(row)
    db.commit()
    return None
