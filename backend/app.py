import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.routers import (
    admin,
    admin_directory,
    auth,
    chatbot,
    content,
    doctors,
    goals,
    metric_history,
    metrics,
    notifications,
    portal,
    provider_directory,
    reports,
    summary,
)


class CoordinatePrivacyMiddleware:
    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        async def private_send(message):
            if scope.get("path") == "/doctors/search" and message["type"] == "http.response.start":
                from urllib.parse import parse_qsl, urlencode
                scope["query_string"] = urlencode([
                    (k, "[redacted]" if k in ("latitude", "longitude") else v)
                    for k, v in parse_qsl(scope.get("query_string", b"").decode())
                ]).encode()
            if message["type"] == "http.response.start" and scope.get("path", "").startswith(("/portal/", "/sharing", "/provider/", "/admin/", "/goals", "/metric-report", "/metrics/history", "/reports", "/chat")):
                message["headers"] = [(k, v) for k, v in message.get("headers", []) if k.lower() != b"cache-control"] + [(b"cache-control", b"no-store")]
            await send(message)
        await self.app(scope, receive, private_send)


app = FastAPI(title="Vital Pilot API", version="1.0.0")

# CORS_EXTRA_ORIGINS lets a deployed web frontend (e.g. a Vercel URL) be added
# without a code change -- comma-separated, e.g. "https://vitalpilot.vercel.app".
allow_origins = [
    "http://localhost:8081",
    "http://localhost:8082",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
] + [origin.strip() for origin in os.getenv("CORS_EXTRA_ORIGINS", "").split(",") if origin.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=allow_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(CoordinatePrivacyMiddleware)

app.include_router(provider_directory.router, tags=["care-team"])
app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(doctors.router, prefix="/doctors", tags=["doctors"])
app.include_router(metrics.router, tags=["metrics"])
app.include_router(notifications.router, tags=["notifications"])
app.include_router(summary.router, tags=["summary"])
app.include_router(goals.router, tags=["goals"])
app.include_router(metric_history.router, tags=["metrics"])
app.include_router(reports.router, tags=["reports"])
app.include_router(portal.router, tags=["portal"])
app.include_router(admin_directory.router)
app.include_router(admin.router, tags=["admin"])
app.include_router(content.router, tags=["content"])
app.include_router(chatbot.router, tags=["chat"])


@app.get("/health")
def health_check():
    """Also touches the database so a scheduled ping (see
    .github/workflows/keep-alive.yml) keeps a free-tier Aiven database from
    auto-pausing due to inactivity, not just the web process itself."""
    from backend.db import get_db_connection

    db_status = "down"
    try:
        connection = get_db_connection()
        if connection:
            try:
                with connection.cursor() as cursor:
                    cursor.execute("SELECT 1")
                    cursor.fetchone()
                db_status = "ok"
            finally:
                connection.close()
    except Exception:
        db_status = "down"
    return {"status": "ok", "database": db_status}
