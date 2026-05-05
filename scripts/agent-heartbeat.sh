#!/bin/bash
# Agent Health Monitor - Heartbeat Checker
# Checks all registered agents every hour via cron
# Auto-restarts failed agents

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BASE_DIR="$(dirname "$SCRIPT_DIR")"
LOG_DIR="$BASE_DIR/logs"
CONFIG_DIR="$BASE_DIR/config"
HEALTH_LOG="$LOG_DIR/heartbeat.log"
ALERT_LOG="$LOG_DIR/alerts.log"

# Ensure directories
mkdir -p "$LOG_DIR" "$CONFIG_DIR"

# Agent registry file
AGENTS_FILE="$CONFIG_DIR/agents.conf"

# Default timeout for health checks
HEALTH_TIMEOUT="${HEALTH_TIMEOUT:-30}"
MAX_RETRIES="${MAX_RETRIES:-3}"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" | tee -a "$HEALTH_LOG"
}

alert() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] ALERT: $*" | tee -a "$ALERT_LOG" "$HEALTH_LOG"
}

# Check process is running
check_process() {
    local pid_file="$1"
    
    if [ ! -f "$pid_file" ]; then
        return 1
    fi
    
    local pid
    pid=$(cat "$pid_file" 2>/dev/null || echo "")
    
    if [ -z "$pid" ]; then
        return 1
    fi
    
    if ! kill -0 "$pid" 2>/dev/null; then
        return 1
    fi
    
    return 0
}

# Check if an agent is healthy
check_agent_health() {
    local agent_name="$1"
    local health_url="$2"
    local pid_file="${3:-/tmp/${agent_name}.pid}"
    
    # Handle different URL schemes
    case "$health_url" in
        process://*)
            # Process-only check (no HTTP endpoint)
            local proc_pid_file="${health_url#process://}"
            if [ -f "$proc_pid_file" ]; then
                check_process "$proc_pid_file"
                return $?
            fi
            return 1
            ;;
        http://*|https://*)
            # HTTP health check
            local response
            response=$(curl -s -o /dev/null -w "%{http_code}" \
                --max-time "$HEALTH_TIMEOUT" \
                "$health_url" 2>/dev/null || echo "000")
            
            if [ "$response" = "200" ] || [ "$response" = "204" ]; then
                return 0
            else
                # HTTP failed - also verify process exists
                if ! check_process "$pid_file"; then
                    return 1
                fi
                # Process exists but HTTP failing
                return 1
            fi
            ;;
        *)
            # Default: just check process
            check_process "$pid_file"
            return $?
            ;;
    esac
}

# Get agent info from config
get_agent_info() {
    local target_agent="$1"
    while IFS='|' read -r name url pid_file type deps || [ -n "$name" ]; do
        [[ "$name" =~ ^# ]] && continue
        [ -z "$name" ] && continue
        if [ "$name" = "$target_agent" ]; then
            echo "$name|$url|${pid_file:-/tmp/${name}.pid}|${type:-server}|${deps:-}"
            return 0
        fi
    done < "$AGENTS_FILE"
    return 1
}

# Check dependencies
check_dependencies() {
    local deps="$1"
    local all_healthy=true
    
    [ -z "$deps" ] && return 0
    
    IFS=',' read -ra DEP_ARRAY <<< "$deps"
    for dep in "${DEP_ARRAY[@]}"; do
        dep=$(echo "$dep" | xargs) # trim whitespace
        local dep_info
        if dep_info=$(get_agent_info "$dep"); then
            local dep_url dep_pid
            dep_url=$(echo "$dep_info" | cut -d'|' -f2)
            dep_pid=$(echo "$dep_info" | cut -d'|' -f3)
            
            if ! check_agent_health "$dep" "$dep_url" "$dep_pid"; then
                log "  ⚠️  Dependency $dep is not healthy"
                all_healthy=false
            else
                log "  ✓ Dependency $dep is healthy"
            fi
        else
            log "  ⚠️  Dependency $dep not found in config"
            all_healthy=false
        fi
    done
    
    $all_healthy && return 0 || return 1
}

# Restart an agent
restart_agent() {
    local agent_name="$1"
    local agent_type="${2:-server}"
    
    log "Attempting to restart $agent_name (type: $agent_type)..."
    
    local pid_file="/tmp/${agent_name}.pid"
    local startup_script="$BASE_DIR/agents/$agent_name/${agent_name}.sh"
    
    # Kill any existing first
    if [ -f "$pid_file" ]; then
        local old_pid
        old_pid=$(cat "$pid_file" 2>/dev/null || echo "")
        if [ -n "$old_pid" ]; then
            kill "$old_pid" 2>/dev/null || true
            sleep 2
            kill -9 "$old_pid" 2>/dev/null || true
        fi
        rm -f "$pid_file"
    fi
    
    # Find startup script
    if [ ! -x "$startup_script" ]; then
        # Try alternate naming
        startup_script="$BASE_DIR/agents/$agent_name/$(echo $agent_name | tr '-' '-')-server.sh"
        if [ ! -x "$startup_script" ]; then
            startup_script="$BASE_DIR/agents/$agent_name/$(echo $agent_name | tr '-' '-')-launcher.sh"
        fi
    fi
    
    # Desktop apps need display
    if [ "$agent_type" = "desktop" ]; then
        log "  Starting desktop application..."
        if [ -x "$startup_script" ]; then
            nohup "$startup_script" > /dev/null 2>&1 &
            sleep 5
        else
            # Try direct hermes launch
            (which hermes &> /dev/null && nohup hermes > /dev/null 2>&1 &)
            sleep 5
        fi
    else
        # Server/service
        if [ -x "$startup_script" ]; then
            nohup "$startup_script" > /dev/null 2>&1 &
            sleep 3
        fi
    fi
    
    # Verify restart
    sleep 3
    if check_process "$pid_file"; then
        log "  ✓ $agent_name restarted successfully (PID: $(cat "$pid_file" 2>/dev/null || echo "?"))"
        return 0
    else
        alert "  ✗ FAILED to restart $agent_name"
        return 1
    fi
}

# Monitor a single agent
monitor_agent() {
    local agent_name="$1"
    local health_url="$2"
    local pid_file="$3"
    local agent_type="${4:-server}"
    local dependencies="${5:-}"
    
    log ""
    log "Checking $agent_name ($agent_type)..."
    
    # Check dependencies first
    if [ -n "$dependencies" ]; then
        log "  Dependencies: $dependencies"
        if ! check_dependencies "$dependencies"; then
            alert "$agent_name: Cannot start - dependencies not healthy"
            # Don't try to restart if deps are down
            return 1
        fi
    fi
    
    # Check health
    local healthy=false
    local attempts=0
    
    while [ $attempts -lt $MAX_RETRIES ]; do
        if check_agent_health "$agent_name" "$health_url" "$pid_file"; then
            healthy=true
            break
        fi
        attempts=$((attempts + 1))
        [ $attempts -lt $MAX_RETRIES ] && sleep 2
    done
    
    if [ "$healthy" = true ]; then
        log "  ✓ $agent_name: HEALTHY"
        return 0
    else
        alert "$agent_name: UNHEALTHY - Attempting restart"
        
        # Check if it's a dependency issue
        if [ -n "$dependencies" ]; then
            if ! check_dependencies "$dependencies"; then
                alert "$agent_name: Skipping restart - dependencies still failing"
                return 1
            fi
        fi
        
        restart_agent "$agent_name" "$agent_type"
        return $?
    fi
}

# Main heartbeat run
run_heartbeat() {
    log "=== AGENT HEARTBEAT CHECK STARTED ==="
    log "Config: $AGENTS_FILE"
    log "Time: $(date)"
    
    if [ ! -f "$AGENTS_FILE" ]; then
        log "ERROR: No agents.conf found at $AGENTS_FILE"
        return 1
    fi
    
    # First pass: check core infrastructure
    log ""
    log "--- Phase 1: Core Infrastructure ---"
    local desktop_agents=""
    
    while IFS='|' read -r agent_name health_url pid_file agent_type dependencies || [ -n "$agent_name" ]; do
        [[ "$agent_name" =~ ^# ]] && continue
        [ -z "$agent_name" ] && continue
        [[ "$agent_type" = "*" ]] && continue
        
        pid_file="${pid_file:-/tmp/${agent_name}.pid}"
        agent_type="${agent_type:-server}"
        
        # Process core infrastructure first
        if [ "$agent_type" != "desktop" ]; then
            monitor_agent "$agent_name" "$health_url" "$pid_file" "$agent_type" "$dependencies"
        else
            # Queue desktop apps for phase 2
            desktop_agents="${desktop_agents}${agent_name}|${health_url}|${pid_file}|${agent_type}|${dependencies}\\n"
        fi
        
    done < "$AGENTS_FILE"
    
    # Second pass: desktop applications
    if [ -n "$desktop_agents" ]; then
        log ""
        log "--- Phase 2: Desktop Applications ---"
        echo -e "$desktop_agents" | while IFS='|' read -r agent_name health_url pid_file agent_type dependencies; do
            [ -z "$agent_name" ] && continue
            monitor_agent "$agent_name" "$health_url" "$pid_file" "$agent_type" "$dependencies"
        done
    fi
    
    log ""
    log "=== HEARTBEAT CHECK COMPLETE ==="
    log "Next check: $(date -v+1H '+%Y-%m-%d %H:%M:%S' 2>/dev/null || date -d '+1 hour' '+%Y-%m-%d %H:%M:%S' 2>/dev/null || echo 'in 1 hour')"
    log ""
}

# Show status
show_status() {
    echo "=== AGENT STATUS ==="
    echo "Time: $(date)"
    echo ""
    
    if [ ! -f "$AGENTS_FILE" ]; then
        echo "No agents configured. Run: ./install.sh"
        return 1
    fi
    
    # Header
    printf "%-20s %-10s %-12s %s\\n" "AGENT" "TYPE" "STATUS" "DEPENDENCIES"
    printf "%s\\n" "-----------------------------------------------"
    
    while IFS='|' read -r agent_name health_url pid_file agent_type dependencies || [ -n "$agent_name" ]; do
        [[ "$agent_name" =~ ^# ]] && continue
        [ -z "$agent_name" ] && continue
        
        pid_file="${pid_file:-/tmp/${agent_name}.pid}"
        agent_type="${agent_type:-server}"
        
        # Check health
        local status="DOWN"
        local color=""
        
        if check_agent_health "$agent_name" "$health_url" "$pid_file"; then
            if check_process "$pid_file"; then
                status="HEALTHY"
            else
                status="UNRESPONSIVE"
            fi
        elif check_process "$pid_file"; then
            status="UNRESPONSIVE"
        fi
        
        printf "%-20s %-10s %-12s %s\\n" \
            "$agent_name" \
            "$agent_type" \
            "$status" \
            "${dependencies:--}"
        
    done < "$AGENTS_FILE"
    
    echo ""
    echo "Run: ./scripts/agent-heartbeat.sh --once"
    echo "Logs: tail -f $HEALTH_LOG"
}

# Install cron job (launchd on macOS)
install_launchd() {
    log "Installing launchd agents..."
    
    # Main heartbeat monitor
    local plist_name="com.studex.agent-monitor"
    local plist_path="$HOME/Library/LaunchAgents/${plist_name}.plist"
    
    mkdir -p "$HOME/Library/LaunchAgents"
    
    cat > "$plist_path" <<PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>${plist_name}</string>
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
    <string>${LOG_DIR}/agent-monitor.stdout.log</string>
    <key>StandardErrorPath</key>
    <string>${LOG_DIR}/agent-monitor.stderr.log</string>
    <key>RunAtLoad</key>
    <true/>
</dict>
</plist>
PLIST

    # Startup agent (runs all agents on boot)
    local startup_name="com.studex.agents-startup"
    local startup_path="$HOME/Library/LaunchAgents/${startup_name}.plist"
    
    cat > "$startup_path" <<STARTUP_PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>${startup_name}</string>
    <key>ProgramArguments</key>
    <array>
        <string>/bin/bash</string>
        <string>${BASE_DIR}/scripts/agent-heartbeat.sh</string>
        <string>--once</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
    <key>StandardOutPath</key>
    <string>${LOG_DIR}/startup.stdout.log</string>
    <key>StandardErrorPath</key>
    <string>${LOG_DIR}/startup.stderr.log</string>
</dict>
</plist>
STARTUP_PLIST

    # Load agents
    launchctl unload "$plist_path" 2>/dev/null || true
    launchctl load "$plist_path"
    
    launchctl unload "$startup_path" 2>/dev/null || true
    launchctl load "$startup_path"
    
    echo "✅ Launchd agents installed:"
    echo "   - Hourly monitoring: $plist_name"
    echo "   - Startup on boot: $startup_name"
}

# Command line interface
case "${1:-}" in
    --status|-s)
        show_status
        ;;
    --once|-o)
        run_heartbeat
        ;;
    --install|-I)
        install_launchd
        ;;
    --help|-h)
        cat <<EOF
Agent Heartbeat Monitor - Dr.Fixit

Commands:
  --install, -I    Install launchd agents (hourly checks + startup)
  --status, -s     Show status of all agents
  --once, -o       Run single heartbeat check
  --help, -h       Show this help

Files:
  Config: $AGENTS_FILE
  Logs:   $HEALTH_LOG, $ALERT_LOG

Format in agents.conf:
  agent_name|health_url|pid_file|type|dependencies

Examples:
  hermes-3-mlx|http://127.0.0.1:8000/v1/models|/tmp/hermes.pid|server|
  hermes-desktop|process:///tmp/hermes-desktop.pid|/tmp/hermes-desktop.pid|desktop|hermes-3-mlx
EOF
        ;;
    *)
        run_heartbeat
        ;;
esac
