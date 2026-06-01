"""Shared LLM call for Discord/Slack bridges → local Super Agents gateway."""

from __future__ import annotations

import os

import httpx

GATEWAY = os.environ.get("LLM_GATEWAY_URL", "http://127.0.0.1:8080/v1/chat/completions")
MODEL = os.environ.get("CHAT_MODEL", "Hermes-4-70B")
MAX_TOKENS = int(os.environ.get("CHAT_MAX_TOKENS", "1024"))


async def ask_agent(user_text: str, system: str | None = None) -> str:
    messages: list[dict[str, str]] = []
    if system:
        messages.append({"role": "system", "content": system})
    messages.append({"role": "user", "content": user_text})
    payload = {"model": MODEL, "messages": messages, "max_tokens": MAX_TOKENS}
    async with httpx.AsyncClient(timeout=300.0) as client:
        r = await client.post(GATEWAY, json=payload)
        r.raise_for_status()
        data = r.json()
    choices = data.get("choices") or []
    if not choices:
        return "(no response)"
    msg = choices[0].get("message") or {}
    return (msg.get("content") or "").strip() or "(empty)"
