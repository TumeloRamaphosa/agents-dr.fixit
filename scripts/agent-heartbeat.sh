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
    # Could add Slack/Discord notification here
}

# Check if an agent is healthy
check_agent_health() {
    local agent_name="$1"
    local health_url="$2"
    local expected_status="${3:-200}"
    
    local response
    local http_code
    
    # Try to get health endpoint
    response=$(curl -s -o /dev/null -w "%{http_code}" \
        --max-time "$HEALTH_TIMEOUT" \
        "$health_url" 2>/dev/null || echo "000")
    
    if [ "$response" = "$expected_status" ]; then
        return 0
    else
        return 1
    fi
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

# Restart an agent
restart_agent() {
    local agent_name="$1"
    local agent_dir="$BASE_DIR/agents/$agent_name"
    local startup_script="$agent_dir/$agent_name.sh"
    
    log "Attempting to restart $agent_name..."
    
    # Kill any existing processes
    local pid_file="/tmp/${agent_name}.pid"
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
    
    # Start new instance
    if [ -x "$startup_script" ]; then
        nohup "$startup_script" > /dev/null 2>&1 &
        sleep 5
        
        # Verify it started
        if check_process "$pid_file"; then
            log "$agent_name restarted successfully (PID: $(cat "$pid_file"))"
            return 0
        else
            alert "FAILED to restart $agent_name"
            return 1
        fi
    else
        alert "Startup script not found: $startup_script"
        return 1
    fi
}

# Monitor a single agent
monitor_agent() {
    local agent_name="$1"
    local health_url="$2"
    local pid_file="${3:-/tmp/${agent_name}.pid}"
    local agent_type="${4:-server}"
    
    local healthy=false
    local attempts=0
    
    log "Checking $agent_name..."
    
    # Check process first
    if ! check_process "$pid_file"; then
        log "$agent_name: Process not running"
        restart_agent "$agent_name"
        return
    fi
    
    # Check health endpoint
    while [ $attempts -lt $MAX_RETRIES ]; do
        if check_agent_health "$agent_name" "$health_url"; then
            healthy=true
            break
        fi
        attempts=$((attempts + 1))
        sleep 2
    done
    
    if [ "$healthy" = true ]; then
        log "$agent_name: HEALTHY ✓"
    else
        alert "$agent_name: UNHEALTHY ✗ (HTTP check failed after $MAX_RETRIES attempts)"
        restart_agent "$agent_name"
    fi
}

# Main heartbeat run
run_heartbeat() {
    log "=== AGENT HEARTBEAT CHECK STARTED ==="
    
    if [ ! -f "$AGENTS_FILE" ]; then
        log "No agents.conf found. Creating default..."
        create_default_config
    fi
    
    # Read agents config
    while IFS='|' read -r agent_name health_url pid_file agent_type || [ -n "$agent_name" ]; do
        # Skip comments and empty lines
        [[ "$agent_name" =~ ^# ]] && continue
        [ -z "$agent_name" ] && continue
        
        # Set defaults
        pid_file="${pid_file:-/tmp/${agent_name}.pid}"
        agent_type="${agent_type:-server}"
        
        monitor_agent "$agent_name" "$health_url" "$pid_file" "$agent_type"
        
    done < "$AGENTS_FILE"
    
    log "=== HEARTBEAT CHECK COMPLETE ==="
    log ""
}

# Create default agents config
create_default_config() {
    cat > "$AGENTS_FILE" <>OF
# Agent Registry | Format: agent_name|health_url|pid_file|type
# Lines starting with # are ignored
# 
# agent_name: Unique identifier for the agent
# health_url: Health check endpoint (should return 200 when healthy)
# pid_file: Path to PID file (optional, defaults to /tmp/{agent_name}.pid)
# type: server|service|script (optional, defaults to server)

# Hermes 3 MLX - Main LLM inference server
hermes-3-mlx|http://127.0.0.1:8000/v1/models|/tmp/hermes-3-mlx.pid|server

# Example additional agents (uncomment to enable)
# ollama|http://127.0.0.1:11434/api/tags|/tmp/ollama.pid|server
# n8n|http://127.0.0.1:5678/health|/tmp/n8n.pid|server
# chromadb|http://127.0.0.1:8000/api/v1/heartbeat|/tmp/chroma.pid|server
EOF
    log "Created default agents.conf at $AGENTS_FILE"
}

# Install cron job
install_cron() {
    local cron_schedule="${CRON_SCHEDULE:-0 * * * *}"
    local current_crontab
    
    # Get current crontab
    current_crontab=$(crontab -l 2>/dev/null || echo "")
    
    # Check if already installed
    if echo "$current_crontab" | grep -q "agent-heartbeat.sh"; then
        echo "Cron job already installed. Updating..."
        # Remove old entry first
        current_crontab=$(echo "$current_crontab" | grep -v "agent-heartbeat.sh")
    fi
    
    # Add new cron job
    local cron_command="cd \"$BASE_DIR\" && \"$SCRIPT_DIR/agent-heartbeat.sh\" > /dev/null 2>&1"
    local new_crontab="${current_crontab}
# Agent Health Monitor - Run every hour
$cron_schedule $cron_command
"
    
    echo "$new_crontab" | crontab -
    echo "Cron job installed: $cron_schedule"
    echo "Logs: $HEALTH_LOG"
    crontab -l | tail -5
}

# Show status
show_status() {
    echo "=== AGENT STATUS ==="
    
    if [ ! -f "$AGENTS_FILE" ]; then
        echo "No agents configured. Run: ./agent-heartbeat.sh --init"
        return 1
    fi
    
    while IFS='|' read -r agent_name health_url pid_file agent_type || [ -n "$agent_name" ]; do
        [[ "$agent_name" =~ ^# ]] && continue
        [ -z "$agent_name" ] && continue
        
        pid_file="${pid_file:-/tmp/${agent_name}.pid}"
        
        # Check process
        local status="DOWN"
        local color="🔴"
        
        if check_process "$pid_file"; then
            local pid
            pid=$(cat "$pid_file" 2>/dev/null || echo "?")
            
            if check_agent_health "$agent_name" "$health_url" 2>/dev/null; then
                status="HEALTHY (PID: $pid)"
                color="🟢"
            else
                status="UNRESPONSIVE (PID: $pid)"
                color="🟡"
            fi
        fi
        
        echo "$color $agent_name: $status"
        echo "   └─ Health: $health_url"
        
    done < "$AGENTS_FILE"
}

# Command line interface
case "${1:-}" in
    --init|-i)
        create_default_config
        echo "Created default config at $AGENTS_FILE"
        echo "Add your agents, then run: ./agent-heartbeat.sh --install"
        ;;
    --install|-I)
        install_cron
        ;;
    --status|-s)
        show_status
        ;;
    --once|-o)
        run_heartbeat
        ;;
    --help|-h)
        cat <>OF
Agent Heartbeat Monitor

Commands:
  --init, -i       Create default agents.conf
  --install, -I    Install cron job (runs every hour)
  --status, -s     Show status of all agents
  --once, -o       Run single heartbeat check
  --help, -h       Show this help

Files:
  Config: $CONFIG_DIR/agents.conf
  Logs:   $LOG_DIR/

Add agents to agents.conf in format:
  agent_name|health_url|pid_file|type

Example:
  hermes-3-mlx|http://127.0.0.1:8000/v1/models|/tmp/hermes-3-mlx.pid|server
EOF
        ;;
    *)
        run_heartbeat
        ;;
esac
