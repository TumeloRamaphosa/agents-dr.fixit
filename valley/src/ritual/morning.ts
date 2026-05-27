/**
 * Morning Ritual (08:00 SAST)
 * Daily standup - Yesterday's wins, sales, social, costs, today's plan
 */

import { robusca } from '../agents/robusca.js';
import fs from 'fs/promises';
import path from 'path';

interface MorningContext {
  sales: {
    today: number;
    yesterday: number;
    thisWeek: number;
    studexMeat: number;
    studexCoffee: number;
    studexWheat: number;
  };
  social: {
    instagram: { followers: number; engagement: string; posts: number };
    twitter: { mentions: number; engagement: string };
    overallSentiment: string;
  };
  costs: {
    dailyBudget: number;
    spent: number;
    onTrack: boolean;
    breakEven: number;
  };
  content: {
    postedYesterday: number;
    scheduledToday: number;
    'top performer': string;
  };
  yesterdayTasks: string[];
}

async function loadContext(): Promise<MorningContext> {
  // Try to load from cache/context
  const contextPath = path.join(process.cwd(), 'data', 'context.json');
  try {
    const data = await fs.readFile(contextPath, 'utf-8');
    return JSON.parse(data);
  } catch {
    // Return defaults if no context
    return {
      sales: { today: 0, yesterday: 0, thisWeek: 0, studexMeat: 0, studexCoffee: 0, studexWheat: 0 },
      social: { instagram: { followers: 0, engagement: 'N/A', posts: 0 }, twitter: { mentions: 0, engagement: 'N/A' }, overallSentiment: 'neutral' },
      costs: { dailyBudget: 3.4, spent: 0, onTrack: true, breakEven: 5000 },
      content: { postedYesterday: 0, scheduledToday: 0, 'top performer': 'N/A' },
      yesterdayTasks: []
    };
  }
}

export async function runMorningRitual(): Promise<void> {
  console.log('🌅 Running Morning Standup Ritual...\n');
  const startTime = Date.now();
  
  try {
    // Load context
    const context = await loadContext();
    
    // Generate report
    const report = await robusca.runMorningStandup(context);
    
    // Output
    console.log('='.repeat(60));
    console.log('DAILY STANDUP - ' + new Date().toLocaleDateString('en-ZA'));
    console.log('='.repeat(60));
    console.log(report);
    console.log('='.repeat(60));
    
    // Save to Obsidian
    const date = new Date().toISOString().split('T')[0];
    const obsidianPath = path.join(process.env.HOME || '', 'agents-dr.fixit', 'dr-fixit', 'obsidian', 'Daily-Notes', `${date}-Morning-Standup.md`);
    
    await fs.mkdir(path.dirname(obsidianPath), { recursive: true });
    await fs.writeFile(obsidianPath, `# Morning Standup: ${date}\n\n${report}\n\n*Generated: ${new Date().toISOString()}*`);
    
    // Send notification
    if (process.platform === 'darwin') {
      const { exec } = await import('child_process');
      exec(`osascript -e 'display notification "Morning standup complete" with title "Valley OS"'`);
    }
    
    console.log(`\n✅ Morning ritual complete (${Date.now() - startTime}ms)`);
    
  } catch (error) {
    console.error('❌ Morning ritual failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runMorningRitual();
}
