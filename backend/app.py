import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.routers import auth

app = FastAPI(title="Vital Pilot API", version="1.0.0")

allow_origins = [] # empty for now
app.add_middleware(
    CORSMiddleware,
    allow_origins=allow_origins,
    allow_credentials=True,
)

app.include_router(auth.router, prefix="/auth", tags=["auth"])

@app.get("/health")
def health_check():
    return {"status": "ok"}
