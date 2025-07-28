from pydantic import BaseModel, EmailStr, conint
from datetime import datetime

from typing import Optional, List


# == USER SCHEMAS ==

class UserBase(BaseModel):
    email: EmailStr
    password: str
    username: str

class UserCreate(UserBase):
    pass

class UserOut(BaseModel):
    id: int
    email: EmailStr
    username : str
    create_at: datetime  #using str for datetime, can be changed to datetime if needed

    class Config:
        orm_mode = True

class UserLogin(BaseModel):
    email: EmailStr
    password: str


# == TOKEN SCHEMAS ==
class Token(BaseModel):
    access_token: str
    token_type: str
    email: EmailStr

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


