#!/bin/bash
# Quick Start - Run this to set everything up

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "╔════════════════════════════════════════════════════════════╗"
echo "║       Agent Dr. Fixit - Health Monitor Setup               ║"
echo "║       Hermes 3 MLX + Auto-Restart System                   ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Make scripts executable
chmod +x "$SCRIPT_DIR/scripts/"*.sh
chmod +x "$SCRIPT_DIR/agents/"*/*.sh 2>/dev/null || true

# Run macOS setup
echo "→ Setting up for macOS..."
"$SCRIPT_DIR/scripts/setup-macos.sh" all

echo ""
echo "✅ Setup complete!"
echo ""
echo "📁 Files created:"
echo "   Config:  $SCRIPT_DIR/config/agents.conf"
echo "   Scripts: $SCRIPT_DIR/scripts/"
echo "   Logs:    $SCRIPT_DIR/logs/"
echo ""
echo "🚀 To start Hermes 3 MLX now:"
echo "   $SCRIPT_DIR/agents/hermes-3-mlx/hermes-mlx-server.sh"
echo ""
echo "📊 Check status:"
echo "   $SCRIPT_DIR/scripts/agent-heartbeat.sh --status"
echo ""
echo "🔧 The heartbeat monitor runs automatically every hour via launchd"
echo "   It will restart any failed agents automatically"
