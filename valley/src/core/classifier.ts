/**
 * Classifier Core
 * Smart routing of messages to appropriate agents
 * Uses Claude for complex routing, local models for fast classification
 */

import { Anthropic } from '@anthropic-ai/sdk';
import { Ollama } from 'ollama';

export interface Message {
  id: string;
  content: string;
  channel: string;
  userId: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface ClassificationResult {
  agentId: string;
  confidence: number;
  reason: string;
  escalated: boolean;
}

export class Classifier {
  private anthropic: Anthropic | null = null;
  private ollama: Ollama;
  private localModel: string = 'qwen2.5:7b';
  
  constructor() {
    this.ollama = new Ollama({ host: 'http://localhost:11434' });
    
    // Only initialize Anthropic for escalated queries
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (apiKey) {
      this.anthropic = new Anthropic({ apiKey });
    }
  }
  
  async classify(message: Message): Promise<ClassificationResult> {
    const startTime = Date.now();
    
    // Fast local classification for common queries
    const fastResult = await this.fastClassify(message);
    
    if (fastResult.confidence > 0.85) {
      return { ...fastResult, escalated: false };
    }
    
    // Escalate to Claude for complex routing
    if (this.anthropic) {
      const claudeResult = await this.claudeClassify(message);
      return { ...claudeResult, escalated: true };
    }
    
    return { ...fastResult, escalated: false };
  }
  
  private async fastClassify(message: Message): Promise<Omit<ClassificationResult, 'escalated'>> {
    const prompt = `Classify this message to the best agent:

Message: "${message.content}"
Channel: ${message.channel}

Available agents:
- robusca: Daily standup, planning, general coordination
- cto: Infrastructure, technical issues, system status
- openclaw: Code, development, deployments, repos
- cashclaw: Sales, revenue, CRM, invoices, Stripe
- denchclaw: Customer relations, support, signups
- charlie: StudEx Meat customers specifically
- goose: Documentation, summaries, knowledge
- hermes: Deep research, analysis, complex thinking
- skunkworks: DevOps, Linear tickets, bugs, infrastructure
- clawx: Browser automation, scrapers, data extraction
- research: Trends, social media, new agents discovery
- drfixit: System health, repairs, monitoring

Respond ONLY with JSON: {"agentId": "name", "confidence": 0.0-1.0, "reason": "brief"}`;

    try {
      const response = await this.ollama.generate({
        model: this.localModel,
        prompt,
        stream: false,
        options: { temperature: 0.1 }
      });
      
      const result = JSON.parse(response.response);
      return {
        agentId: result.agentId,
        confidence: result.confidence,
        reason: result.reason
      };
    } catch (error) {
      console.error('Fast classification failed:', error);
      return {
        agentId: 'robusca',
        confidence: 0.5,
        reason: 'Fallback due to classification error'
      };
    }
  }
  
  private async claudeClassify(message: Message): Promise<Omit<ClassificationResult, 'escalated'>> {
    if (!this.anthropic) {
      throw new Error('Anthropic not initialized');
    }
    
    const response = await this.anthropic.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 150,
      temperature: 0,
      messages: [{
        role: 'user',
        content: `Route this message to the best agent. Available: robusca (standup), cto (infra), openclaw (code), cashclaw (sales), denchclaw (support), charlie (meat), goose (docs), hermes (research), skunkworks (devops), clawx (automation), research (trends), drfixit (health).

Message: "${message.content}"

Return JSON: {"agentId": "name", "confidence": 0.0-1.0, "reason": "why"}`
      }]
    });
    
    const text = response.content[0].type === 'text' ? response.content[0].text : '';
    const result = JSON.parse(text);
    
    return {
      agentId: result.agentId,
      confidence: result.confidence,
      reason: result.reason + ' [Claude routed]'
    };
  }
  
  // Cost tracking for routing decisions
  async getClassificationCost(): Promise<number> {
    // Track which routing path was used
    return 0.001; // Approximate cost placeholder
  }
}
