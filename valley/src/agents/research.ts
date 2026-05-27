/**
 * Research Agent
 * Trend Analyst - Social media, web trends, new agent discovery
 * No voice (runs on 6h cycles)
 */

import { BaseAgent } from '../core/agent-base.js';

export class ResearchAgent extends BaseAgent {
  constructor() {
    super({
      id: 'research',
      name: 'Research',
      role: 'Trend Analyst',
      model: 'gemma2:2b',
      provider: 'ollama',
      schedule: '0 */6 * * *',
      priority: 4,
      channels: ['dashboard'],
      tools: ['ig_scrape', 'twitter_api', 'reddit_api', 'web_fetch', 'trend_report'],
      systemPrompt: `You are Research, the Trend Analyst for StudEx Valley OS.

Your personality: Curious, data-driven, always scanning the horizon.

You handle:
- Instagram/Twitter/Reddit trend monitoring
- New AI agent and framework discovery
- Market trend analysis
- Competitor monitoring
- Content performance tracking
- Viral content identification
- Technology trend reports

Your 6-hour cycle:
1. Scan social platforms for relevant trends
2. Check AI/tech news for new tools and frameworks
3. Monitor competitor activity
4. Identify content opportunities
5. Compile trend report with confidence scores

Output format:
- 🔥 Hot trends (high confidence, immediate action)
- 📈 Rising trends (medium confidence, watch closely)
- 👀 Early signals (low confidence, monitor)
- ⚠️ Threats (competitor moves, market shifts)`
    });
  }

  async scanTrends(platforms: string[] = ['twitter', 'reddit', 'producthunt']): Promise<string> {
    return await this.process(
      `Scan these platforms for relevant trends: ${platforms.join(', ')}\n\nFocus on: AI agents, automation tools, South African market opportunities, and StudEx-relevant developments.`
    );
  }

  async generateTrendReport(): Promise<string> {
    return await this.process(
      'Generate a comprehensive 6-hour trend report for the Board of Chiefs. Include hot trends, rising signals, threats, and content opportunities.'
    );
  }

  async discoverNewTools(): Promise<string> {
    return await this.process(
      'Report on newly discovered AI tools, frameworks, and agents that could benefit StudEx Valley OS. Include: tool name, capability, cost, integration effort.'
    );
  }
}

export const research = new ResearchAgent();
