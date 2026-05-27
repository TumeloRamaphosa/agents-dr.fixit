/**
 * Agent Orchestrator
 * Central brain that routes messages, manages agent lifecycle,
 * coordinates rituals, and handles agent-to-agent communication
 */

import { BaseAgent, AgentStatus } from './agent-base.js';
import { Classifier } from './classifier.js';
import { eventBus } from './event-bus.js';
import { costFooter } from './cost-footer.js';

export interface OrchestratorStats {
  uptime: number;
  totalRequests: number;
  agentCount: number;
  activeAgents: number;
  dailyCost: number;
  budgetRemaining: number;
}

export class Orchestrator {
  private agents: Map<string, BaseAgent> = new Map();
  private classifier: Classifier;
  private startTime: Date = new Date();
  private totalRequests: number = 0;

  constructor() {
    this.classifier = new Classifier();
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    eventBus.subscribe('agent.message', async (event) => {
      const { to, content, from } = event.payload;
      const targetAgent = this.agents.get(to);
      if (targetAgent) {
        const response = await targetAgent.process(content, { fromAgent: from });
        eventBus.sendMessage({
          from: to,
          to: from,
          content: response,
          type: 'response'
        });
      }
    });

    eventBus.subscribe('agent.error', (event) => {
      console.error(`[Orchestrator] Agent ${event.source} error:`, event.payload.error);
    });
  }

  register(agent: BaseAgent): void {
    this.agents.set(agent.id, agent);
    eventBus.publish({
      type: 'agent.registered',
      source: 'orchestrator',
      payload: { agentId: agent.id, name: agent.name, role: agent.role },
      priority: 'normal'
    });
  }

  getAgent(id: string): BaseAgent | undefined {
    return this.agents.get(id);
  }

  getAllAgents(): BaseAgent[] {
    return Array.from(this.agents.values());
  }

  getAgentStatuses(): AgentStatus[] {
    return this.getAllAgents().map(a => a.getStatus());
  }

  async route(message: string, channel: string = 'api', userId: string = 'anonymous'): Promise<{
    agentId: string;
    agentName: string;
    response: string;
    confidence: number;
    escalated: boolean;
    latencyMs: number;
  }> {
    const startTime = Date.now();
    this.totalRequests++;

    // Classify the message to find the best agent
    const classification = await this.classifier.classify({
      id: crypto.randomUUID(),
      content: message,
      channel,
      userId,
      timestamp: new Date()
    });

    // Get the target agent
    const agent = this.agents.get(classification.agentId);
    if (!agent) {
      // Fallback to first available agent
      const fallback = this.agents.values().next().value;
      if (!fallback) {
        return {
          agentId: 'system',
          agentName: 'System',
          response: 'No agents available. Please check system status.',
          confidence: 0,
          escalated: false,
          latencyMs: Date.now() - startTime
        };
      }
      const response = await fallback.process(message);
      return {
        agentId: fallback.id,
        agentName: fallback.name,
        response,
        confidence: classification.confidence,
        escalated: classification.escalated,
        latencyMs: Date.now() - startTime
      };
    }

    const response = await agent.process(message, { channel, userId });

    return {
      agentId: agent.id,
      agentName: agent.name,
      response,
      confidence: classification.confidence,
      escalated: classification.escalated,
      latencyMs: Date.now() - startTime
    };
  }

  async directMessage(agentId: string, message: string, context?: Record<string, any>): Promise<string> {
    const agent = this.agents.get(agentId);
    if (!agent) {
      return `Agent '${agentId}' not found. Available: ${Array.from(this.agents.keys()).join(', ')}`;
    }
    this.totalRequests++;
    return agent.process(message, context);
  }

  getStats(): OrchestratorStats {
    const budget = costFooter.getBudgetStatus();
    const activeAgents = this.getAgentStatuses().filter(a => a.status === 'ready' || a.status === 'busy').length;

    return {
      uptime: Date.now() - this.startTime.getTime(),
      totalRequests: this.totalRequests,
      agentCount: this.agents.size,
      activeAgents,
      dailyCost: budget.dailySpent,
      budgetRemaining: budget.remaining
    };
  }

  getHealthReport(): Record<string, any> {
    const statuses = this.getAgentStatuses();
    return {
      timestamp: new Date().toISOString(),
      uptime: Math.round((Date.now() - this.startTime.getTime()) / 1000),
      agents: {
        total: statuses.length,
        ready: statuses.filter(s => s.status === 'ready').length,
        busy: statuses.filter(s => s.status === 'busy').length,
        error: statuses.filter(s => s.status === 'error').length,
        offline: statuses.filter(s => s.status === 'offline').length
      },
      budget: costFooter.getBudgetStatus(),
      recentEvents: eventBus.getHistory({ limit: 20 })
    };
  }
}

export const orchestrator = new Orchestrator();
