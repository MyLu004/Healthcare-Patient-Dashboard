from fastapi import FastAPI, Response, status, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base
import models
from routers import user, auth, trends, recent, summary, vitals, appointment, availability, facility, vapi


app = FastAPI()

models.Base.metadata.create_all(bind=engine) #create table 


ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "https://healthcare-patient-dashboard.vercel.app",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_origin_regex=r"https://.*\.vercel\.app$",  # preview URLs
    allow_credentials=True,               # only if you use cookies
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---- Include routers ----
app.include_router(auth.router)      # /auth
app.include_router(user.router)      # /users (or whatever you set)
app.include_router(vitals.router)    # /vitals
app.include_router(summary.router)   # /vitals/summary (per your file)
app.include_router(trends.router)    # /vitals/trends
app.include_router(recent.router)    # /vitals/recent

# Appointments platform
app.include_router(appointment.router)   # /appointments
app.include_router(availability.router)  # /availability
app.include_router(facility.router)      # /facilities

app.include_router(vapi.router)




@app.get("/") 
def root():
    #the data get send back to the client
    return {"message": "Hello World kinoko from HealthDashboard! :3"}