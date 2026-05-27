/**
 * Memory v2
 * 5-layer retrieval: episodic, semantic, procedural, working, long-term
 * SQLite + 768-dim embeddings + FTS5 full-text search
 */

import Database from 'better-sqlite3';
import { Ollama } from 'ollama';
import * as crypto from 'crypto';

export interface MemoryEntry {
  id: string;
  content: string;
  type: 'episodic' | 'semantic' | 'procedural' | 'working' | 'long-term';
  agentId: string;
  userId?: string;
  timestamp: Date;
  embedding?: number[];
  metadata?: Record<string, any>;
  importance: number;
  accessCount: number;
  lastAccessed: Date;
}

export interface SearchResult {
  entry: MemoryEntry;
  score: number;
  matchType: 'embedding' | 'text' | 'hybrid';
}

export class MemoryStore {
  private db: Database.Database;
  private ollama: Ollama;
  private embeddingModel: string = 'nomic-embed-text';
  private ollamaAvailable: boolean = true;

  constructor(dbPath: string = './data/memory.db') {
    this.db = new Database(dbPath);
    this.ollama = new Ollama({ host: process.env.OLLAMA_HOST || 'http://localhost:11434' });
    this.initialize();
  }

  private initialize(): void {
    this.db.pragma('journal_mode = WAL');
    this.db.pragma('synchronous = NORMAL');

    this.db.exec(`
      CREATE TABLE IF NOT EXISTS memories (
        id TEXT PRIMARY KEY,
        content TEXT NOT NULL,
        type TEXT NOT NULL,
        agent_id TEXT NOT NULL,
        user_id TEXT,
        timestamp TEXT NOT NULL,
        embedding BLOB,
        metadata TEXT,
        importance REAL DEFAULT 0.5,
        access_count INTEGER DEFAULT 0,
        last_accessed TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_agent ON memories(agent_id);
      CREATE INDEX IF NOT EXISTS idx_type ON memories(type);
      CREATE INDEX IF NOT EXISTS idx_timestamp ON memories(timestamp);
      CREATE INDEX IF NOT EXISTS idx_importance ON memories(importance);
    `);

    // FTS5 table - separate creation to handle gracefully
    try {
      this.db.exec(`
        CREATE VIRTUAL TABLE IF NOT EXISTS memories_fts USING fts5(
          content,
          agent_id,
          content='memories',
          content_rowid='rowid'
        );
      `);
    } catch {
      // FTS5 may already exist with different schema, that's fine
    }
  }

  async store(entry: {
    content: string;
    type: MemoryEntry['type'];
    agentId: string;
    importance: number;
    userId?: string;
    metadata?: Record<string, any>;
  }): Promise<string> {
    const id = crypto.randomUUID();
    const timestamp = new Date().toISOString();

    let embedding: number[] | undefined;
    if (this.ollamaAvailable) {
      try {
        const response = await this.ollama.embeddings({
          model: this.embeddingModel,
          prompt: entry.content
        });
        embedding = response.embedding;
      } catch {
        this.ollamaAvailable = false;
      }
    }

    const stmt = this.db.prepare(`
      INSERT INTO memories (
        id, content, type, agent_id, user_id, timestamp,
        embedding, metadata, importance, access_count, last_accessed
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?)
    `);

    stmt.run(
      id,
      entry.content,
      entry.type,
      entry.agentId,
      entry.userId || null,
      timestamp,
      embedding ? Buffer.from(new Float32Array(embedding).buffer) : null,
      JSON.stringify(entry.metadata || {}),
      entry.importance,
      timestamp
    );

    // Index for FTS - sanitize input for FTS5 syntax
    try {
      this.db.prepare(
        'INSERT INTO memories_fts(rowid, content, agent_id) VALUES ((SELECT rowid FROM memories WHERE id = ?), ?, ?)'
      ).run(id, entry.content, entry.agentId);
    } catch {
      // FTS indexing is best-effort
    }

    return id;
  }

  async retrieve(
    query: string,
    agentId?: string,
    limit: number = 10,
    minImportance: number = 0.3
  ): Promise<SearchResult[]> {
    const textResults = this.queryByText(query, agentId, limit);
    const recentResults = this.queryRecent(agentId, limit);

    // Merge results
    const combined = new Map<string, SearchResult>();

    textResults.forEach(r => {
      combined.set(r.entry.id, { ...r, score: r.score * 0.7 });
    });

    recentResults.forEach(r => {
      if (combined.has(r.entry.id)) {
        const existing = combined.get(r.entry.id)!;
        existing.score += r.score * 0.3;
        existing.matchType = 'hybrid';
      } else {
        combined.set(r.entry.id, { ...r, score: r.score * 0.3 });
      }
    });

    const results = Array.from(combined.values())
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    results.forEach(r => this.incrementAccess(r.entry.id));

    return results;
  }

  private queryByText(query: string, agentId?: string, limit: number = 10): SearchResult[] {
    // Sanitize query for FTS5: escape special characters and wrap in quotes
    const sanitized = this.sanitizeFtsQuery(query);
    if (!sanitized) {
      return this.queryByLike(query, agentId, limit);
    }

    try {
      let sql = `
        SELECT m.*
        FROM memories m
        JOIN memories_fts fts ON m.rowid = fts.rowid
        WHERE memories_fts MATCH ?
      `;
      const params: any[] = [sanitized];

      if (agentId) {
        sql += ' AND m.agent_id = ?';
        params.push(agentId);
      }

      sql += ' ORDER BY rank LIMIT ?';
      params.push(limit);

      const rows = this.db.prepare(sql).all(...params);

      return rows.map((row: any, index: number) => ({
        entry: this.rowToEntry(row),
        score: 1.0 / (index + 1),
        matchType: 'text' as const
      }));
    } catch {
      return this.queryByLike(query, agentId, limit);
    }
  }

  private queryByLike(query: string, agentId?: string, limit: number = 10): SearchResult[] {
    const words = query.split(/\s+/).filter(w => w.length > 2).slice(0, 5);
    if (words.length === 0) return [];

    let sql = 'SELECT * FROM memories WHERE (';
    const conditions = words.map(() => 'content LIKE ?');
    sql += conditions.join(' OR ') + ')';

    const params: any[] = words.map(w => `%${w}%`);

    if (agentId) {
      sql += ' AND agent_id = ?';
      params.push(agentId);
    }

    sql += ' ORDER BY importance DESC, last_accessed DESC LIMIT ?';
    params.push(limit);

    const rows = this.db.prepare(sql).all(...params);
    return rows.map((row: any, index: number) => ({
      entry: this.rowToEntry(row),
      score: 0.5 / (index + 1),
      matchType: 'text' as const
    }));
  }

  private queryRecent(agentId?: string, limit: number = 5): SearchResult[] {
    let sql = 'SELECT * FROM memories WHERE importance >= 0.5';
    const params: any[] = [];

    if (agentId) {
      sql += ' AND agent_id = ?';
      params.push(agentId);
    }

    sql += ' ORDER BY timestamp DESC LIMIT ?';
    params.push(limit);

    const rows = this.db.prepare(sql).all(...params);
    return rows.map((row: any, index: number) => ({
      entry: this.rowToEntry(row),
      score: 0.8 / (index + 1),
      matchType: 'text' as const
    }));
  }

  private sanitizeFtsQuery(query: string): string | null {
    // Extract meaningful words, strip FTS5 special chars
    const words = query
      .replace(/[^a-zA-Z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 2);

    if (words.length === 0) return null;

    // Use OR operator for multiple words
    return words.map(w => `"${w}"`).join(' OR ');
  }

  private incrementAccess(id: string): void {
    this.db.prepare(`
      UPDATE memories
      SET access_count = access_count + 1,
          last_accessed = ?
      WHERE id = ?
    `).run(new Date().toISOString(), id);
  }

  private rowToEntry(row: any): MemoryEntry {
    return {
      id: row.id,
      content: row.content,
      type: row.type,
      agentId: row.agent_id,
      userId: row.user_id,
      timestamp: new Date(row.timestamp),
      metadata: JSON.parse(row.metadata || '{}'),
      importance: row.importance,
      accessCount: row.access_count,
      lastAccessed: new Date(row.last_accessed)
    };
  }

  applyDecay(): number {
    const monthAgo = new Date();
    monthAgo.setMonth(monthAgo.getMonth() - 1);

    const result = this.db.prepare(`
      DELETE FROM memories
      WHERE last_accessed < ?
      AND importance < 0.3
      AND access_count < 3
    `).run(monthAgo.toISOString());

    return result.changes;
  }

  getStats(): { total: number; byType: Record<string, number>; byAgent: Record<string, number> } {
    const total = this.db.prepare('SELECT COUNT(*) as count FROM memories').get() as { count: number };

    const byType = this.db.prepare(`
      SELECT type, COUNT(*) as count FROM memories GROUP BY type
    `).all() as Array<{ type: string; count: number }>;

    const byAgent = this.db.prepare(`
      SELECT agent_id, COUNT(*) as count FROM memories GROUP BY agent_id
    `).all() as Array<{ agent_id: string; count: number }>;

    return {
      total: total.count,
      byType: byType.reduce((acc, row) => { acc[row.type] = row.count; return acc; }, {} as Record<string, number>),
      byAgent: byAgent.reduce((acc, row) => { acc[row.agent_id] = row.count; return acc; }, {} as Record<string, number>)
    };
  }

  close(): void {
    this.db.close();
  }
}
