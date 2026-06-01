#!/usr/bin/env python3
"""Slack Socket Mode bot → Super Agents LLM gateway."""

from __future__ import annotations

import asyncio
import os
import sys

from slack_bolt.async_app import AsyncApp
from slack_bolt.adapter.socket_mode.async_handler import AsyncSocketModeHandler

from bridge_common import ask_agent

BOT_TOKEN = os.environ.get("SLACK_BOT_TOKEN", "").strip()
APP_TOKEN = os.environ.get("SLACK_APP_TOKEN", "").strip()

if not BOT_TOKEN or not APP_TOKEN:
    print("SLACK_BOT_TOKEN / SLACK_APP_TOKEN not set; Slack bridge disabled.", file=sys.stderr)
    sys.exit(0)

app = AsyncApp(token=BOT_TOKEN)
SYSTEM = os.environ.get(
    "SLACK_AGENT_SYSTEM",
    "You are CashClaw / Super Agents assistant for Studex. Be concise.",
)


@app.event("app_mention")
async def handle_mention(event, say, logger) -> None:
    text = (event.get("text") or "").strip()
    for token in ("<@", ">"):
        if token in text:
            parts = text.split(">", 1)
            text = parts[1].strip() if len(parts) > 1 else text
    if not text:
        await say("Mention me with a question.")
        return
    try:
        reply = await ask_agent(text, system=SYSTEM)
    except Exception as e:
        logger.exception(e)
        reply = f"Error calling agent hub: {e}"
    await say(reply[:3900])


async def main() -> None:
    handler = AsyncSocketModeHandler(app, APP_TOKEN)
    print("Slack bridge starting (Socket Mode)…")
    await handler.start_async()


if __name__ == "__main__":
    asyncio.run(main())
