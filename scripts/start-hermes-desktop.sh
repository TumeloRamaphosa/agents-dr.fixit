#!/bin/bash
# Start Hermes Desktop App with MLX Backend
# Run manually when you want to use the GUI

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BASE_DIR="$(dirname "$SCRIPT_DIR")"

# MLX Configuration
MLX_URL="${MLX_URL:-http://127.0.0.1:8090/v1}"
MODEL_ID="${HERMES_MODEL:-mlx-community/Hermes-3-Llama-3.1-8B-4bit}"

echo "╔════════════════════════════════════════════════════════════╗"
echo "║     Hermes Desktop + MLX Launcher                         ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Check if MLX is running
echo "→ Checking MLX server at $MLX_URL..."
if ! curl -s "$MLX_URL/models" > /dev/null 2>&1; then
    echo ""
    echo "⚠️  MLX server not running! Starting it..."
    echo ""
    
    # Start MLX server
    "$BASE_DIR/agents/hermes-3-mlx/hermes-mlx-server.sh" &
    
    # Wait for it
    for i in {1..30}; do
        if curl -s "$MLX_URL/models" > /dev/null 2>&1; then
            echo "✓ MLX server is ready!"
            break
        fi
        echo -n "."
        sleep 1
    done
    echo ""
else
    echo "✓ MLX server is running"
fi

# Configure Hermes to use MLX
echo ""
echo "→ Configuring Hermes for MLX..."
mkdir -p "$HOME/.config/hermes"

cat > "$HOME/.config/hermes/config.yaml" << EOF
model:
  provider: "custom"
  default: "$MODEL_ID"
  base_url: "$MLX_URL"
  context_length: 131072
EOF

echo "✓ Hermes configured:"
echo "   Model: $MODEL_ID"
echo "   Endpoint: $MLX_URL"

# Check Hermes CLI
if ! command -v hermes &> /dev/null; then
    echo ""
    echo "✗ Hermes CLI not found!"
    echo "   Install: pip install hermes-agent"
    exit 1
fi

# Launch desktop app
echo ""
echo "→ Starting Hermes Desktop..."
echo ""
echo "   🚀 Launching GUI..."
echo "   "
echo "   Tips:"
echo "   - MLX runs on your M1 Max GPU"
echo "   - All inference is local (private)"
echo "   - Model: Hermes 3 (8B parameters)"
echo ""

# Get PID and save it
hermes &
HERMES_PID=$!
echo "$HERMES_PID" > "/tmp/hermes-desktop.pid"

echo "✓ Hermes Desktop started (PID: $HERMES_PID)"
echo ""
echo "To check status: ./scripts/agent-heartbeat.sh --status"
echo "To view logs:    tail -f logs/hermes-desktop.log"
echo ""
echo "Press Ctrl+C to exit this script (Hermes will keep running)"
echo ""

# Wait for Hermes
wait $HERMES_PID
