from fastapi import APIRouter, Depends, HTTPException, Query, Body, status, Response
from sqlalchemy.orm import Session
from database import get_db
import models, schemas, oauth2
from datetime import datetime


# API router for all vitals endpoint
router = APIRouter(
    prefix="/vitals",
    tags=["Vitals"]
)


# -----------------------------
# Create a new vital entry
# -----------------------------
@router.post("/", response_model=schemas.VitalsOut)
def create_vital(
    vital: schemas.VitalsCreate,    # the vitals data sent from the frontend (validate by Pydantic schema)
    current_user: models.User = Depends(oauth2.get_current_user),  # the ID of the user for whome the vital is being recoding
    db: Session = Depends(get_db)   # SQLAlchemy session dependency (injected automatically)
):
    # create the instance for vital to add into the database later
    # instance will all relevant fields
   
    db_vital = models.Vital(
        user_id = current_user.id, # associate the vital with the current user
        recorded_at=vital.recorded_at,
        systolic_bp=vital.systolic_bp,
        diastolic_bp=vital.diastolic_bp,
        heart_rate=vital.heart_rate,
        temperature=vital.temperature,
        glucose=vital.glucose,
        notes=vital.notes,
        created_at=datetime.utcnow()
    )

    db.add(db_vital)        # add new obj to the database session
    db.commit()             # commit the command
    db.refresh(db_vital)    # refresh the database / update
    return db_vital         # return the object/instance

# -----------------------------
# Update an existing vital entry
# -----------------------------
@router.put("/{vital_id}", response_model=schemas.VitalsOut)
def update_vital(
    vital_id: int,
    current_user: models.User = Depends(oauth2.get_current_user),
    payload: schemas.VitalUpdate = Body(...),
    db: Session = Depends(get_db),
):  
    
    user_id = current_user.id
    # Fetch the target vital entry by ID from the database
    v = db.query(models.Vital).filter(
        models.Vital.id == vital_id,
        models.Vital.user_id == user_id  # ensure the user owns this entry
        ).first()

    # If not found or the user doesn't own this entry, raise 404
    if not v:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vital not found")

     # Update only the fields that were sent (exclude_unset=True ignores fields not provided)
    updates = payload.model_dump(exclude_unset=True)
    allowed = {"recorded_at","systolic_bp","diastolic_bp","heart_rate","temperature","glucose","notes"}
    
    for field, value in updates.items():
        if field in allowed:
            setattr(v, field, value)

    db.commit()
    db.refresh(v)
    return v

# -----------------------------
# Delete an existing vital entry
# -----------------------------
@router.delete("/{vital_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_vital(
    vital_id: int,
    current_user: models.User = Depends(oauth2.get_current_user),
    db: Session = Depends(get_db),
):
    user_id = current_user.id
    v = db.query(models.Vital).filter(
        models.Vital.id == vital_id,
        models.Vital.user_id == user_id
    ).first()

    if not v:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vital not found")

    db.delete(v)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)