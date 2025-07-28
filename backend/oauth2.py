from passlib.context import CryptContext
from jose import JWTError, jwt
from datetime import datetime, timedelta

import models,schemas,database
from fastapi import HTTPException, status, Depends

from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from dotenv import load_dotenv
import os


# load env variable from .env file
load_dotenv()

# Enviroment variables for JWT configuration
JWT_SECRET= os.getenv("JWT_SECRET_KEY")
JWT_ALGORITHM=os.getenv("JWT_ALGORITHM")
ACCESS_TOKEN_EXPIRE_MINUTES=os.getenv("JWT_ACCESS_TOKEN_EXPIRE_MINUTES")

# define the OAuthu2 password flow, expecting token to be sent to the login or other funciton need it URL
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

# Create JWT access token
def create_access_token(data: dict,  expires_delta=None):
    """
    Create a JWT access token with expiration.

    Args:
        data (dict): The payload to encode in the token.
        expires_delta (timedelta, optional): Custom expiration time.

    Returns:
        str: Encoded JWT token.
    """
    to_encode = data.copy()
    to_encode["sub"] = str(to_encode["sub"])  

    expire = datetime.utcnow() + timedelta(minutes=int(ACCESS_TOKEN_EXPIRE_MINUTES))
    #expire = datetime.utcnow() + (expires_delta or timedelta(minutes=int(ACCESS_TOKEN_EXPIRE_MINUTES)))
    to_encode.update({"exp": expire})
    
    # encode the token with secret and algorithms
    encoded_jwt = jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)
    print("token create")
    return encoded_jwt

# verify a JWT access token
def verify_access_token(token: str, credentials_exception):
    
    """
    Verify and decode a JWT access token.

    Args:
        token (str): The JWT token to decode.
        credentials_exception (HTTPException): The exception to raise if verification fails.

    Returns:
        TokenData: Contains the decoded user ID from token.
    """
    try:
        # decode the JWT token using secret and algorithms
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        id:str = payload.get("sub") # get the user_id from the sub field
        
       
        # raise error if there is no ID found
        if id is None:
            raise credentials_exception 
        token_data = schemas.TokenData(id=id)

    # if token is invalid or expired
    except JWTError as e:
        raise credentials_exception
    
    return token_data  # Return the token data if verification is successful


def get_current_user(token: str = Depends(oauth2_scheme),db: Session = Depends(database.get_db)):
    """
    Get the current user from the JWT token.
    
    Args:
        token (str): The JWT token to decode.
        
    Returns:
        schemas.TokenData: The token data containing user information.
        
    Raises:
        credentials_exception: If the token is invalid or expired.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    # verify and decode the token
    token = verify_access_token(token, credentials_exception)

    # query the database to find the user associated with the token's ID
    user = db.query(models.User).filter(models.User.id == token.id).first()  # Fetch the user from the database using the ID from the token
    if user is None:
        raise credentials_exception
    
    # return the user object
    return user
