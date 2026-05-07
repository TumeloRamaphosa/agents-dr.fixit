# STUDEX NEXUS — LLM Mesh Architecture Plan

## Current Infrastructure

| Machine | Specs | Role | Current State |
|---------|-------|------|--------------|
| **Mac Mini M4 Pro** | M1 Max (8P+2E cores), 32GB RAM, 34GB usable | Primary agent runtime | Ollama running, MLX available, Hermes 3 MLX server ready |
| **Windows PC** `192.168.1.114` | 2x GTX 1080 (8GB VRAM each) | GPU compute farm | Unreachable via SSH (needs setup) |

---

## Inference Options Compared

| Runtime | Speed | VRAM Efficiency | Multi-Agent Fit | Setup | Best For |
|---------|-------|-----------------|-----------------|-------|----------|
| **Ollama** | ⭐⭐⭐⭐ | Good (quantized) | ⭐⭐⭐⭐⭐ Easy orchestration | ⭐⭐⭐⭐⭐ Zero-config | Current setup, easy management |
| **MLX (Apple Silicon)** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ Unified memory | ⭐⭐⭐ Good | ⭐⭐⭐⭐ Apple-only | Hermes 3, Gemma4 on Mac Mini |
| **vLLM** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ Best | ⭐⭐⭐ Needs work | ⭐⭐ Hard (GPU/Linux) | Windows PC GPU farm |
| **LM Studio** | ⭐⭐⭐⭐ | Good | ⭐⭐⭐ CLI only | ⭐⭐⭐⭐ Desktop GUI | Local dev, no production |
| **LiteLLM** | ⭐⭐⭐ | Proxy layer | ⭐⭐⭐⭐⭐ Best routing | ⭐⭐⭐⭐⭐ Unified API | Multi-model orchestration |

---

## Recommended Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    STUDEX NEXUS LLM MESH                        │
│                         (Tumi's Empire)                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────── CONTROL PLANE ───────────────┐                │
│  │  LangGraph (orchestration)                  │                │
│  │  Composio (tool actions)                    │  Mac Mini      │
│  │  LiteLLM (multi-model router)               │  M1 Max 32GB   │
│  │  Cron scheduler (system cron)               │                │
│  └────────────────────────────────────────────┘                │
│                          │                                       │
│            ┌─────────────┼─────────────┐                        │
│            ▼             ▼             ▼                        │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │   OLLAMA    │  │    MLX      │  │    vLLM     │             │
│  │  localhost  │  │  localhost   │  │ 192.168.1.114│            │
│  │             │  │             │  │             │             │
│  │ qwen2.5:7b  │  │ Hermes-3-8B │  │ deepseek-r1  │            │
│  │ phi4-mini   │  │ Gemma4:9b   │  │ llama3.2     │            │
│  │ gemma2:2b   │  │             │  │             │             │
│  └─────────────┘  └─────────────┘  └─────────────┘             │
│       │                │                │                      │
│       └────────────────┴────────────────┘                      │
│                      │                                          │
│              LiteLLM Proxy                                      │
│          (unified API for all models)                           │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Agent → Model Mapping

| Agent | Primary Model | Runtime | Speed | Special |
|-------|--------------|---------|-------|---------|
| **RALF** (router) | `qwen2.5:7b` | Ollama | Fast | Routing decisions |
| **Naledi** (CMO) | `deepseek-r1:70b` | Ollama | Medium | Creative generation |
| **Amara** (IG) | `qwen2.5:7b` | Ollama | Fast | Short-form content |
| **Charlie** (voice) | `qwen2.5:7b` | Ollama | Fast | TTS/transcription |
| **EDDIE** (ads) | `hermes3` | MLX | Fast+Apple | Ad copy + Higgsfield |
| **Money Mike** | `qwen2.5:7b` | Ollama | Fast | Deal analysis |
| **DenchClaw** | `phi4-mini` | Ollama | Fastest | CRM queries |
| **Robusca** | `qwen2.5:7b` | Ollama | Fast | Logistics ops |
| **Dr. Fixit** | `phi4-mini` | Ollama | Fastest | Health checks |

---

## Step-by-Step Setup Plan

### Phase 1: Mac Mini as Primary Hub (DONE foundation)

- [x] Ollama running with models
- [x] MLX available (Hermes 3 ready)
- [x] LangGraph installed
- [x] Composio installed
- [ ] Start Hermes MLX server on port 8090
- [ ] Configure LiteLLM as unified proxy

### Phase 2: Windows PC GPU Farm (needs setup)

- [ ] Enable SSH on Windows PC
- [ ] Install vLLM on Windows
- [ ] Expose vLLM on network: `http://192.168.1.114:8000`
- [ ] Add to LiteLLM config

### Phase 3: Orchestration Layer

- [ ] Set up LiteLLM config with all endpoints
- [ ] Configure LangGraph with LiteLLM client
- [ ] Set up Composio actions for tools
- [ ] Install cron schedule for all agents

### Phase 4: Enable Network Mesh

- [ ] Configure `ollama serve --advertise` for network exposure
- [ ] Update LiteLLM endpoints to include `192.168.1.114:8000`
- [ ] Test cross-machine agent calls

---

## vLLM vs Ollama for Windows PC

**vLLM is the clear winner for GTX 1080:**

```
Advantages:
- Paged attention (2x throughput vs Ollama)
- Continuous batching (better GPU utilization)
- RXSwap attention for longer contexts
- Much faster for large models (70B deepseek)

Disadvantages:
- Windows support islimited (Linux/WSL2 recommended)
- CUDA only (NVIDIA)

Recommended Setup for Windows PC:
1. Install WSL2 with Ubuntu 22.04
2. Install CUDA 12.4+ drivers
3. pip install vllm
4. vllm serve deepseek-r1:70b --host 0.0.0.0 --port 8000
```

**Alternative: Use Ollama on Windows**
- Easier but slower for large models
- `ollama serve` on Windows with exposed network

---

## Answer to Your Questions

### Where will agents run?
**Primarily on Mac Mini** using Ollama + MLX. The Windows PC can be added as a remote worker via LiteLLM proxy once SSH is set up.

### Do you need LangGraph + Composio accounts?
**No accounts needed.** Both are open-source packages you already have installed. They run locally.
- LangGraph: orchestration framework
- Composio: tool action library (Composio Cloud optional for managed actions)

### Best Setup for Multi-Agent with No Lags

**Tier 1 — Fastest (local, Mac Mini)**
- RALF, Amara, Charlie, Money Mike, DenchClaw, Robusca → `qwen2.5:7b` via Ollama
- EDDIE → `hermes3` via MLX (Apple optimized)
- Dr. Fixit → `phi4-mini` (fastest, smallest)

**Tier 2 — Heavy Lifters (can be on Windows)**
- Naledi → `deepseek-r1:70b` (best for marketing creative)
- EDDIE creative → `llama3.2:70b` on vLLM/Windows

**Orchestration: LiteLLM**
- Single API endpoint for all models
- Automatic load balancing
- Fallback when one model is busy

---

## Immediate Next Steps

1. **Start Hermes MLX server** (30 seconds)
2. **Configure LiteLLM proxy** (5 minutes)
3. **Enable SSH on Windows PC** (manual step)
4. **Install vLLM on Windows** (after SSH)
5. **Update cron schedule** with full agent tasks

---

## Cron Schedule (Current + New)

```
# Existing (keep)
0 8,15 * * * cd ~/studex-deal-system && python3 daily_update.py
0 0 * * * cd ~/studex-deal-system && python3 daily_report.py

# Dr. Fixit health (keep)
0 * * * * ~/agents-dr.fixit/dr-fixit/src/dr_fixit.py

# RALF Loop (new)
0 0 * * * cd ~/second-brain && python3 brain.py --ralf

# Full agent schedule (new - pending approval)
0 7 * * * cd ~/studex-nexus && python3 agent_runner.py --agent naledi --task morning_check
0 9 * * * cd ~/studex-nexus && python3 agent_runner.py --agent amara --task optimize_queue
0 12 * * * cd ~/studex-nexus && python3 agent_runner.py --agent eddie --task ad_review
0 21 * * * cd ~/studex-nexus && python3 agent_runner.py --agent denchclaw --task crm_reminders
```