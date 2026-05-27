/**
 * Robusca Agent
 * Daily 08:00 SAST standup host
 * Greets you, coordinates all activities
 * 09:00 Board of Chiefs moderator
 */

import { BaseAgent } from '../core/agent-base.js';
import { costFooter } from '../core/cost-footer.js';

export class RobuscaAgent extends BaseAgent {
  constructor() {
    super({
      id: 'robusca',
      name: 'Robusca',
      model: 'qwen2.5:7b',
      provider: 'ollama',
      systemPrompt: `You are Robusca, the daily standup host for StudEx Valley OS.

Your personality: Warm, calm, South African English accent. You greet with energy and enthusiasm.

Your daily 08:00 SAST routine:
1. Warm greeting with today's date
2. Yesterday's wins - what did we accomplish?
3. Sales updates from StudEx stores
4. Social media performance and engagement
5. Content performance metrics
6. Cost analysis - how close to break-even
7. Today's plan and priorities

Keep responses conversational but structured. Use South African English expressions naturally.

When something goes wrong, be reassuring but honest. Always end with encouragement.

Format: Use emojis to make things visual. Keep paragraphs short and punchy.`
    });
  }
  
  /**
   * Run morning standup (08:00 SAST)
   */
  async runMorningStandup(context: {
    sales: any;
    social: any;
    costs: any;
    yesterdayTasks: string[];
  }): Promise<string> {
    const prompt = `Good morning! It's ${new Date().toLocaleDateString('en-ZA')}.

Generate today's standup update:

YESTERDAY:
${context.yesterdayTasks?.map(t => `- ${t}`).join('\n') || '- No recorded tasks'}

SALES:
- Revenue today: R${context.sales?.today || 0}
- Revenue yesterday: R${context.sales?.yesterday || 0}
- Break-even target: R${context.costs?.breakEven || 5000}

SOCIAL MEDIA:
- Instagram engagement: ${context.social?.instagram || 'N/A'}
- Twitter/X mentions: ${context.social?.twitter || 'N/A'}
- Content posted: ${context.social?.contentPosted || 0}

COSTS:
- Daily budget: $${context.costs?.dailyBudget || 3.4}
- Spent today: $${context.costs?.spent || 0}
- Status: ${context.costs?.onTrack ? 'On track' : 'Over budget'}

Generate an enthusiastic but professional standup report with greetings, updates, and motivation for today.`;

    return await this.process(prompt, context);
  }
  
  /**
   * Moderate Board of Chiefs meeting (09:00 SAST)
   */
  async moderateBoardMeeting(
    reports: Array<{ agent: string; report: string }>
  ): Promise<string> {
    const prompt = `You are moderating the 09:00 Board of Chiefs meeting for StudEx Valley OS.

Agents reporting in order:

${reports.map(r => `=== ${r.agent} ===\n${r.report}`).join('\n\n')}

As moderator:
1. Thank each agent for their report (30 seconds per agent)
2. Summarize key points
3. Identify any blockers or issues
4. Announce next steps
5. Close with encouragement

Keep it professional, efficient, and motivating. Total meeting should feel under 45 minutes.`;

    return await this.process(prompt);
  }
  
  /**
   * Day close report (23:00 SAST)
   */
  async runDayClose(metrics: {
    tokenSpend: number;
    agentRuntime: number;
    costToBreakeven: number;
  }): Promise<string> {
    const prompt = `Generate the day-close summary for StudEx Valley OS:

METRICS:
- Token spend today: ${metrics.tokenSpend}
- Total agent runtime: ${metrics.agentRuntime} hours
- Distance to break-even: R${metrics.costToBreakeven}

Write a concise but warm closing message acknowledging today's work, the costs, and setting up for tomorrow.`;

    return await this.process(prompt, metrics);
  }
  
  /**
   * Greeting for new conversation
   */
  async greet(userName?: string): Promise<string> {
    const hour = new Date().getHours();
    let greeting = 'Hello';
    
    if (hour < 12) greeting = 'Good morning';
    else if (hour < 17) greeting = 'Good afternoon';
    else greeting = 'Good evening';
    
    return `${greeting}${userName ? ` ${userName}` : ''}! 👋 I'm Robusca, your daily standup coordinator for StudEx Valley OS.

Here's what's on deck for today:
- 🕗 08:00 - Morning standup & yesterday's review
- 🕘 09:00 - Board of Chiefs meeting
- 📊 Throughout - Sales tracking, social monitoring, cost tracking
- 🕚 23:00 - Day close & tomorrows prep

How can I help you right now?`;
  }
}

// Export singleton
export const robusca = new RobuscaAgent();
