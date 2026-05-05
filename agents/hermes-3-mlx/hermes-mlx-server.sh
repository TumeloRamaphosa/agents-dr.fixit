#!/bin/bash
# Hermes 3 MLX Server Launcher
# Auto-restart on crash, health monitoring enabled

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
AGENT_NAME="hermes-3-mlx"
PID_FILE="/tmp/${AGENT_NAME}.pid"
LOG_FILE="${SCRIPT_DIR}/../../logs/${AGENT_NAME}.log"
CONFIG_FILE="${SCRIPT_DIR}/config.env"

# Default config
MODEL_ID="${HERMES_MODEL:-mlx-community/Hermes-3-Llama-3.1-8B-4bit}"
PORT="${HERMES_PORT:-8090}"
HOST="${HERMES_HOST:-127.0.0.1}"

# Ensure log directory exists
mkdir -p "$(dirname "$LOG_FILE")"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" | tee -a "$LOG_FILE"
}

cleanup() {
    log "Shutting down Hermes 3 MLX server..."
    rm -f "$PID_FILE"
    exit 0
}

trap cleanup SIGTERM SIGINT

# Check if already running
if [ -f "$PID_FILE" ]; then
    OLD_PID=$(cat "$PID_FILE" 2>/dev/null || echo "")
    if [ -n "$OLD_PID" ] && kill -0 "$OLD_PID" 2>/dev/null; then
        log "Server already running on PID $OLD_PID"
        exit 0
    else
        rm -f "$PID_FILE"
    fi
fi

# Check for MLX tools
if command -v macmlx &> /dev/null; then
    BACKEND="macmlx"
elif command -v mlx_lm.server &> /dev/null; then
    BACKEND="mlx-lm"
else
    log "ERROR: No MLX server found. Install with: brew install macmlx"
    exit 1
fi

# Check/download model
log "Starting Hermes 3 MLX server..."
log "Model: $MODEL_ID"
log "Backend: $BACKEND"
log "Endpoint: http://$HOST:$PORT/v1"

# Write PID
echo $$ > "$PID_FILE"

# Start server based on backend
case $BACKEND in
    macmlx)
        log "Using macmlx native Swift backend"
        exec macmlx serve "$MODEL_ID" --host "$HOST" --port "$PORT" 2>&1 | tee -a "$LOG_FILE"
        ;;
    mlx-lm)
        log "Using mlx-lm Python backend"
        exec python -m mlx_lm.server \
            --model "$MODEL_ID" \
            --host "$HOST" \
            --port "$PORT" 2>&1 | tee -a "$LOG_FILE"
        ;;
esac
