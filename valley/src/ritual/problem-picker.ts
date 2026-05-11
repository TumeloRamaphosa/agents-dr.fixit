import { readVaultFile } from '../core/vault.js';

interface Problem {
  title: string;
  slug: string;
  plan: string;
  score: number;
}

export async function pickProblems(count: number): Promise<Problem[]> {
  const indexContent = readVaultFile('proposals/INDEX.md');
  const problems: Problem[] = [];

  if (indexContent) {
    const lines = indexContent.split('\n').filter(l => l.startsWith('- '));
    for (const line of lines) {
      const parts = line.slice(2).split(' | ');
      problems.push({
        title: parts[0] || 'Untitled',
        slug: parts[0]?.toLowerCase().replace(/\s+/g, '-') || `prob-${problems.length}`,
        plan: parts[1] || '',
        score: Number(parts[2]) || 5,
      });
    }
  }

  problems.sort((a, b) => b.score - a.score);
  return problems.slice(0, count);
}
