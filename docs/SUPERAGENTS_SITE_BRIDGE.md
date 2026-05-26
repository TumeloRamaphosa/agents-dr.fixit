# Bridging `superagents-site` (Vercel) · `stud.exchange` · this repo

The public marketing repo is **[TumeloRamaphosa/superagents-site](https://github.com/TumeloRamaphosa/superagents-site)** (`index.html` on **main**, deployed at [superagents-site.vercel.app](https://superagents-site.vercel.app)). This workspace is **`agents-dr.fixit`**, where Studex infra and dashboards live.

## Recommended layout

| Surface | Role |
|--------|------|
| **Vercel** (`index.html`) | Marketing / landing |
| **`stud.ex-nexus-dashboard.html`** (copy or symlink into the site repo, or iframe) | Private-style command UX |
| **Fly.io `studex-command-plane`** | API that holds `DAYTONA_API_KEY` and exposes `/health`, `/api/sandboxes` |
| **Daytona** | Sandboxes (e.g. **Cursor Studex**) for Cursor cloud agents and builds |
| **`stud.exchange`** | Point DNS to Vercel when ready; add the origin to Fly `CORS_ALLOW_ORIGINS` |

## Minimal Vercel integration

1. Copy `studex-nexus-dashboard.html` into `superagents-site` (or a `/dashboard/` route).
2. In Vercel project settings, you do **not** need Daytona keys for static HTML; only the Fly app needs `DAYTONA_API_KEY`.
3. After deploying Fly, open the dashboard page, go to **Control Plane**, paste your Fly app URL, **Save & Refresh**.

## OpenClaw

Install inside the **Daytona** sandbox (not on Vercel): use `infra/daytona/bootstrap_openclaw.sh` or `npm install -g openclaw` after Node is available in the sandbox image.

## Creating “Cursor Studex” on Daytona

From any machine with the key:

```bash
cd agents-dr.fixit/infra/daytona
pip install -r requirements.txt
export DAYTONA_API_KEY="…"
python3 create_cursor_studex_sandbox.py
```
