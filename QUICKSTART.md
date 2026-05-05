# 🌊 StudEx Valley OS - Quick Start Guide

**Branch**: `claude/studex-valley-os-setup-SDWlp`  
**Status**: ✅ Complete - Ready for 5-machine deployment

---

## 🎯 What You Have

### 12 AI Agents (Each with ElevenLabs Voice)

| Agent | Role | When They Speak |
|-------|------|-----------------|
| 🤖 **Robusca** | Daily Coordinator | 08:00 Standup, 09:00 Board Meeting, 23:00 Close |
| 🔧 **CTO** | Infrastructure | 09:00 Board Meeting - Reports on agents, tokens, uptime |
| 💻 **OpenClaw** | Code/Deploy | Executes builds, repos, deployments |
| 💰 **CashClaw** | Sales | Reports revenue, Stripe/PayFast, CRM |
| 🤝 **DenchClaw** | Customer Relations | WhatsApp support, signups |
| 🥩 **Charlie** | StudEx Meat Specialist | Customer agent for meat customers |
| 📝 **Goose** | Documentation | Repo summaries, knowledge |
| 🔬 **Hermes** | Deep Research | Analysis, big models (70B) |
| 🤖 **ClawX** | Automation | Browser, scrapers |
| 🛠️ **SkunkWorks** | DevOps | Linear tickets, bugs |
| 🔍 **Research** | Trends | IG/Twitter/Reddit scraping |
| 🏥 **Dr Fix-It** | Health Monitor | Heartbeat every 5 minutes |

### 3 Daily Rituals (SAST)

```
07:55 → Dr Fix-It heartbeat sweep
08:00 → Robusca Morning Standup
09:00 → Board of Chiefs Meeting (60 min)
23:00 → Day Close
```

### 5-Machine Mesh

```
MBP M1 32GB          → Orchestrator (Robusca, Board)
Mac Mini M4 16GB     → NAS + Memory + AnythingLLM
Windows Desktop      → GPU host (Hermes 70B)
Lenovo Legion Go 2   → Mobile research
Windows Laptop       → Voice edge (Whisper, Pipecat)
```

---

## 🚀 Deploy in 3 Steps

### Step 1: Clone Repo on All 5 Machines

```bash
git clone https://github.com/TumeloRamaphosa/agents-dr.fixit.git
cd agents-dr.fixit
git checkout claude/studex-valley-os-setup-SDWlp
```

### Step 2: Run Universal Installer (on each machine)

```bash
chmod +x infra/scripts/studex-install.sh
./infra/scripts/studex-install.sh
```

This automatically:
- ✅ Detects machine role from hostname
- ✅ Installs Ollama, Node.js, Tailscale
- ✅ Pulls appropriate models for that role
- ✅ Creates .env file
- ✅ Sets up launchd services (macOS)

### Step 3: Paste MEGA PROMPT into Roo Code

```bash
# Open the prompt
cat docs/MEGA_PROMPT.md

# Or open in editor
open docs/MEGA_PROMPT.md  # macOS
```

**Copy everything** from the MEGA_PROMPT.md and paste into **Roo Code (auto mode)**.

This will:
- Complete setup on each machine
- Join Tailscale mesh
- Verify rituals work

---

## 📋 Machine Setup Order

**Deploy in this order:**

1. **Mac Mini M4** (NAS) - First, sets up SQLite, AnythingLLM, Cloudflare tunnel
2. **MBP M1** (Orchestrator) - Then, connects to NAS for memory
3. **Windows Desktop** (GPU) - Third, for large models
4. **Lenovo Legion** (Mobile) - Fourth
5. **Windows Laptop** (Voice) - Last

---

## 🔑 Required API Keys

Add these to `~/agents-dr.fixit/valley/.env`:

```bash
ANTHROPIC_API_KEY=your_key        # Required for escalated queries
ELEVENLABS_API_KEY=your_key       # Required for agent voices
GROQ_API_KEY=your_key             # Optional, for fast Whisper STT
TAILSCALE_AUTH_KEY=your_key     # Optional, Tailscale auth
```

**Get keys from:**
- Anthropic: https://console.anthropic.com/
- ElevenLabs: https://elevenlabs.io/
- Groq: https://console.groq.com/

---

## 🎮 Commands

### Daily Rituals (Manual)

```bash
cd ~/agents-dr.fixit/valley

npm run ritual:morning    # 08:00 standup
npm run ritual:board      # 09:00 board meeting
npm run ritual:close      # 23:00 day close
```

### Health Check

```bash
npm run health            # Check all agents
```

### Development

```bash
npm run dev               # Start Valley OS
npm run build             # Build TypeScript
npm run debug             # Debug mode
```

### Ollama Commands

```bash
ollama list               # See installed models
ollama pull qwen2.5:7b    # Add model
ollama rm qwen2.5:7b      # Remove model
```

---

## 📁 Key Files

```
factory/config/
  inventory.json      ← 5 machines + specs
  agents.json         ← 12 agents + voices
  schedule.json       ← Daily rituals

valley/src/
  agents/
    robusca.ts        ← Main coordinator
    cto.ts            ← Infrastructure
  core/
    classifier.ts     ← Message routing
    memory.ts         ← SQLite + embeddings
    cost-footer.ts    ← Budget tracking
    exfil-guard.ts    ← Security scanner
  ritual/
    morning.ts        ← 08:00 standup
    board.ts          ← 09:00 meeting
    close.ts          ← 23:00 close

infra/
  scripts/
    studex-install.sh ← Universal installer
  launchd/
    *.plist           ← macOS services
```

---

## 📝 Cost Tracking

Daily budget: **$3.40 USD**
Monthly burn: **~$102 USD**

```
Local models (Ollama):   $0.00
Claude escalated:        ~$0.50/day
ElevenLabs voices:       ~$1.00/day
Other services:          ~$2.00/day
────────────────────────────────────
TOTAL:                   ~$3.50/day
```

**Cost footer appears on every message** showing daily spend vs budget.

---

## 🔧 Troubleshooting

### Ollama not responding

```bash
ollama serve          # Start server
ollama list           # Check models
curl http://localhost:11434/api/tags  # Test API
```

### Node modules missing

```bash
cd ~/agents-dr.fixit/valley
npm install
```

### Ritual didn't run

```bash
# Check launchd (macOS NAS)
launchctl list | grep studex
launchctl load ~/Library/LaunchAgents/com.studex.morning.plist
```

### Can't connect to other machines

```bash
# Check Tailscale
tailscale status
tailscale ping studex-nas
tailscale ping studex-gpu
```

---

## 🌐 Access Points

| Service | URL | Port |
|---------|-----|------|
| Valley OS Dashboard | http://localhost:3141 | 3141 |
| Valley OS API | http://localhost:4200 | 4200 |
| War Room (Pipecat) | http://localhost:7860 | 7860 |
| Ollama API | http://localhost:11434 | 11434 |
| mesh-llm (GPU) | http://studex-gpu:9337/v1 | 9337 (Tailscale) |
| AnythingLLM | http://localhost:3001 | 3001 (NAS only) |

---

## 📊 Obsidian Vault

Access health logs at:
```
~/agents-dr.fixit/dr-fixit/obsidian/
  00-Dr-Fixit-Dashboard.md      ← Main dashboard
  Daily-Notes/                  ← Daily standup records
  Issues/                       ← Agent health issues
```

Open folder in **Obsidian** app for full dashboard.

---

## 🎯 Success Checklist

After running MEGA PROMPT on all 5 machines:

- [ ] All 5 machines show in `tailscale status`
- [ ] Each machine has Ollama responding
- [ ] `npm run dev` starts on Orchestrator without errors
- [ ] Morning ritual runs at 08:00 SAST
- [ ] Board meeting runs at 09:00 SAST
- [ ] Day close runs at 23:00 SAST
- [ ] Robusca greets you with voice
- [ ] Cost footer appears on messages
- [ ] Dr Fix-It heartbeat every 5 minutes
- [ ] Obsidian vault updating daily

---

## 🆘 Support

**Roo Code not working:**
- Install VS Code + Roo Code extension
- Enable "Auto-approve" in settings
- Paste MEGA_PROMPT
- Watch it work

**Voice not working:**
- Check ElevenLabs API key in .env
- Verify speakers work: `afplay /System/Library/Sounds/Glass.aiff`
- Check agent voice IDs in agents.json

**Agent not responding:**
- Run Dr Fix-It: `python3 ~/agents-dr.fixit/dr-fixit/src/dr_fixit.py`
- Check agent health: `npm run health`
- Check logs: `tail -f ~/agents-dr.fixit/dr-fixit/logs/dr_fixit.log`

---

## 🎤 Voice Commands (ElevenLabs)

Each agent has their own voice. Robusca can activate others:

```
"Robusca, call the Board Meeting"
"Robusca, what's the sales update?"
"Robusca, how are costs today?"
"CTO, check agent health"
"CashClaw, give me revenue report"
```

---

## ⚡ MLX Performance Tips

**Mac M4 Pro 16GB:**
- Use `qwen2.5:7b` for fast responses (~120ms)
- Use `gemma2:2b` for really fast (~60ms)
- Use GPU desktop via mesh for `hermes3:70b`

**GPU Desktop 2×8GB:**
- Runs `hermes3:70b` full 4-bit quant
- Exposes OpenAI-compatible API at `:9337/v1`
- All other machines can call it via Tailscale

---

## 📞 Next Steps

1. **Run installer** on Mac Mini M4 (NAS) first
2. **Add API keys** to .env
3. **Join Tailscale** mesh
4. **Run MEGA PROMPT** in Roo Code
5. **Test rituals** manually first
6. **Deploy to all 5 machines**
7. **Launch to clients** after 2 weeks stable

---

**Built with**: Claude Agent SDK + Ollama + MLX + ElevenLabs + Tailscale  
**For**: StudEx Group  
**By**: Valley OS Team  
**Version**: 1.0.0

🌊 Let the Valley OS flow! 🐉
