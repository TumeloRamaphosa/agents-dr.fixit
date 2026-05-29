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
