# Super Agents (one Fly VM + one Daytona sandbox)

Everything runs under the name **Super Agents**:

| Layer | Name | What it does |
|-------|------|----------------|
| **Fly.io** | App `super-agents` | Command plane (`/api/inventory`), Daytona list, MiMo chat (`/v1/chat/completions`) |
| **Daytona** | Sandbox `Super Agents` | Build/run agents; calls this Fly URL for LLM |

There is **no** separate `studex-command-plane` app anymore.

## Deploy the VM

```bash
cd infra/fly/super-agents
fly auth login
fly apps create super-agents --org personal   # if needed
fly secrets set \
  NOUS_API_KEY="sk-nous-..." \
  MIMO_API_KEY="..." \
  DAYTONA_API_KEY="..." \
  --app super-agents
# Optional: list other Fly apps in dashboard
fly secrets set FLY_API_TOKEN="..." --app super-agents
fly deploy
```

Dashboard URL: **`https://super-agents.fly.dev`** (paste into Control Plane, no trailing slash).

## Create the Daytona sandbox

```bash
export DAYTONA_API_KEY=...
python infra/daytona/create_super_agents_sandbox.py
```

## Test

```bash
curl -s https://super-agents.fly.dev/health
curl -s https://super-agents.fly.dev/api/inventory
```

### Hermes 4 via Nous (same as portal API, key on server)

```bash
curl -s https://super-agents.fly.dev/v1/chat/completions \
  -H 'Content-Type: application/json' \
  -d '{"model":"Hermes-4-70B","messages":[{"role":"user","content":"Hello"}],"max_tokens":64}'
```

Models starting with `Hermes` route to Nous; `mimo-*` routes to MiMo. Force provider: header `X-Studex-Provider: nous` or `mimo`.

**Never commit or paste API keys.** Create keys at https://portal.nousresearch.com only.

## Discord & Slack

1. Create bots (see `docs/SUPER_AGENTS_RUNTIME.md`).
2. Enable bridges:

```bash
fly secrets set DISCORD_BOT_TOKEN=... --app super-agents
fly secrets set SLACK_BOT_TOKEN=... SLACK_APP_TOKEN=... --app super-agents
fly secrets set ENABLE_DISCORD_BRIDGE=true ENABLE_SLACK_BRIDGE=true --app super-agents
fly deploy
```

Mention the Discord bot or `@app` in Slack; replies use `CHAT_MODEL` (default `Hermes-4-70B`) via the hub.

## CashClaw + OpenClaw (Daytona, not inside this image)

```bash
# In Super Agents sandbox
bash infra/daytona/bootstrap_super_agents.sh
```

CashClaw: https://github.com/ertugrulakben/cashclaw

## OpenAI

```bash
fly secrets set OPENAI_API_KEY=... --app super-agents
# Use model gpt-4o in requests
```
