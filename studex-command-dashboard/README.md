# Studex Command — Management Dashboard

SPA for the Studex Command experience: Infrastructure (Fly layout + demo logs), Cognitive Repository / Founder variant, and Soul Document (SOULDOC).

## Prerequisites

Node 20+

## Scripts

```bash
npm install
npm run dev    # http://localhost:5173
npm run build  # outputs to dist/
npm run lint
```

## Project layout

- `src/studex-command/` — dashboard UI, themed CSS scoped under `.studex-command`
- `src/studex-command/data.js` — mock VM definitions and narrative logs (replace with Fly Machines API responses when wired)
- `src/util/seededRng.js` — deterministic demo metrics per VM ID (stable across mounts)

## Production notes

- Styles avoid mutating global `body` scroll; only `#root` is sized via `src/index.css`.
- Demo copy on Infrastructure clarifies mocked metrics vs a future Machines API integration.
