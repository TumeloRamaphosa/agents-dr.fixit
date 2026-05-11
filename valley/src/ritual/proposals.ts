import { writeVaultFile, readVaultFile, listVaultFiles } from '../core/vault.js';

export function createProposal(slug: string, title: string, content: string): string {
  const path = `proposals/${new Date().toISOString().slice(0, 10)}/${slug}/README.md`;
  const md = `# ${title}\n\n${content}\n`;
  writeVaultFile(path, md);
  return path;
}

export function listProposals(): string[] {
  return listVaultFiles('proposals');
}

export function getProposal(slug: string): string | null {
  const files = listVaultFiles('proposals');
  const match = files.find(f => f.includes(slug));
  if (!match) return null;
  return readVaultFile(`proposals/${match}`);
}
