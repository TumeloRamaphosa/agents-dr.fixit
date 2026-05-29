"""
Super Agents — single Fly VM: command plane, inventory API, OpenAI-compatible LLM gateway.

Routes /v1/chat/completions to Nous (Hermes-4-*) or Xiaomi MiMo by model name.
Secrets on Fly: NOUS_API_KEY, MIMO_API_KEY, DAYTONA_API_KEY (never in code or chat).
"""

from __future__ import annotations

import json
import os
from typing import Any, Literal, cast

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
MIMO_MODEL = os.environ.get("MIMO_MODEL", "mimo-v2.5-pro")
NOUS_BASE = os.environ.get("NOUS_API_BASE", "https://inference-api.nousresearch.com/v1").rstrip("/")
NOUS_MODEL = os.environ.get("NOUS_MODEL", "Hermes-4-70B")
OPENAI_BASE = os.environ.get("OPENAI_API_BASE", "https://api.openai.com/v1").rstrip("/")
OPENAI_MODEL = os.environ.get("OPENAI_MODEL", "gpt-4o")
PUBLIC_URL = os.environ.get("SUPER_AGENTS_PUBLIC_URL", "https://super-agents.fly.dev").rstrip("/")
DEFAULT_PROVIDER = os.environ.get("DEFAULT_LLM_PROVIDER", "nous").strip().lower()

Provider = Literal["nous", "mimo", "openai"]

# Other Fly apps to list in dashboard (this app is the hub — not a separate command-plane app)
OTHER_FLY_APPS = ("superagents-site", "studex-n8n", "agentic-lab-v3")


def _mimo_key() -> str | None:
    key = os.environ.get("MIMO_API_KEY", "").strip()
    return key or None


def _nous_key() -> str | None:
    key = os.environ.get("NOUS_API_KEY", "").strip()
    return key or None


def _openai_key() -> str | None:
    key = os.environ.get("OPENAI_API_KEY", "").strip()
    return key or None


def _pick_provider(model: str | None) -> Provider:
    name = (model or "").lower()
    if name.startswith("hermes") or "nous" in name:
        return "nous"
    if name.startswith("mimo"):
        return "mimo"
    if name.startswith("gpt-") or name.startswith("o1") or name.startswith("o3") or name.startswith("o4"):
        return "openai"
    if DEFAULT_PROVIDER in ("nous", "mimo", "openai"):
        return cast(Provider, DEFAULT_PROVIDER)
    if _nous_key():
        return "nous"
    if _openai_key():
        return "openai"
    return "mimo"


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
        "nous_configured": bool(_nous_key()),
        "openai_configured": bool(_openai_key()),
        "discord_bridge": os.environ.get("ENABLE_DISCORD_BRIDGE", "false").lower() == "true",
        "slack_bridge": os.environ.get("ENABLE_SLACK_BRIDGE", "false").lower() == "true",
        "default_provider": DEFAULT_PROVIDER,
        "nous_model": NOUS_MODEL,
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
                "note": "Single VM: command plane + Nous Hermes + MiMo",
            },
            {
                "id": "hermes-nous",
                "name": "Hermes 4 (Nous hosted)",
                "host": "fly",
                "endpoint": f"{PUBLIC_URL}/v1",
                "model": NOUS_MODEL,
                "note": "Set NOUS_API_KEY on Fly; model Hermes-4-70B",
            },
            {
                "id": "openai",
                "name": "OpenAI",
                "host": "fly",
                "endpoint": f"{PUBLIC_URL}/v1",
                "model": OPENAI_MODEL,
                "note": "OPENAI_API_KEY on Fly; use gpt-4o etc.",
            },
            {
                "id": "cashclaw",
                "name": "CashClaw + OpenClaw",
                "host": "daytona",
                "endpoint": f"{PUBLIC_URL}/v1",
                "note": "bootstrap_super_agents.sh in Super Agents sandbox",
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


# --- OpenAI-compatible gateway (Nous Hermes + MiMo) ---


@app.get("/v1/models")
def list_models() -> dict[str, Any]:
    data: list[dict[str, Any]] = []
    if _nous_key():
        data.append({"id": NOUS_MODEL, "object": "model", "owned_by": "nous-research"})
        data.append({"id": "Hermes-4-405B", "object": "model", "owned_by": "nous-research"})
    if _mimo_key():
        data.append({"id": MIMO_MODEL, "object": "model", "owned_by": "xiaomi-mimo"})
    if not data:
        data.append({"id": NOUS_MODEL, "object": "model", "owned_by": "nous-research"})
    return {"object": "list", "data": data}


@app.api_route("/v1/chat/completions", methods=["POST"])
async def chat_completions(request: Request) -> Response:
    body_bytes = await request.body()
    content_type = request.headers.get("content-type", "application/json")
    model: str | None = None
    try:
        payload = json.loads(body_bytes) if body_bytes else {}
        if isinstance(payload, dict):
            model = payload.get("model")
    except json.JSONDecodeError:
        payload = None

    override = request.headers.get("x-studex-provider", "").strip().lower()
    provider: Literal["nous", "mimo"]
    if override in ("nous", "mimo"):
        provider = override  # type: ignore[assignment]
    else:
        provider = _pick_provider(model if isinstance(model, str) else None)

    if provider == "nous":
        key = _nous_key()
        if not key:
            raise HTTPException(
                status_code=503,
                detail="NOUS_API_KEY not set. fly secrets set NOUS_API_KEY=... --app super-agents",
            )
        headers = {
            "Authorization": f"Bearer {key}",
            "Content-Type": content_type,
        }
        url = f"{NOUS_BASE}/chat/completions"
        timeout = 300.0
    else:
        key = _mimo_key()
        if not key:
            raise HTTPException(
                status_code=503,
                detail="MIMO_API_KEY not set. fly secrets set MIMO_API_KEY=... --app super-agents",
            )
        headers = {
            "api-key": key,
            "Content-Type": content_type,
        }
        url = f"{MIMO_BASE}/chat/completions"
        timeout = 120.0

    async with httpx.AsyncClient(timeout=timeout) as client:
        upstream = await client.post(url, content=body_bytes, headers=headers)
    return Response(
        content=upstream.content,
        status_code=upstream.status_code,
        media_type=upstream.headers.get("content-type", "application/json"),
        headers={"X-Studex-Provider": provider},
    )
