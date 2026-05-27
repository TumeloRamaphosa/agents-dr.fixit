/**
 * CTO Agent
 * Chief Technology Officer - Infrastructure, agents, tokens, uptime
 * Voice: Domi (crisp, technical, precise)
 */

import { BaseAgent } from '../core/agent-base.js';

export class CTOAgent extends BaseAgent {
  constructor() {
    super({
      id: 'cto',
      name: 'CTO',
      role: 'Chief Technology Officer',
      model: 'qwen2.5-coder:7b',
      provider: 'ollama',
      voiceId: 'AZnzlk1XvdvUeBnXmlld',
      schedule: '0 9 * * *',
      priority: 2,
      channels: ['board_meeting'],
      tools: ['agent_status', 'token_usage', 'uptime_check', 'linear_tickets', 'bug_report'],
      systemPrompt: `You are the CTO (Chief Technology Officer) for StudEx Valley OS.

Your personality: Crisp, technical, precise. No fluff. Data-driven.

You report on:
- STUDEX Agent Server Warehouse operations
- Agent health and status across the 5-machine mesh
- System restarts and updates
- Runtime metrics and latency
- Token consumption per agent
- Infrastructure issues and resolutions
- New deployments and updates
- Cost optimizations (local vs cloud routing)

Be concise but comprehensive. Use technical accuracy. Numbers matter.
Format: Bullet points, metrics, and clear recommendations.`
    });
  }

  async generateInfrastructureReport(metrics: {
    totalAgents: number;
    healthyAgents: number;
    crashedAgents: number;
    uptimeHours: number;
    totalTokens: number;
    restarts: number;
    updates: string[];
    avgLatency: number;
  }): Promise<string> {
    const prompt = `Generate the CTO report for the Board of Chiefs:

INFRASTRUCTURE STATUS:
- Total agents: ${metrics.totalAgents}
- Healthy: ${metrics.healthyAgents}
- Crashed/restarting: ${metrics.crashedAgents}
- System uptime: ${metrics.uptimeHours} hours

PERFORMANCE:
- Total tokens consumed today: ${metrics.totalTokens.toLocaleString()}
- Average latency: ${metrics.avgLatency}ms
- Restarts required: ${metrics.restarts}

UPDATES:
${metrics.updates?.map(u => `- ${u}`).join('\n') || '- No updates'}

Provide a crisp, technical report with specific numbers and recommendations.`;

    return await this.process(prompt, metrics);
  }

  async analyzeSystemHealth(agentStatuses: any[]): Promise<string> {
    const prompt = `Analyze current system health:

${JSON.stringify(agentStatuses, null, 2)}

Identify:
1. Any agents needing attention
2. Token consumption outliers
3. Latency issues
4. Recommendations for optimization

Format as a concise CTO advisory.`;

    return await this.process(prompt);
  }
}

export const cto = new CTOAgent();
