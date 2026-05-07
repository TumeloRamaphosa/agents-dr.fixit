#!/bin/bash
# Dr.Fixit + Valley OS Agent Test Suite
# Tests all agents and integration points

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BASE_DIR="$SCRIPT_DIR"
LOG_DIR="$BASE_DIR/logs"

colors() {
    GREEN='\033[0;32m'
    RED='\033[0;31m'
    YELLOW='\033[1;33m'
    BLUE='\033[0;34m'
    NC='\033[0m'
}

colors

log() { echo -e "${BLUE}[TEST]${NC} $*"; }
pass() { echo -e "${GREEN}[PASS]${NC} $*"; }
fail() { echo -e "${RED}[FAIL]${NC} $*"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $*"; }

check_port() {
    local port=$1
    local name=$2
    if nc -z localhost "$port" 2>/dev/null; then
        pass "$name is running on port $port"
        return 0
    else
        fail "$name is NOT running on port $port"
        return 1
    fi
}

check_http() {
    local url=$1
    local name=$2
    local code
    code=$(curl -s -o /dev/null -w "%{http_code}" "$url" 2>/dev/null || echo "000")
    if [ "$code" = "200" ]; then
        pass "$name responding at $url"
        return 0
    else
        fail "$name returned HTTP $code at $url"
        return 1
    fi
}

log "=============================================="
log "  StudEx Valley OS + Dr.Fixit Test Suite"
log "=============================================="
echo ""

# Test 1: Dr.Fixit Configuration
log "[1/7] Testing Dr.Fixit Configuration..."
if [ -f "$BASE_DIR/config/agents.conf" ]; then
    pass "agents.conf exists"
    agent_count=$(grep -c "^[a-z]" "$BASE_DIR/config/agents.conf" 2>/dev/null || echo "0")
    log "Found $agent_count agents in registry"
else
    fail "agents.conf not found"
fi
echo ""

# Test 2: Heartbeat Script
log "[2/7] Testing Dr.Fixit Heartbeat..."
if bash -n "$BASE_DIR/scripts/agent-heartbeat.sh"; then
    pass "agent-heartbeat.sh syntax OK"
else
    fail "agent-heartbeat.sh has syntax errors"
fi
echo ""

# Test 3: Core Infrastructure (Hermes)
log "[3/7] Testing Core Infrastructure..."
check_port 8090 "Hermes MLX" || warn "Hermes not running - will be auto-started"
check_port 8000 "Ollama/Ollama Bridge" || warn "Ollama not detected"
echo ""

# Test 4: Valley OS Agents
log "[4/7] Testing Valley OS Agents..."
check_port 8001 "Charlie (Voice AI)" || warn "Charlie not running"
check_port 8002 "Naledi (WhatsApp)" || warn "Naledi not running"  
check_port 8003 "Amara (Social)" || warn "Amara not running"
check_port 8004 "Robusca (Ops)" || warn "Robusca not running"
check_port 8005 "EDDIE (Ads)" || warn "EDDIE not running"
check_port 9000 "Health Monitor" || warn "Health monitor not running"
echo ""

# Test 5: Discord Bot Files
log "[5/7] Testing Discord Integration..."
if [ -f ~/StudEx-Valley-OS/integrations/discord/charlie_discord_bot.py ]; then
    pass "Discord bot exists"
    if python3 -m py_compile ~/StudEx-Valley-OS/integrations/discord/charlie_discord_bot.py 2>/dev/null; then
        pass "Discord bot syntax OK"
    else
        fail "Discord bot has syntax errors"
    fi
else
    fail "Discord bot not found"
fi
echo ""

# Test 6: Slack Bot Files
log "[6/7] Testing Slack Integration..."
if [ -f ~/StudEx-Valley-OS/integrations/slack/charlie_slack_bot.py ]; then
    pass "Slack bot exists"
    if python3 -m py_compile ~/StudEx-Valley-OS/integrations/slack/charlie_slack_bot.py 2>/dev/null; then
        pass "Slack bot syntax OK"
    else
        fail "Slack bot has syntax errors"
    fi
else
    fail "Slack bot not found"
fi
echo ""

# Test 7: Website Widget
log "[7/7] Testing Website Widget..."
if [ -f ~/StudEx-Valley-OS/integrations/studexmeat-whatsapp-widget.html ]; then
    pass "WhatsApp widget exists"
    if grep -q "studexmeat.com" ~/StudEx-Valley-OS/integrations/studexmeat-whatsapp-widget.html; then
        pass "Widget configured for studexmeat.com"
    fi
    if grep -q "27794988737" ~/StudEx-Valley-OS/integrations/studexmeat-whatsapp-widget.html; then
        pass "Widget has WhatsApp +27 79 498 8737"
    fi
else
    fail "WhatsApp widget not found"
fi
echo ""

# Summary
log "=============================================="
log "  TEST SUMMARY"
log "=============================================="
echo ""

# Check Dr.Fixit status
log "Dr.Fixit Agent Status:"
"$BASE_DIR/scripts/agent-heartbeat.sh" --status 2>/dev/null || true
echo ""

log "To start missing agents:"
echo "  cd ~/agents-dr.fixit && ./scripts/agent-heartbeat.sh --once"
echo ""
log "To start Valley OS Health Monitor:"
echo "  cd ~/StudEx-Valley-OS/agents && python3 agent_health_server.py"
echo ""
log "To push to GitHub:"
echo "  cd ~/agents-dr.fixit"
echo "  git add -A && git commit -m 'Add Valley OS agents'"
echo "  git push origin main"