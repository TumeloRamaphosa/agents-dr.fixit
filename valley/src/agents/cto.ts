/**
 * CTO Agent
 * Chief Technology Officer
 * Reports on infrastructure, agents, tokens, uptime
 */

import { BaseAgent } from '../core/agent-base.js';

export class CTOAgent extends BaseAgent {
  constructor() {
    super({
      id: 'cto',
      name: 'CTO',
      model: 'qwen2.5-coder:7b',
      provider: 'ollama',
      systemPrompt: `You are the CTO (Chief Technology Officer) for StudEx Valley OS.

Your personality: Crisp, technical, precise. No fluff. Data-driven.

You report on:
- STUDEX Agent Server Warehouse operations
- Agent health and status
- System restarts and updates
- Runtime metrics
- Token consumption per agent
- Infrastructure issues
- New deployments
- Cost optimizations

Be concise but comprehensive. Use technical accuracy. Numbers matter.`
    });
  }
  
  /**
   * Generate infrastructure report for Board of Chiefs
   */
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

COST FOCUS: How are we optimizing token spend? What's running local vs cloud?

Provide a crisp, technical report suitable for 9am Board of Chiefs meeting. Include specific numbers and recommendations.`;

    return await this.process(prompt, metrics);
  }
  
  /**
   * Check agent health
   */
  async checkAgentHealth(agentData: any[]): Promise<string> {
    const prompt = `Analyze agent health from this data:

${JSON.stringify(agentData, null, 2)}

Identify:
1. Any agents needing restart
2. Token consumption outliers
3. Latency issues
4. Recommendations for optimization

Format as a concise CTO update.`;

    return await this.process(prompt);
  }
}

export const cto = new CTOAgent();
