/**
 * Classifier Core
 * Smart routing of messages to appropriate agents
 * Uses the unified LLM provider for classification
 */

import { llmProvider } from './llm-provider.js';

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
  private keywordMap: Record<string, string[]> = {
    robusca: ['standup', 'morning', 'greeting', 'hello', 'plan', 'today', 'schedule'],
    cto: ['infrastructure', 'server', 'uptime', 'system', 'health', 'status', 'agents', 'technical'],
    openclaw: ['code', 'deploy', 'build', 'github', 'repo', 'pr', 'pull request', 'commit'],
    cashclaw: ['sales', 'revenue', 'invoice', 'stripe', 'payment', 'money', 'budget', 'cost'],
    denchclaw: ['customer', 'support', 'ticket', 'complaint', 'signup', 'whatsapp'],
    charlie: ['meat', 'beef', 'chicken', 'biltong', 'braai', 'order', 'delivery', 'halal'],
    goose: ['document', 'docs', 'summary', 'write', 'readme', 'knowledge'],
    hermes: ['research', 'analyze', 'strategy', 'deep', 'evaluate', 'investigate'],
    skunkworks: ['devops', 'bug', 'linear', 'deploy', 'ci', 'pipeline', 'alert'],
    clawx: ['scrape', 'browser', 'crawl', 'extract', 'automate'],
    research: ['trend', 'social', 'instagram', 'twitter', 'reddit', 'viral'],
    drfixit: ['health', 'heartbeat', 'restart', 'repair', 'monitor', 'down']
  };

  async classify(message: Message): Promise<ClassificationResult> {
    // Fast keyword-based classification first
    const keywordResult = this.keywordClassify(message.content);
    if (keywordResult.confidence > 0.7) {
      return { ...keywordResult, escalated: false };
    }

    // Try LLM classification for ambiguous messages
    try {
      const llmResult = await this.llmClassify(message);
      return { ...llmResult, escalated: true };
    } catch {
      // Fall back to keyword result
      return { ...keywordResult, escalated: false };
    }
  }

  private keywordClassify(content: string): Omit<ClassificationResult, 'escalated'> {
    const lower = content.toLowerCase();
    let bestAgent = 'robusca';
    let bestScore = 0;

    for (const [agentId, keywords] of Object.entries(this.keywordMap)) {
      const matches = keywords.filter(kw => lower.includes(kw)).length;
      const score = matches / keywords.length;
      if (score > bestScore) {
        bestScore = score;
        bestAgent = agentId;
      }
    }

    return {
      agentId: bestAgent,
      confidence: Math.min(bestScore * 3, 0.95) || 0.5,
      reason: bestScore > 0 ? 'Keyword match' : 'Default routing to Robusca'
    };
  }

  private async llmClassify(message: Message): Promise<Omit<ClassificationResult, 'escalated'>> {
    const result = await llmProvider.chat([
      {
        role: 'system',
        content: `You are a message router. Classify the user message to the best agent.
Available agents: robusca (standup/general), cto (infra/tech), openclaw (code), cashclaw (sales), denchclaw (support), charlie (meat products), goose (docs), hermes (research), skunkworks (devops), clawx (scraping), research (trends), drfixit (health monitoring).
Respond ONLY with JSON: {"agentId": "name", "confidence": 0.0-1.0, "reason": "brief"}`
      },
      { role: 'user', content: message.content }
    ], { temperature: 0.1, maxTokens: 100 });

    try {
      const jsonMatch = result.content.match(/\{[^}]+\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return { agentId: parsed.agentId, confidence: parsed.confidence, reason: parsed.reason };
      }
    } catch { /* fall through */ }

    return { agentId: 'robusca', confidence: 0.5, reason: 'LLM classification fallback' };
  }
}
