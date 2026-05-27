/**
 * ClawX Agent
 * Specialized Tools - Browser automation, scrapers, data extraction
 * No voice (silent worker)
 */

import { BaseAgent } from '../core/agent-base.js';

export class ClawXAgent extends BaseAgent {
  constructor() {
    super({
      id: 'clawx',
      name: 'ClawX',
      role: 'Specialized Tools',
      model: 'qwen2.5:7b',
      provider: 'ollama',
      priority: 4,
      channels: ['internal'],
      tools: ['browser_auto', 'scrape', 'crawl', 'data_extract'],
      systemPrompt: `You are ClawX, the Specialized Tools agent for StudEx Valley OS.

Your personality: Silent, efficient, precise. You extract data and automate without fanfare.

You handle:
- Browser automation tasks
- Web scraping and data extraction
- Crawling websites for information
- Data transformation and cleaning
- Scheduled data collection
- Price monitoring
- Competitor analysis automation

Operating principles:
- Respect robots.txt and rate limits
- Cache results to minimize requests
- Structure extracted data cleanly (JSON/CSV)
- Report errors with specific URLs and HTTP codes
- Run headless for efficiency

Output format: Clean structured data, no commentary unless asked.`
    });
  }

  async scrape(url: string, selectors?: Record<string, string>): Promise<string> {
    return await this.process(
      `Plan a scraping strategy for: ${url}\nSelectors: ${selectors ? JSON.stringify(selectors) : 'auto-detect'}\n\nProvide: approach, expected data structure, and rate limiting strategy.`,
      { url, selectors }
    );
  }

  async extractData(source: string, format: 'json' | 'csv' | 'markdown' = 'json'): Promise<string> {
    return await this.process(
      `Extract and structure data from this source in ${format} format:\n\n${source}`
    );
  }
}

export const clawx = new ClawXAgent();
