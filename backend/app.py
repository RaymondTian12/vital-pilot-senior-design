from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.routers import auth, doctors, metrics, provider_directory, summary, portal, admin, content,chatbot

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
            if message["type"] == "http.response.start" and scope.get("path", "").startswith(("/portal/", "/sharing", "/provider/", "/admin/", "/goals", "/metric-report", "/reports", "/chat")):
                message["headers"] = [(k,v) for k,v in message.get("headers", []) if k.lower() != b"cache-control"] + [(b"cache-control", b"no-store")]
            await send(message)
        await self.app(scope, receive, private_send)


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

app.add_middleware(CoordinatePrivacyMiddleware)

app.include_router(provider_directory.router, tags=["care-team"])
app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(doctors.router, prefix="/doctors", tags=["doctors"])
app.include_router(metrics.router, tags=["metrics"])
app.include_router(summary.router, tags=["summary"])
from backend.routers import goals, reports, admin_directory
app.include_router(goals.router, tags=["goals"])
app.include_router(portal.router, tags=["portal"])
app.include_router(reports.router)
app.include_router(admin_directory.router)

app.include_router(admin.router, tags=["admin"])
app.include_router(content.router, tags=["content"])
app.include_router(chatbot.router, tags=["chat"])

@app.middleware("http")
async def no_store_portal_responses(request, call_next):
    response = await call_next(request)
    if request.url.path.startswith(("/portal/", "/admin/")):
        response.headers["Cache-Control"] = "no-store"
    return response


@app.get("/health")
def health_check():
    return {"status": "ok"}
