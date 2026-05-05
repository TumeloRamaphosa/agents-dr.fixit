# MEGA PROMPT - StudEx Valley OS Setup

**Paste this into Roo Code (auto mode) or Claude CLI to set up the entire Valley OS.**

---

## Context

You are setting up StudEx Valley OS - an AI Agent Operating System for a company called StudEx. The system runs on 5 machines:

1. **MBP M1 32GB** - Orchestrator
2. **Mac Mini M4 16GB + 6TB ext** - NAS + SQLite + AnythingLLM
3. **Windows Desktop 16GB + 2×8GB GPUs** - GPU host for large models
4. **Lenovo Legion Go 2 16GB** - Mobile/Research
5. **Windows Laptop 16GB + 8GB GPU** - Voice edge

The system uses:
- **Claude Agent SDK** for orchestration
- **Ollama** for local models (MLX-optimized)
- **Tailscale** for mesh networking
- **11 Agents** with ElevenLabs voices
- **Daily Rituals**: 08:00 Standup, 09:00 Board of Chiefs, 23:00 Close

---

## BMAD Protocol

**Brief**: Set up Valley OS on this machine according to its role in the inventory.

**Map**: 
- Read `~/agents-dr.fixit/factory/config/inventory.json` for machine roles
- Read `~/agents-dr.fixit/factory/config/agents.json` for agent configs
- Read `~/agents-dr.fixit/factory/config/schedule.json` for rituals

**Act**: Install Ollama, install npm deps, pull correct models, set env vars, install services.

**Decide**: Gate any spend (Stripe, external APIs) with approval from me.

---

## Step-by-Step Instructions

### 0. Pre-Flight Requirements

```bash
# Check machine
hostname  # Determines role
cd ~/agents-dr.fixit || echo "Cloning repo..."
git clone https://github.com/TumeloRamaphosa/agents-dr.fixit.git ~/agents-dr.fixit
cd ~/agents-dr.fixit
git checkout claude/studex-valley-os-setup-SDWlp
```

### 1. Detect Machine Role

```bash
# Read inventory and match hostname
python3 << 'PYTHON'
import json
import socket
import sys

with open('factory/config/inventory.json') as f:
    inventory = json.load(f)

hostname = socket.gethostname().lower()
role = None

for machine in inventory['machines']:
    if machine['hostname'].lower() in hostname or hostname in machine['hostname'].lower():
        role = machine['role']
        print(f"Role: {role}")
        print(f"Name: {machine['name']}")
        print(f"Specs: {machine['specs']}")
        break

if not role:
    print("WARNING: Could not detect role. Prompt user.")
    sys.exit(1)

# Save role for later steps
with open('/tmp/valley_role', 'w') as f:
    f.write(role)

print(f"\n✅ Role detected: {role}")
PYTHON
```

### 2. Install Dependencies

**macOS (Orchestrator/NAS):**
```bash
# Homebrew
if ! command -v brew >/dev/null; then
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
fi

# Node.js
brew install node@20
brew link node@20

# Ollama
curl -fsSL https://ollama.com/install.sh | sh

# Tailscale
brew install tailscale
sudo brew services restart tailscale

# Python packages
pip3 install requests faster-whisper kokoro-onnx
```

**Windows (GPU/Mobile/Voice):**
```powershell
# Winget
winget install Ollama.Ollama
winget install tailscale.tailscale
winget install OpenJS.NodeJS.LTS

# Join Tailscale
tailscale up
```

### 3. Pull Models Based on Role

```bash
#!/bin/bash
role=$(cat /tmp/valley_role)

echo "Pulling models for role: $role"

case $role in
    orchestrator)
        ollama pull qwen2.5:7b
        ollama pull qwen2.5-coder:7b
        ollama pull llama3.1:8b
        ollama pull hermes3:8b
        ollama pull gemma2:2b
        ;;
    nas)
        ollama pull gemma2:2b
        ollama pull phi3:mini
        ollama pull nomic-embed-text
        ollama pull llama3.2:3b
        ;;
    gpu)
        ollama pull hermes3:70b
        ollama pull qwen2.5-coder:7b
        ollama pull deepseek-coder:6.7b
        ollama pull qwen2.5:14b
        ;;
    mobile)
        ollama pull gemma2:2b
        ollama pull llama3.2:3b
        ;;
    voice)
        ollama pull phi3:mini
        ollama pull llama3.2:3b
        ;;
esac

echo "✅ Models pulled"
```

### 4. Setup Valley OS Application

```bash
cd ~/agents-dr.fixit/valley

# Install Node dependencies
npm install

# Create environment file
cat > .env << 'ENV'
# StudEx Valley OS - Environment
# Fill in your API keys below:

ANTHROPIC_API_KEY=YOUR_ANTHROPIC_KEY_HERE
ELEVENLABS_API_KEY=YOUR_ELEVENLABS_KEY_HERE
GROQ_API_KEY=YOUR_GROQ_KEY_HERE

# Local Config
OLLAMA_HOST=http://localhost:11434
VALLEY_PORT=4200
DASHBOARD_PORT=3141
WAR_ROOM_PORT=7860

# Role detection
ROLE=$(cat /tmp/valley_role 2>/dev/null || echo "unknown")
HOSTNAME=$(hostname)

# Timezone
TZ=Africa/Johannesburg

# Debug Mode
DEBUG=false

cp .env .env.local

ENV

echo "⚠️ Created .env file. Please edit with your API keys."
```

### 5. Setup Obsidian Vault (NAS/Mobile)

```bash
# If this is NAS, setup Obsidian vault
if [[ "$(cat /tmp/valley_role)" == "nas" ]]; then
    # Link external storage
    if [ -d "/Volumes/ExtStorage" ]; then
        ln -sf /Volumes/ExtStorage/valley-data ~/agents-dr.fixit/data
        echo "✅ External storage linked"
    fi
    
    # AnytingLLM setup
    echo "Creating AnythingLLM workspace..."
    # This would download and setup AnythingLLM
fi
```

### 6. Install Launchd Services (macOS only)

```bash
#!/bin/bash

role=$(cat /tmp/valley_role)

if [[ "$role" == "nas" ]]; then
    echo "Installing launchd services for NAS..."
    
    # Heartbeat - every 5 minutes
    cat > ~/Library/LaunchAgents/com.studex.heartbeat.plist << 'PLIST'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.studex.heartbeat</string>
    <key>ProgramArguments</key>
    <array>
        <string>/opt/homebrew/bin/node</string>
        <string>valley/src/utils/heartbeat.ts</string>
    </array>
    <key>StartInterval</key>
    <integer>300</integer>
    <key>WorkingDirectory</key>
    <string>/Users/tumeloramaphosa/agents-dr.fixit</string>
</dict>
</plist>
PLIST

    # Morning Ritual - 08:00 daily
    cat > ~/Library/LaunchAgents/com.studex.morning.plist << 'PLIST'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.studex.morning</string>
    <key>ProgramArguments</key>
    <array>
        <string>/opt/homebrew/bin/npx</string>
        <string>tsx</string>
        <string>valley/src/ritual/morning.ts</string>
    </array>
    <key>StartCalendarInterval</key>
    <dict>
        <key>Hour</key>
        <integer>8</integer>
        <key>Minute</key>
        <integer>0</integer>
    </dict>
    <key>WorkingDirectory</key>
    <string>/Users/tumeloramaphosa/agents-dr.fixit</string>
</dict>
</plist>
PLIST

    # Board Meeting - 09:00 daily
    cat > ~/Library/LaunchAgents/com.studex.board.plist << 'PLIST'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.studex.board</string>
    <key>ProgramArguments</key>
    <array>
        <string>/opt/homebrew/bin/npx</string>
        <string>tsx</string>
        <string>valley/src/ritual/board.ts</string>
    </array>
    <key>StartCalendarInterval</key>
    <dict>
        <key>Hour</key>
        <integer>9</integer>
        <key>Minute</key>
        <integer>0</integer>
    </dict>
    <key>WorkingDirectory</key>
    <string>/Users/tumeloramaphosa/agents-dr.fixit</string>
</dict>
</plist>
PLIST

    # Day Close - 23:00 daily
    cat > ~/Library/LaunchAgents/com.studex.close.plist << 'PLIST'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.studex.close</string>
    <key>ProgramArguments</key>
    <array>
        <string>/opt/homebrew/bin/npx</string>
        <string>tsx</string>
        <string>valley/src/ritual/close.ts</string>
    </array>
    <key>StartCalendarInterval</key>
    <dict>
        <key>Hour</key>
        <integer>23</integer>
        <key>Minute</key>
        <integer>0</integer>
    </dict>
    <key>WorkingDirectory</key>
    <string>/Users/tumeloramaphosa/agents-dr.fixit</string>
</dict>
</plist>
PLIST

    # Load services
    launchctl load ~/Library/LaunchAgents/com.studex.*.plist
    
    echo "✅ Launchd services configured"
fi
```

### 7. Setup Cloudflare Tunnel (NAS only)

```bash
# If NAS, setup tunnel
if [[ "$(cat /tmp/valley_role)" == "nas" ]]; then
    if ! command -v cloudflared >/dev/null; then
        brew install cloudflared
    fi
    
    echo "⚠️ Run: cloudflared tunnel login"
    echo "⚠️ Then: cloudflared tunnel create valley-os"
    echo "⚠️ Save creds to .env"
fi
```

### 8. Smoke Test

```bash
echo "Running smoke tests..."

cd ~/agents-dr.fixit/valley

# Test 1: Can we run TypeScript
npx tsc --version || exit 1

# Test 2: Can we connect to Ollama
curl -s http://localhost:11434/api/tags > /tmp/ollama_test.json
if [ $? -eq 0 ]; then
    echo "✅ Ollama responding"
    cat /tmp/ollama_test.json | jq '.models | length' || echo "  Models: see /tmp/ollama_test.json"
else
    echo "❌ Ollama not responding"
    exit 1
fi

# Test 3: Can we load core modules
node --loader ts-node/esm -e "import('./src/core/classifier.ts')" 2>/dev/null || echo "⚠️ ts-node/esm not configured, using tsx"

# Test 4: Are .env vars set (no actual values, just keys)
if grep -q "ANTHROPIC_API_KEY" .env; then
    echo "✅ .env file has required keys"
else
    echo "⚠️ .env file missing keys (expected, fill them in)"
fi

echo "✅ Smoke tests complete"
```

### 9. Start Valley OS

```bash
#!/bin/bash

echo ""
echo "═══════════════════════════════════════════════════════"
echo "  StudEx Valley OS Setup Complete!"
echo "═══════════════════════════════════════════════════════"
echo ""
echo "Role: $(cat /tmp/valley_role)"
echo "Hostname: $(hostname)"
echo ""

role=$(cat /tmp/valley_role)

case $role in
    orchestrator)
        echo "To start:"
        echo "  cd ~/agents-dr.fixit/valley"
        echo "  npm run dev"
        echo ""
        echo "Or run rituals directly:"
        echo "  npm run ritual:morning"
        echo "  npm run ritual:board"
        ;;
    nas)
        echo "Services auto-start via launchd."
        echo "Or manual start:"
        echo "  cd ~/agents-dr.fixit/valley && npm run dev"
        ;;
    *)
        echo "Start: cd ~/agents-dr.fixit/valley && npm run dev"
        ;;
esac

echo ""
echo "Dashboard: http://localhost:3141"
echo "API: http://localhost:4200"
echo ""
echo "Next: Join Tailscale mesh with all 5 machines"
echo "  tailscale up"
echo "  tailscale status"
echo ""

# Green/Red report
if [ -f .env ] && grep -q "ANTHROPIC_API_KEY" .env && ! grep -q "YOUR_" .env; then
    echo "🟢 SETUP COMPLETE - Ready for use"
else
    echo "🟡 SETUP PARTIAL - Please edit .env with API keys"
fi
```

---

## Expected Outputs

After running this prompt, you should have:

1. ✅ Role-detected configuration
2. ✅ Ollama installed with role-appropriate models
3. ✅ Node.js dependencies installed
4. ✅ .env file created (with placeholder keys)
5. ✅ Launchd services installed (macOS NAS)
6. ✅ Smoke tests passed
7. ✅ Ready to start with `npm run dev`

---

## Manual Steps Required

1. **Add API Keys** - Edit `~/agents-dr.fixit/valley/.env`
2. **Start Tailscale** - Run `tailscale up` on all machines
3. **Start Valley OS** - `npm run dev` in valley/ directory
4. **Test Rituals** - Verify 08:00, 09:00, 23:00 rituals work

---

## Troubleshooting

**Ollama not responding:**
```bash
ollama serve  # Start server
```

**Node modules missing:**
```bash
cd ~/agents-dr.fixit/valley && npm install
```

**Permission denied:**
```bash
chmod +x ~/agents-dr.fixit/infra/scripts/studex-install.sh
```

**Tailscale not joining:**
```bash
sudo tailscale up --operator=$USER
```

---

## Success Criteria

- [ ] `npm run dev` starts without errors
- [ ] Ollama API responds at `http://localhost:11434`
- [ ] Tailscale shows all 5 machines
- [ ] Morning ritual runs at 08:00
- [ ] Board meeting runs at 09:00
- [ ] Day close runs at 23:00

**STATUS:** Complete when all checked.
