#!/bin/bash
# Uninstall Agent Dr. Fixit

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LAUNCHD_PREFIX="com.studex"

echo "Uninstalling Agent Dr. Fixit..."

# Unload launchd agents
for plist in ~/Library/LaunchAgents/${LAUNCHD_PREFIX}.*.plist; do
    if [ -f "$plist" ]; then
        echo "Unloading: $plist"
        launchctl unload "$plist" 2>/dev/null || true
        rm -f "$plist"
    fi
done

# Stop running agents
for pid_file in /tmp/*.pid; do
    if [ -f "$pid_file" ]; then
        agent_name=$(basename "$pid_file" .pid)
        echo "Stopping: $agent_name"
        
        pid=$(cat "$pid_file" 2>/dev/null || echo "")
        if [ -n "$pid" ]; then
            kill "$pid" 2>/dev/null || true
            sleep 1
            kill -9 "$pid" 2>/dev/null || true
        fi
        
        rm -f "$pid_file"
    fi
done

echo "✅ Uninstalled. Logs kept at: $SCRIPT_DIR/logs/"
echo "To remove completely: rm -rf $SCRIPT_DIR"
