import { readFileSync } from 'node:fs';
import { checkExfil } from '../core/exfil-guard.js';

const documents: Map<string, Array<{ filePath: string; agent: string; timestamp: Date }>> = new Map();

export function dropDocument(sessionId: string, filePath: string, agentCodename: string): void {
  const guard = checkExfil(filePath);
  if (!guard.allowed) throw new Error(`Exfil guard blocked: ${guard.reason}`);
  
  if (!documents.has(sessionId)) documents.set(sessionId, []);
  documents.get(sessionId)!.push({ filePath, agent: agentCodename, timestamp: new Date() });
}

export function getDocuments(sessionId: string): Array<{ filePath: string; agent: string; timestamp: Date }> {
  return documents.get(sessionId) || [];
}

export function readFile(filePath: string): string {
  const guard = checkExfil(filePath);
  if (!guard.allowed) throw new Error(`Exfil guard blocked: ${guard.reason}`);
  return readFileSync(filePath, 'utf-8');
}
