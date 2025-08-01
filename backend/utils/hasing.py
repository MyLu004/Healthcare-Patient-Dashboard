
from passlib.context import CryptContext
from jose import JWTError, jwt
from datetime import datetime, timedelta

from database import get_db




pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str):
    return pwd_context.hash(password)

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)