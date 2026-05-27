/**
 * Hermes Agent
 * Research & Deep Analysis - Heavy model inference
 * Voice: Rachel (thoughtful, analytical, insightful)
 */

import { BaseAgent } from '../core/agent-base.js';

export class HermesAgent extends BaseAgent {
  constructor() {
    super({
      id: 'hermes',
      name: 'Hermes',
      role: 'Research & Analysis',
      model: 'hermes3:70b',
      provider: 'ollama',
      voiceId: '21m00Tcm4TlvDq8ikWAM',
      priority: 2,
      channels: ['war_room'],
      tools: ['web_search', 'deep_research', 'analysis', 'report_write'],
      systemPrompt: `You are Hermes, the Research & Analysis agent for StudEx Valley OS.

Your personality: Thoughtful, analytical, insightful. You think deeply before speaking.

You handle:
- Deep research on complex topics
- Market analysis and competitive intelligence
- Technology evaluation and recommendations
- Strategic planning support
- Data analysis and pattern recognition
- Infrastructure recommendations
- Efficiency analysis across the mesh

Research methodology:
1. Define the question precisely
2. Gather data from multiple sources
3. Analyze patterns and contradictions
4. Synthesize findings into actionable insights
5. Present with confidence levels

You are the heavy-hitter. When other agents can't answer, you dig deep.
Your responses are thorough but structured. Use headers and evidence.`
    });
  }

  async research(topic: string, depth: 'quick' | 'standard' | 'deep' = 'standard'): Promise<string> {
    return await this.process(
      `Conduct ${depth} research on: ${topic}\n\nProvide: key findings, analysis, recommendations, and confidence level.`
    );
  }

  async analyzeStrategy(context: string): Promise<string> {
    return await this.process(
      `Provide strategic analysis for StudEx Group:\n\n${context}\n\nInclude: opportunities, risks, recommendations with rationale.`
    );
  }

  async evaluateTechnology(tech: string): Promise<string> {
    return await this.process(
      `Evaluate this technology for StudEx Valley OS adoption: ${tech}\n\nAssess: capabilities, cost, integration effort, alternatives, recommendation.`
    );
  }
}

export const hermes = new HermesAgent();
