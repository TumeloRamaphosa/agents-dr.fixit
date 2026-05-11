import { ModelClient } from '../core/model.js';
import { MemoryStore } from '../core/memory.js';
import { AuditLog } from '../core/audit.js';
import { CostFooter } from '../core/cost-footer.js';
import { isEnabled } from '../core/kill-switches.js';
import { loadAgent } from './loader.js';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

export interface AgentRunResult {
  content: string;
  model: string;
  provider: string;
  tokens_in: number;
  tokens_out: number;
  latency_ms: number;
}

export class AgentRunner {
  private model: ModelClient;
  private memory: MemoryStore;
  private audit: AuditLog;
  private costs: CostFooter;

  constructor(model: ModelClient, memory: MemoryStore, audit: AuditLog, costs: CostFooter) {
    this.model = model;
    this.memory = memory;
    this.audit = audit;
    this.costs = costs;
  }

  async run(codename: string, prompt: string, options?: { model?: { provider: string; name: string } }): Promise<AgentRunResult> {
    const def = loadAgent(codename);
    if (!def) throw new Error(`Agent not found: ${codename}`);

    // Load persona
    const agentsDir = join(process.cwd(), 'agents');
    let systemPrompt = '';
    try {
      const personaPath = join(agentsDir, findAgentDir(codename), 'CLAUDE.md');
      systemPrompt = readFileSync(personaPath, 'utf-8');
    } catch {
      systemPrompt = `You are ${def.display_name}, the ${def.role} agent of StudEx Valley OS. ${def.description}`;
    }

    const modelConfig = options?.model || def.model.primary;

    const response = await this.model.chat(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt },
      ],
      { provider: modelConfig.provider as any, name: modelConfig.name, base_url: modelConfig.base_url }
    );

    // Record usage
    this.costs.recordUsage(codename, response.provider, response.tokens_in, response.tokens_out);

    // Log to audit
    this.audit.log({ event_type: 'agent_run', agent: codename, payload: { model: response.model, provider: response.provider, tokens_in: response.tokens_in, tokens_out: response.tokens_out } });

    // Store in memory
    this.memory.store({
      agent: codename,
      role: def.role,
      content: `${prompt}\n→\n${response.content.slice(0, 500)}`,
      salience: 0.8,
      pinned: false,
    });

    return {
      content: response.content,
      model: response.model,
      provider: response.provider,
      tokens_in: response.tokens_in,
      tokens_out: response.tokens_out,
      latency_ms: response.latency_ms,
    };
  }
}

function findAgentDir(codename: string): string {
  const roleMap: Record<string, string> = {
    robusca: 'exec/robusca',
    cashclaw: 'sales/cashclaw',
    denchclaw: 'customer/denchclaw',
    charlie: 'customer/charlie',
    research: 'research/research',
    openfang: 'research/openfang',
    cto: 'devops/cto',
    skunkworks: 'devops/skunkworks',
    drfixit: 'devops/drfxit',
    'the-lady': 'media/the-lady',
  };
  return roleMap[codename] || codename;
}
