# AGENTS.md

## Cursor Cloud specific instructions

### Overview

This repository contains **StudEx Valley OS**, a multi-agent AI operating system. The primary developable service is the TypeScript-based Valley OS core in `valley/`.

### Services

| Service | Port | How to start | Notes |
|---------|------|-------------|-------|
| Valley OS (API) | 4200 | `cd valley && npm run dev` | Main Fastify server with tsx watch |
| Dr. Fixit (Python) | N/A | `python3 dr-fixit/src/dr_fixit.py` | Health monitor, optional |

### Key commands

- **Dev server**: `cd valley && npm run dev` (tsx watch with hot reload)
- **Type-check**: `cd valley && npx tsc --noEmit`
- **Build**: `cd valley && npm run build`
- **Run ritual scripts**: `cd valley && npm run ritual:morning` / `ritual:board` / `ritual:close`

### Non-obvious caveats

1. **No Ollama in Cloud**: The codebase depends on Ollama (`localhost:11434`) for LLM inference. In cloud environments, the classifier and chat endpoints gracefully fall back (classifier returns default agent with 0.5 confidence). The API server runs fine without it.

2. **`@fastify/websocket` version**: The package.json originally specified `^9.0.1` which doesn't exist on npm. It was corrected to `^9.0.0`.

3. **Pre-existing TypeScript errors**: Running `tsc --noEmit` reports type errors (unused vars due to strict tsconfig, and some type mismatches in the memory store). These are pre-existing and do not prevent runtime via `tsx`.

4. **SQLite FTS5 issue**: The memory module's text search uses raw message text as FTS5 MATCH queries, which fails on messages containing special characters. This is a known code-level issue.

5. **Data directory**: The server creates SQLite databases in `valley/data/`. Ensure this directory exists before starting.

6. **macOS-centric scripts**: Most shell scripts in `scripts/` and `agents/` assume macOS (launchd, macmlx, brew). These are not usable in Linux cloud environments but don't affect the core Valley OS server.
