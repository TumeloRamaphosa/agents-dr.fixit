"""
Studex Command Plane — small API for the Studex Nexus dashboard.
Lists Daytona sandboxes when DAYTONA_API_KEY is set (Fly secret). No keys in responses.
"""

from __future__ import annotations

import os
from typing import Any

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Studex Command Plane", version="0.1.0")

_origins = os.environ.get("CORS_ALLOW_ORIGINS", "")
if _origins.strip():
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[o.strip() for o in _origins.split(",") if o.strip()],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )


def _daytona_client():
    key = os.environ.get("DAYTONA_API_KEY", "").strip()
    if not key:
        return None
    try:
        from daytona import Daytona
    except ImportError as e:
        raise HTTPException(status_code=500, detail="daytona SDK not installed") from e
    return Daytona()


@app.get("/health")
def health() -> dict[str, Any]:
    has_key = bool(os.environ.get("DAYTONA_API_KEY", "").strip())
    return {
        "ok": True,
        "service": "studex-command-plane",
        "daytona_configured": has_key,
    }


@app.get("/api/sandboxes")
def list_sandboxes() -> dict[str, Any]:
    client = _daytona_client()
    if client is None:
        return {
            "configured": False,
            "message": "DAYTONA_API_KEY not set on this Fly app. Set: fly secrets set DAYTONA_API_KEY=...",
            "sandboxes": [],
        }
    rows: list[dict[str, Any]] = []
    for s in client.list():
        rows.append(
            {
                "id": s.id,
                "name": s.name,
                "state": str(s.state) if s.state is not None else None,
                "labels": s.labels or {},
                "created_at": s.created_at.isoformat() if getattr(s, "created_at", None) else None,
            }
        )
    return {"configured": True, "sandboxes": rows}
