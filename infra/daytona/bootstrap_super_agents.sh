#!/usr/bin/env bash
# Run inside Daytona sandbox "Super Agents": OpenClaw + CashClaw + agent tooling.
set -euo pipefail

HUB="${SUPER_AGENTS_HUB:-https://super-agents.fly.dev}"
API_BASE="${OPENAI_API_BASE:-${HUB}/v1}"

echo "==> Super Agents sandbox bootstrap"
echo "    LLM hub: $API_BASE"

if ! command -v node >/dev/null 2>&1; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y nodejs git
fi

echo "==> OpenClaw"
if ! command -v openclaw >/dev/null 2>&1; then
  npm install -g openclaw@latest || npm install -g openclaw || true
fi

echo "==> CashClaw (https://github.com/ertugrulakben/cashclaw)"
npm install -g cashclaw@latest || true
if command -v cashclaw >/dev/null 2>&1 && [ ! -d "$HOME/.cashclaw" ]; then
  cashclaw init || true
fi

mkdir -p "$HOME/.config/super-agents"
cat > "$HOME/.config/super-agents/env" <<EOF
export OPENAI_API_BASE="$API_BASE"
export OPENAI_API_KEY="local-hub"
export CHAT_MODEL="${CHAT_MODEL:-Hermes-4-70B}"
export SUPER_AGENTS_HUB="$HUB"
EOF

echo "==> Done. Source: source ~/.config/super-agents/env"
echo "    CashClaw: cashclaw status"
echo "    Use model Hermes-4-70B or gpt-4o via hub (keys on Fly, not in sandbox)."
