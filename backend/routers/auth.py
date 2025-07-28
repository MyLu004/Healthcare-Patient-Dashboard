

#import neccessary modules and classes to run the backend
from fastapi import APIRouter, Depends, HTTPException, status, Response
from sqlalchemy.orm import Session
from typing import List
from fastapi.security import OAuth2PasswordRequestForm


#import database and other utils for authencation 
from ..database import get_db
from .. import models, schemas, oauth2
from ..utils import hasing

#create routes instance for authentication related routes
router = APIRouter(
      # set a prefix for all routes in this router
    tags=["Authentication"]  # set a tag for the router, useful for documentation
)  # create a router for authentication related operations

# Define a POST route for user login with expected response type of Token schema
@router.post("/login", response_model=schemas.Token)  # set the response model to Token schema  



def login(user_credentials: OAuth2PasswordRequestForm = Depends() ,db:Session = Depends(get_db)):
    """
    Authenticates a user and returns a JWT access token if credentials are valid.

    Args:
        user_credentials (OAuth2PasswordRequestForm): Form containing 'username' and 'password' fields.
        db (Session): SQLAlchemy database session injected via dependency.

    Returns:
        dict: A JSON response with the access token and token type.

    Raises:
        HTTPException: If the user is not found or password is incorrect.
    """
    #retrieve the user from the datavase using the provided email (username field in the form [login.jsx])
    user = db.query(models.User).filter(models.User.email == user_credentials.username).first()
    
    # If no user is found, raise a 403 Forbidden error
    if not user:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid credentials"
        )
    
    #if the password does not match the hashed password in the database, raise 403 error
    if not hasing.verify_password(user_credentials.password, user.password):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid credentials"
        )
    
    #Generate the JWT access token with the user's ID as the payload 
    access_token = oauth2.create_access_token(data={"sub": user.id})

    
    return {"access_token": access_token, 
            "token_type": "bearer", 
            "email": user.email
        }
