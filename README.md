# StudEx Valley OS

Hive Mind wrapper for Claude Code. Role-based agents run Tumelo's businesses (Studex Meat, SGM, Studex Coffee) on local Ollama by default, escalating to Claude only when needed, with daily voice rituals, an overnight Night Build that ships two prototypes per night, and the existing 2nd Brain Obsidian vault as the single source of truth.

## Architecture

```
Vault (2nd Brain) = brain · Hive Mind = wrapper · Agents = hands
Slack + Discord + Voice = steering wheel · Ollama (+ optional mesh-llm) = muscle · Claude = escalation
```

## Quick Start

```bash
npm install
cp .env.example .env   # fill in keys
npm run doctor         # verify Ollama, keys, SQLite, vault, Cursor API
npm run dashboard:dev  # :3141 — world clocks, kanban, mission control
```

## Daily Rituals (SAST)

| Time | Ritual |
|------|--------|
| 08:00 | Robusca Standup |
| 09:00 | StudEx Agent Council Meeting |
| 22:00–02:00 | Night Build (2 products/night, local Ollama only) |

## Agent Roster

| Role | Codename | Voice | Anchor |
|------|----------|-------|--------|
| Chief of Staff | Robusca | Female, warm SA-English | 08:00 standup + 09:00 Council |
| Sales | CashClaw (Adam) | Male, confident | Studex Meat |
| Customer | DenchClaw, Charlie | Friendly SA-English | Charlie = Studex Meat |
| Research | Research, OpenFang | Curious | Owns Night Build problem picks |
| DevOps | CTO, Skunk Works, Dr Fix-It | Engineer, brief | CTO uses Cursor |
| Media | The Lady | Female, polished | Content + brand |

## Kill Switches

All toggled in `.env`. Key switches: `SCHEDULER_ENABLED`, `COUNCIL_ENABLED`, `NIGHT_BUILD_ENABLED`, `KILL_PHRASE`.

## Stack

Node 20+ ESM · TypeScript 5.x · Hono · better-sqlite3 + sqlite-vec · ElevenLabs TTS · Groq Whisper STT · Slack Bolt · discord.js · node-cron + launchd · Cursor IDE+CLI+API

## Directory Structure

```
agents-dr.fixit/
├─ valley/src/           # Core runtime
│  ├─ core/              # kill-switches, vault, model, classifier, memory, audit, exfil-guard, cost-footer
│  ├─ tools/cursor.ts    # Cursor IDE wrapper
│  ├─ agents/            # loader, runner
│  ├─ warroom/           # room, roster, doc-drop, transcript, commands
│  ├─ ritual/            # morning, council, snapshot, night-build, problem-picker, build-sandbox, test-loop, proposals
│  ├─ voice/             # elevenlabs, whisper
│  ├─ bridges/           # slack, discord
│  └─ dashboard/         # Hono :3141 (React, kanban, world clocks, SSE)
├─ agents/               # 11 agent definitions (yaml + CLAUDE.md)
├─ factory/              # config, scripts, templates, projects
├─ bridges/              # Slack + Discord bridge servers
├─ infra/                # scripts, launchd plists
├─ docs/                 # all documentation
├─ reference/            # digests
└─ promo/                # pre-built promo pack (read-only)
```

## Acceptance Tests

```bash
npm install
npm run doctor
node valley/dist/index.js --smoke
node factory/scripts/mission.mjs list
node factory/scripts/warroom.mjs start council --dry-run
node factory/scripts/night-build.mjs --dry-run
node factory/scripts/snapshot.mjs --dry-run
node factory/scripts/heartbeat.mjs
npm run dashboard:dev   # :3141, world clocks tick
```

## License

MIT — For Studex Group internal use.

---

**Maintained by**: Tumelo Ramaphosa