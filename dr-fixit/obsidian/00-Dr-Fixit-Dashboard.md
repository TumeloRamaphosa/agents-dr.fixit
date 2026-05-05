# 🏥 Dr. Fixit Dashboard

**AI Agent Health Monitor** | **OpenFang + MLX**

---

## 🟢 System Status

| Component | Status | Last Check |
|-----------|--------|------------|
| OpenFang Daemon | ✅ Running | {{date}} |
| MLX Backend | ✅ Active | {{date}} |
| Ollama | ✅ Online | {{date}} |
| Dr. Fixit Agent | ✅ Monitoring | Every hour |
| Git Backup | ✅ Synced | {{date}} |

---

## 📊 Quick Stats

```dataview
TABLE WITHOUT ID
    file.link as "Health Check",
    agent_count as "Agents",
    issue_count as "Issues",
    repair_count as "Repairs",
    status as "Status"
FROM "Daily-Notes"
SORT file.name DESC
LIMIT 7
```

---

## 🚨 Active Issues

```dataview
TABLE WITHOUT ID
    file.link as "Issue",
    agent as "Agent",
    severity as "Severity",
    file.ctime as "Detected"
FROM "Issues"
WHERE status = "open"
SORT file.ctime DESC
```

---

## 🤖 Agent Fleet

| Agent | Status | Model | Purpose |
|-------|--------|-------|---------|
| Researcher | 🟢 | DeepSeek-R1 | Deep research |
| Browser | 🟢 | Llama-3.2-3B | Web automation |
| Clip | 🟢 | Llama-3.2-3B | Video editing |
| Collector | 🟢 | DeepSeek-R1 | Data collection |
| Lead | 🟢 | Qwen2.5 | Lead gen |
| Predictor | 🟢 | DeepSeek-R1 | Forecasting |
| Trader | 🟢 | Qwen2.5 | Market analysis |
| Twitter | 🟢 | Llama-3.2-3B | Social media |
| Coder | 🟢 | Qwen2.5-Coder | Code gen |
| Analyst | 🟢 | DeepSeek-R1 | Analysis |
| Architect | 🟢 | gemma-4b | System design |
| Assistant | 🟢 | Llama-3.2-3B | General chat |
| DevOps | 🟢 | Qwen2.5-Coder | Operations |

---

## ⚡ MLX Performance

| Model Type | Latency | Memory |
|------------|---------|--------|
| Fast (3B) | ~50ms | 2GB |
| Balanced (4B) | ~80ms | 3GB |
| Powerful (7B) | ~150ms | 4.5GB |

**Running on**: Apple M4 Pro (16GB) with Metal

---

## 📁 Quick Links

- [[2026-05-05-Health-Check|Latest Health Check]]
- [OpenFang Dashboard](http://127.0.0.1:4200)
- [GitHub Repo](https://github.com/TumeloRamaphosa/agents-dr.fixit)

### Logs
- [Daily Health Checks](Daily-Notes/)
- [Issues Log](Issues/)
- [Agent Logs](Agents/)

---

## 🔧 Manual Commands

```bash
# Check status
openfang status

# Restart daemon
openfang stop && openfang start

# List active hands
openfang hand active

# Activate hand
openfang hand activate [name]

# Run Dr. Fixit manually
python3 ~/agents-dr.fixit/dr-fixit/src/dr_fixit.py
```

---

## 📝 Recent Repairs

```dataview
LIST FROM "Repairs"
SORT file.ctime DESC
LIMIT 10
```

---

*Last Updated: {{date}}*  
*Next Health Check: Next hour*  
*Dr. Fixit v1.0 | OpenFang v0.6.4 | MLX Enabled*
