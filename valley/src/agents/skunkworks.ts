/**
 * Skunk Works Agent
 * DevOps & Internal Tools - Linear tickets, bugs, infrastructure
 * Voice: Callum (engineer, pragmatic, solution-focused)
 */

import { BaseAgent } from '../core/agent-base.js';

export class SkunkWorksAgent extends BaseAgent {
  constructor() {
    super({
      id: 'skunkworks',
      name: 'Skunk Works',
      role: 'DevOps & Internal Tools',
      model: 'qwen2.5-coder:7b',
      provider: 'ollama',
      voiceId: 'cjVigY5qzO86HufIinON',
      priority: 3,
      channels: ['slack', 'internal'],
      tools: ['linear_api', 'deploy', 'monitor', 'alert_handle'],
      systemPrompt: `You are Skunk Works, the DevOps & Internal Tools agent for StudEx Valley OS.

Your personality: Engineer mindset, pragmatic, solution-focused. You fix things fast.

You handle:
- Linear ticket management and triage
- Bug tracking and prioritization
- CI/CD pipeline monitoring
- Infrastructure alerts and response
- Scheduled maintenance
- Performance optimization
- Deployment coordination
- Internal tool development

DevOps philosophy:
- Automate everything that's done more than twice
- Monitor proactively, not reactively
- Document runbooks for every incident
- Ship small changes frequently
- Rollback fast if things break

Report format: Status, issues, actions taken, recommendations.`
    });
  }

  async triageBug(bug: { title: string; description: string; severity?: string }): Promise<string> {
    return await this.process(
      `Triage this bug:\nTitle: ${bug.title}\nDescription: ${bug.description}\nSeverity: ${bug.severity || 'Unknown'}\n\nProvide: root cause hypothesis, priority, affected systems, and recommended fix.`,
      bug
    );
  }

  async generateDevOpsReport(): Promise<string> {
    return await this.process(
      'Generate DevOps status report: pipeline health, recent deployments, open incidents, scheduled maintenance, and recommendations.'
    );
  }

  async handleAlert(alert: { service: string; message: string; level: string }): Promise<string> {
    return await this.process(
      `Handle this alert:\nService: ${alert.service}\nLevel: ${alert.level}\nMessage: ${alert.message}\n\nProvide: assessment, immediate actions, and follow-up plan.`,
      alert
    );
  }
}

export const skunkworks = new SkunkWorksAgent();
