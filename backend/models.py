from  database import Base
from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, Text, DateTime, Float
from sqlalchemy.sql.sqltypes import TIMESTAMP
from sqlalchemy.sql import text
from sqlalchemy.orm import relationship
#Base = declarative_base()
from datetime import datetime
class User(Base):
    __tablename__ = "users"  #specify the table name

    id = Column(Integer, primary_key=True, nullable=False)  #define the id column as an integer and primary key
    email = Column(String, nullable=False, unique=True)  #define the email column as a string, not nullable, and unique
    username = Column(String, nullable=False, unique=True)  #define the username column as a string, not nullable, and unique
    password = Column(String, nullable=False)  #define the password column as a string and not nullable
    create_at = Column(TIMESTAMP(timezone=True), server_default=text('now()'), nullable=False)  #define the create_at column as a timestamp with a default value of the current time

    vitals = relationship("Vital", back_populates="user")

class Vital(Base):
    __tablename__ = "vitals"

    id = Column(Integer, primary_key=True, index=True) # Primary key for the vitals table
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False) # Foreign key to users table

    recorded_at = Column(DateTime, index=True, nullable=False)  # Timestamp for when the vitals were recorded

    systolic_bp = Column(Integer, nullable=True)
    diastolic_bp = Column(Integer, nullable=True)
    heart_rate = Column(Integer, nullable=True)
    temperature = Column(Float, nullable=True)
    glucose = Column(Float, nullable=True)

    notes = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="vitals") # Relationship to User model