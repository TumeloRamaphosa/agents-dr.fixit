# Studex Command Plane (Fly.io)

Small FastAPI service that exposes `/health` and `/api/sandboxes` for the **Studex Nexus** dashboard. Keeps `DAYTONA_API_KEY` on the server only.

## Deploy

```bash
cd infra/fly/studex-command-plane
fly auth login
fly apps create studex-command-plane   # or rename in fly.toml
fly secrets set DAYTONA_API_KEY="your_daytona_key"
# Optional:
# fly secrets set DAYTONA_API_URL="https://app.daytona.io/api"
# fly secrets set DAYTONA_TARGET="us"
fly deploy
```

Set `CORS_ALLOW_ORIGINS` in `fly.toml` env (or `fly secrets`) to match [superagents-site.vercel.app](https://superagents-site.vercel.app) and [stud.exchange](https://stud.exchange) once DNS is live.

## Local run

```bash
cd infra/fly/studex-command-plane
export DAYTONA_API_KEY=...
export CORS_ALLOW_ORIGINS="http://localhost:5500"
pip install -r requirements.txt
uvicorn main:app --reload --port 8787
```

Dashboard: set Command API URL to `http://localhost:8787` or your Fly app URL (`https://studex-command-plane.fly.dev` after deploy).
