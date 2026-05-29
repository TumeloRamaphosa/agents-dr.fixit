# Super Agents runtime: Fly VM vs Mac vs Daytona

## Your Mac setup today

| Piece | Where it runs | Notes |
|-------|----------------|-------|
| Hermes 3 **MLX** | Mac Mini | Local GPU; `127.0.0.1:8090` |
| Ollama pool | Mac | Multiple local models |
| Hermes desktop / CLI | Mac | Points at MLX |
| CashClaw skills | With **OpenClaw** on a machine | `npx cashclaw init` — not a long-running server by itself |
| Cursor cloud agents | **Cursor’s cloud** | Build in Daytona; not installed inside your Fly VM |
| Discord / Slack | Scripts / webhooks on Mac or Valley OS | Need bot tokens |

## Super Agents cloud setup (recommended split)

```
┌──────────────────────── Fly: super-agents (jnb) ────────────────────────┐
│  • Command plane /api/inventory                                         │
│  • LLM gateway /v1  → Nous Hermes-4-70B | OpenAI | MiMo (secrets)      │
│  • Discord + Slack bridges (optional, same VM)                          │
└───────────────────────────────┬─────────────────────────────────────────┘
                                │ OPENAI_API_BASE=https://super-agents.fly.dev/v1
┌───────────────────────────────▼─────────────────────────────────────────┐
│  Daytona sandbox: "Super Agents"                                         │
│  • Node 20, OpenClaw, CashClaw (`bootstrap_super_agents.sh`)            │
│  • Cursor agents attach here to build/run                               │
│  • Hermes *cloud* via hub URL (not MLX)                                  │
└─────────────────────────────────────────────────────────────────────────┘

Mac Mini (unchanged): Hermes MLX for local speed; optional tunnel to hub.
```

**Hosting CashClaw + OpenClaw inside the Fly VM** is possible but tight on **512MB** free tier (Node + Python). Better: **Fly = API + chat bots**, **Daytona = agent workspace + CashClaw**.

## Agents and API keys (all via Fly secrets — never in git or chat)

| Agent / provider | Secret on Fly | Model examples |
|------------------|---------------|----------------|
| Hermes 4 (Nous) | `NOUS_API_KEY` | `Hermes-4-70B` |
| OpenAI | `OPENAI_API_KEY` | `gpt-4o`, `gpt-4.1` |
| Xiaomi MiMo | `MIMO_API_KEY` | `mimo-v2.5-pro` |
| Claude (API) | `ANTHROPIC_API_KEY` | use Anthropic SDK in sandbox, or add later |
| **Claude Code** (product) | Your Anthropic login / API | CLI is for local dev; in cloud use API + OpenClaw |
| **Cursor agent** | Cursor account | Runs on Cursor; uses Daytona sandbox to execute |
| Discord | `DISCORD_BOT_TOKEN` | Bot in Developer Portal |
| Slack | `SLACK_BOT_TOKEN`, `SLACK_APP_TOKEN` | Socket Mode app |

```bash
fly secrets set \
  NOUS_API_KEY=... \
  OPENAI_API_KEY=... \
  MIMO_API_KEY=... \
  DISCORD_BOT_TOKEN=... \
  SLACK_BOT_TOKEN=... \
  SLACK_APP_TOKEN=... \
  DAYTONA_API_KEY=... \
  --app super-agents
```

**Revoke any key that was pasted in chat** and create new ones.

## CashClaw

Upstream: https://github.com/ertugrulakben/cashclaw — OpenClaw skill pack + Stripe/HYRVE.

Install in **Daytona** (recommended):

```bash
bash infra/daytona/bootstrap_super_agents.sh
```

Or on any machine with Node 20+:

```bash
npm install -g cashclaw
cashclaw init
```

Point OpenClaw LLM config at `https://super-agents.fly.dev/v1` and model `Hermes-4-70B` or `gpt-4o`.

## Discord & Slack

Enable on the Fly app with bot tokens. Bridges call the **local** hub (`http://127.0.0.1:8080/v1`) so keys stay server-side.

1. [Discord Developer Portal](https://discord.com/developers/applications) → Bot → Token  
2. [Slack API](https://api.slack.com/apps) → Bot + Socket Mode → `xoxb-` + `xapp-`  
3. `fly secrets set` then `fly deploy`

## Huashu plugin

Not in this repo. OpenClaw + CashClaw are supported via bootstrap.
