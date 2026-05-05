/**
 * Day Close Ritual (23:00 SAST)
 * Summary of token spend, agent runtime, cost-to-break-even
 */

import { robusca } from '../agents/robusca.js';
import { costFooter } from '../core/cost-footer.js';
import fs from 'fs/promises';
import path from 'path';

interface DayMetrics {
  tokenSpend: number;
  agentRuntime: number;
  costToBreakeven: number;
  totalRevenue: number;
  profitLoss: number;
}

async function gatherDayMetrics(): Promise<DayMetrics> {
  const costReport = costFooter.getDailyReport();
  
  // Parse from cost report or fetch from metrics
  return {
    tokenSpend: 0, // Would come from actual tracking
    agentRuntime: 16, // Hours
    costToBreakeven: 5000, // ZAR
    totalRevenue: 0,
    profitLoss: -5000
  };
}

export async function runDayClose(): Promise<void> {
  console.log('🌙 Running Day Close Ritual...\n');
  const startTime = Date.now();
  
  try {
    // Gather metrics
    const metrics = await gatherDayMetrics();
    
    // Get cost report
    const costReport = costFooter.getDailyReport();
    
    // Generate day close
    const closeReport = await robusca.runDayClose(metrics);
    
    // Output
    console.log('='.repeat(60));
    console.log('DAY CLOSE - ' + new Date().toLocaleDateString('en-ZA'));
    console.log('23:00 SAST');
    console.log('='.repeat(60));
    console.log('\n📊 Financial Summary:\n' + costReport);
    console.log('\n📝 Robusca Report:\n' + closeReport);
    console.log('='.repeat(60));
    
    // Save to Obsidian
    const date = new Date().toISOString().split('T')[0];
    const obsidianPath = path.join(
      process.env.HOME || '',
      'agents-dr.fixit', 'dr-fixit', 'obsidian', 'Daily-Notes', 
      `${date}-Day-Close.md`
    );
    
    const markdown = `# Day Close: ${date}

**Time**: 23:00 SAST  
**Agent**: Robusca

## Financial Summary

\`\`\`
${costReport}
\`\`\`

## Daily Report

${closeReport}

*Closed: ${new Date().toISOString()}*`;
    
    await fs.mkdir(path.dirname(obsidianPath), { recursive: true });
    await fs.writeFile(obsidianPath, markdown);
    
    // Notification
    if (process.platform === 'darwin') {
      const { exec } = await import('child_process');
      exec(`osascript -e 'display notification "Day close complete" with title "Valley OS"'`);
    }
    
    console.log(`\n✅ Day close ritual complete (${Date.now() - startTime}ms)`);
    
  } catch (error) {
    console.error('❌ Day close failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runDayClose();
}
