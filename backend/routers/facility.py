from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

import models, schemas, oauth2
from database import get_db

router = APIRouter(prefix="/facilities", tags=["Facilities"])

@router.get("/", response_model=List[schemas.FacilityOut])
def list_facilities(db: Session = Depends(get_db)):
    return db.query(models.Facility).order_by(models.Facility.name.asc()).all()

def require_staff(u: models.User = Depends(oauth2.get_current_user)):
    if getattr(u, "role", "patient") != "staff":
        raise HTTPException(status_code=403, detail="Staff only")
    return u

@router.post("/", response_model=schemas.FacilityOut, status_code=status.HTTP_201_CREATED)
def create_facility(
    payload: schemas.FacilityCreate,
    _staff: models.User = Depends(require_staff),  # require staff
    db: Session = Depends(get_db),
):
    row = models.Facility(**payload.model_dump())
    db.add(row); db.commit(); db.refresh(row)
    return row
