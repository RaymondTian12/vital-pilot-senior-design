import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Vital Pilot API", version="1.0.0")

allow_origins = [] # empty for now
app.add_middleware(
    CORSMiddleware,
    allow_origins=allow_origins,
)

@app.get("/health")
def health_check():
    return {"status": "ok"}
