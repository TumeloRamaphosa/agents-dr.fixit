# Super Agents VM, Hermes, and Xiaomi MiMo

## Security

Never paste API keys in chat or commit them. Set on Fly only:

```bash
fly secrets set MIMO_API_KEY="..." --app super-agents
```

If a key was exposed, **revoke and create a new one** at https://platform.xiaomimimo.com/console/api-keys

## What runs where

| Component | Where | Notes |
|-----------|--------|--------|
| **Hermes 3 MLX** | Mac Mini (Apple Silicon) | `agents/hermes-3-mlx/` — requires MLX, not portable to Fly Linux |
| **Super Agents API** | Fly app `super-agents` | OpenAI-compatible proxy to MiMo |
| **Cursor Studex** | Daytona sandbox | Build / cloud agents |
| **Super Agents** | Daytona sandbox | `create_super_agents_sandbox.py` |
| **Marketing site** | Fly `superagents-site` | Static `index.html` |
| **Management UI** | Command Plane API + dashboard | Lists Daytona + Fly apps |

You **cannot** move the MLX Hermes server to Fly as-is. You **can** run the same *agent software* in Daytona/Fly with LLM calls going to `https://super-agents.fly.dev/v1` (MiMo).

## Huashu plugin

There is **no Huashu plugin** in this repository (searched the codebase). OpenClaw bootstrap exists at `infra/daytona/bootstrap_openclaw.sh`. If Huashu is a third-party plugin, share the repo or install URL and we can add it to the sandbox bootstrap.

## Dashboard: seeing VMs

1. Deploy `infra/fly/studex-command-plane`
2. `fly secrets set FLY_API_TOKEN=... DAYTONA_API_KEY=...`
3. Open Control Plane → Save & Refresh → calls `/api/inventory`
