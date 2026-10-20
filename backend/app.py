from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.routers import auth, doctors, metrics, provider_directory, summary
from backend.routers import auth, doctors, metrics

app = FastAPI(title="Vital Pilot API", version="1.0.0")

allow_origins = [
    "http://localhost:8081",
    "http://localhost:8082",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=allow_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(provider_directory.router, tags=["care-team"])
app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(doctors.router, prefix="/doctors", tags=["doctors"])
app.include_router(metrics.router, tags=["metrics"])
app.include_router(summary.router, tags=["summary"])

@app.get("/health")
def health_check():
    return {"status": "ok"}
