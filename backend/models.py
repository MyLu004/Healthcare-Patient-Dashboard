from database import Base
from sqlalchemy import (
    Column, Integer, String, Text, Float, ForeignKey, DateTime,
    Enum as SAEnum, Index, UniqueConstraint, CheckConstraint, func
)
from sqlalchemy.sql.sqltypes import TIMESTAMP
from sqlalchemy.sql import text
from sqlalchemy.orm import relationship
from datetime import datetime
import enum

# ---------------------------
# USERS / PATIENTS
# ---------------------------
class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, nullable=False)
    email = Column(String, nullable=False, unique=True)
    username = Column(String, nullable=False, unique=True)
    password = Column(String, nullable=False)

    # If possible, rename to created_at (requires migration). For now, keep column name stable:
    create_at = Column(TIMESTAMP(timezone=True), server_default=text("now()"), nullable=False)

    # Relationships with vital table ([user] one-to-many [vitals])
    vitals = relationship("Vital", back_populates="user", cascade="all, delete-orphan")



    appointments_as_patient = relationship(
        "Appointment", foreign_keys="Appointment.patient_id", # disambiguates which FK
        back_populates="patient", cascade="all, delete-orphan"
    )
    appointments_as_provider = relationship(
        "Appointment", foreign_keys="Appointment.provider_id",
        back_populates="provider", cascade="all, delete-orphan"
    )

    # Provider availability
    availabilities = relationship(
        "Availability", foreign_keys="Availability.provider_id",
        back_populates="provider", cascade="all, delete-orphan"
    )

    role = Column(String, nullable=False, server_default="patient")  # "patient" | "provider" | "staff"
    __table_args__ = (
        CheckConstraint("role IN ('patient','provider','staff')", name="chk_user_role"),
    )

class Vital(Base):
    __tablename__ = "vitals"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)

    # Make timestamps timezone-aware (UTC in DB)
    recorded_at = Column(DateTime(timezone=True), index=True, nullable=False)

    systolic_bp = Column(Integer, nullable=True)
    diastolic_bp = Column(Integer, nullable=True)
    heart_rate = Column(Integer, nullable=True)
    temperature = Column(Float, nullable=True)
    glucose = Column(Float, nullable=True)

    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    user = relationship("User", back_populates="vitals")

# ---------------------------
# PROVIDERS / APPTS
# ---------------------------
class VisitType(str, enum.Enum):
    telehealth = "telehealth"
    in_person = "in_person"

class ApptStatus(str, enum.Enum):
    requested = "requested"
    confirmed = "confirmed"
    denied = "denied"
    cancelled = "cancelled"
    reschedule_requested = "reschedule_requested"


# ---------- Facility (host location) ----------
class Facility(Base):
    __tablename__ = "facilities"

    id = Column(Integer, primary_key=True)
    name = Column(String(120), nullable=False)
    address = Column(Text, nullable=True)
    timezone = Column(String(64), nullable=True)

    # Backrefs
    availabilities = relationship("Availability", back_populates="facility", cascade="all, delete-orphan")
    appointments = relationship("Appointment", back_populates="facility", cascade="all, delete-orphan")



class Availability(Base):
    __tablename__ = "availabilities"

    id = Column(Integer, primary_key=True)

    # Foreign Key from the user (provider)
        # relationship [provider] one-to-many [avaibility]
        # define in the postgreSQL : in the DB
    provider_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    
    # ---------- location [extra info link to availability] ----------
    facility_id = Column(Integer, ForeignKey("facilities.id", ondelete="SET NULL"), nullable=True)  # NULL = telehealth

    # time properties
    start_at = Column(DateTime(timezone=True), nullable=False)   # UTC
    end_at   = Column(DateTime(timezone=True), nullable=False)   # UTC

    # check the enum above
    visit_type = Column(SAEnum(VisitType, name="visittype"), nullable=False, default=VisitType.in_person)
    
    # NOTE: your existing "location" is kept as a free-text label (e.g., "Room 3")
    location   = Column(String(120), nullable=True)
    capacity   = Column(Integer, nullable=False, default=1)
    notes      = Column(Text, nullable=True)

    # data time properties
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # ORM syntax : defining relationships between database tables (models) 
        # define in the ORM : SQLAlchemy
    provider = relationship("User", foreign_keys=[provider_id], back_populates="availabilities")
  
    facility = relationship("Facility", foreign_keys=[facility_id], back_populates="availabilities")

    __table_args__ = (
        UniqueConstraint("provider_id", "start_at", "end_at", "visit_type", "location", name="uq_availability_exact"),
        Index("ix_availability_provider_start", "provider_id", "start_at"),
        CheckConstraint("end_at > start_at", name="chk_availability_time_order"),
    )

class Appointment(Base):
    __tablename__ = "appointments"

    id = Column(Integer, primary_key=True)

    # defining the relationship between the table in the database
    patient_id  = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    provider_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    
    facility_id = Column(Integer, ForeignKey("facilities.id", ondelete="SET NULL"), nullable=True)  # NULL for telehealth
    
    availability_id = Column(Integer, ForeignKey("availabilities.id", ondelete="SET NULL"), nullable=True)

    start_at = Column(DateTime(timezone=True), nullable=False)   # UTC
    end_at   = Column(DateTime(timezone=True), nullable=False)   # UTC

    visit_type = Column(SAEnum(VisitType, name="visittype"), nullable=False, default=VisitType.in_person)
    # keep your existing "location" as a snapshot label
    location   = Column(String(120), nullable=True)
    reason     = Column(Text, nullable=True)

    status    = Column(SAEnum(ApptStatus, name="appointmentstatus"), nullable=False, default=ApptStatus.requested)
    video_url = Column(Text, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Backrefs / relationships / defining the relationship in the ORM - SQLAlchemy
    patient  = relationship("User", foreign_keys=[patient_id], back_populates="appointments_as_patient")
    provider = relationship("User", foreign_keys=[provider_id], back_populates="appointments_as_provider")
    
    facility = relationship("Facility", foreign_keys=[facility_id], back_populates="appointments")
    
    availability = relationship("Availability", foreign_keys=[availability_id])

    # extra rule for the optimizations for the database table beyond the normal column definition

    __table_args__ = (
        Index("ix_appointment_provider_start", "provider_id", "start_at"),
        Index("ix_appointment_patient_start", "patient_id", "start_at"),
        CheckConstraint("end_at > start_at", name="chk_appointment_time_order"),
        # # Optional integrity: in-person requires facility; telehealth requires NULL facility (keep/comment if not ready)
        CheckConstraint(
            "(visit_type = 'in_person' AND facility_id IS NOT NULL) OR "
            "(visit_type = 'telehealth' AND facility_id IS NULL)",
            name="chk_appt_visit_type_location",
        ),
    )
