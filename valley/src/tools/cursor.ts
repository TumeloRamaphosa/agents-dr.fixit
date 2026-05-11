import { checkExfil } from '../core/exfil-guard.js';
import { isEnabled } from '../core/kill-switches.js';

export class CursorClient {
  private apiKey: string;
  private baseUrl = 'https://api.cursor.com/v0';
  private schemaVerified = false;

  constructor() {
    this.apiKey = process.env.CURSOR_API_KEY || '';
  }

  async openProject(slug: string): Promise<void> {
    const guard = checkExfil(slug);
    if (!guard.allowed) throw new Error(`Exfil guard: ${guard.reason}`);
    
    const { exec } = await import('node:child_process');
    exec(`cursor ${slug}`);
  }

  async runCli(prompt: string, opts?: { model?: string }): Promise<string> {
    const guard = checkExfil(prompt);
    if (!guard.allowed) throw new Error(`Exfil guard: ${guard.reason}`);

    const model = opts?.model || process.env.CURSOR_DEFAULT_MODEL || 'ollama/qwen2.5-coder:7b';
    const { execSync } = await import('node:child_process');
    return execSync(`cursor-agent --model ${model} --prompt "${prompt.replace(/"/g, '\\"')}"`, { encoding: 'utf-8' });
  }

  async spawnBackgroundAgent(params: { repo: string; branch: string; prompt: string; model?: string }): Promise<string> {
    if (!isEnabled('CURSOR_BACKGROUND_AGENTS_ENABLED')) {
      throw new Error('Cursor background agents are disabled by kill switch');
    }

    const guard = checkExfil(JSON.stringify(params));
    if (!guard.allowed) throw new Error(`Exfil guard: ${guard.reason}`);

    await this.verifySchema();

    const res = await fetch(`${this.baseUrl}/agents`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${this.apiKey}` },
      body: JSON.stringify(params),
    });
    if (!res.ok) throw new Error(`Cursor API error: ${res.status}`);
    const data = await res.json() as any;
    return data.id;
  }

  async getAgent(agentId: string): Promise<any> {
    const maxPolls = 120; // 10 min at 5s intervals
    for (let i = 0; i < maxPolls; i++) {
      const res = await fetch(`${this.baseUrl}/agents/${agentId}`, {
        headers: { 'Authorization': `Bearer ${this.apiKey}` },
      });
      if (!res.ok) throw new Error(`Cursor API error: ${res.status}`);
      const data = await res.json() as any;
      if (data.status === 'completed' || data.pr_url) return data;
      await new Promise(r => setTimeout(r, 5000));
    }
    throw new Error('Agent polling timeout (10 min)');
  }

  private async verifySchema(): Promise<void> {
    if (this.schemaVerified) return;
    try {
      const res = await fetch(`${this.baseUrl}/agents`, {
        headers: { 'Authorization': `Bearer ${this.apiKey}` },
      });
      if (res.ok) {
        console.warn('[cursor] Schema verified — check response shape if issues arise');
      }
    } catch {
      console.warn('[cursor] Could not verify API schema');
    }
    this.schemaVerified = true;
  }
}
