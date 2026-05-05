#!/bin/bash
# Setup script for Agent Dr. Fixit with Hermes Desktop + MLX Integration
# Run this once to set everything up

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo ""
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║     🤖 Dr. Fixit - Agent Health Monitor Setup               ║"
echo "║     Hermes 3 MLX + Desktop App Integration                    ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# Make scripts executable
echo "→ Setting up permissions..."
chmod +x "$SCRIPT_DIR"/*.sh 2>/dev/null || true
chmod -R +x "$SCRIPT_DIR/scripts/"*.sh 2>/dev/null || true
chmod -R +x "$SCRIPT_DIR/agents/"*/*.sh 2>/dev/null || true

# Create directories
echo "→ Creating directories..."
mkdir -p "$SCRIPT_DIR/logs"
mkdir -p "$SCRIPT_DIR/config"

# Check for Hermes CLI
if ! command -v hermes &>/dev/null; then
    echo ""
    echo "⚠️  WARNING: Hermes CLI not found in PATH"
    echo "   Install with: pip install hermes-agent"
    echo "   Or download from: https://github.com/NousResearch/hermes-agent"
    echo ""
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Check for MLX
if ! command -v macmlx &>/dev/null; then
    echo ""
    echo "⚠️  macMLX not found. Install with: brew install macmlx"
    echo ""
fi

# Install cron/launchd
echo "→ Installing launchd agents (hourly health checks)..."
"$SCRIPT_DIR/scripts/agent-heartbeat.sh" --install

echo ""
echo "✅ Setup Complete!"
echo ""
echo "┌────────────────────────────────────────────────────────────────┐"
echo "│  START THE SYSTEM:                                             │"
echo "├────────────────────────────────────────────────────────────────┤"
echo "│  Option 1 - Start everything:                                  │"
echo "│      ./scripts/agent-heartbeat.sh --once                      │"
echo "│                                                                │"
echo "│  Option 2 - Manual start:                                      │"
echo "│      # 1. Start MLX server first:                              │"
echo "│      ./agents/hermes-3-mlx/hermes-mlx-server.sh               │"
echo "│                                                                │"
echo "│      # 2. Then start desktop app:                              │"
echo "│      ./agents/hermes-desktop/hermes-desktop-launcher.sh       │"
echo "│                                                                │"
echo "│  Option 3 - Auto-start on next boot:                           │"
echo "│      (Already configured via launchd)                          │"
echo "└────────────────────────────────────────────────────────────────┘"
echo ""
echo "📊 Check status:"
echo "   ./scripts/agent-heartbeat.sh --status"
echo ""
echo "📁 Logs location:"
echo "   tail -f $SCRIPT_DIR/logs/heartbeat.log"
echo ""
echo "⏰ Health checks run automatically every hour via launchd"
echo "   └─ LaunchAgents: com.studex.agent-monitor"
echo "   └─ Launches on boot: com.studex.agents-startup"
echo ""
