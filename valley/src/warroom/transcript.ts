import { writeVaultFile } from '../core/vault.js';

export interface TranscriptEntry {
  agent: string;
  message: string;
  timestamp: Date;
}

const transcripts: Map<string, TranscriptEntry[]> = new Map();

export class TranscriptRecorder {
  startTranscript(sessionId: string, type: string): void {
    transcripts.set(sessionId, []);
  }

  addEntry(sessionId: string, agent: string, message: string): void {
    const entries = transcripts.get(sessionId) || [];
    entries.push({ agent, message, timestamp: new Date() });
    transcripts.set(sessionId, entries);
  }

  endTranscript(sessionId: string, type: string): string {
    const entries = transcripts.get(sessionId) || [];
    const date = new Date().toISOString().slice(0, 10);
    const lines = entries.map(e => `**${e.agent}** (${e.timestamp.toISOString()}): ${e.message}`);
    const content = `# ${type} Transcript — ${date}\n\n${lines.join('\n\n')}`;
    writeVaultFile(`meetings/${date}-${type}.md`, content);
    transcripts.delete(sessionId);
    return content;
  }

  getTranscript(sessionId: string): TranscriptEntry[] {
    return transcripts.get(sessionId) || [];
  }
}
