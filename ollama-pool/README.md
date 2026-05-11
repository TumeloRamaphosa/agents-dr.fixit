# 🤖 Studex Multi-AI Pool Configuration

Complete setup for Ollama models across Codex, Copilot, Droid, Cloud, and Local environments.

## ✅ What's Configured

### 📦 Components
| Component | File | Purpose |
|-----------|------|---------|
| **Pool Shell** | `~/.studex-ollama-pool.sh` | Unified command interface |
| **LiteLLM Config** | `~/.config/litellm/config.yaml` | Proxy for unified API |
| **Cursor Settings** | `~/.cursor/settings.json` | Cursor IDE integration |
| **VS Code Settings** | `~/Library/Application Support/Code/User/settings.json` | VS Code integration |
| **Multi-AI Skill** | `~/.claude/skills/studex-multi-ai/SKILL.md` | gstack/pi integration |
| **LiteLLM Startup** | `~/.studex-start-litellm.sh` | Proxy startup script |
| **LaunchAgent** | `~/Library/LaunchAgents/com.studex.ollamapool.plist` | Auto-start on boot |
| **Copilot Config** | `~/.copilot-ollama.json` | GitHub Copilot settings |
| **Status Checker** | `~/.studex-status.sh` | Health monitoring |

---

## 🚀 Quick Start

### 1. Reload Shell
```bash
source ~/.zshrc
```

### 2. Check Status
```bash
studex-status
```

### 3. Start LiteLLM Proxy (optional, for unified API)
```bash
studex-litellm
```

### 4. Use the Pool Command
```bash
# Code generation (default: qwen2.5-coder:7b)
pool codex "Write a Python function to sort a list"

# Use specific model
pool codex deepseek "Explain this algorithm"

# Pair programming
pool copilot "Help me debug this async function"

# Mobile/Android development
pool droid "Create a Jetpack Compose screen"

# Cloud fallback (SambaNova)
pool cloud "Maximum reasoning power needed"

# Interactive chat
pool chat phi

# Compare models
pool compare "What makes Rust unique?"

# List all models
pool list
```

---

## 🤖 Available Models

### Local Ollama Models
| Alias | Full Name | Size | Best For | Context |
|-------|-----------|------|----------|---------|
| `codex` / `coder` | qwen2.5-coder:7b | 4.7 GB | **Code generation** | 32K |
| `deepseek` | deepseek-v4-pro:cloud | Cloud | Complex reasoning | 64K |
| `qwen` | qwen2.5:7b | 4.7 GB | General purpose | 32K |
| `qwen-pro` | qwen3.5:latest | 6.6 GB | Latest generation | 128K |
| `phi` | phi4-mini:latest | 2.5 GB | Fast responses | 128K |
| `llama` | llama3.2:latest | 2.0 GB | Lightweight | 128K |
| `gemma` | gemma4:latest | 9.6 GB | Google's latest | 128K |
| `hermes` | hermes3:latest | 4.7 GB | Chat/dialogue | 128K |
| `nous` | nous-hermes2:latest | 6.1 GB | Advanced reasoning | 32K |
| `embed` | nomic-embed-text:latest | 274 MB | Embeddings | 8K |
| `tiny` | tinyllama:latest | 637 MB | Testing | 2K |

### Cloud Models (SambaNova)
| Alias | Name | Best For |
|-------|------|----------|
| `cloud` / `sambanova` | Meta-Llama-3.1-405B-Instruct | Maximum power |

---

## 💻 IDE Integration

### Cursor
Models configured in `~/.cursor/settings.json`:
- Default: `codex-local` → qwen2.5-coder:7b
- Tab autocomplete: qwen2.5-coder:7b
- All Ollama models available in model switcher

### VS Code
Continue extension configured with:
- Qwen Coder (Local)
- DeepSeek Pro (Local)
- Phi Fast (Local)
- SambaNova (Cloud)

### GitHub Copilot
Via LiteLLM proxy at `http://localhost:8000/v1`:
```json
{
  "github.copilot.advanced": {
    "debug.useLocalProxy": true,
    "localProxy": {
      "url": "http://localhost:8000/v1"
    }
  }
}
```

### Claude Code (Local)
Uses SambaNova profile:
```bash
codex --profile sambanova
```

---

## 🔧 Advanced Configuration

### Override Ollama Host (Remote)
```bash
export OLLAMA_HOST="http://192.168.1.114:11434"
```

### Set Default Model
```bash
export OLLAMA_MODEL="qwen2.5-coder:7b"
```

### Start LiteLLM with Custom Config
```bash
litellm --config ~/.config/litellm/config.yaml --port 8000
```

---

## 📊 Model Selection Guide

| Task | Recommended Model | Command |
|------|------------------|---------|
| **Code generation** | qwen2.5-coder:7b | `pool codex "prompt"` |
| **Code review** | qwen2.5-coder:7b | `pool codex "review..."` |
| **Complex algorithms** | deepseek-v4-pro:cloud | `pool deepseek "prompt"` |
| **Quick answers** | phi4-mini:latest | `pool phi "prompt"` |
| **Architecture decisions** | qwen3.5:latest | `pool qwen-pro "prompt"` |
| **Learning/explanation** | hermes3:latest | `pool hermes "prompt"` |
| **Advanced reasoning** | nous-hermes2:latest | `pool nous "prompt"` |
| **Maximum power** | Meta-Llama-3.1-405B | `pool cloud "prompt"` |
| **Embeddings** | nomic-embed-text:latest | `pool embed "text"` |
| **Testing** | tinyllama:latest | `pool test tiny` |

---

## 🔄 Fallback Chain

1. **Primary**: Local Ollama (qwen2.5-coder:7b)
2. **Secondary**: qwen3.5:latest (if primary busy)
3. **Tertiary**: deepseek-v4-pro:cloud (for complex tasks)
4. **Cloud**: Meta-Llama-3.1-405B-Instruct (SambaNova)

---

## 📁 File Structure

```
~/.studex-ollama-pool.sh          # Main pool command
~/.studex-start-litellm.sh        # LiteLLM startup
~/.studex-status.sh               # Status checker
~/.config/litellm/config.yaml     # LiteLLM configuration
~/.cursor/settings.json           # Cursor IDE config
~/.copilot-ollama.json            # Copilot integration
~/Library/Application Support/Code/User/settings.json  # VS Code
~/Library/LaunchAgents/com.studex.ollamapool.plist    # Auto-start
~/.claude/skills/studex-multi-ai/SKILL.md           # gstack skill
```

---

## 🛠️ Troubleshooting

### Ollama not responding
```bash
# Check Ollama status
ollama list

# Restart Ollama
pkill ollama
ollama serve
```

### LiteLLM won't start
```bash
# Check if port 8000 is free
lsof -i :8000

# Kill existing process
kill $(pgrep -f 'litellm')

# Restart
studex-litellm
```

### Model not loading
```bash
# Test specific model
pool test qwen2.5-coder:7b

# Pull model if missing
ollama pull qwen2.5-coder:7b
```

### Cloud fallback not working
```bash
# Check SambaNova key
echo $SAMBANOVA_API_KEY

# Test cloud directly
pool cloud "Hello"
```

---

## 📊 Health Check

Run status checker anytime:
```bash
studex-status
```

This shows:
- ✅ Ollama service status
- ✅ LiteLLM proxy status
- ✅ Available models
- ✅ Cloud connectivity
- ✅ All integrations

---

## 🎯 Usage Examples

### Generate a Function
```bash
pool codex "Create a Rust function that implements a thread-safe LRU cache with max size"
```

### Debug Code
```bash
pool copilot "This async code has a race condition, help me identify it"
```

### Compare Approaches
```bash
pool compare "What are the trade-offs between mutexes and atomic operations?"
```

### Mobile Development
```bash
pool droid "Create a Jetpack Compose login screen with validation"
```

### Get Embeddings
```bash
pool embed "This is the text to vectorize for semantic search"
```

### Interactive Session
```bash
pool chat deepseek
```

---

## 📝 Summary

✅ **13 Ollama models** configured
✅ **Codex** → Local qwen2.5-coder:7b
✅ **Copilot** → Via LiteLLM proxy
✅ **Droid** → Mobile dev mode
✅ **Cloud** → SambaNova fallback
✅ **Local** → All models via `pool` command

Your Studex Multi-AI Pool is ready! 🚀
