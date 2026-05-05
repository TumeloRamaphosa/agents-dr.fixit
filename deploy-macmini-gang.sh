#!/bin/bash
# 🤖 MACMINI GANG - Dr.Fixit Edition
# Agents: Hermes (Messenger) + GoClaw (Engineer)
# Repository: github.com/agents-dr.fixit
# Mode: AUTOM

set -e

clear

echo ""
echo "╔══════════════════════════════════════════════════════════════════╗"
echo "║                                                                  ║"
echo "║     🤖 MACMINI GANG - Dr.Fixit Edition                           ║"
echo "║                                                                  ║"
echo "║     Agents:                                                       ║"
echo "║       📨 Hermes  - The Messenger (Coordination)                  ║"
echo "║       🔧 GoClaw  - The Engineer (Code Repairs)                   ║"
echo "║                                                                  ║"
echo "║     Repository: github.com/agents-dr.fixit                       ║"
echo "║     Location: MacMini-Alpha (Local)                             ║"
echo "║     Mode: AUTOM (Fully Autonomous)                               ║"
echo "║                                                                  ║"
echo "╚══════════════════════════════════════════════════════════════════╝"
echo ""
sleep 2

# Paths
AGENT_FILE="/Users/project2571/agent-configs/macmini-gang-agent.js"
MEMORY_PATH="/Users/project2571/agent-configs/.memory/macmini-gang"
PID_FILE="$MEMORY_PATH/status/macmini-gang.pid"
LOG_FILE="$MEMORY_PATH/logs/deploy-$(date +%Y%m%d-%H%M%S).log"

# Create directories
mkdir -p "$MEMORY_PATH"/{logs,backups,status}

# Check if agent file exists
if [ ! -f "$AGENT_FILE" ]; then
    echo "❌ Agent file not found: $AGENT_FILE"
    exit 1
fi

echo "✅ Agent file found: macmini-gang-agent.js"
echo ""

# Kill existing if running
if [ -f "$PID_FILE" ]; then
    old_pid=$(cat "$PID_FILE" 2>/dev/null || echo "")
    if [ -n "$old_pid" ] && kill -0 "$old_pid" 2>/dev/null; then
        echo "🛑 Stopping existing agent (PID: $old_pid)..."
        kill "$old_pid" 2>/dev/null || true
        sleep 2
    fi
fi

echo ""
echo "╔══════════════════════════════════════════════════════════════════╗"
echo "║                    DEPLOYING MACMINI GANG                        ║"
echo "╚══════════════════════════════════════════════════════════════════╝"
echo ""

# Start the agent
echo "🚀 Starting MacMini Gang Agent..."
echo "   Agents: Hermes + GoClaw"
echo "   Log: $LOG_FILE"
echo ""

nohup node "$AGENT_FILE" > "$LOG_FILE" 2>&1 &
deploy_pid=$!

sleep 3

if kill -0 $deploy_pid 2>/dev/null; then
    echo $deploy_pid > "$PID_FILE"
    echo "✅ DEPLOYED (PID: $deploy_pid)"
    
    echo ""
    echo "╔══════════════════════════════════════════════════════════════════╗"
    echo "║                    GATEWAY STATUS                              ║"
    echo "╚══════════════════════════════════════════════════════════════════╝"
    echo ""
    
    # Check gateways
    if lsof -i :18789 | grep LISTEN > /dev/null 2>&1; then
        echo "✅ OpenClaw Gateway: ACTIVE (Port 18789)"
    else
        echo "⚠️  OpenClaw Gateway: NOT DETECTED"
        echo "   Start manually: openclaw gateway start"
    fi
    
    if lsof -i :18790 | grep LISTEN > /dev/null 2>&1; then
        echo "✅ GoClaw Gateway: ACTIVE (Port 18790)"
    else
        echo "⚠️  GoClaw Gateway: NOT DETECTED"
    fi
    
    echo ""
    echo "╔══════════════════════════════════════════════════════════════════╗"
    echo "║                    AUTOM MODE ACTIVE                           ║"
    echo "╚══════════════════════════════════════════════════════════════════╝"
    echo ""
    
    cat << 'EOF'
🤖 MacMini Gang is running in AUTOM MODE:

📨 Hermes (The Messenger):
   • Heartbeat: Every 1 hour
   • Coordination: Every 5 minutes
   • Slack: etherdoge.slack.com

🔧 GoClaw (The Engineer):
   • Repair Cycle: Every 6 hours
   • Backups: FULL before every change
   • Auto-fix: ENABLED

Commands:
  View logs:  tail -f /Users/project2571/agent-configs/.memory/macmini-gang/logs/deploy-*.log
  Check PID:  cat /Users/project2571/agent-configs/.memory/macmini-gang/status/macmini-gang.pid
  Stop:       /Users/project2571/agent-configs/stop-macmini-gang.sh

EOF

    echo ""
    echo "✅ DEPLOYMENT COMPLETE"
    echo ""
    echo "View live logs:"
    echo "  tail -f $LOG_FILE"
    
else
    echo "❌ FAILED TO START"
    echo "Check logs: $LOG_FILE"
    exit 1
fi

echo ""
exit 0
