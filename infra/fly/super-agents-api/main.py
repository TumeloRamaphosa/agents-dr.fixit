"""
Super Agents API — Fly.io OpenAI-compatible gateway for Hermes / agents.

Proxies chat to Xiaomi MiMo when MIMO_API_KEY is set (Fly secret). Keys never returned to clients.
Local Hermes MLX (Apple Silicon) stays on Mac; point agents at this URL from cloud sandboxes.
"""

from __future__ import annotations

import os
from typing import Any

import httpx
from fastapi import FastAPI, HTTPException, Request, Response
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Super Agents API", version="0.1.0")

_origins = os.environ.get("CORS_ALLOW_ORIGINS", "")
if _origins.strip():
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[o.strip() for o in _origins.split(",") if o.strip()],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

MIMO_BASE = os.environ.get("MIMO_API_BASE", "https://api.xiaomimimo.com/v1").rstrip("/")
DEFAULT_MODEL = os.environ.get("MIMO_MODEL", "mimo-v2.5-pro")
AGENT_NAME = os.environ.get("SUPER_AGENTS_NAME", "Super Agents")


def _mimo_key() -> str | None:
    key = os.environ.get("MIMO_API_KEY", "").strip()
    return key or None


@app.get("/health")
def health() -> dict[str, Any]:
    return {
        "ok": True,
        "service": "super-agents-api",
        "agent": AGENT_NAME,
        "mimo_configured": bool(_mimo_key()),
        "mimo_base": MIMO_BASE,
        "default_model": DEFAULT_MODEL,
        "openai_path": "/v1/chat/completions",
    }


@app.get("/v1/models")
def list_models() -> dict[str, Any]:
    return {
        "object": "list",
        "data": [
            {
                "id": DEFAULT_MODEL,
                "object": "model",
                "owned_by": "xiaomi-mimo",
            },
            {
                "id": "hermes-cloud",
                "object": "model",
                "owned_by": "studex",
            },
        ],
    }


@app.api_route("/v1/chat/completions", methods=["POST"])
async def chat_completions(request: Request) -> Response:
    key = _mimo_key()
    if not key:
        raise HTTPException(
            status_code=503,
            detail="MIMO_API_KEY not set. fly secrets set MIMO_API_KEY=... --app super-agents",
        )
    body = await request.body()
    headers = {
        "api-key": key,
        "Content-Type": request.headers.get("content-type", "application/json"),
    }
    url = f"{MIMO_BASE}/chat/completions"
    async with httpx.AsyncClient(timeout=120.0) as client:
        upstream = await client.post(url, content=body, headers=headers)
    return Response(
        content=upstream.content,
        status_code=upstream.status_code,
        media_type=upstream.headers.get("content-type", "application/json"),
    )
