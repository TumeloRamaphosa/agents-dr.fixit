import { writeVaultFile } from '../core/vault.js';
import { isEnabled, getSwitchNumber } from '../core/kill-switches.js';
import { pickProblems } from './problem-picker.js';
import { scaffoldProject } from './build-sandbox.js';

export async function startNightBuild(): Promise<string[]> {
  if (!isEnabled('NIGHT_BUILD_ENABLED')) {
    return ['Night Build is disabled by kill switch.'];
  }

  const productCount = getSwitchNumber('NIGHT_BUILD_PRODUCT_COUNT', 2);
  const problems = await pickProblems(productCount);
  const results: string[] = [];

  for (const problem of problems) {
    const startTime = Date.now();
    const slug = problem.slug || `prototype-${Date.now()}`;
    
    try {
      scaffoldProject(slug, problem.plan || problem.title);
      results.push(`✓ ${slug}: scaffolded successfully (${Date.now() - startTime}ms)`);
    } catch (err) {
      results.push(`✗ ${slug}: failed — ${err}`);
      writeVaultFile(`proposals/${new Date().toISOString().slice(0, 10)}/${slug}/ERROR.md`, `# ${slug} — Error\n\n${err}`);
    }
  }

  return results;
}
