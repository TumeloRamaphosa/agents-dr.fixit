import { AgentRunner } from '../agents/runner.js';
import { TranscriptRecorder } from '../warroom/transcript.js';
import { getRosterForSession } from '../warroom/roster.js';
import { isEnabled } from '../core/kill-switches.js';

const MAX_SECONDS_PER_AGENT = 90;

export async function runCouncil(runner: AgentRunner, agents?: string[]): Promise<string> {
  if (!isEnabled('COUNCIL_ENABLED')) {
    return 'Council is disabled by kill switch.';
  }

  const roster = agents || getRosterForSession('council');
  const transcript = new TranscriptRecorder();
  const sessionId = `council-${Date.now()}`;
  transcript.startTranscript(sessionId, 'council');

  for (const codename of roster) {
    const prompt = `Council report for ${codename}. You have ${MAX_SECONDS_PER_AGENT} seconds. Give your update for the daily agent council.`;
    try {
      const result = await runner.run(codename, prompt);
      transcript.addEntry(sessionId, codename, result.content);
    } catch (err) {
      transcript.addEntry(sessionId, codename, `[Error: ${err}]`);
    }
  }

  return transcript.endTranscript(sessionId, 'council');
}
