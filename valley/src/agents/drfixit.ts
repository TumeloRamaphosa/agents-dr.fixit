/**
 * Dr Fix-It Agent
 * Heartbeat Watchdog - Health monitoring, repairs, auto-recovery
 * No voice (runs every 5 minutes)
 */

import { BaseAgent } from '../core/agent-base.js';
import { eventBus } from '../core/event-bus.js';

export class DrFixItAgent extends BaseAgent {
  constructor() {
    super({
      id: 'drfixit',
      name: 'Dr Fix-It',
      role: 'Heartbeat Watchdog',
      model: 'phi3:mini',
      provider: 'ollama',
      schedule: '*/5 * * * *',
      priority: 1,
      channels: ['internal'],
      tools: ['health_check', 'agent_restart', 'log_alert', 'notify'],
      systemPrompt: `You are Dr Fix-It, the Heartbeat Watchdog for StudEx Valley OS.

Your personality: Clinical, efficient, alert. You detect and fix problems before anyone notices.

You handle:
- Health monitoring of all 12 agents
- Automatic agent restarts on failure
- System resource monitoring (CPU, RAM, disk)
- Network connectivity checks across the mesh
- Alert escalation to CTO
- Health report generation
- Performance degradation detection

Monitoring protocol:
1. Ping each agent's health endpoint
2. Check response time (alert if > 5s)
3. Verify process is running (PID check)
4. Check memory usage (alert if > 80%)
5. Log findings to Obsidian vault
6. Auto-restart if agent is down
7. Notify if restart fails

Report format: Agent status table, issues found, actions taken.`
    });
  }

  async runHealthCheck(agentStatuses: Array<{
    id: string;
    name: string;
    status: string;
    latency?: number;
    memoryMb?: number;
  }>): Promise<string> {
    return await this.process(
      `Run health check on all agents:\n\n${JSON.stringify(agentStatuses, null, 2)}\n\nReport: status summary, issues found, actions needed.`,
      { agentStatuses }
    );
  }

  async diagnose(agentId: string, symptoms: string): Promise<string> {
    return await this.process(
      `Diagnose issue with agent '${agentId}':\nSymptoms: ${symptoms}\n\nProvide: likely cause, immediate fix, and prevention strategy.`
    );
  }

  reportHealth(agents: Array<{ id: string; status: string }>): void {
    const healthy = agents.filter(a => a.status === 'ready').length;
    const total = agents.length;

    eventBus.publish({
      type: 'health.report',
      source: this.id,
      payload: {
        healthy,
        total,
        timestamp: new Date().toISOString(),
        allHealthy: healthy === total
      },
      priority: healthy < total ? 'high' : 'low'
    });
  }
}

export const drfixit = new DrFixItAgent();
