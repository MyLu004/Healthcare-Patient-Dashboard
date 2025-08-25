from pydantic import BaseModel, EmailStr, conint, BaseModel, ConfigDict, field_validator
from datetime import datetime

from typing import Optional, List, Literal


# --------------------------
# Common type aliases
# --------------------------
VisitType = Literal["telehealth", "in_person"]
ApptStatus = Literal["requested", "confirmed", "denied", "cancelled", "reschedule_requested"]

# == USER SCHEMAS ==

# ---- INPUT SCHEMAS (what client sends) ----
class UserCreate(BaseModel):
    email: EmailStr
    username: str
    password: str                 # plain here; hash in service layer
    role: Literal["user", "patient", "provider", "admin"]

class UserLogin(BaseModel):
    email: EmailStr
    password: str

# ---- OUTPUT SCHEMAS (what API returns) ----
class UserOut(BaseModel):
    id: int
    email: EmailStr
    username: str
    role: str
    created_at: datetime          # match your column name exactly
    class Config:
        orm_mode = True


# == TOKEN SCHEMAS ==
class Token(BaseModel):
    access_token: str
    token_type: str
    email: EmailStr
    username: str
    role: str

class TokenData(BaseModel):
    id: Optional[int] | None = None  #id can be None if not provided, using union type for optional id
    email: EmailStr | None = None  #email can also be None if not provided, using union type for optional email


# == VITALS SCHEMAS ==

class VitalsBase(BaseModel):
    recorded_at: datetime
    systolic_bp: Optional[int] = None
    diastolic_bp: Optional[int] = None
    heart_rate: Optional[int] = None
    temperature: Optional[float] = None
    glucose: Optional[float] = None
    notes: Optional[str] = None

class VitalsCreate(VitalsBase):
    pass

class VitalUpdate(VitalsBase):
    pass

class VitalsOut(VitalsBase):
    id: int
    user_id: int
    created_at: datetime

    class Config:
        orm_mode = True


class AvgBP(BaseModel):
    systolic: Optional[float] = None
    diastolic: Optional[float] = None

class SummaryResponse(BaseModel):
    avg_bp: Optional[AvgBP] = None
    max_hr: Optional[int] = None
    avg_temp: Optional[float] = None
    temp_trend: Optional[str] = None  # "up" | "down" | None
    entries_this_week: int
    last_entry_at: Optional[datetime] = None
    flagged_entries: int


class TrendPoint(BaseModel):
    date: datetime
    systolic: Optional[int]
    diastolic: Optional[int]
    heart_rate: Optional[int]
    temperature: Optional[float]
    systolic_roll7: Optional[float]

class TrendsResponse(BaseModel):
    points: List[TrendPoint]


class RecentEntry(BaseModel):
    id: int
    date: datetime
    systolic: Optional[int]
    diastolic: Optional[int]
    heart_rate: Optional[int]
    temperature: Optional[float]
    notes: Optional[str]

    class Config:
        orm_mode = True

class RecentResponse(BaseModel):
    items: list[RecentEntry]
    


# ----- Facility -----

class FacilityCreate(BaseModel):
    name: str
    address: Optional[str] = None
    timezone: Optional[str] = None

class FacilityOut(FacilityCreate):
    id: int
    model_config = ConfigDict(from_attributes=True)


# ----- Availability ------
class AvailabilityCreate(BaseModel):
    provider_id: int
    start_at: datetime
    end_at: datetime
    visit_type: VisitType = "telehealth"
    facility_id: Optional[int] = None  # None = telehealth
    location: Optional[str] = None     # free-text label (e.g., "Room 3")
    capacity: int = 1
    notes: Optional[str] = None

    @field_validator("end_at")
    @classmethod
    def validate_time(cls, v, info):
        start = info.data.get("start_at")
        if start and v <= start:
            raise ValueError("end_at must be after start_at")
        return v

class AvailabilityUpdate(BaseModel):
    start_at: Optional[datetime] = None
    end_at: Optional[datetime] = None
    visit_type: Optional[VisitType] = None
    facility_id: Optional[int] = None
    location: Optional[str] = None
    capacity: Optional[int] = None
    notes: Optional[str] = None

class AvailabilityOut(BaseModel):
    id: int
    provider_id: int
    start_at: datetime
    end_at: datetime
    visit_type: VisitType
    facility_id: Optional[int] = None
    location: Optional[str] = None
    capacity: int
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)

# ---------- Appointment ----------
class AppointmentCreate(BaseModel):
    provider_id: int
    start_at: datetime
    end_at: datetime
    visit_type: VisitType = "telehealth"
    facility_id: Optional[int] = None
    reason: Optional[str] = None
    availability_id: Optional[int] = None  # if booked from a slot
    location: Optional[str] = None         # snapshot label

    @field_validator("end_at")
    @classmethod
    def validate_time(cls, v, info):
        start = info.data.get("start_at")
        if start and v <= start:
            raise ValueError("end_at must be after start_at")
        return v

class AppointmentUpdate(BaseModel):
    start_at: Optional[datetime] = None
    end_at: Optional[datetime] = None
    visit_type: Optional[VisitType] = None
    facility_id: Optional[int] = None
    reason: Optional[str] = None
    status: Optional[ApptStatus] = None
    location: Optional[str] = None

class AppointmentOut(BaseModel):
    id: int
    patient_id: int
    provider_id: int
    start_at: datetime
    end_at: datetime
    visit_type: VisitType
    status: ApptStatus
    facility_id: Optional[int] = None
    availability_id: Optional[int] = None
    location: Optional[str] = None
    reason: Optional[str] = None
    video_url: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)

