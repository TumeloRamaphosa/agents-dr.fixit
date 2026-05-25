# Studex Command — Management Dashboard

SPA for the Studex Command experience: Infrastructure (Fly layout + demo logs), Cognitive Repository / Founder variant, Soul Document (SOULDOC), and a local **Ollama** assistant with toggleable **skills**.

## Prerequisites

Node 20+

## Scripts

```bash
npm install
npm run dev    # http://localhost:5173
npm run build  # outputs to dist/
npm run lint
```

## Ollama (local LLM)

1. Install and run **Ollama** with `ollama serve` (defaults to port **11434**).
2. Pull a model once, for example **`llama3.2:latest`** (see `.env.example` for `VITE_OLLAMA_MODEL`).
3. **`npm run dev`** proxies **`/ollama` → `http://127.0.0.1:11434`**, so the browser never talks to `:11434` directly (no CORS pain in development).
4. In the dashboard header choose **Ask LLM** → set model tag if needed → chat.

Production / static hosting:

- Configure **`VITE_OLLAMA_BASE_URL`** at build time, and permit browser origins from Ollama via **`OLLAMA_ORIGINS`** (see Ollama docs), **or**
- Serve the SPA behind your own reverse proxy that forwards **`/ollama`** to **`127.0.0.1:11434`**.

## Assistant “skills”

Skills are **not** MCP tools yet: they extend the assistant’s **system prompt** each request. **`Board snapshot`** also injects a **mock** VM / cognitive / log digest from `src/studex-command/data.js` so replies can reference dashboard-shaped context.

Editable definitions live in **`src/studex-command/assistantSkills.js`** (`ASSISTANT_SKILLS`, `DEFAULT_SKILL_IDS`).

## Project layout

- `src/studex-command/` — dashboard UI, themed CSS scoped under `.studex-command`
- `src/studex-command/data.js` — mock VM definitions and narrative logs (replace with Fly Machines API responses when wired)
- `src/studex-command/assistantSkills.js` — LLM behaviour modes + composed system prompt
- `src/util/seededRng.js` — deterministic demo metrics per VM ID (stable across mounts)

## Production notes

- Styles avoid mutating global `body` scroll; only `#root` is sized via `src/index.css`.
- Demo copy on Infrastructure clarifies mocked metrics vs a future Machines API integration.
