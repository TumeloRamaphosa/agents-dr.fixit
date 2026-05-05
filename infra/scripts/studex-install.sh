#!/bin/bash

# StudEx Valley OS - Universal Installer
# Works on macOS, Linux, Windows (via WSL/Git Bash)
# Detects machine role and installs appropriate components

set -e

echo "🌊 StudEx Valley OS Installer"
echo "=============================="

# Detect OS
OS="unknown"
if [[ "$OSTYPE" == "darwin"* ]]; then
    OS="macos"
    echo "✅ macOS detected"
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    OS="linux"
    echo "✅ Linux detected"
elif [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "cygwin" ]]; then
    OS="windows"
    echo "✅ Windows (Git Bash) detected"
else
    echo "⚠️ Unknown OS: $OSTYPE"
fi

# Detect machine role from hostname/hostname
HOSTNAME=$(hostname -s 2>/dev/null || hostname)
echo "🖥️  Hostname: $HOSTNAME"

# Map hostname to role
ROLE="unknown"
case "$HOSTNAME" in
    *orchestrator*|*m1*|*mbp*)
        ROLE="orchestrator"
        ;;
    *nas*|*mini*|*m4*)
        ROLE="nas"
        ;;
    *gpu*|*desktop*)
        ROLE="gpu"
        ;;
    *legion*|*mobile*)
        ROLE="mobile"
        ;;
    *voice*|*laptop*)
        ROLE="voice"
        ;;
    *)
        echo "⚠️ Unknown role. Please select:"
        echo "  1) Orchestrator (MBP M1)"
        echo "  2) NAS (Mac Mini M4)"
        echo "  3) GPU (Windows Desktop)"
        echo "  4) Mobile (Legion Go 2)"
        echo "  5) Voice (Windows Laptop)"
        read -p "Selection: " choice
        case $choice in
            1) ROLE="orchestrator" ;;
            2) ROLE="nas" ;;
            3) ROLE="gpu" ;;
            4) ROLE="mobile" ;;
            5) ROLE="voice" ;;
        esac
        ;;
esac

echo "✅ Role: $ROLE"

# Install dependencies
install_deps() {
    echo "📦 Installing dependencies..."
    
    # Node.js
    if ! command -v node &> /dev/null; then
        echo "Installing Node.js..."
        if [[ "$OS" == "macos" ]]; then
            if command -v brew &> /dev/null; then
                brew install node
            else
                echo "Please install Homebrew first: https://brew.sh"
                exit 1
            fi
        elif [[ "$OS" == "linux" ]]; then
            curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
            sudo apt-get install -y nodejs
        fi
    fi
    
    # Python
    if ! command -v python3 &> /dev/null; then
        echo "Installing Python..."
        if [[ "$OS" == "macos" ]]; then
            brew install python@3.11
        elif [[ "$OS" == "linux" ]]; then
            sudo apt-get install -y python3 python3-pip
        fi
    fi
    
    # Ollama (all roles except voice-only)
    if ! command -v ollama &> /dev/null; then
        echo "Installing Ollama..."
        curl -fsSL https://ollama.com/install.sh | sh
    fi
    
    # Tailscale
    if ! command -v tailscale &> /dev/null; then
        echo "Installing Tailscale..."
        if [[ "$OS" == "macos" ]]; then
            brew install tailscale
        elif [[ "$OS" == "linux" ]]; then
            curl -fsSL https://tailscale.com/install.sh | sh
        fi
    fi
    
    echo "✅ Dependencies installed"
}

# Configure by role
configure_role() {
    echo "⚙️ Configuring for role: $ROLE"
    
    case $ROLE in
        orchestrator)
            configure_orchestrator
            ;;
        nas)
            configure_nas
            ;;
        gpu)
            configure_gpu
            ;;
        mobile)
            configure_mobile
            ;;
        voice)
            configure_voice
            ;;
    esac
}

configure_orchestrator() {
    echo "  - Installing orchestrator packages..."
    
    # Pull models for orchestrator
    ollama pull qwen2.5:7b
    ollama pull qwen2.5-coder:7b
    ollama pull llama3.1:8b
    ollama pull hermes3:8b
    
    # Install Valley OS
    cd ~/agents-dr.fixit/valley || exit
    npm install
    
    echo "✅ Orchestator configured"
    echo "  Start: npm run dev"
}

configure_nas() {
    echo "  - Configuring NAS (Mac Mini M4)..."
    
    # Install SQLite and better-sqlite3 deps
    if [[ "$OS" == "macos" ]]; then
        brew install sqlite3 python-setuptools
    fi
    
    # Pull models
    ollama pull gemma2:2b
    ollama pull phi3:mini
    ollama pull nomic-embed-text
    
    # Install Valley OS
    cd ~/agents-dr.fixit/valley || exit
    npm install
    
    # Setup external storage link
    if [ -d /Volumes/ExtStorage ]; then
        echo "  - Linking external storage..."
        ln -sf /Volumes/ExtStorage ~/agents-dr.fixit/data
    fi
    
    # Install launchd services
    echo "  - Installing launchd services..."
    cp ~/agents-dr.fixit/infra/launchd/*.plist ~/Library/LaunchAgents/ 2>/dev/null || true
    launchctl load ~/Library/LaunchAgents/com.studex.*.plist 2>/dev/null || true
    
    echo "✅ NAS configured"
}

configure_gpu() {
    echo "  - Configuring GPU host..."
    
    # Large models for GPU
    ollama pull hermes3:70b
    ollama pull qwen2.5-coder:7b
    ollama pull deepseek-coder:6.7b
    
    # Setup mesh-llm
    echo "  - Setting up mesh-llm on port 9337..."
    # This would start Ollama API on custom port
    
    echo "✅ GPU host configured"
}

configure_mobile() {
    echo "  - Configuring mobile agent..."
    
    ollama pull gemma2:2b
    
    echo "✅ Mobile configured"
}

configure_voice() {
    echo "  - Configuring voice edge..."
    
    # Install Whisper dependencies
    pip3 install faster-whisper kokoro-onnx
    
    ollama pull phi3:mini
    
    echo "✅ Voice edge configured"
}

# Create .env file
create_env() {
    echo "🔐 Creating environment file..."
    
    ENV_FILE="$HOME/agents-dr.fixit/valley/.env"
    
    if [ ! -f "$ENV_FILE" ]; then
        cat > "$ENV_FILE" << EOF
# StudEx Valley OS - Environment Configuration

# API Keys
ANTHROPIC_API_KEY=your_key_here
ELEVENLABS_API_KEY=your_key_here
GROQ_API_KEY=your_key_here

# Local Config
OLLAMA_HOST=http://localhost:11434
VALLEY_PORT=4200
DASHBOARD_PORT=3141
WAR_ROOM_PORT=7860

# Machine Role
ROLE=$ROLE
HOSTNAME=$HOSTNAME

# Timezone
TZ=Africa/Johannesburg

# Debug
DEBUG=false
EOF
        
        echo "✅ Environment file created: $ENV_FILE"
        echo "⚠️  Please edit and add your API keys"
    else
        echo "✅ Environment file already exists"
    fi
}

# Main execution
main() {
    install_deps
    configure_role
    create_env
    
    echo ""
    echo "✅ Installation complete!"
    echo ""
    echo "Next steps:"
    echo "  1. Edit ~/agents-dr.fixit/valley/.env with your API keys"
    echo "  2. Join Tailscale: tailscale up"
    echo "  3. Start Valley OS: cd ~/agents-dr.fixit/valley && npm run dev"
    echo "  4. Dashboard: http://localhost:3141"
    echo ""
    echo "Role: $ROLE"
    echo "Hostname: $HOSTNAME"
}

# Run main
main
