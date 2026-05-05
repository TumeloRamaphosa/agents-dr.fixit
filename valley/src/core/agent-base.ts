/**
 * Base Agent Class
 * All agents extend this base
 */

import { MemoryStore } from './memory.js';
import { exfilGuard } from './exfil-guard.js';
import { costFooter } from './cost-footer.js';

export interface AgentConfig {
  id: string;
  name: string;
  model: string;
  provider: 'ollama' | 'anthropic';
  systemPrompt: string;
  tools?: string[];
}

export class BaseAgent {
  public id: string;
  public name: string;
  protected model: string;
  protected provider: string;
  protected systemPrompt: string;
  protected memory: MemoryStore;
  protected tools: string[];
  
  constructor(config: AgentConfig) {
    this.id = config.id;
    this.name = config.name;
    this.model = config.model;
    this.provider = config.provider;
    this.systemPrompt = config.systemPrompt;
    this.tools = config.tools || [];
    this.memory = new MemoryStore(`./data/memory-${config.id}.db`);
  }
  
  /**
   * Process a message and return a response
   */
  async process(message: string, context?: Record<string, any>): Promise<string> {
    // Security check
    const securityCheck = exfilGuard.scan(message);
    if (!securityCheck.safe) {
      return `⚠️ Security: Sensitive data detected in message. Please review.\nTypes: ${securityCheck.findings.map(f => f.type).join(', ')}`;
    }
    
    // Retrieve relevant memories
    const memories = await this.memory.retrieve(message, this.id, 5);
    const memoryContext = memories.map(m => m.entry.content).join('\n');
    
    // Process based on provider
    let response: string;
    
    if (this.provider === 'ollama' || costFooter.shouldUseLocal()) {
      response = await this.processWithOllama(message, memoryContext, context);
    } else {
      response = await this.processWithClaude(message, memoryContext, context);
    }
    
    // Store interaction in memory
    await this.memory.store({
      content: `User: ${message}\nAgent: ${response}`,
      type: 'episodic',
      agentId: this.id,
      importance: 0.7,
      metadata: { ...context, timestamp: new Date().toISOString() }
    });
    
    // Append cost footer
    return response + costFooter.generateFooter();
  }
  
  /**
   * Process with local Ollama
   */
  protected async processWithOllama(
    message: string, 
    memoryContext: string,
    context?: Record<string, any>
  ): Promise<string> {
    const { Ollama } = await import('ollama');
    const ollama = new Ollama({ host: 'http://localhost:11434' });
    
    const prompt = `${this.systemPrompt}

Previous context:
${memoryContext}

Current request: ${message}

${context ? `Additional context: ${JSON.stringify(context)}` : ''}

Respond as ${this.name}:`;
    
    const startTime = Date.now();
    
    try {
      const response = await ollama.generate({
        model: this.model,
        prompt,
        stream: false,
        options: {
          temperature: 0.7,
          num_ctx: 8192
        }
      });
      
      // Track cost (0 for local)
      costFooter.track({
        agentId: this.id,
        model: this.model,
        provider: 'local',
        inputTokens: prompt.length / 4, // Rough estimate
        outputTokens: response.response.length / 4,
        operation: 'chat'
      });
      
      return response.response;
    } catch (error) {
      console.error(`Ollama error for ${this.name}:`, error);
      return `[${this.name}] Error processing request. Please check if Ollama is running.`;
    }
  }
  
  /**
   * Process with Claude API
   */
  protected async processWithClaude(
    message: string,
    memoryContext: string,
    context?: Record<string, any>
  ): Promise<string> {
    try {
      const { Anthropic } = await import('@anthropic-ai/sdk');
      const anthropic = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY
      });
      
      const response = await anthropic.messages.create({
        model: 'claude-3-haiku-20240307',
        max_tokens: 4096,
        system: this.systemPrompt + '\n\nPrevious context:\n' + memoryContext,
        messages: [{
          role: 'user',
          content: message + (context ? `\n\nContext: ${JSON.stringify(context)}` : '')
        }],
        temperature: 0.7
      });
      
      const text = response.content[0].type === 'text' ? response.content[0].text : '';
      
      // Track cost
      costFooter.track({
        agentId: this.id,
        model: 'claude-3-haiku',
        provider: 'anthropic',
        inputTokens: response.usage?.input_tokens || 0,
        outputTokens: response.usage?.output_tokens || 0,
        operation: 'chat'
      });
      
      return text;
    } catch (error) {
      console.error(`Claude error for ${this.name}:`, error);
      return `[${this.name}] Claude processing failed. Falling back to local...`;
    }
  }
  
  /**
   * Get agent status
   */
  getStatus(): { id: string; name: string; status: string } {
    return {
      id: this.id,
      name: this.name,
      status: 'ready'
    };
  }
  
  /**
   * Store knowledge
   */
  async learn(content: string, importance: number = 0.5): Promise<void> {
    await this.memory.store({
      content,
      type: 'semantic',
      agentId: this.id,
      importance,
      metadata: { learnedAt: new Date().toISOString() }
    });
  }
}
