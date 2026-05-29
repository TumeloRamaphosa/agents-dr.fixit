"""
Studex Command Plane — API for Super Agents management dashboard.
Lists Daytona sandboxes and Fly.io apps when secrets are set. No keys in responses.
"""

from __future__ import annotations

import os
from typing import Any

import httpx
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Studex Command Plane", version="0.2.0")

_origins = os.environ.get("CORS_ALLOW_ORIGINS", "")
if _origins.strip():
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[o.strip() for o in _origins.split(",") if o.strip()],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

# Apps we surface by default in the dashboard (extend via FLY_INVENTORY_APPS env)
DEFAULT_FLY_APPS = (
    "super-agents",
    "superagents-site",
    "studex-command-plane",
    "studex-n8n",
    "agentic-lab-v3",
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


def _list_daytona() -> dict[str, Any]:
    client = _daytona_client()
    if client is None:
        return {
            "configured": False,
            "message": "DAYTONA_API_KEY not set on this Fly app.",
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


def _fly_app_names() -> list[str]:
    extra = os.environ.get("FLY_INVENTORY_APPS", "")
    names = list(DEFAULT_FLY_APPS)
    if extra.strip():
        names.extend(a.strip() for a in extra.split(",") if a.strip())
    # dedupe preserve order
    seen: set[str] = set()
    out: list[str] = []
    for n in names:
        if n not in seen:
            seen.add(n)
            out.append(n)
    return out


def _list_fly() -> dict[str, Any]:
    token = os.environ.get("FLY_API_TOKEN", "").strip()
    if not token:
        return {
            "configured": False,
            "message": "FLY_API_TOKEN not set. fly secrets set FLY_API_TOKEN=...",
            "apps": [],
        }
    apps: list[dict[str, Any]] = []
    headers = {"Authorization": f"Bearer {token}"}
    with httpx.Client(timeout=30.0) as client:
        for name in _fly_app_names():
            row: dict[str, Any] = {"name": name, "status": "unknown", "hostname": f"https://{name}.fly.dev"}
            try:
                r = client.get(f"https://api.machines.dev/v1/apps/{name}", headers=headers)
                if r.status_code == 404:
                    row["status"] = "not_deployed"
                elif r.is_success:
                    data = r.json()
                    row["status"] = data.get("status") or "deployed"
                    row["id"] = data.get("id")
                else:
                    row["status"] = f"error_{r.status_code}"
            except httpx.HTTPError as e:
                row["status"] = "unreachable"
                row["error"] = str(e)
            apps.append(row)
    return {"configured": True, "apps": apps}


@app.get("/health")
def health() -> dict[str, Any]:
    return {
        "ok": True,
        "service": "studex-command-plane",
        "daytona_configured": bool(os.environ.get("DAYTONA_API_KEY", "").strip()),
        "fly_configured": bool(os.environ.get("FLY_API_TOKEN", "").strip()),
    }


@app.get("/api/sandboxes")
def list_sandboxes() -> dict[str, Any]:
    return _list_daytona()


@app.get("/api/fly-apps")
def list_fly_apps() -> dict[str, Any]:
    return _list_fly()


@app.get("/api/inventory")
def inventory() -> dict[str, Any]:
    """Combined view for Super Agents management dashboard."""
    daytona = _list_daytona()
    fly = _list_fly()
    return {
        "daytona": daytona,
        "fly": fly,
        "agents": [
            {
                "id": "hermes-mlx",
                "name": "Hermes 3 MLX",
                "host": "mac_local",
                "endpoint": "http://127.0.0.1:8090/v1",
                "note": "Apple Silicon only — not on Fly",
            },
            {
                "id": "hermes-cloud",
                "name": "Super Agents (MiMo)",
                "host": "fly",
                "endpoint": "https://super-agents.fly.dev/v1",
                "note": "Deploy infra/fly/super-agents-api",
            },
        ],
    }
