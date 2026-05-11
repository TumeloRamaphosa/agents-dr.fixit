import Database from 'better-sqlite3';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const SCHEMA_PATH = join(fileURLToPath(import.meta.url), '..', 'memory.schema.sql');

export interface MemoryEntry {
  id?: number;
  agent: string;
  role: string;
  content: string;
  salience: number;
  pinned: boolean;
  created_at?: string;
  correlation_id?: string;
}

export class MemoryStore {
  private db: Database.Database;

  constructor(dbPath?: string) {
    const path = dbPath || ':memory:';
    this.db = new Database(path);
    this.db.pragma('journal_mode = WAL');
    this.db.pragma('foreign_keys = ON');
    this.initialize();
  }

  private initialize(): void {
    const schema = readFileSync(SCHEMA_PATH, 'utf-8');
    this.db.exec(schema);
  }

  store(entry: Omit<MemoryEntry, 'id' | 'created_at'>): number {
    const result = this.db.prepare(
      `INSERT INTO memories (agent, role, content, salience, pinned, correlation_id) VALUES (?, ?, ?, ?, ?, ?)`
    ).run(entry.agent, entry.role, entry.content, entry.salience, entry.pinned ? 1 : 0, entry.correlation_id || null);

    // Update FTS
    this.db.prepare(
      `INSERT INTO memories_fts (rowid, content) VALUES (?, ?)`
    ).run(result.lastInsertRowid as number, entry.content);

    return result.lastInsertRowid as number;
  }

  recall(query: string, agent?: string, limit: number = 10): MemoryEntry[] {
    let sql = `SELECT m.* FROM memories m
      JOIN memories_fts f ON m.id = f.rowid
      WHERE memories_fts MATCH ?`;
    const params: any[] = [query];

    if (agent) {
      sql += ` AND m.agent = ?`;
      params.push(agent);
    }

    sql += ` ORDER BY m.salience DESC, m.created_at DESC LIMIT ?`;
    params.push(limit);

    const rows = this.db.prepare(sql).all(...params) as any[];
    return rows.map(r => ({ ...r, pinned: Boolean(r.pinned) }));
  }

  recent(agent: string, limit: number = 20): MemoryEntry[] {
    const rows = this.db.prepare(
      `SELECT * FROM memories WHERE agent = ? ORDER BY created_at DESC LIMIT ?`
    ).all(agent, limit) as any[];
    return rows.map(r => ({ ...r, pinned: Boolean(r.pinned) }));
  }

  pin(id: number): void {
    this.db.prepare(`UPDATE memories SET pinned = 1 WHERE id = ?`).run(id);
  }

  unpin(id: number): void {
    this.db.prepare(`UPDATE memories SET pinned = 0 WHERE id = ?`).run(id);
  }

  prune(daysOld: number = 90): number {
    const cutoff = new Date(Date.now() - daysOld * 86400000).toISOString();
    const result = this.db.prepare(
      `DELETE FROM memories WHERE pinned = 0 AND created_at < ?`
    ).run(cutoff);
    return result.changes;
  }

  close(): void {
    this.db.close();
  }

  getDatabase(): Database.Database {
    return this.db;
  }
}