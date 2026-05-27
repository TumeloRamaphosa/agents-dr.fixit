# Studex Command — Management Dashboard

Production-ready SPA for Studex Command: **Infrastructure** (Fly Machines + demo fallback), **Cognitive Repository**, **Founder's Brain**, **Soul Document (SOULDOC)**, and a local **Ollama** assistant with toggleable **skills**.

## Quick start

```bash
cd studex-command-dashboard
cp .env.example .env    # optional: Fly token + model tag
npm install
npm run dev             # http://localhost:5173
```

**Ollama** (separate terminal):

```bash
ollama pull llama3.2:latest
ollama serve
```

Open the dashboard → **Ask LLM** in the header.

## Features

| Area | Status |
|------|--------|
| Four dashboard pages | ✅ |
| Responsive layout | ✅ |
| Ollama assistant + skills | ✅ |
| Fly Machines live state (optional token) | ✅ with fallback demo |
| Assistant prefs in `localStorage` | ✅ |
| CI (lint + build) | ✅ |
| Docker static + `/ollama` proxy | ✅ |

## Environment

Copy `.env.example` → `.env`:

| Variable | Purpose |
|----------|---------|
| `VITE_OLLAMA_MODEL` | Default model tag in UI |
| `VITE_OLLAMA_BASE_URL` | Override Ollama origin (default `/ollama` proxy) |
| `VITE_FLY_API_TOKEN` | Fly Machines API (dev/preview proxy only — **never commit**) |

Live Fly state: token is read by **Vite** and attached server-side to `/fly` → `api.machines.dev`. Without a token, infra stays in **Demo** mode with seeded metrics.

## Ollama proxy

- **`npm run dev`** and **`npm run preview`** proxy **`/ollama` → `127.0.0.1:11434`**
- **Docker** image proxies **`/ollama/`** to **`host.docker.internal:11434`**
- Direct browser → Ollama requires **`OLLAMA_ORIGINS`** if you set `VITE_OLLAMA_BASE_URL=http://127.0.0.1:11434`

## Assistant skills

Defined in **`src/studex-command/assistantSkills.js`**. Skills extend the **system prompt** each request; **Board snapshot** injects mock VM/brain/log context from **`data.js`**. Not tool-calling yet.

## Project layout

```
src/studex-command/
  StudexCommand.jsx      # shell + nav
  InfraPage.jsx          # Fly live/demo infra
  CognitivePage.jsx      # brain + logs
  SoulDocPage.jsx
  OllamaAssistant.jsx
  assistantSkills.js
  flyClient.js           # Machines API client
  ollamaClient.js
  data.js                # mock narrative data
```

## Scripts

```bash
npm run dev
npm run build      # dist/
npm run preview    # production build + dev proxies
npm run lint
```

## Docker

```bash
docker build -t studex-command .
docker run --rm -p 8080:80 studex-command
# Ollama must run on the host; container proxies /ollama to host.docker.internal:11434
```

Optional Fly proxy in container: pass `-e FLY_API_TOKEN=...` at run time.

## Recommended Ollama model

**`llama3.2:latest` (8B)** — best balance for ops Q&A on a typical dev laptop. Use **`llama3.2:3b`** if RAM is tight; **`qwen2.5:7b-instruct`** if you want stronger reasoning.

## Next integrations (optional)

- Real memory logs from Supabase / n8n webhooks
- Ollama tool-calling for `flyctl` or Slack
- Replace mock `data.js` with live API modules
