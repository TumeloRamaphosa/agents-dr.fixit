# Studex · Daytona (“Aesthetics Agent Wave”)

Programmatic sandboxes for **Cursor cloud agents** and build workloads. Default sandbox display name: **Cursor Studex**.

## Prerequisites

1. Daytona account and API key from [Daytona](https://www.daytona.io/).
2. Environment variables (or pass via `DaytonaConfig` in custom scripts):

| Variable | Required | Description |
|----------|----------|-------------|
| `DAYTONA_API_KEY` | Yes | API key |
| `DAYTONA_API_URL` | Usually no | Defaults per SDK; SaaS commonly `https://app.daytona.io/api` |
| `DAYTONA_TARGET` | Usually no | Region target, e.g. `us` |

```bash
export DAYTONA_API_KEY="YOUR_KEY_HERE"
# optional:
# export DAYTONA_API_URL="https://app.daytona.io/api"
# export DAYTONA_TARGET="us"
```

## Create the Cursor Studex sandbox

```bash
cd infra/daytona
python3 -m pip install -r requirements.txt
python3 create_cursor_studex_sandbox.py
```

The script prints sandbox `id`, `name`, `state`, and labels. Run OpenClaw bootstrap **inside** the sandbox with `sandbox.process.exec` or SSH/preview URLs from the Daytona dashboard.

## OpenClaw inside the sandbox

After the sandbox exists, install OpenClaw (Node/npm required in the sandbox image):

```bash
# From your machine — adapt SSH/preview/exec to how you attach to the sandbox
bash infra/daytona/bootstrap_openclaw.sh
```

Or copy `bootstrap_openclaw.sh` into the sandbox with `sandbox.process.exec` / file upload APIs.

## Security

Never commit API keys. For the web dashboard, only the Fly.io **Studex Command Plane** app should hold `DAYTONA_API_KEY` as a Fly secret, not Vercel or static HTML.
