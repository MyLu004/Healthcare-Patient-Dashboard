from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

import models, schemas, oauth2
from database import get_db

router = APIRouter(prefix="/appointments", tags=["Appointments"])

def _has_overlap(
    db: Session,
    provider_id: int,
    start: datetime,
    end: datetime,
    *,
    statuses: list[models.ApptStatus] | None = None,
    exclude_id: int | None = None,
) -> bool:
    q = db.query(models.Appointment).filter(
        models.Appointment.provider_id == provider_id,
        models.Appointment.start_at < end,
        models.Appointment.end_at   > start,
    )
    if statuses:
        q = q.filter(models.Appointment.status.in_(statuses))
    if exclude_id:
        q = q.filter(models.Appointment.id != exclude_id)
    return db.query(q.exists()).scalar()

@router.get("/mine", response_model=List[schemas.AppointmentOut])
def my_appointments(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(oauth2.get_current_user),
    active_only: bool = Query(True),  # default to hiding cancelled/denied
):
    q = db.query(models.Appointment).filter(
        models.Appointment.patient_id == current_user.id
    )
    if active_only:
        q = q.filter(models.Appointment.status.in_([
            models.ApptStatus.requested,
            models.ApptStatus.confirmed,
        ]))
    return q.order_by(models.Appointment.start_at.asc()).all()

@router.get("/provider", response_model=List[schemas.AppointmentOut])
def provider_appointments(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(oauth2.get_current_user),
    start_from: Optional[datetime] = Query(None),
):
    q = db.query(models.Appointment).filter(models.Appointment.provider_id == current_user.id)
    if start_from:
        q = q.filter(models.Appointment.start_at >= start_from)
    return q.order_by(models.Appointment.start_at.asc()).all()

@router.post("/", response_model=schemas.AppointmentOut, status_code=status.HTTP_201_CREATED)
def create_appointment(payload: schemas.AppointmentCreate,
                       db: Session = Depends(get_db),
                       current_user: models.User = Depends(oauth2.get_current_user)):

    provider = db.query(models.User).filter(models.User.id == payload.provider_id).first()
    if not provider or provider.role != "provider":
        raise HTTPException(status_code=404, detail="Provider not found")

    if payload.end_at <= payload.start_at:
        raise HTTPException(status_code=400, detail="end_at must be after start_at")

    # visit-type / facility rule (mirror DB constraint with friendly message)
    if payload.visit_type == models.VisitType.in_person and payload.facility_id is None:
        raise HTTPException(status_code=400, detail="in_person requires facility_id")
    if payload.visit_type == models.VisitType.telehealth and payload.facility_id is not None:
        raise HTTPException(status_code=400, detail="telehealth must not include facility_id")

    # Allow multiple *requested* at the same time; only block if a confirmed appt clashes
    if _has_overlap(db, payload.provider_id, payload.start_at, payload.end_at,
                    statuses=[models.ApptStatus.confirmed]):
        raise HTTPException(status_code=409, detail="Time slot not available")

    appt = models.Appointment(
        patient_id=current_user.id,
        provider_id=payload.provider_id,
        facility_id=payload.facility_id,
        availability_id=payload.availability_id,
        start_at=payload.start_at,
        end_at=payload.end_at,
        visit_type=payload.visit_type,
        location=payload.location,
        reason=payload.reason,
        status=models.ApptStatus.requested, 
        video_url=None,
    )
    db.add(appt); db.commit(); db.refresh(appt)
    return appt

@router.patch("/{appt_id}", response_model=schemas.AppointmentOut)
def update_appointment(
    appt_id: int,
    payload: schemas.AppointmentUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(oauth2.get_current_user),
):
    appt = db.get(models.Appointment, appt_id)
    if not appt:
        raise HTTPException(status_code=404, detail="Appointment not found")

    # only patient or provider can update basic fields
    if current_user.id not in (appt.patient_id, appt.provider_id):
        raise HTTPException(status_code=403, detail="Forbidden")

    data = payload.model_dump(exclude_unset=True)

    # if rescheduling, check overlaps
    new_start = data.get("start_at", appt.start_at)
    new_end = data.get("end_at", appt.end_at)
    if new_end <= new_start:
        raise HTTPException(status_code=400, detail="end_at must be after start_at")
    if (new_start != appt.start_at or new_end != appt.end_at) and _has_overlap(db, appt.provider_id, new_start, new_end):
        raise HTTPException(status_code=409, detail="Time slot not available")

    for k, v in data.items():
        setattr(appt, k, v)

    db.commit()
    db.refresh(appt)
    return appt

@router.patch("/{appt_id}/approve", response_model=schemas.AppointmentOut)
def approve_appointment(appt_id: int,
                        db: Session = Depends(get_db),
                        current_user: models.User = Depends(oauth2.get_current_user)):

    appt = db.get(models.Appointment, appt_id)
    if not appt:
        raise HTTPException(status_code=404, detail="Appointment not found")
    if appt.provider_id != current_user.id and current_user.role != "staff":
        raise HTTPException(status_code=403, detail="Only the provider/staff can approve")
    if appt.status != models.ApptStatus.requested:
        raise HTTPException(status_code=400, detail=f"Cannot approve from status={appt.status}")

    # Make sure we don't collide with other confirmed bookings
    if _has_overlap(db, appt.provider_id, appt.start_at, appt.end_at,
                    statuses=[models.ApptStatus.confirmed],
                    exclude_id=appt.id):
        raise HTTPException(status_code=409, detail="Time slot not available")

    appt.status = models.ApptStatus.confirmed

    # (Optional) if telehealth, set a video URL here
    # appt.video_url = generate_meeting_link(...)

    db.commit(); db.refresh(appt)
    return appt

@router.patch("/{appt_id}/cancel", status_code=status.HTTP_204_NO_CONTENT)
def cancel_appointment(
    appt_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(oauth2.get_current_user),
):
    appt = db.get(models.Appointment, appt_id)
    if not appt:
        raise HTTPException(status_code=404, detail="Appointment not found")
    if current_user.id not in (appt.patient_id, appt.provider_id):
        raise HTTPException(status_code=403, detail="Forbidden")

    appt.status = models.ApptStatus.cancelled
    db.commit()
    return None

@router.patch("/{appt_id}/deny", status_code=204)
def deny_appointment(appt_id: int,
                     db: Session = Depends(get_db),
                     current_user: models.User = Depends(oauth2.get_current_user)):

    appt = db.get(models.Appointment, appt_id)
    if not appt:
        raise HTTPException(status_code=404, detail="Appointment not found")
    if appt.provider_id != current_user.id and current_user.role != "staff":
        raise HTTPException(status_code=403, detail="Only the provider/staff can deny")
    if appt.status != models.ApptStatus.requested:
        raise HTTPException(status_code=400, detail=f"Cannot deny from status={appt.status}")

    appt.status = models.ApptStatus.denied
    db.commit()
    return None