# Quick Reference Card

## Install (One-time)
```bash
cd ~/agents-dr.fixit
./install.sh
```

## Daily Commands
```bash
# Check if everything is running
./scripts/agent-heartbeat.sh --status

# View live logs
tail -f logs/heartbeat.log
tail -f logs/hermes-3-mlx.log

# Test Hermes API
curl http://localhost:8000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{"model":"Hermes-3-Llama-3.1-8B-4bit","messages":[{"role":"user","content":"Hello"}]}'
```

## Troubleshooting
```bash
# Agent won't start
./agents/hermes-3-mlx/hermes-mlx-server.sh

# Restart everything
launchctl unload ~/Library/LaunchAgents/com.studex.*.plist
./install.sh

# Full reset
./scripts/uninstall.sh
rm -rf logs/*.log
./install.sh
```

## Files to Edit
| File | Purpose |
|------|---------|
| `config/agents.conf` | Add/remove agents |
| `logs/heartbeat.log` | Monitor health |
| `logs/alerts.log` | See errors only |

## URLs After Setup
- Hermes API: http://localhost:8000/v1
- Health Check: http://localhost:8000/v1/models

## Git Commands
```bash
# Push updates
git add .
git commit -m "Add Hermes 3 MLX + heartbeat monitoring"
git push origin main

# View status
git status
git log --oneline -5
```
