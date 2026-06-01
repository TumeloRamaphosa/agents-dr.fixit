# Super Agents — one VM, one sandbox

## Architecture

```
┌──────────────────────────── Fly: super-agents (jnb) ────────────────────────────┐
│  /health  /api/inventory  /api/sandboxes  /v1/chat/completions  (MiMo)        │
└────────────────────────────────────┬────────────────────────────────────────────┘
                                     │
┌──────────────────────────── Daytona: "Super Agents" ────────────────────────────┐
│  Builds, OpenClaw, cursor cloud agents → OPENAI_API_BASE = super-agents.fly.dev │
└─────────────────────────────────────────────────────────────────────────────────┘
```

No separate **studex-command-plane** Fly app.

## Secrets (Fly app `super-agents` only)

```bash
fly secrets set NOUS_API_KEY=... MIMO_API_KEY=... DAYTONA_API_KEY=... --app super-agents
```

**Hermes-4-70B** uses Nous: `https://inference-api.nousresearch.com/v1/chat/completions` with `Authorization: Bearer` — proxied at `https://super-agents.fly.dev/v1/chat/completions` when `model` is `Hermes-4-70B` (or any `Hermes*` name).

## Dashboard

Control Plane base URL: **`https://super-agents.fly.dev`**

## Hermes MLX

Stays on Mac (`agents/hermes-3-mlx/`). Cloud agents use Super Agents API + MiMo.

## Huashu plugin

Not in this repo. OpenClaw: `infra/daytona/bootstrap_openclaw.sh`.
