/**
 * Base Agent Class
 * All Valley OS agents extend this foundation
 * Handles LLM routing, memory, security, cost tracking, and voice
 */

import { MemoryStore } from './memory.js';
import { exfilGuard } from './exfil-guard.js';
import { costFooter } from './cost-footer.js';
import { eventBus } from './event-bus.js';
import { llmProvider } from './llm-provider.js';

export interface AgentConfig {
  id: string;
  name: string;
  role: string;
  model: string;
  provider: 'ollama' | 'anthropic' | 'mesh_llm';
  systemPrompt: string;
  tools?: string[];
  channels?: string[];
  voiceId?: string;
  schedule?: string;
  priority?: number;
}

export interface AgentStatus {
  id: string;
  name: string;
  role: string;
  status: 'ready' | 'busy' | 'error' | 'offline';
  lastActive: Date;
  requestCount: number;
  avgLatencyMs: number;
  model: string;
  provider: string;
}

export class BaseAgent {
  public id: string;
  public name: string;
  public role: string;
  protected model: string;
  protected provider: string;
  protected systemPrompt: string;
  protected memory: MemoryStore;
  protected tools: string[];
  protected channels: string[];
  protected voiceId?: string;
  protected schedule?: string;
  protected priority: number;

  private _status: 'ready' | 'busy' | 'error' | 'offline' = 'ready';
  private _lastActive: Date = new Date();
  private _requestCount: number = 0;
  private _totalLatency: number = 0;

  constructor(config: AgentConfig) {
    this.id = config.id;
    this.name = config.name;
    this.role = config.role;
    this.model = config.model;
    this.provider = config.provider;
    this.systemPrompt = config.systemPrompt;
    this.tools = config.tools || [];
    this.channels = config.channels || [];
    this.voiceId = config.voiceId;
    this.schedule = config.schedule;
    this.priority = config.priority || 5;
    this.memory = new MemoryStore(`./data/memory-${config.id}.db`);
  }

  async process(message: string, context?: Record<string, any>): Promise<string> {
    const startTime = Date.now();
    this._status = 'busy';
    this._requestCount++;

    try {
      // Security check
      const securityCheck = exfilGuard.scan(message);
      if (!securityCheck.safe) {
        return `⚠️ Security: Sensitive data detected. Types: ${securityCheck.findings.map(f => f.type).join(', ')}`;
      }

      // Retrieve relevant memories
      const memories = await this.memory.retrieve(message, this.id, 5);
      const memoryContext = memories.map(m => m.entry.content).join('\n');

      // Route through unified LLM provider (auto-fallback chain)
      let response: string;
      try {
        const result = await llmProvider.chat([
          { role: 'system', content: this.systemPrompt + (memoryContext ? '\n\nRecent context:\n' + memoryContext : '') },
          { role: 'user', content: message + (context ? `\n\nContext: ${JSON.stringify(context)}` : '') }
        ], {
          temperature: 0.7,
          maxTokens: 4096,
          agentId: this.id
        });
        response = result.content;
      } catch (error: any) {
        response = `[${this.name}] All inference providers unavailable: ${error.message}`;
      }

      // Store interaction in memory
      await this.memory.store({
        content: `User: ${message}\n${this.name}: ${response.slice(0, 500)}`,
        type: 'episodic',
        agentId: this.id,
        importance: 0.6,
        metadata: { ...context, timestamp: new Date().toISOString() }
      });

      // Publish event
      eventBus.publish({
        type: 'agent.response',
        source: this.id,
        payload: { message: message.slice(0, 100), responseLength: response.length },
        priority: 'low'
      });

      this._lastActive = new Date();
      this._status = 'ready';
      const latency = Date.now() - startTime;
      this._totalLatency += latency;

      return response;
    } catch (error) {
      this._status = 'error';
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      eventBus.publish({
        type: 'agent.error',
        source: this.id,
        payload: { error: errorMsg, message: message.slice(0, 100) },
        priority: 'high'
      });
      return `[${this.name}] Processing error: ${errorMsg}`;
    }
  }

  protected async processWithOllama(
    message: string,
    memoryContext: string,
    context?: Record<string, any>
  ): Promise<string> {
    const { Ollama } = await import('ollama');
    const ollama = new Ollama({ host: process.env.OLLAMA_HOST || 'http://localhost:11434' });

    const prompt = this.buildPrompt(message, memoryContext, context);
    const startTime = Date.now();

    try {
      const response = await ollama.generate({
        model: this.model,
        prompt,
        stream: false,
        options: { temperature: 0.7, num_ctx: 8192 }
      });

      costFooter.track({
        agentId: this.id,
        model: this.model,
        provider: 'local',
        inputTokens: Math.ceil(prompt.length / 4),
        outputTokens: Math.ceil(response.response.length / 4),
        operation: 'chat'
      });

      return response.response;
    } catch {
      return `[${this.name}] Ollama unavailable. Agent standing by for when inference is restored.`;
    }
  }

  protected async processWithClaude(
    message: string,
    memoryContext: string,
    context?: Record<string, any>
  ): Promise<string> {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return `[${this.name}] No API key configured. Set ANTHROPIC_API_KEY to enable cloud inference.`;
    }

    try {
      const { Anthropic } = await import('@anthropic-ai/sdk');
      const anthropic = new Anthropic({ apiKey });

      const response = await anthropic.messages.create({
        model: 'claude-3-haiku-20240307',
        max_tokens: 4096,
        system: this.systemPrompt + (memoryContext ? '\n\nRecent context:\n' + memoryContext : ''),
        messages: [{
          role: 'user',
          content: message + (context ? `\n\nContext: ${JSON.stringify(context)}` : '')
        }],
        temperature: 0.7
      });

      const text = response.content[0].type === 'text' ? response.content[0].text : '';

      costFooter.track({
        agentId: this.id,
        model: 'claude-3-haiku',
        provider: 'anthropic',
        inputTokens: response.usage?.input_tokens || 0,
        outputTokens: response.usage?.output_tokens || 0,
        operation: 'chat'
      });

      return text;
    } catch (error: any) {
      const errMsg = error?.message || 'Unknown error';
      console.error(`[${this.name}] Claude API error: ${errMsg}`);
      return `[${this.name}] Cloud inference error: ${errMsg}`;
    }
  }

  protected buildPrompt(message: string, memoryContext: string, context?: Record<string, any>): string {
    let prompt = this.systemPrompt + '\n\n';

    if (memoryContext) {
      prompt += `Recent context:\n${memoryContext}\n\n`;
    }

    prompt += `Current request: ${message}`;

    if (context) {
      prompt += `\n\nAdditional context: ${JSON.stringify(context)}`;
    }

    prompt += `\n\nRespond as ${this.name} (${this.role}):`;
    return prompt;
  }

  getStatus(): AgentStatus {
    return {
      id: this.id,
      name: this.name,
      role: this.role,
      status: this._status,
      lastActive: this._lastActive,
      requestCount: this._requestCount,
      avgLatencyMs: this._requestCount > 0 ? Math.round(this._totalLatency / this._requestCount) : 0,
      model: this.model,
      provider: this.provider
    };
  }

  async learn(content: string, importance: number = 0.5): Promise<void> {
    await this.memory.store({
      content,
      type: 'semantic',
      agentId: this.id,
      importance,
      metadata: { learnedAt: new Date().toISOString() }
    });
  }

  async sendTo(targetAgentId: string, message: string): Promise<void> {
    eventBus.sendMessage({
      from: this.id,
      to: targetAgentId,
      content: message,
      type: 'request'
    });
  }

  async broadcastUpdate(content: string): Promise<void> {
    eventBus.broadcast(this.id, content);
  }
}
