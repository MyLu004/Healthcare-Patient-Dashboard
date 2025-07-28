from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from dotenv import load_dotenv
import os

# Load .env first
load_dotenv()

# Then get the value
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL")
print("DATABASE URL:", SQLALCHEMY_DATABASE_URL)

# Now create the engine
engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    print("connect successful")
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
