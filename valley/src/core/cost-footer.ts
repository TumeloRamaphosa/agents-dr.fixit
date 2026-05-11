import { writeVaultFile } from './vault.js';

const COST_PER_MTOKEN: Record<string, { input: number; output: number }> = {
  anthropic: { input: 3, output: 15 },
  openai: { input: 5, output: 15 },
  groq: { input: 0.24, output: 0.24 },
  openrouter: { input: 3, output: 15 },
};

const LOCAL_PROVIDERS = new Set(['ollama', 'mesh-llm']);

interface UsageRecord {
  agent: string;
  provider: string;
  tokensIn: number;
  tokensOut: number;
  timestamp: number;
}

export interface DailyAgentSummary {
  agent: string;
  date: string;
  totalTokensIn: number;
  totalTokensOut: number;
  totalCost: number;
  providers: Record<string, { tokensIn: number; tokensOut: number; cost: number }>;
}

export class CostFooter {
  private records: Map<string, UsageRecord[]> = new Map();
  private lastFlushDate: string = todayStr();

  recordUsage(agent: string, provider: string, tokensIn: number, tokensOut: number): void {
    const key = `${agent}::${todayStr()}`;
    const records = this.records.get(key) || [];
    records.push({ agent, provider, tokensIn, tokensOut, timestamp: Date.now() });
    this.records.set(key, records);

    const today = todayStr();
    if (today !== this.lastFlushDate) {
      this.flushToVault(this.lastFlushDate);
      this.lastFlushDate = today;
    }
  }

  getDailySummary(agent?: string): DailyAgentSummary[] {
    const today = todayStr();

    if (agent) {
      const key = `${agent}::${today}`;
      const records = this.records.get(key) || [];
      return [summarizeRecords(agent, today, records)];
    }

    const agents = new Set<string>();
    for (const k of this.records.keys()) {
      const [a] = k.split('::');
      agents.add(a);
    }

    return Array.from(agents).map(a => {
      const key = `${a}::${today}`;
      const records = this.records.get(key) || [];
      return summarizeRecords(a, today, records);
    });
  }

  getAgentCosts(agent: string): { totalCost: number; totalTokensIn: number; totalTokensOut: number } {
    let totalCost = 0;
    let totalTokensIn = 0;
    let totalTokensOut = 0;

    for (const [key, records] of this.records.entries()) {
      if (!key.startsWith(`${agent}::`)) continue;
      for (const r of records) {
        totalTokensIn += r.tokensIn;
        totalTokensOut += r.tokensOut;
        totalCost += calculateCost(r.provider, r.tokensIn, r.tokensOut);
      }
    }

    return { totalCost, totalTokensIn, totalTokensOut };
  }

  private flushToVault(date: string): void {
    const agents = new Set<string>();
    for (const k of this.records.keys()) {
      if (k.endsWith(`::${date}`)) {
        const [a] = k.split('::');
        agents.add(a);
      }
    }

    const lines: string[] = [
      `# Cost Summary — ${date}`,
      '',
      '| Agent | Provider | Tokens In | Tokens Out | Cost (USD) |',
      '|-------|----------|-----------|------------|------------|',
    ];

    let grandTotal = 0;

    for (const agent of agents) {
      const key = `${agent}::${date}`;
      const records = this.records.get(key) || [];
      const byProvider = new Map<string, { tokensIn: number; tokensOut: number; cost: number }>();

      for (const r of records) {
        const existing = byProvider.get(r.provider) || { tokensIn: 0, tokensOut: 0, cost: 0 };
        existing.tokensIn += r.tokensIn;
        existing.tokensOut += r.tokensOut;
        existing.cost += calculateCost(r.provider, r.tokensIn, r.tokensOut);
        byProvider.set(r.provider, existing);
      }

      for (const [provider, data] of byProvider.entries()) {
        lines.push(`| ${agent} | ${provider} | ${data.tokensIn.toLocaleString()} | ${data.tokensOut.toLocaleString()} | $${data.cost.toFixed(4)} |`);
        grandTotal += data.cost;
      }
    }

    lines.push('');
    lines.push(`**Grand Total: $${grandTotal.toFixed(4)}**`);

    writeVaultFile(`daily/${date}-costs.md`, lines.join('\n'));

    for (const agent of agents) {
      this.records.delete(`${agent}::${date}`);
    }
  }
}

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

function calculateCost(provider: string, tokensIn: number, tokensOut: number): number {
  if (LOCAL_PROVIDERS.has(provider)) return 0;
  const rates = COST_PER_MTOKEN[provider];
  if (!rates) return 0;
  return (tokensIn / 1_000_000) * rates.input + (tokensOut / 1_000_000) * rates.output;
}

function summarizeRecords(agent: string, date: string, records: UsageRecord[]): DailyAgentSummary {
  const providers: Record<string, { tokensIn: number; tokensOut: number; cost: number }> = {};
  let totalTokensIn = 0;
  let totalTokensOut = 0;
  let totalCost = 0;

  for (const r of records) {
    const cost = calculateCost(r.provider, r.tokensIn, r.tokensOut);
    totalTokensIn += r.tokensIn;
    totalTokensOut += r.tokensOut;
    totalCost += cost;

    if (!providers[r.provider]) {
      providers[r.provider] = { tokensIn: 0, tokensOut: 0, cost: 0 };
    }
    providers[r.provider]!.tokensIn += r.tokensIn;
    providers[r.provider]!.tokensOut += r.tokensOut;
    providers[r.provider]!.cost += cost;
  }

  return { agent, date, totalTokensIn, totalTokensOut, totalCost, providers };
}