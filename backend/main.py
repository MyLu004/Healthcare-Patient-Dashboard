from fastapi import FastAPI, Response, status, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base
import models
from routers import user, auth


app = FastAPI()

models.Base.metadata.create_all(bind=engine) #create table 


origins = [
     "http://localhost:5173",  # Vite dev server
    "http://127.0.0.1:5173",  # Vite dev server
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(user.router)  # Include user-related routes
app.include_router(auth.router)  # Include authentication-related routes


@app.get("/") 
def root():
    #the data get send back to the client
    return {"message": "Hello World kinoko from HealthDashboard! :3"}