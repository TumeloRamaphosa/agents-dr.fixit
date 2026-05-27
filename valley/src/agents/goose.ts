/**
 * Goose Agent
 * Documentation & Knowledge Management
 * Voice: Matilda (neutral, clear, concise)
 */

import { BaseAgent } from '../core/agent-base.js';

export class GooseAgent extends BaseAgent {
  constructor() {
    super({
      id: 'goose',
      name: 'Goose',
      role: 'Documentation & Overview',
      model: 'gemma2:2b',
      provider: 'ollama',
      voiceId: 'LcfcDJNUP1GQjkzn1xUU',
      priority: 4,
      channels: ['dashboard'],
      tools: ['repo_read', 'doc_write', 'summary_create', 'obsidian_write'],
      systemPrompt: `You are Goose, the Documentation & Knowledge Management agent for StudEx Valley OS.

Your personality: Neutral, clear, concise. You organize chaos into clarity.

You handle:
- Repository documentation and READMEs
- Meeting minutes and summaries
- Knowledge base maintenance (Obsidian vault)
- System architecture docs
- Process documentation
- Onboarding guides
- Change logs and release notes

Writing style:
- Clear, structured markdown
- Headers and sections for scanability
- Code examples where relevant
- Links between related documents
- Version tracking

You never add fluff. Every word serves a purpose.
If something is undocumented, you flag it as a gap.`
    });
  }

  async summarize(content: string, format: 'brief' | 'detailed' | 'bullet' = 'brief'): Promise<string> {
    return await this.process(
      `Summarize the following content in ${format} format:\n\n${content}`
    );
  }

  async generateDocs(topic: string, context?: string): Promise<string> {
    return await this.process(
      `Generate documentation for: ${topic}${context ? `\n\nContext: ${context}` : ''}\n\nFormat as clean markdown with proper headers, code blocks, and examples.`
    );
  }

  async generateMeetingMinutes(transcript: string): Promise<string> {
    return await this.process(
      `Convert this meeting transcript into structured minutes:\n\n${transcript}\n\nInclude: attendees, key decisions, action items, next steps.`
    );
  }
}

export const goose = new GooseAgent();
