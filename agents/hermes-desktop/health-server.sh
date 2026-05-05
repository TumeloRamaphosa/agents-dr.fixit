#!/bin/bash
# Health check endpoint for Hermes Desktop (optional micro-server)
# Returns 200 if Hermes is running

PORT="${HERMES_HEALTH_PORT:-9001}"
PID_FILE="/tmp/hermes-desktop.pid"

if [ -f "$PID_FILE" ]; then
    PID=$(cat "$PID_FILE" 2>/dev/null || echo "")
    if [ -n "$PID" ] && kill -0 "$PID" 2>/dev/null; then
        echo -e "HTTP/1.1 200 OK\n\n{\"status\":\"ok\",\"pid\":$PID,\"agent\":\"hermes-desktop\"}"
        exit 0
    fi
fi

echo -e "HTTP/1.1 503 Service Unavailable\n\n{\"status\":\"down\"}"
exit 1
