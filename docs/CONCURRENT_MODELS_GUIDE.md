# Concurrent Model Strategy - Ollama + MLX + Hermes

## Quick Answer

**YES** - You can run both simultaneously:
- ✅ **MLX** (Hermes 3 via port 8090) + **Ollama** can run at the same time
- ✅ Hermes desktop uses **Nous Research models** (Hermes 3 IS Nous Research)
- ✅ **No stress reduction needed** - they're completely separate systems

## Current Setup Status

### Running Now 🔥

| System | Status | Memory | Port | Models Available |
|--------|--------|--------|------|------------------|
| **MLX Server** | ✅ Running | ~5GB | 8090 | Hermes-3-8B, Phi-4, Llama-3.2 |
| **Ollama** | ✅ Running | 5.6GB | 11434 | llama3.2:3b (loaded) |
| **Total Used** | | ~11GB | | |
| **Remaining** | | ~21GB | | |

### How They Work Together

```
┌─────────────────────────────────────────────────────────────┐
│                    Your M1 Max 32GB                        │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────┐         ┌──────────────┐                │
│  │   Ollama     │         │    MLX       │                │
│  │   (Go)       │         │  (Python)    │                │
│  │   Port 11434 │         │  Port 8090   │                │
│  │              │         │              │                │
│  │ llama3.2:3b  │         │ Hermes-3-8B  │                │
│  │ 5.6GB GPU    │         │ 5GB GPU      │                │
│  └──────────────┘         └──────────────┘                │
│                                                             │
│       NO CONFLICT - Separate Processes                      │
│       Both use Apple Silicon GPU via Metal                  │
└─────────────────────────────────────────────────────────────┘
```

## Starting Hermes Desktop

### Option 1: Use MLX Backend (Recommended)

```bash
cd ~/agents-dr.fixit
./scripts/start-hermes-desktop.sh
```

This will:
1. Connect to Hermes 3 on MLX (port 8090)
2. Launch the desktop GUI
3. All inference goes through MLX (not Ollama)

### Option 2: Manual Config

```bash
# Set Hermes to use MLX
hermes model
# > Select "Custom endpoint"
# > Base URL: http://127.0.0.1:8090/v1
# > Model: mlx-community/Hermes-3-Llama-3.1-8B-4bit

# Launch desktop
hermes
```

## Nous Research vs Llama Models

### Nous Research Models Available

| Model | Type | Size | Organization |
|-------|------|------|--------------|
| **Hermes-3-Llama-3.1-8B** | Chat/Instruct | 8B | **Nous Research** |
| Hermes-2-Mistral-7B | Chat | 7B | Nous Research |
| DeepHermes-3 | Reasoning | 8B | Nous Research |

**Hermes 3 IS a Nous Research model** - it's their flagship model fine-tuned on Llama 3.1

### What's Currently Running

Your MLX server (port 8090) has:
- ✅ **Nous Research**: `Hermes-3-Llama-3.1-8B-4bit`
- ✅ **Microsoft**: `Phi-4-mini-instruct-4bit`
- ✅ **Meta**: `Llama-3.2-3B-Instruct-4bit`

## Ollama Concurrent Model Capacity

### Local Models (Your Machine)

**Factors:**
- M1 Max has **32GB unified memory**
- GPU/CPU share same memory pool
- Each model uses RAM while loaded

**Rule of Thumb:**
```
Memory per model ≈ Model size in GB × 1.5
8B model (4-bit) ≈ 5-6GB
3B model (4-bit) ≈ 2-3GB
70B model ≈ 40GB (too big for 32GB)
```

**Your Capacity:**

| Scenario | Models | Total Memory | Works? |
|----------|--------|--------------|--------|
| 1 × 8B | 1 | 5GB | ✅ Yes (current) |
| 2 × 8B | 2 | 10GB | ✅ Yes |
| 3 × 8B | 3 | 15GB | ✅ Yes |
| 4 × 8B | 4 | 20GB | ⚠️ Tight |
| 1 × 70B | 1 | 40GB | ❌ No |
| Mixed (8B+3B+3B) | 3 | 10GB | ✅ Yes |

**Concurrent Limit: 3-4 local models** depending on size

### Cloud Models

**Unlimited** - cloud models don't use your RAM:

```bash
# These use API, not local memory:
ollama run deepseek-v4-pro:cloud      # Cloud API
ollama run kimi-k2.5:cloud            # Cloud API
ollama run minimax-m2:cloud           # Cloud API
```

You can run **unlimited cloud models** simultaneously.

## Testing Both Systems

### Test 1: Ollama (Port 11434)

```bash
# Terminal 1
ollama run llama3.2:3b

# Test API
curl http://localhost:11434/api/generate -d '{
  "model": "llama3.2:3b",
  "prompt": "Hello from Ollama"
}'
```

### Test 2: MLX (Port 8090)

```bash
# Terminal 2 - Simultaneous!
curl http://127.0.0.1:8090/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "mlx-community/Hermes-3-Llama-3.1-8B-4bit",
    "messages": [{"role": "user", "content": "Hello from MLX"}]
  }'
```

### Test 3: Both at same time

```bash
# Both queries work simultaneously - different ports
curl http://localhost:11434/api/tags &
curl http://127.0.0.1:8090/v1/models &
wait
```

## Resource Management Tips

### 1. Keep Models Loaded

```bash
# Ollama - keep hot
ollama run llama3.2:3b &

# MLX runs continuously
# Already running on port 8090
```

### 2. Monitor Memory

```bash
# Check memory usage
ps aux | grep -E "(ollama|mlx)" | awk '{sum += $4} END {print "Memory: " sum "%"}'

# Or use Activity Monitor
open -a "Activity Monitor"
```

### 3. Swapping Strategy

If memory is tight:
```bash
# Unload Ollama model
ollama stop llama3.2:3b

# MLX keeps running
# Load different Ollama model
ollama run phi4-mini:latest
```

## Performance Comparison

### Ollama vs MLX on M1 Max

| Metric | Ollama | MLX | Winner |
|--------|--------|-----|--------|
| Framework | Go + llama.cpp | Python + MLX | - |
| Optimization | CPU/GPU hybrid | Apple Silicon native | MLX |
| Model Loading | Slower | Faster | MLX |
| Token Speed | ~40-60 tok/s | ~50-80 tok/s | MLX |
| Memory Use | Moderate | Efficient | MLX |
| Ease of Use | Simple | Requires setup | Ollama |

**Verdict:** MLX is faster for pure Apple Silicon, but Ollama has more model variety.

## Your Optimal Setup

### Recommended:
```
MLX (Port 8090)        → Hermes Desktop GUI (primary)
  └─ Model: Hermes-3-8B (Nous Research)
  └─ Memory: 5GB

Ollama (Port 11434)    → API/Automation/Scripts
  └─ Model: 1-2x 3B-7B models
  └─ Memory: 5-10GB

Total: 15GB / 32GB used
Free: 17GB for other tasks
```

### Start Command:

```bash
# In one terminal - Start Hermes desktop
./agents-dr.fixit/scripts/start-hermes-desktop.sh

# In another - Use Ollama APIs
ollama run llama3.2:3b
```

## Troubleshooting

### "Port already in use"
```bash
# Find what's using port
lsof -i :8090
lsof -i :11434

# Kill if needed
kill $(lsof -t -i:8090)
```

### "Out of memory"
```bash
# Stop Ollama models
ollama stop $(ollama ps | tail -n +2 | awk '{print $1}')

# Check MLX
ps aux | grep mlx

# Restart MLX with smaller model if needed
pkill -f mlx_lm.server
```

### "Hermes won't connect"
```bash
# Verify MLX is running
curl http://127.0.0.1:8090/v1/models

# Check config
cat ~/.config/hermes/config.yaml

# Should show:
# base_url: http://127.0.0.1:8090/v1
# model: mlx-community/Hermes-3-Llama-3.1-8B-4bit
```

## Summary

✅ **Hermes can use Nous Research models** - Hermes 3 IS Nous Research  
✅ **MLX and Ollama run together** - Different processes, no conflict  
✅ **3-4 local models max** on 32GB M1 Max  
✅ **Unlimited cloud models** - They use APIs, not your RAM  
✅ **Current setup is optimal** - Hermes 3 on MLX + Ollama for variety

Your MLX server is already running Hermes 3 (Nous Research). Just start the desktop app and you're good to go.
