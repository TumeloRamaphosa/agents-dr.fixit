> **Note:** This README combines the previous Agent Configuration Manager with the new Dr.Fixit Health Monitoring System.

# Agent Dr. Fixit 🤖💉

**Automated Health Monitoring & Auto-Recovery for AI Agents**

Continuous uptime for your local MLX inference servers with automatic restart, health checks, and comprehensive logging.

## Features

- 🔄 **Auto-Restart**: Automatically restarts crashed agents within seconds
- 💓 **Heartbeat Monitoring**: Checks all agents every hour (configurable)
- 🏎️ **MLX Native**: Hermes 3 runs on Apple's MLX framework (faster than GGUF/Ollama)
- 📝 **Comprehensive Logging**: All activity logged to `logs/` directory
- 🚨 **Alert System**: Notifies when agents go down and come back up
- 🎯 **Multi-Agent**: Support for unlimited agents in one config file
- 🍎 **macOS Native**: Uses launchd (proper Mac service management)

## Directory Structure

```
agents-dr.fixit/
├── agents/
│   └── hermes-3-mlx/              # Hermes 3 MLX server
├── scripts/
│   ├── agent-heartbeat.sh        # Health monitor (main)
│   ├── setup-macos.sh            # launchd installer
│   └── uninstall.sh              # Cleanup
├── config/
│   └── agents.conf               # Agent registry
├── logs/                         # Health logs
├── .github/workflows/            # CI/CD validation
└── install.sh                    # One-command setup
```

## Quick Start

```bash
# 1. Clone the repo
git clone https://github.com/TumeloRamaphosa/agents-dr.fixit.git
cd agents-dr.fixit

# 2. Run setup
chmod +x install.sh
./install.sh
```

## What's Installed

### 1. Hermes 3 MLX Server (`agents/hermes-3-mlx/`)
- **Model**: Hermes-3-Llama-3.1-8B-4bit (recommended for 32GB Macs)
- **Backend**: macMLX (native Swift, fastest on Apple Silicon)
- **Port**: 8000
- **API**: OpenAI-compatible at `http://localhost:8000/v1`

### 2. Heartbeat Monitor (`scripts/agent-heartbeat.sh`)
- Checks agent health every hour
- Auto-restarts on failure
- Health checks verify both process + HTTP endpoint
- Logs everything to `logs/heartbeat.log`

### 3. LaunchD Service (Auto-scheduled)
- Runs hourly via macOS launchd
- Also runs on system boot
- No cron needed (uses native Mac tech)

## Configuration

### Add New Agents

Edit `config/agents.conf`:

```
# Format: agent_name|health_url|pid_file|type

# Hermes 3 MLX
hermes-3-mlx|http://127.0.0.1:8000/v1/models|/tmp/hermes-3-mlx.pid|server

# Example: Ollama
ollama|http://127.0.0.1:11434/api/tags|/tmp/ollama.pid|server

# Example: n8n
n8n|http://127.0.0.1:5678/health|/tmp/n8n.pid|server

# Example: ChromaDB
chromadb|http://127.0.0.1:8000/api/v1/heartbeat|/tmp/chroma.pid|server

# Example: Custom Python service
my-service|http://127.0.0.1:9000/health||server
```

### Hermes Model Selection

For your M1 Max 32GB, you can run:

| Model | Size | Speed | Command |
|-------|------|-------|---------|
| Hermes-3-3B | ~1.8GB | Very Fast | `macmlx pull mlx-community/Hermes-3-Llama-3.2-3B-4bit` |
| **Hermes-3-8B** ⭐ | ~5GB | **Fast, Best Quality** | `macmlx pull mlx-community/Hermes-3-Llama-3.1-8B-4bit` |
| Hermes-3-70B | ~40GB | Too big for 32GB | Skip |

Set your preferred model:
```bash
export HERMES_MODEL=mlx-community/Hermes-3-Llama-3.1-8B-4bit
./install.sh
```

## Commands

```bash
# Check status of all agents
./scripts/agent-heartbeat.sh --status

# Run health check once (manual)
./scripts/agent-heartbeat.sh --once

# View logs
tail -f logs/heartbeat.log
tail -f logs/hermes-3-mlx.log

# Start Hermes manually
./agents/hermes-3-mlx/hermes-mlx-server.sh

# Stop all agents
launchctl unload ~/Library/LaunchAgents/com.studex.agent-monitor.plist
launchctl unload ~/Library/LaunchAgents/com.studex.agents-startup.plist

# Uninstall
./scripts/uninstall.sh
```

## Log Files

| File | Purpose |
|------|---------|
| `logs/heartbeat.log` | Health check runs, agent status |
| `logs/alerts.log` | Only errors and restarts |
| `logs/hermes-3-mlx.log` | Model inference logs |
| `logs/launchd.stderr.log` | Service errors |

## How the Monitoring Works

```
┌─────────────────────────────────────────────────────┐
│         launchd (runs every hour)                   │
└─────────────────┬───────────────────────────────────┘
                  ▼
┌─────────────────────────────────────────────────────┐
│    agent-heartbeat.sh --once                        │
│    (checks all agents in agents.conf)               │
└─────────────────┬───────────────────────────────────┘
                  ▼
    ┌─────────────────┐
    │ Is process      │────No────┐
    │ running?        │          │
    └─────────────────┘          │
          │ Yes                  │
          ▼                      │
    ┌─────────────────┐          │
    │ HTTP health     │────No────┤
    │ check pass?     │          │
    └─────────────────┘          │
          │ Yes                  │
          ▼                      ▼
    ┌─────────┐            ┌─────────┐
    │ Log     │            │ Restart │
    │ Healthy │            │ Agent   │
    └─────────┘            └─────────┘
```

## Connect to Hermes Desktop App

Once running, configure the Hermes desktop app:

```bash
hermes model
# Select: "Custom endpoint"
# Base URL: http://localhost:8000/v1
# Model: mlx-community/Hermes-3-Llama-3.1-8B-4bit

hermes  # Launch desktop app
```

## Testing

```bash
# Test Hermes is responding
curl http://localhost:8000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{"model":"Hermes-3-Llama-3.1-8B-4bit","messages":[{"role":"user","content":"Hello"}]}'

# Test heartbeat manually
./scripts/agent-heartbeat.sh --once

# Simulate crash and see recovery
pkill -f "hermes-mlx-server"
./scripts/agent-heartbeat.sh --once  # Should auto-restart
```

## Troubleshooting

### "macmlx command not found"
```bash
brew install macmlx
```

### "Permission denied"
```bash
chmod +x install.sh
chmod +x scripts/*.sh
chmod +x agents/*/*.sh
```

### Agent won't start
Check logs:
```bash
tail -50 logs/hermes-3-mlx.log
tail -20 logs/launchd.stderr.log
```

### Monitor not running
```bash
launchctl list | grep studex
ls ~/Library/LaunchAgents/com.studex.*
```

## Performance on M1 Max 32GB

| Model | Memory | Tokens/sec | Use Case |
|-------|--------|------------|----------|
| Hermes-3-3B | ~5GB | ~80 tok/s | Quick tasks, testing |
| Hermes-3-8B | ~12GB | ~45 tok/s | General purpose ⭐ |
| Qwen3.5-9B | ~12GB | ~50 tok/s | Advanced reasoning |

All models run entirely on GPU (unified memory).

## Advanced: Custom Alert Integration

Edit `scripts/agent-heartbeat.sh` and add webhook calls to the `alert()` function:

```bash
alert() {
    # Local logging
    echo "[$(date)] ALERT: $*" | tee -a "$ALERT_LOG"
    
    # Add webhook notifications here:
    # curl -X POST "https://hooks.slack.com/services/YOUR/WEBHOOK/URL" \
    #   -H 'Content-Type: application/json' \
    #   -d "{\"text\":\"Agent Alert: $*\"}"
    
    # Or n8n webhook:
    # curl -X POST "http://localhost:5678/webhook/agent-alert" \
    #   -d "{\"message\":\"$*\",\"timestamp\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"}"
}
```

## Studex Cloud: Daytona · Fly · Command dashboard

Sandboxes (**Cursor Studex**), Fly.io API, OpenClaw bootstrap, and the dashboard **Control Plane** tab:

- `infra/daytona/` — create Daytona sandbox (`create_cursor_studex_sandbox.py`), OpenClaw bootstrap script
- `infra/fly/super-agents/` — Single Fly VM: command plane, `/api/inventory`, MiMo `/v1` (app `super-agents`)
- `studex-nexus-dashboard.html` — **Control Plane** section (stores Fly URL in `localStorage`)
- `docs/SUPERAGENTS_SITE_BRIDGE.md` — wiring [superagents-site](https://github.com/TumeloRamaphosa/superagents-site), Vercel, and **stud.exchange**

## Legacy: Agent Configuration

This repo was previously used for agent configuration management. Those configs are preserved in:
```
config/
├── slack/
├── openclaw/
├── hermes/
└── nexus/
```

## License

MIT - For Studex Group internal use.

---

**Maintained by**: Tumelo Ramaphosa  
**Last Updated**: 2025
