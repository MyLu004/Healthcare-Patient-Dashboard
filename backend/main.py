from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseSettings, AnyHttpUrl, validator
from typing import List, Optional

from database import engine
import models

# Routers
from routers import (
    user,
    auth,
    trends,
    recent,
    summary,
    vitals,
    appointment,
    availability,
    facility,
    vapi,
)

# ---------------- Settings ----------------
class Settings(BaseSettings):
    APP_NAME: str = "HealthCare Patient Dashboard API"
    APP_VERSION: str = "0.1.0"

    # Comma-separated list of allowed origins
    CORS_ORIGINS: Optional[str] = (
        "http://localhost:5173,"
        "http://127.0.0.1:5173,"
        "https://healthcare-patient-dashboard.vercel.app"
    )
    # Whether to allow vercel preview subdomains via regex (e.g., https://*.vercel.app)
    ALLOW_VERCEL_PREVIEWS: bool = True

    class Config:
        env_file = ".env"
        case_sensitive = True

    @property
    def origins_list(self) -> List[str]:
        if not self.CORS_ORIGINS:
            return []
        return [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]


settings = Settings()

# ---------------- App ----------------
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
)

# NOTE: OK for local/dev. Prefer Alembic for prod migrations.
models.Base.metadata.create_all(bind=engine)

# ---------------- CORS ----------------
allow_origin_regex = r"https://.*\.vercel\.app$" if settings.ALLOW_VERCEL_PREVIEWS else None

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.origins_list,
    allow_origin_regex=allow_origin_regex,
    allow_credentials=True,   # required if you use cookies/JWT in cookies
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------- Routers ----------------
# Auth & users
app.include_router(auth.router)         # /auth
app.include_router(user.router)         # /users

# Vitals
app.include_router(vitals.router)       # /vitals
app.include_router(summary.router)      # /vitals/summary
app.include_router(trends.router)       # /vitals/trends
app.include_router(recent.router)       # /vitals/recent

# Appointments platform
app.include_router(appointment.router)  # /appointments
app.include_router(availability.router) # /availability
app.include_router(facility.router)     # /facilities

# Voice/agent integration
app.include_router(vapi.router)         # /vapi

# ---------------- Health/Meta ----------------
@app.get("/")
def root():
    return {"message": "Hello World kinoko from HealthDashboard! :3"}

@app.get("/health")
def health():
    return {"status": "ok"}

@app.get("/ready")
def ready():
    # Optionally add a simple DB ping here later
    return {"ready": True}

@app.get("/version")
def version():
    return {"name": settings.APP_NAME, "version": settings.APP_VERSION}
# ---------------- End ----------------