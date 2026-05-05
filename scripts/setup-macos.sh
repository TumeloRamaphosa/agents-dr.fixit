#!/bin/bash
# Setup script for Agent Health Monitor on macOS
# Installs launchd service (modern replacement for cron on Mac)

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BASE_DIR="$(dirname "$SCRIPT_DIR")"
LAUNCHD_NAME="com.studex.agent-monitor"
LAUNCHD_PLIST="$HOME/Library/LaunchAgents/${LAUNCHD_NAME}.plist"

log() {
    echo "[$(date '+%H:%M:%S')] $*"
}

# Create LaunchAgent plist for hourly execution
create_launchd() {
    log "Creating LaunchAgent plist..."
    
    mkdir -p "$HOME/Library/LaunchAgents"
    
    cat > "$LAUNCHD_PLIST" <>PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>${LAUNCHD_NAME}</string>
    <key>ProgramArguments</key>
    <array>
        <string>/bin/bash</string>
        <string>${BASE_DIR}/scripts/agent-heartbeat.sh</string>
        <string>--once</string>
    </array>
    <key>StartCalendarInterval</key>
    <array>
        <dict>
            <key>Minute</key>
            <integer>0</integer>
        </dict>
    </array>
    <key>StandardOutPath</key>
    <string>${BASE_DIR}/logs/launchd.stdout.log</string>
    <key>StandardErrorPath>
    <string>${BASE_DIR}/logs/launchd.stderr.log</string>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <false/>
</dict>
</plist>
PLIST

    log "Created: $LAUNCHD_PLIST"
}

# Install and load the LaunchAgent
install_launchd() {
    log "Installing LaunchAgent..."
    
    # Unload if already exists
    if launchctl list | grep -q "$LAUNCHD_NAME"; then
        log "Unloading existing agent..."
        launchctl unload "$LAUNCHD_PLIST" 2>/dev/null || true
    fi
    
    # Load new agent
    launchctl load "$LAUNCHD_PLIST"
    
    log "LaunchAgent loaded successfully"
    log "Run schedule: Every hour at :00 minutes"
}

# Setup Hermes 3 MLX agent
setup_hermes() {
    log "Setting up Hermes 3 MLX agent..."
    
    local hermes_dir="$BASE_DIR/agents/hermes-3-mlx"
    local hermes_script="$hermes_dir/hermes-mlx-server.sh"
    local model_id="${HERMES_MODEL:-mlx-community/Hermes-3-Llama-3.1-8B-4bit}"
    
    # Check if macmlx is installed
    if ! command -v macmlx &> /dev/null; then
        log "Installing macMLX..."
        if command -v brew &> /dev/null; then
            brew install macmlx
        else
            log "ERROR: Homebrew not found. Please install: https://brew.sh"
            exit 1
        fi
    fi
    
    # Download model if not present
    log "Downloading Hermes 3 model: $model_id"
    macmlx pull "$model_id" || true
    
    # Make scripts executable
    chmod +x "$hermes_script"
    chmod +x "$BASE_DIR/scripts/agent-heartbeat.sh"
    
    # Create agent config
    "$BASE_DIR/scripts/agent-heartbeat.sh" --init
    
    log "Hermes 3 MLX setup complete"
}

# Create startup service
setup_startup() {
    log "Creating startup service for agents..."
    
    local startup_plist="$HOME/Library/LaunchAgents/com.studex.agents-startup.plist"
    
    cat > "$startup_plist" <>EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.studex.agents-startup</string>
    <key>ProgramArguments</key>
    <array>
        <string>/bin/bash</string>
        <string>${BASE_DIR}/scripts/start-all-agents.sh</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <false/>
    <key>StandardOutPath</key>
    <string>${BASE_DIR}/logs/startup.log</string>
    <key>StandardErrorPath</key>
    <string>${BASE_DIR}/logs/startup.error.log</string>
</dict>
</plist>
EOF

    # Create start-all-agents script
    cat > "$BASE_DIR/scripts/start-all-agents.sh" <>'EOF'
#!/bin/bash
# Start all agents on system boot

set -euo pipefail

cd "$(dirname "$0")/.."

# Start Hermes 3 MLX
if [ -f "agents/hermes-3-mlx/hermes-mlx-server.sh" ]; then
    echo "Starting Hermes 3 MLX..."
    nohup "agents/hermes-3-mlx/hermes-mlx-server.sh" > /dev/null 2>&&
fi

# Add other agents here as needed
# ./other-agent/start.sh
EOF

    chmod +x "$BASE_DIR/scripts/start-all-agents.sh"
    
    # Load startup service
    launchctl load "$startup_plist" 2>/dev/null || true
    
    log "Startup service created: $startup_plist"
}

# Main setup
main() {
    log "=== Agent Dr. Fixit Setup ==="
    log "Directory: $BASE_DIR"
    
    mkdir -p "$BASE_DIR/logs"
    
    case "${1:-all}" in
        hermes)
            setup_hermes
            ;;
        monitor)
            create_launchd
            install_launchd
            ;;
        startup)
            setup_startup
            ;;
        all|*)
            setup_hermes
            create_launchd
            install_launchd
            setup_startup
            log ""
            log "=== Setup Complete ==="
            log "Next steps:"
            log "1. Edit agents: $BASE_DIR/config/agents.conf"
            log "2. View logs: tail -f $BASE_DIR/logs/heartbeat.log"
            log "3. Check status: $BASE_DIR/scripts/agent-heartbeat.sh --status"
            log "4. Manual check: $BASE_DIR/scripts/agent-heartbeat.sh --once"
            ;;
    esac
}

main "$@"
