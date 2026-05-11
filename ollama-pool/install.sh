#!/bin/bash
# Studex Ollama Pool - Installation Script
# Installs all configurations for Codex, Copilot, Droid, Cloud, Local integration

set -e

OLLAMA_POOL_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$OLLAMA_POOL_DIR/.." && pwd)"

echo "🚀 Installing Studex Ollama Pool..."
echo "═══════════════════════════════════════════════════════"

# Check dependencies
command -v ollama >/dev/null 2>&1 || { echo "❌ Ollama not installed. Visit: https://ollama.com/download"; exit 1; }
command -v jq >/dev/null 2>&1 || echo "⚠️  jq not installed (optional, for better output)"

# Create necessary directories
mkdir -p ~/.config/litellm
mkdir -p ~/.claude/skills
mkdir -p ~/Library/LaunchAgents
mkdir -p ~/.ollama/logs

# Install pool command
echo "📦 Installing pool command..."
cp "$OLLAMA_POOL_DIR/scripts/pool" ~/.studex-ollama-pool.sh
chmod +x ~/.studex-ollama-pool.sh

# Install LiteLLM start script
cp "$OLLAMA_POOL_DIR/scripts/start-litellm" ~/.studex-start-litellm.sh
chmod +x ~/.studex-start-litellm.sh

# Install status checker
cp "$OLLAMA_POOL_DIR/scripts/status" ~/.studex-status.sh
chmod +x ~/.studex-status.sh

# Install LiteLLM config
echo "⚙️  Installing LiteLLM configuration..."
cp "$OLLAMA_POOL_DIR/configs/litellm.yaml" ~/.config/litellm/config.yaml

# Install Cursor config
echo "🖥️  Installing Cursor IDE configuration..."
mkdir -p ~/.cursor
cp "$OLLAMA_POOL_DIR/ide-configs/cursor.json" ~/.cursor/settings.json

# Install VS Code config
echo "💻 Installing VS Code configuration..."
mkdir -p ~/Library/Application\ Support/Code/User
cp "$OLLAMA_POOL_DIR/ide-configs/vscode.json" ~/Library/Application\ Support/Code/User/settings.json 2>/dev/null || echo "⚠️  VS Code config skipped"

# Install gstack skill
echo "🔧 Installing gstack/pi skill..."
cp -r "$OLLAMA_POOL_DIR/studex-multi-ai" ~/.claude/skills/ 2>/dev/null || echo "⚠️  Skipping gstack skill"

# Add aliases to shell
add_aliases() {
    local RC_FILE="$1"
    if [ -f "$RC_FILE" ]; then
        if ! grep -q "alias pool=" "$RC_FILE" 2>/dev/null; then
            echo "" >> "$RC_FILE"
            echo "# Studex Ollama Pool" >> "$RC_FILE"
            echo 'alias pool="~/.studex-ollama-pool.sh"' >> "$RC_FILE"
            echo 'alias studex-litellm="~/.studex-start-litellm.sh"' >> "$RC_FILE"
            echo 'alias studex-status="~/.studex-status.sh"' >> "$RC_FILE"
            echo "✅ Aliases added to $(basename $RC_FILE)"
        fi
    fi
}

add_aliases ~/.zshrc
add_aliases ~/.bashrc

# Optional: LaunchAgent for auto-start
cat > ~/Library/LaunchAgents/com.studex.ollamapool.plist << 'PLIST'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.studex.ollamapool</string>
    <key>ProgramArguments</key>
    <array>
        <string>/usr/local/bin/litellm</string>
        <string>--config</string>
        <string>~/.config/litellm/config.yaml</string>
        <string>--port</string>
        <string>8000</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <dict>
        <key>SuccessfulExit</key>
        <false/>
    </dict>
</dict>
</plist>
PLIST

echo ""
echo "✅ Installation complete!"
echo ""
echo "═══════════════════════════════════════════════════════"
echo "NEXT STEPS:"
echo "═══════════════════════════════════════════════════════"
echo "1. Reload your shell:"
echo "   source ~/.zshrc"
echo ""
echo "2. Check status:"
echo "   studex-status"
echo ""
echo "3. Test the pool command:"
echo "   pool codex 'Write a Python function'"
echo ""
echo "4. Start LiteLLM proxy (optional):"
echo "   studex-litellm"
echo ""
echo "📚 Full documentation: $OLLAMA_POOL_DIR/README.md"
echo "═══════════════════════════════════════════════════════"
