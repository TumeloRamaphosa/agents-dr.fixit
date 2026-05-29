# Super Agents API (Fly.io)

Cloud **OpenAI-compatible** API for Studex agents. Uses **Xiaomi MiMo** on the server (key in Fly secrets). This is **not** the Mac MLX Hermes binary — that stays on Apple Silicon.

## Deploy (org `personal`, region `jnb`)

```bash
cd infra/fly/super-agents-api
fly auth login
fly apps create super-agents --org personal
fly secrets set MIMO_API_KEY="your_key_from_console" --app super-agents
fly deploy
```

Test:

```bash
curl -s https://super-agents.fly.dev/health
curl -s https://super-agents.fly.dev/v1/models
```

Chat (key stays on server; use from your agent with base URL `https://super-agents.fly.dev/v1` only if you add auth in front — today this proxy is open; add Fly private network or API key middleware before production).

## Point Hermes / OpenClaw at MiMo via this gateway

In Daytona or a dev machine:

```bash
export OPENAI_API_BASE=https://super-agents.fly.dev/v1
export OPENAI_API_KEY=unused
# model: mimo-v2.5-pro or hermes-cloud
```

Mac MLX Hermes (`agents/hermes-3-mlx/`) continues to use `http://127.0.0.1:8090/v1`.

## Management dashboard

After deploying `studex-command-plane` with `FLY_API_TOKEN` set, Control Plane shows Fly apps (including `super-agents`) and Daytona sandboxes.
