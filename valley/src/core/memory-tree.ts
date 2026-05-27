/**
 * Memory Tree
 * OpenHuman-inspired hierarchical knowledge base
 * Stores knowledge as markdown files in a tree structure
 * Sources → Topics → Daily summaries
 */

import fs from 'fs/promises';
import path from 'path';
import { llmProvider } from './llm-provider.js';
import { eventBus } from './event-bus.js';

export interface TreeNode {
  path: string;
  title: string;
  type: 'source' | 'topic' | 'daily' | 'agent' | 'file';
  children?: TreeNode[];
  content?: string;
  updatedAt?: Date;
  tokenCount?: number;
}

const TREE_ROOT = process.env.MEMORY_TREE_PATH || './data/memory-tree';

class MemoryTree {
  private root: string;

  constructor() {
    this.root = TREE_ROOT;
    this.ensureStructure();
  }

  private async ensureStructure(): Promise<void> {
    const dirs = [
      this.root,
      path.join(this.root, 'sources'),
      path.join(this.root, 'topics'),
      path.join(this.root, 'daily'),
      path.join(this.root, 'agents'),
    ];
    for (const dir of dirs) {
      await fs.mkdir(dir, { recursive: true }).catch(() => {});
    }
  }

  async store(category: string, title: string, content: string, metadata?: Record<string, any>): Promise<string> {
    await this.ensureStructure();
    const sanitizedTitle = title.replace(/[^a-zA-Z0-9-_ ]/g, '').replace(/\s+/g, '-').toLowerCase();
    const filePath = path.join(this.root, category, `${sanitizedTitle}.md`);

    const frontmatter = [
      '---',
      `title: "${title}"`,
      `category: ${category}`,
      `created: ${new Date().toISOString()}`,
      `updated: ${new Date().toISOString()}`,
      `tokens: ${Math.ceil(content.length / 4)}`,
      ...(metadata ? Object.entries(metadata).map(([k, v]) => `${k}: ${JSON.stringify(v)}`) : []),
      '---',
      '',
    ].join('\n');

    await fs.writeFile(filePath, frontmatter + content);

    eventBus.publish({
      type: 'memory-tree.stored',
      source: 'memory-tree',
      payload: { category, title, path: filePath, tokens: Math.ceil(content.length / 4) },
      priority: 'low'
    });

    return filePath;
  }

  async storeDailySummary(agentId: string, summary: string): Promise<string> {
    const date = new Date().toISOString().split('T')[0];
    return this.store('daily', `${date}-${agentId}`, summary, { agent: agentId, date });
  }

  async storeAgentKnowledge(agentId: string, topic: string, content: string): Promise<string> {
    return this.store('agents', `${agentId}-${topic}`, content, { agent: agentId, topic });
  }

  async getTree(): Promise<TreeNode[]> {
    await this.ensureStructure();
    const categories = ['sources', 'topics', 'daily', 'agents'];
    const tree: TreeNode[] = [];

    for (const cat of categories) {
      const catPath = path.join(this.root, cat);
      try {
        const files = await fs.readdir(catPath);
        const children: TreeNode[] = [];

        for (const file of files.filter(f => f.endsWith('.md'))) {
          const filePath = path.join(catPath, file);
          const stat = await fs.stat(filePath);
          children.push({
            path: `${cat}/${file}`,
            title: file.replace('.md', '').replace(/-/g, ' '),
            type: 'file',
            updatedAt: stat.mtime,
            tokenCount: Math.ceil(stat.size / 4)
          });
        }

        tree.push({
          path: cat,
          title: cat.charAt(0).toUpperCase() + cat.slice(1),
          type: cat as any,
          children: children.sort((a, b) => (b.updatedAt?.getTime() || 0) - (a.updatedAt?.getTime() || 0))
        });
      } catch { /* directory may not exist yet */ }
    }

    return tree;
  }

  async getFile(relativePath: string): Promise<string | null> {
    try {
      const fullPath = path.join(this.root, relativePath);
      return await fs.readFile(fullPath, 'utf-8');
    } catch {
      return null;
    }
  }

  async summarize(content: string, maxTokens: number = 500): Promise<string> {
    try {
      const result = await llmProvider.chat([
        { role: 'system', content: 'Summarize the following content concisely. Preserve key facts, numbers, and actionable items.' },
        { role: 'user', content: content.slice(0, 8000) }
      ], { maxTokens, temperature: 0.3 });
      return result.content;
    } catch {
      return content.slice(0, maxTokens * 4);
    }
  }

  async search(query: string): Promise<Array<{ path: string; title: string; snippet: string }>> {
    const results: Array<{ path: string; title: string; snippet: string }> = [];
    const categories = ['sources', 'topics', 'daily', 'agents'];
    const lowerQuery = query.toLowerCase();

    for (const cat of categories) {
      const catPath = path.join(this.root, cat);
      try {
        const files = await fs.readdir(catPath);
        for (const file of files.filter(f => f.endsWith('.md'))) {
          const content = await fs.readFile(path.join(catPath, file), 'utf-8');
          if (content.toLowerCase().includes(lowerQuery)) {
            const idx = content.toLowerCase().indexOf(lowerQuery);
            results.push({
              path: `${cat}/${file}`,
              title: file.replace('.md', '').replace(/-/g, ' '),
              snippet: content.slice(Math.max(0, idx - 50), idx + 150)
            });
          }
        }
      } catch { /* ignore */ }
    }

    return results;
  }

  getStats(): { totalFiles: number; categories: Record<string, number> } {
    return { totalFiles: 0, categories: {} };
  }
}

export const memoryTree = new MemoryTree();
