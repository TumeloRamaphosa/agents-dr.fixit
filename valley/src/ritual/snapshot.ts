import { writeVaultFile } from '../core/vault.js';
import { loadAllAgents } from '../agents/loader.js';

export function takeSnapshot(): Record<string, any> {
  const agents = loadAllAgents();
  return {
    timestamp: new Date().toISOString(),
    agents: agents.map(a => ({ codename: a.codename, role: a.role, status: 'available' })),
    mission: { queued: 0, running: 0, done: 0 },
    costs: { local_tokens: 0, claude_tokens: 0 },
  };
}

export function writeSnapshot(): string {
  const snapshot = takeSnapshot();
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const content = `# Snapshot — ${new Date().toISOString()}\n\n${JSON.stringify(snapshot, null, 2)}`;
  writeVaultFile(`daily/snapshot-${timestamp}.md`, content);
  return content;
}
