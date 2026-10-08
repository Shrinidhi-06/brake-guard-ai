"""AutoSentinel AI — FastAPI backend (prototype).

Run:  uvicorn main:app --reload --port 8000
DEMO_MODE=true (default) uses deterministic mock services; no external AI API required.
"""
import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routes import analytics, history, inspect, machine, risk, simulate

app = FastAPI(title="AutoSentinel AI", version="0.1.0", description="Prototype brake disc inspection API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("CORS_ORIGINS", "http://localhost:8080").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)

for r in (inspect.router, risk.router, simulate.router, history.router, analytics.router, machine.router):
    app.include_router(r, prefix="/api")


@app.get("/health")
def health():
    return {"status": "ok", "demo_mode": os.getenv("DEMO_MODE", "true") == "true"}
