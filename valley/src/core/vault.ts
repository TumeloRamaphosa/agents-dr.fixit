import { existsSync, mkdirSync, readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';

const DEFAULT_VAULT_PATH = '/Users/tumeloramaphosa/Documents/Obsidian Vault/2nd Brain';

export function getVaultPath(): string {
  return process.env.VAULT_PATH || DEFAULT_VAULT_PATH;
}

export function getValleyOSPath(): string {
  return join(getVaultPath(), 'StudEx-Valley-OS');
}

export function ensureVaultTree(): void {
  const base = getValleyOSPath();
  const dirs = [
    base,
    join(base, 'daily'),
    join(base, 'proposals'),
    join(base, 'meetings'),
    join(base, 'partners'),
    join(base, 'ledger'),
    join(base, 'assets'),
    join(base, 'assets', 'agents'),
  ];

  for (const dir of dirs) {
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
  }
}

export function seedVault(): void {
  ensureVaultTree();
  const base = getValleyOSPath();

  const seedFiles: Record<string, string> = {
    '00-Valley-OS.md': `# StudEx Valley OS\n\n> Hive Mind wrapper for Claude Code. Role-based agents running Studex Group businesses on local Ollama.\n\n## Architecture\n\nVault (2nd Brain) = brain · Hive Mind = wrapper · Agents = hands · Slack+Discord+Voice = steering wheel · Ollama = muscle · Claude = escalation\n\n## Quick Start\n\n\`\`\`bash\nnpm install && npm run doctor && npm run dashboard:dev\n\`\`\`\n`,
    '01-Machines.md': `# Machines\n\n| Machine | Specs | Role |\n|---------|-------|------|\n| Mac Mini M4 Pro | 16GB RAM | Primary server, dev machine |\n| Windows PC (192.168.1.114) | Dual GTX 1080 | Always-on GPU compute |\n`,
    '02-Agents.md': `# Agent Roster\n\n| Role | Codename | Voice | Anchor |\n|------|----------|-------|--------|\n| Chief of Staff | Robusca | Female, warm SA-English | 08:00 standup + 09:00 Council |\n| Sales | CashClaw (Adam) | Male, confident | Studex Meat |\n| Customer | DenchClaw, Charlie | Friendly SA-English | Charlie = Studex Meat |\n| Research | Research, OpenFang | Curious | Night Build problem picks |\n| DevOps | CTO, Skunk Works, Dr Fix-It | Engineer, brief | CTO uses Cursor |\n| Media | The Lady | Female, polished | Content + brand |\n`,
    '03-Costs.md': `# Cost Tracking\n\nToken costs tracked daily. Local Ollama tokens = free. Claude tokens = billed.\n\n## Strategy\n- Default to Ollama (free)\n- Escalate to Claude only when needed\n- Night Build: local Ollama only (no Claude)\n- Target 80-90% cost reduction vs Claude-only\n`,
    '04-Studex-Meat.md': `# Studex Meat\n\nPremium Halaal-certified Wagyu & Ankole beef.\n- Nelson Mandela Boxing Cup brand partnership\n- CashClaw handles sales pipeline\n- Charlie handles customer queue\n- Website: studexmeat.com\n`,
    '05-SGM.md': `# Studex Global Markets\n\nB2B commodity trading.\n- 5-tier client access (Aspire $99/mo → Ghost $7,500+/mo)\n- OpenFang scrapes partner news\n- Research provides market analysis\n`,
    '06-Studex-Coffee.md': `# Studex Coffee\n\nPremium coffee vertical.\n- Emerging brand in the Studex Group portfolio\n- Media (The Lady) handles content\n`,
  };

  for (const [filename, content] of Object.entries(seedFiles)) {
    const filepath = join(base, filename);
    if (!existsSync(filepath)) {
      writeFileSync(filepath, content, 'utf-8');
    }
  }
}

export function readVaultFile(relativePath: string): string | null {
  const filepath = join(getValleyOSPath(), relativePath);
  if (!existsSync(filepath)) return null;
  return readFileSync(filepath, 'utf-8');
}

export function writeVaultFile(relativePath: string, content: string): void {
  ensureVaultTree();
  const filepath = join(getValleyOSPath(), relativePath);
  mkdirSync(join(filepath, '..'), { recursive: true });
  writeFileSync(filepath, content, 'utf-8');
}

export function listVaultFiles(relativeDir: string): string[] {
  const dirpath = join(getValleyOSPath(), relativeDir);
  if (!existsSync(dirpath)) return [];
  return readdirSync(dirpath).filter(f => statSync(join(dirpath, f)).isFile());
}