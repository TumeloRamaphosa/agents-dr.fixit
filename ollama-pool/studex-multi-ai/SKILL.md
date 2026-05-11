---
name: studex-multi-ai
title: Studex Multi-AI Router
description: Route between Ollama local models, SambaNova cloud, and Claude API
triggers:
  - /codex
  - /copilot
  - /droid
  - /pool
  - /cloud
  - /local
---

# Studex Multi-AI Router

This skill routes between multiple AI providers based on task requirements:
- **Local Ollama**: qwen2.5-coder, deepseek-v4, phi4-mini, llama3.2, etc.
- **Cloud SambaNova**: Meta-Llama-3.1-405B-Instruct
- **Claude API**: Escalation for complex tasks

## Quick Commands

```bash
# Code generation with local model
/codex "implement a binary search tree in Rust"

# Pair programming mode
/copilot "help me debug this async function"

# Mobile/Android development
/droid "create a Jetpack Compose screen for user profile"

# Use specific model
/pool deepseek "solve this complex algorithm"

# Cloud fallback
/cloud "need maximum reasoning power"

# Interactive mode
/local chat
```

## Available Models

| Command | Model | Best For |
|---------|-------|----------|
| /codex | qwen2.5-coder:7b | Code generation, review |
| /copilot | qwen2.5:7b | Pair programming |
| /droid | qwen2.5:7b or llama3.2 | Mobile dev |
| deepseek | deepseek-v4-pro:cloud | Complex reasoning |
| phi | phi4-mini:latest | Fast responses |
| llama | llama3.2:latest | Lightweight |
| qwen-pro | qwen3.5:latest | General purpose |
| hermes | hermes3:latest | Chat/dialogue |
| nous | nous-hermes2:latest | Advanced reasoning |
| cloud | Meta-Llama-3.1-405B | Maximum power |

## Model Selection Guide

- **Quick coding tasks** → /codex (qwen2.5-coder)
- **Complex algorithms** → deepseek or cloud
- **Fast autocomplete** → phi
- **Architecture decisions** → qwen-pro or nous-hermes
- **Learning explanations** → llama or hermes
- **Production code** → /codex with review

## Configuration

```bash
# Set default model
export OLLAMA_MODEL="qwen2.5-coder:7b"

# Override host (if remote Ollama)
export OLLAMA_HOST="http://192.168.1.114:11434"

# Start LiteLLM proxy for unified API
export SAMBANOVA_API_KEY="sk-..."
litellm --config ~/.config/litellm/config.yaml --port 8000
```

## Pool Command Reference

```bash
pool codex [model] "prompt"          # Code generation
pool copilot [model] "prompt"       # Pair programming
pool droid [model] "prompt"         # Mobile dev help
pool cloud "prompt"                 # Cloud fallback
pool embed "text"                   # Generate embeddings
pool chat [model]                    # Interactive mode
pool list                           # Show all models
pool test <model>                   # Test a model
pool compare "prompt"               # Compare responses
```

## Examples

```bash
# Generate a React component
pool codex "Create a React component with TypeScript that displays a paginated data table with sorting"

# Get help with algorithms
pool deepseek "Explain time complexity and optimize this O(n²) solution"

# Compare model responses
pool compare "What makes Rust's ownership model unique?"

# Interactive session with specific model
pool chat phi

# Cloud for maximum power
pool cloud "Write a comprehensive system design for a distributed cache"
```

## Integration with IDEs

### Cursor
- Models configured in: `~/.cursor/settings.json`
- Tab autocomplete: qwen2.5-coder:7b
- Default: codex-local → qwen2.5-coder:7b

### VS Code
- Continue extension: `pool list` to see available
- Copilot: Uses cloud fallback on failures

### Environment
```bash
# Add to ~/.zshrc
source ~/.studex-ollama-pool.sh
alias pool="~/.studex-ollama-pool.sh"
```
