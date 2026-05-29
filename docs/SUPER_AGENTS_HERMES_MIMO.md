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
fly secrets set MIMO_API_KEY=... DAYTONA_API_KEY=... --app super-agents
```

## Dashboard

Control Plane base URL: **`https://super-agents.fly.dev`**

## Hermes MLX

Stays on Mac (`agents/hermes-3-mlx/`). Cloud agents use Super Agents API + MiMo.

## Huashu plugin

Not in this repo. OpenClaw: `infra/daytona/bootstrap_openclaw.sh`.
