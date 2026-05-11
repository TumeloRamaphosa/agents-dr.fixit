import { readVaultFile, writeVaultFile } from '../core/vault.js';
import { AgentRunner } from '../agents/runner.js';

export async function morningStandup(runner: AgentRunner): Promise<string> {
  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  
  const yesterdayReport = readVaultFile(`daily/${yesterday}.md`) || 'No previous report found.';
  const missionQueued = readVaultFile('proposals/INDEX.md') || 'No queued proposals.';
  
  const prompt = `Generate the morning standup for today (${today}).\n\nYesterday's report:\n${yesterdayReport}\n\nQueued proposals:\n${missionQueued}\n\nInclude:\n1. Yesterday's wins and misses\n2. Sales/social/costs delta\n3. Three priorities for today\n4. Tumelo-acknowledgment block`;

  const result = await runner.run('robusca', prompt);
  writeVaultFile(`daily/${today}.md`, result.content);
  return result.content;
}
