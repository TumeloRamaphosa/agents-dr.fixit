#!/bin/sh
set -e
cd /app

echo "Starting Super Agents API on :8080"
uvicorn main:app --host 0.0.0.0 --port 8080 &
API_PID=$!

sleep 2

if [ "${ENABLE_DISCORD_BRIDGE:-false}" = "true" ] && [ -n "${DISCORD_BOT_TOKEN:-}" ]; then
  echo "Starting Discord bridge"
  python bridge_discord.py &
fi

if [ "${ENABLE_SLACK_BRIDGE:-false}" = "true" ] && [ -n "${SLACK_BOT_TOKEN:-}" ] && [ -n "${SLACK_APP_TOKEN:-}" ]; then
  echo "Starting Slack bridge"
  python bridge_slack.py &
fi

wait $API_PID
