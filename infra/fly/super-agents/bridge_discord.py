#!/usr/bin/env python3
"""Discord bot → Super Agents LLM gateway (Hermes / OpenAI / MiMo via hub)."""

from __future__ import annotations

import os
import sys

import discord

from bridge_common import ask_agent

TOKEN = os.environ.get("DISCORD_BOT_TOKEN", "").strip()
if not TOKEN:
    print("DISCORD_BOT_TOKEN not set; Discord bridge disabled.", file=sys.stderr)
    sys.exit(0)

intents = discord.Intents.default()
intents.message_content = True
client = discord.Client(intents=intents)

SYSTEM = os.environ.get(
    "DISCORD_AGENT_SYSTEM",
    "You are CashClaw / Super Agents assistant for Studex. Be concise.",
)


@client.event
async def on_ready() -> None:
    print(f"Discord bridge ready as {client.user}")


@client.event
async def on_message(message: discord.Message) -> None:
    if message.author.bot:
        return
    if client.user not in message.mentions and not isinstance(message.channel, discord.DMChannel):
        return
    text = message.content.replace(f"<@{client.user.id}>", "").strip()
    if not text:
        return
    async with message.channel.typing():
        try:
            reply = await ask_agent(text, system=SYSTEM)
        except Exception as e:
            reply = f"Error calling agent hub: {e}"
    if len(reply) > 1900:
        reply = reply[:1900] + "…"
    await message.reply(reply)


if __name__ == "__main__":
    client.run(TOKEN)
