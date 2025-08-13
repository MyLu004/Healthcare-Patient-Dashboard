from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

import models, schemas, oauth2
from database import get_db

router = APIRouter(prefix="/facilities", tags=["Facilities"])

@router.get("/", response_model=List[schemas.FacilityOut])
def list_facilities(db: Session = Depends(get_db)):
    return db.query(models.Facility).order_by(models.Facility.name.asc()).all()

@router.post("/", response_model=schemas.FacilityOut, status_code=status.HTTP_201_CREATED)
def create_facility(
    payload: schemas.FacilityCreate,
    _user: models.User = Depends(oauth2.get_current_user), # gate if needed
    db: Session = Depends(get_db),
):
    row = models.Facility(**payload.model_dump())
    db.add(row); db.commit(); db.refresh(row)
    return row
