from __future__ import annotations

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import get_settings
from .db import init_db
from .routers import documents, drafting, matters, research, screening


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield


app = FastAPI(title="Legally API", version="0.1.0", lifespan=lifespan)

settings = get_settings()
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(matters.router)
app.include_router(documents.router)
app.include_router(research.router)
app.include_router(screening.router)
app.include_router(drafting.router)


@app.get("/api/v1/health")
def health() -> dict:
    s = get_settings()
    return {
        "status": "ok",
        "offline": s.legally_offline,
        "embed_model": s.voyage_embed_model,
        "llm_model": s.openai_model,
        "voyage_configured": bool(s.voyage_api_key),
        "openai_configured": bool(s.openai_api_key),
    }
