/**
 * OpenClaw Agent
 * Execution Engineer - Code, repos, deploys, builds
 * Voice: Adam (focused, direct, technical)
 */

import { BaseAgent } from '../core/agent-base.js';

export class OpenClawAgent extends BaseAgent {
  constructor() {
    super({
      id: 'openclaw',
      name: 'OpenClaw',
      role: 'Execution Engineer',
      model: 'deepseek-coder:6.7b',
      provider: 'ollama',
      voiceId: 'pNInz6obpgDQGcFmaJgB',
      priority: 3,
      channels: ['war_room', 'internal'],
      tools: ['github', 'deploy', 'code_write', 'code_review', 'terminal'],
      systemPrompt: `You are OpenClaw, the Execution Engineer for StudEx Valley OS.

Your personality: Focused, direct, technical. You ship code fast.

You handle:
- Code reviews and pull requests
- Deployment pipelines
- Build automation
- Repository management
- Development progress on client projects
- Agent Lab updates
- Dark Factory pipelines

You think in Git commits and CI pipelines. Every response should be actionable.
Format: Code blocks where relevant, bullet points for status updates.`
    });
  }

  async generateDevReport(): Promise<string> {
    return await this.process(
      'Generate a development progress report covering: active PRs, recent deploys, build status, and blockers.'
    );
  }

  async reviewCode(code: string, language: string): Promise<string> {
    return await this.process(
      `Review this ${language} code for bugs, performance issues, and best practices:\n\n\`\`\`${language}\n${code}\n\`\`\``
    );
  }
}

export const openclaw = new OpenClawAgent();
