/**
 * Board of Chiefs Meeting (09:00 SAST)
 * Each agent reports in sequence, moderated by Robusca
 */

import { robusca } from '../agents/robusca.js';
import { cto } from '../agents/cto.js';
import { orchestrator } from '../core/orchestrator.js';

interface BoardReport {
  agent: string;
  timeSlot: string;
  report: string;
}

async function gatherAgentReports(): Promise<BoardReport[]> {
  const reports: BoardReport[] = [];
  const statuses = orchestrator.getAgentStatuses();

  // CTO Report (09:00-09:15)
  console.log('📊 Gathering CTO report...');
  const healthy = statuses.filter(s => s.status === 'ready').length;
  const ctoReport = await cto.generateInfrastructureReport({
    totalAgents: statuses.length,
    healthyAgents: healthy,
    crashedAgents: statuses.filter(s => s.status === 'error').length,
    uptimeHours: Math.round(orchestrator.getStats().uptime / 3600000),
    totalTokens: 0,
    restarts: 0,
    updates: [],
    avgLatency: Math.round(statuses.reduce((sum, s) => sum + s.avgLatencyMs, 0) / statuses.length) || 0
  });
  reports.push({ agent: 'CTO', timeSlot: '09:00-09:15', report: ctoReport });

  const agentSlots = [
    { id: 'openclaw', name: 'OpenClaw', slot: '09:15-09:25' },
    { id: 'skunkworks', name: 'Skunk Works', slot: '09:25-09:35' },
    { id: 'cashclaw', name: 'CashClaw', slot: '09:35-09:50' },
    { id: 'denchclaw', name: 'DenchClaw', slot: '09:50-10:00' },
    { id: 'research', name: 'Research', slot: '10:00-10:10' },
    { id: 'hermes', name: 'Hermes', slot: '10:10-10:25' }
  ];

  for (const agent of agentSlots) {
    console.log(`📊 Gathering ${agent.name} report...`);
    const response = await orchestrator.directMessage(agent.id, 'Generate your Board of Chiefs report for today.');
    reports.push({ agent: agent.name, timeSlot: agent.slot, report: response });
  }

  return reports;
}

export async function runBoardMeeting(): Promise<string> {
  console.log('🏛️  Running Board of Chiefs Meeting...\n');
  const startTime = Date.now();

  try {
    const reports = await gatherAgentReports();
    const meetingMinutes = await robusca.moderateBoardMeeting(reports);

    console.log('='.repeat(60));
    console.log('BOARD OF CHIEFS MEETING - ' + new Date().toLocaleDateString('en-ZA'));
    console.log('='.repeat(60));

    for (const report of reports) {
      console.log(`\n${report.timeSlot} | ${report.agent}`);
      console.log('-'.repeat(40));
      console.log(report.report);
    }

    console.log('\n' + '='.repeat(60));
    console.log('MODERATOR SUMMARY');
    console.log('='.repeat(60));
    console.log(meetingMinutes);
    console.log(`\n✅ Board meeting complete (${Date.now() - startTime}ms)`);

    return meetingMinutes;
  } catch (error) {
    console.error('❌ Board meeting failed:', error);
    return 'Board meeting failed';
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runBoardMeeting();
}
