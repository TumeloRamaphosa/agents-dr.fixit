# Logs Directory

This directory contains:
- `heartbeat.log` - Health check runs
- `*.log` - Individual agent logs
- `alerts.log` - Error notifications

Logs are automatically rotated and should be monitored via:
```bash
tail -f logs/heartbeat.log
```
