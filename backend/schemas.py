from pydantic import BaseModel, EmailStr, conint
from datetime import datetime

from typing import Optional


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
