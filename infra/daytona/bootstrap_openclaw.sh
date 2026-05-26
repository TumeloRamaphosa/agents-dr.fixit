#!/usr/bin/env bash
# Bootstrap OpenClaw on a Linux VM / Daytona sandbox (run inside the sandbox or via SSH).
# Requires: curl or wget, sudo for apt (typical Ubuntu sandbox).

set -euo pipefail

echo "Studex · OpenClaw bootstrap"

if ! command -v node >/dev/null 2>&1; then
  echo "Installing Node.js 22.x (nodesource) — needs sudo/apt."
  curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
  sudo apt-get update -qq
  sudo apt-get install -y -qq nodejs
fi

echo "Installing openclaw globally..."
sudo npm install -g openclaw || npm install -g openclaw

echo ""
echo "Next steps (manual):"
echo "  1. openclaw doctor --fix"
echo "  2. openclaw gateway start   # listens on gateway port per your OpenClaw version"
echo "  3. Point Studex Command Plane / dashboard at this gateway if exposing HTTP."
