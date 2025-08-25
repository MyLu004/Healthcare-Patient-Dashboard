from fastapi import APIRouter, Depends, HTTPException, status, APIRouter

import models, schemas

#from ..utils.hasing import hash_password, verify_password

from utils import hasing



from sqlalchemy.orm import Session

from database import get_db
from typing import List


router = APIRouter(
    prefix="/users",  #set a prefix for all routes in this router
    tags=["Users"]  #set a tag for the router, useful for documentation

)  #create a router for user related operations
# CRUD USERS FUNCTIONS

@router.get("/", response_model=List[schemas.UserOut])  #get all users
def get_users(db: Session = Depends(get_db)):
    users = db.query(models.User).all()
    return users


@router.get("/{id}", response_model=schemas.UserOut)  #get a user by id
def get_user(id: int, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.id == id).first()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with id {id} not found"
        )
    return user


#create a new user
@router.post("/", response_model=schemas.UserOut, status_code=status.HTTP_201_CREATED)
def create_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    #print("here!")
    #hashing the password
    if db.query(models.User).filter(models.User.email == user.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")

    hashed_password = hasing.hash_password(user.password)  #hash the password using bcrypt
    user.password = hashed_password 
    
    #new_user = models.User(**user.dict())
    new_user = models.User(
        email=user.email,
        username=user.username,
        password=hashed_password,
        role=user.role  
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return new_user