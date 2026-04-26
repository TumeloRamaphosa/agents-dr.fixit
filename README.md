# Agent Configuration Manager
## Centralized Settings for All Your AI Agents

---

## Directory Structure

```
/Users/project2571/agent-configs/
├── README.md                    # This file
├── config-manager.html          # Web UI for managing configs
├── settings.json                # Master settings index
├── slack/
│   ├── bot-config.json          # Slack bot configuration
│   ├── connections.json         # Workspace connections
│   └── webhooks.json           # Webhook endpoints
├── goclaw/
│   ├── config.json             # Goclaw main settings
│   ├── agents.json             # Agent definitions
│   ├── connections.json        # API connections
│   ├── workflows.json          # Automation workflows
│   └── deployments.json        # Deployment configs
├── hermes/
│   ├── agents.json             # Hermes agent configs
│   ├── gateways.json           # Gateway connections
│   └── skills.json             # Skill definitions
└── nexus/
    ├── social-connections.json # Social media APIs
    ├── graph-api.json          # Facebook/Graph API
    └── content-pipelines.json  # Content automation
```

---

## Quick Start

### 1. View Current Configs
```bash
# See all saved configurations
cat /Users/project2571/agent-configs/settings.json

# View specific agent config
cat /Users/project2571/agent-configs/slack/bot-config.json
cat /Users/project2571/agent-configs/openclaw/agents.json
```

### 2. Assign Configurations
```bash
# Use goclaw to assign configs
goclaw config assign --agent=slack --workspace=studex
goclaw config assign --agent=openclaw --project=meat-sales
```

### 3. Open Web Manager
```bash
# Launch configuration UI
open /Users/project2571/agent-configs/config-manager.html
```

---

## Configuration Types

### Slack Bot Settings
- Bot tokens
- Workspace connections
- Command handlers
- Webhook URLs

### OpenClaw Settings
- Agent definitions
- Model configurations
- Tool integrations
- Workflow triggers

### Goclaw Settings
- Deployment targets
- Environment variables
- Resource allocation
- Monitoring configs

### Hermes Settings
- Agent personalities
- Gateway endpoints
- Skill mappings
- Channel configs

### Nexus Social Settings
- Facebook Graph API
- Instagram API
- Content pipelines
- Analytics connections

---

## Usage

### From Command Line
```bash
# List all configs
goclaw config list

# View specific config
goclaw config show slack:studex-bot

# Edit config
goclaw config edit openclaw:sales-agent

# Assign to project
goclaw config assign --config=slack:bot --project=studex-meat

# Deploy config
goclaw config deploy --agent=openclaw --environment=production
```

### From Web UI
1. Open `config-manager.html` in browser
2. Select agent type (Slack, OpenClaw, etc.)
3. View/edit configurations
4. Assign to projects
5. Deploy to environments

---

## Security

All sensitive tokens and keys are:
- Encrypted at rest
- Never committed to git
- Loaded from environment variables or keychain
- Access controlled via permissions

---

## Backup & Sync

```bash
# Backup all configs
goclaw config backup --output=~/backups/agent-configs-$(date +%Y%m%d).zip

# Sync between machines
goclaw config sync --from=~/backups/agent-configs-20240121.zip
```
