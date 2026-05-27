/**
 * Morning Ritual (08:00 SAST)
 * Daily standup - Yesterday's wins, sales, social, costs, today's plan
 */

import { robusca } from '../agents/robusca.js';
import { costFooter } from '../core/cost-footer.js';
import fs from 'fs/promises';
import path from 'path';

export async function runMorningRitual(): Promise<string> {
  console.log('🌅 Running Morning Standup Ritual...\n');
  const startTime = Date.now();

  try {
    const context = {
      sales: { today: 0, yesterday: 0, thisWeek: 0 },
      social: { instagram: 'N/A', twitter: 'N/A', contentPosted: 0 },
      costs: costFooter.getBudgetStatus(),
      yesterdayTasks: []
    };

    const report = await robusca.runMorningStandup(context);

    console.log('='.repeat(60));
    console.log('DAILY STANDUP - ' + new Date().toLocaleDateString('en-ZA'));
    console.log('='.repeat(60));
    console.log(report);
    console.log('='.repeat(60));
    console.log(`\n✅ Morning ritual complete (${Date.now() - startTime}ms)`);

    return report;
  } catch (error) {
    console.error('❌ Morning ritual failed:', error);
    return 'Morning ritual failed';
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runMorningRitual();
}
