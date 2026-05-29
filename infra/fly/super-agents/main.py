"""
Super Agents — single Fly VM: command plane, inventory API, and MiMo (OpenAI-compatible) gateway.

Deploy only this app (super-agents). Pair with one Daytona sandbox named "Super Agents".
Secrets on Fly: MIMO_API_KEY, DAYTONA_API_KEY, optional FLY_API_TOKEN for fleet inventory.
"""

from __future__ import annotations

import os
from typing import Any

import httpx
from fastapi import FastAPI, HTTPException, Request, Response
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Super Agents", version="1.0.0")

_origins = os.environ.get("CORS_ALLOW_ORIGINS", "")
if _origins.strip():
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[o.strip() for o in _origins.split(",") if o.strip()],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

SANDBOX_NAME = os.environ.get("SUPER_AGENTS_SANDBOX_NAME", "Super Agents")
MIMO_BASE = os.environ.get("MIMO_API_BASE", "https://api.xiaomimimo.com/v1").rstrip("/")
DEFAULT_MODEL = os.environ.get("MIMO_MODEL", "mimo-v2.5-pro")
PUBLIC_URL = os.environ.get("SUPER_AGENTS_PUBLIC_URL", "https://super-agents.fly.dev").rstrip("/")

# Other Fly apps to list in dashboard (this app is the hub — not a separate command-plane app)
OTHER_FLY_APPS = ("superagents-site", "studex-n8n", "agentic-lab-v3")


def _mimo_key() -> str | None:
    key = os.environ.get("MIMO_API_KEY", "").strip()
    return key or None


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
            "message": "DAYTONA_API_KEY not set. fly secrets set DAYTONA_API_KEY=... --app super-agents",
            "sandboxes": [],
            "primary_sandbox": SANDBOX_NAME,
        }
    rows: list[dict[str, Any]] = []
    primary: dict[str, Any] | None = None
    for s in client.list():
        row = {
            "id": s.id,
            "name": s.name,
            "state": str(s.state) if s.state is not None else None,
            "labels": s.labels or {},
            "created_at": s.created_at.isoformat() if getattr(s, "created_at", None) else None,
            "is_primary": (s.name or "") == SANDBOX_NAME,
        }
        rows.append(row)
        if row["is_primary"]:
            primary = row
    rows.sort(key=lambda r: (not r["is_primary"], r.get("name") or ""))
    return {
        "configured": True,
        "primary_sandbox": SANDBOX_NAME,
        "primary": primary,
        "sandboxes": rows,
    }


def _fly_app_names() -> list[str]:
    names = ["super-agents", *OTHER_FLY_APPS]
    extra = os.environ.get("FLY_INVENTORY_APPS", "")
    if extra.strip():
        names.extend(a.strip() for a in extra.split(",") if a.strip())
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
            "message": "FLY_API_TOKEN optional — set to list other Fly apps in dashboard.",
            "apps": [
                {
                    "name": "super-agents",
                    "status": "this_vm",
                    "hostname": PUBLIC_URL,
                    "role": "command_plane_and_api",
                }
            ],
        }
    apps: list[dict[str, Any]] = []
    headers = {"Authorization": f"Bearer {token}"}
    with httpx.Client(timeout=30.0) as client:
        for name in _fly_app_names():
            row: dict[str, Any] = {
                "name": name,
                "status": "unknown",
                "hostname": f"https://{name}.fly.dev",
                "is_hub": name == "super-agents",
            }
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
        "service": "super-agents",
        "vm": SANDBOX_NAME,
        "public_url": PUBLIC_URL,
        "daytona_configured": bool(os.environ.get("DAYTONA_API_KEY", "").strip()),
        "mimo_configured": bool(_mimo_key()),
        "fly_inventory_configured": bool(os.environ.get("FLY_API_TOKEN", "").strip()),
        "endpoints": {
            "inventory": "/api/inventory",
            "sandboxes": "/api/sandboxes",
            "chat": "/v1/chat/completions",
        },
    }


@app.get("/api/sandboxes")
def list_sandboxes() -> dict[str, Any]:
    return _list_daytona()


@app.get("/api/fly-apps")
def list_fly_apps() -> dict[str, Any]:
    return _list_fly()


@app.get("/api/inventory")
def inventory() -> dict[str, Any]:
    return {
        "hub": {
            "name": SANDBOX_NAME,
            "fly_app": "super-agents",
            "url": PUBLIC_URL,
        },
        "daytona": _list_daytona(),
        "fly": _list_fly(),
        "agents": [
            {
                "id": "super-agents-vm",
                "name": SANDBOX_NAME,
                "host": "fly",
                "endpoint": f"{PUBLIC_URL}/v1",
                "note": "Single VM: command plane + MiMo API",
            },
            {
                "id": "hermes-mlx",
                "name": "Hermes 3 MLX",
                "host": "mac_local",
                "endpoint": "http://127.0.0.1:8090/v1",
                "note": "Apple Silicon only",
            },
        ],
    }


# --- OpenAI-compatible (MiMo) ---


@app.get("/v1/models")
def list_models() -> dict[str, Any]:
    return {
        "object": "list",
        "data": [
            {"id": DEFAULT_MODEL, "object": "model", "owned_by": "xiaomi-mimo"},
            {"id": "hermes-cloud", "object": "model", "owned_by": "studex"},
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
