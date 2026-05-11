import { mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

export function scaffoldProject(slug: string, plan: string): string {
  const projectDir = join(process.cwd(), 'factory', 'projects', slug);
  if (existsSync(projectDir)) return projectDir;

  mkdirSync(join(projectDir, '.cursor'), { recursive: true });
  mkdirSync(join(projectDir, 'src'), { recursive: true });

  writeFileSync(join(projectDir, '.cursor', 'model-config.json'), JSON.stringify({
    model: 'ollama/qwen2.5-coder:7b',
    provider: 'ollama',
  }, null, 2));

  writeFileSync(join(projectDir, '.cursor', 'rules'), `You are a Skunk Works prototype builder for ${slug}.\nWrite clean, minimal code. No over-engineering.\nTypeScript strict mode. ESM modules only.\n`);

  writeFileSync(join(projectDir, 'package.json'), JSON.stringify({
    name: slug, version: '0.1.0', type: 'module', scripts: { start: 'node dist/index.js', build: 'tsc' },
  }, null, 2));

  writeFileSync(join(projectDir, 'PLAN.md'), `# ${slug}\n\n${plan}\n`);

  return projectDir;
}
