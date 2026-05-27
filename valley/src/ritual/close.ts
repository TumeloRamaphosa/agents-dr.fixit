/**
 * Day Close Ritual (23:00 SAST)
 * Summary of token spend, agent runtime, cost-to-break-even
 */

import { robusca } from '../agents/robusca.js';
import { costFooter } from '../core/cost-footer.js';
import { orchestrator } from '../core/orchestrator.js';

export async function runDayClose(): Promise<string> {
  console.log('🌙 Running Day Close Ritual...\n');
  const startTime = Date.now();

  try {
    const stats = orchestrator.getStats();
    const costReport = costFooter.getDailyReport();

    const metrics = {
      tokenSpend: costFooter.getBudgetStatus().dailySpent,
      agentRuntime: Math.round(stats.uptime / 3600000),
      costToBreakeven: 5000
    };

    const closeReport = await robusca.runDayClose(metrics);

    console.log('='.repeat(60));
    console.log('DAY CLOSE - ' + new Date().toLocaleDateString('en-ZA'));
    console.log('='.repeat(60));
    console.log('\n📊 Financial Summary:\n' + costReport);
    console.log('\n📝 Robusca Report:\n' + closeReport);
    console.log('='.repeat(60));
    console.log(`\n✅ Day close ritual complete (${Date.now() - startTime}ms)`);

    return closeReport;
  } catch (error) {
    console.error('❌ Day close failed:', error);
    return 'Day close failed';
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runDayClose();
}
