# AGENTS.md

## Cursor Cloud specific instructions

### Overview

StudEx Valley OS is a monorepo with two main subsystems:

| Subsystem | Location | Language | Run Command |
|-----------|----------|----------|-------------|
| **Valley OS** | `valley/` | TypeScript (Node.js ≥20) | `npm run build` / `npx tsx src/ritual/morning.ts` |
| **Dr. Fixit** | `dr-fixit/src/dr_fixit.py` | Python 3 | `python3 dr-fixit/src/dr_fixit.py` |

### Build & Lint

- **TypeScript build**: `cd valley && npm run build` (runs `tsc`)
- **Type-check only**: `cd valley && npx tsc --noEmit`
- There is no separate lint script configured; TypeScript strict mode via `tsconfig.json` serves as the primary static check.

### Running the application

- `npm run dev` (`tsx watch src/index.ts`) cannot run because `src/index.ts` does not exist yet — the project is partially implemented.
- Individual ritual scripts can be executed directly: `npx tsx src/ritual/morning.ts`, `npx tsx src/ritual/board.ts`, `npx tsx src/ritual/close.ts`.
- All Valley OS agent functionality requires **Ollama** running on `localhost:11434`. Ollama is not available in Cloud Agent VMs (no GPU). Ritual scripts will start and initialize SQLite databases but fail with `ECONNREFUSED` when trying to reach Ollama.
- Dr. Fixit requires **OpenFang daemon** on `localhost:4200` and `osascript` (macOS-only). It runs and reports status but cannot perform repairs in Cloud Agent VMs.

### Key gotchas

- The `@fastify/websocket` dependency was pinned at `^9.0.1` which doesn't exist on npm; it was fixed to `^9.0.0`.
- `better-sqlite3` is a native module that compiles during `npm install`; ensure build tools (`gcc`, `make`, `python3`) are available.
- The `data/` directory under `valley/` is created at runtime to hold SQLite databases (`memory-*.db`, `costs.db`).
- Shell scripts in `scripts/` are macOS-specific (use `launchd`, `osascript`). They pass `bash -n` syntax checks but won't function on Linux.

### Tests

There is no automated test suite. The CI workflow (`.github/workflows/health-check.yml`) validates shell script syntax with `bash -n` and `shellcheck`.
