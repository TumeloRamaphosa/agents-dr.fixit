import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

export interface AgentModelConfig {
  provider: string;
  name: string;
  base_url?: string;
}

export interface AgentDefinition {
  codename: string;
  role: string;
  display_name: string;
  description: string;
  model: {
    primary: AgentModelConfig;
    escalate?: AgentModelConfig;
    alternates?: AgentModelConfig[];
  };
  tools: { allow: string[]; deny: string[] };
  voice: { elevenlabs_id: string };
  channels: string[];
  schedule: string[];
}

const agentCache = new Map<string, AgentDefinition>();

function parseYaml(content: string): Record<string, any> {
  const result: Record<string, any> = {};
  const lines = content.split('\n');
  const stack: Array<{ obj: Record<string, any>; indent: number }> = [{ obj: result, indent: -1 }];
  let currentKey = '';

  for (const rawLine of lines) {
    const line = rawLine.replace(/\t/g, '  ');
    if (line.trim().startsWith('#') || !line.trim()) continue;
    const indent = line.search(/\S/);
    const trimmed = line.trim();

    while (stack.length > 1 && indent <= stack[stack.length - 1].indent) {
      stack.pop();
    }

    const parent = stack[stack.length - 1].obj;
    const colonIdx = trimmed.indexOf(':');
    if (colonIdx === -1) continue;

    const key = trimmed.slice(0, colonIdx).trim();
    let value: any = trimmed.slice(colonIdx + 1).trim();

    if (value === '' || value === '|' || value === '>') {
      currentKey = key;
      parent[key] = value === '' ? {} : '';
      if (typeof parent[key] === 'object') {
        stack.push({ obj: parent[key] as Record<string, any>, indent });
      }
    } else if (value.startsWith('[') && value.endsWith(']')) {
      parent[key] = value.slice(1, -1).split(',').map(s => s.trim().replace(/['"]/g, '')).filter(Boolean);
    } else if (value.startsWith('{') && value.endsWith('}')) {
      const inner = value.slice(1, -1);
      const obj: Record<string, any> = {};
      for (const pair of inner.split(',')) {
        const [k, v] = pair.split(':').map(s => s.trim().replace(/['"]/g, ''));
        if (k && v) obj[k] = isNaN(Number(v)) ? v : Number(v);
      }
      parent[key] = obj;
    } else {
      value = value.replace(/^['"]|['"]$/g, '');
      if (value === 'true') value = true;
      else if (value === 'false') value = false;
      else if (!isNaN(Number(value)) && value !== '') value = Number(value);
      parent[key] = value;
    }
  }

  return result;
}

export function loadAgent(codename: string, agentsDir?: string): AgentDefinition | null {
  if (agentCache.has(codename)) return agentCache.get(codename)!;

  const base = agentsDir || join(process.cwd(), 'agents');
  const searchDirs = (function* () {
    const entries = readdirSync(base, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isDirectory() || entry.name.startsWith('_') || entry.name.startsWith('.')) continue;
      yield join(base, entry.name);
      const sub = join(base, entry.name);
      if (existsSync(sub)) {
        const subs = readdirSync(sub, { withFileTypes: true });
        for (const s of subs) {
          if (s.isDirectory()) yield join(sub, s.name);
        }
      }
    }
  })();

  for (const dir of searchDirs) {
    const yamlPath = join(dir, 'agent.yaml');
    if (!existsSync(yamlPath)) continue;
    try {
      const content = readFileSync(yamlPath, 'utf-8');
      const parsed = parseYaml(content) as unknown as AgentDefinition;
      if (parsed.codename === codename) {
        if (!parsed.codename || !parsed.role || !parsed.description) continue;
        agentCache.set(codename, parsed);
        return parsed;
      }
    } catch { continue; }
  }
  return null;
}

export function loadAllAgents(agentsDir?: string): AgentDefinition[] {
  const base = agentsDir || join(process.cwd(), 'agents');
  const agents: AgentDefinition[] = [];

  const walk = (dir: string) => {
    const entries = readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isDirectory() || entry.name.startsWith('_') || entry.name.startsWith('.')) continue;
      const yamlPath = join(dir, entry.name, 'agent.yaml');
      if (existsSync(yamlPath)) {
        try {
          const content = readFileSync(yamlPath, 'utf-8');
          const parsed = parseYaml(content) as unknown as AgentDefinition;
          if (parsed.codename && parsed.role && parsed.description) {
            agentCache.set(parsed.codename, parsed);
            agents.push(parsed);
          }
        } catch { /* skip */ }
      } else {
        walk(join(dir, entry.name));
      }
    }
  };

  walk(base);
  return agents;
}
