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
  
  constructor(dbPath: string = './data/memory.db') {
    this.db = new Database(dbPath);
    this.ollama = new Ollama({ host: 'http://localhost:11434' });
    this.initialize();
  }
  
  private initialize(): void {
    // Create tables with FTS5 for full-text search
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
      
      CREATE VIRTUAL TABLE IF NOT EXISTS memories_fts USING fts5(
        content,
        agent_id,
        content='memories',
        content_rowid='id'
      );
      
      CREATE INDEX IF NOT EXISTS idx_agent ON memories(agent_id);
      CREATE INDEX IF NOT EXISTS idx_type ON memories(type);
      CREATE INDEX IF NOT EXISTS idx_timestamp ON memories(timestamp);
      CREATE INDEX IF NOT EXISTS idx_importance ON memories(importance);
    `);
  }
  
  async store(entry: Omit<MemoryEntry, 'id' | 'embedding' | 'accessCount' | 'lastAccessed'>): Promise<string> {
    const id = crypto.randomUUID();
    const timestamp = new Date().toISOString();
    
    // Generate embedding if not provided
    let embedding: number[] | undefined;
    if (!entry.embedding) {
      try {
        const response = await this.ollama.embeddings({
          model: this.embeddingModel,
          prompt: entry.content
        });
        embedding = response.embedding;
      } catch (error) {
        console.error('Embedding generation failed:', error);
      }
    }
    
    // Store in database
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
    
    // Index for FTS
    this.db.prepare('INSERT INTO memories_fts(rowid, content, agent_id) VALUES (?, ?, ?)')
      .run(id, entry.content, entry.agentId);
    
    return id;
  }
  
  async retrieve(
    query: string,
    agentId?: string,
    limit: number = 10,
    minImportance: number = 0.3
  ): Promise<SearchResult[]> {
    // Hybrid search: combine embedding similarity + text search
    const embeddingResults = await this.queryByEmbedding(query, agentId, limit, minImportance);
    const textResults = this.queryByText(query, agentId, limit);
    
    // Merge and deduplicate
    const combined = new Map<string, SearchResult>();
    
    // Add embedding results with higher weight
    embeddingResults.forEach(r => {
      combined.set(r.entry.id, { ...r, score: r.score * 0.6 });
    });
    
    // Add text results
    textResults.forEach(r => {
      if (combined.has(r.entry.id)) {
        const existing = combined.get(r.entry.id)!;
        existing.score += r.score * 0.4;
        existing.matchType = 'hybrid';
      } else {
        combined.set(r.entry.id, { ...r, score: r.score * 0.4 });
      }
    });
    
    // Sort by score and update access patterns
    const results = Array.from(combined.values())
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
    
    // Update access counts
    results.forEach(r => this.incrementAccess(r.entry.id));
    
    return results;
  }
  
  private async queryByEmbedding(
    query: string,
    agentId?: string,
    limit: number = 10,
    minImportance: number = 0.3
  ): Promise<SearchResult[]> {
    try {
      const response = await this.ollama.embeddings({
        model: this.embeddingModel,
        prompt: query
      });
      const queryEmbedding = response.embedding;
      
      // Build SQL with cosine similarity
      let sql = `
        SELECT id, content, type, agent_id, user_id, timestamp,
               metadata, importance, embedding,
               (embedding MATCH ?) as similarity
        FROM memories
        WHERE importance >= ?
      `;
      
      const params: any[] = [
        Buffer.from(new Float32Array(queryEmbedding).buffer),
        minImportance
      ];
      
      if (agentId) {
        sql += ' AND agent_id = ?';
        params.push(agentId);
      }
      
      sql += ' ORDER BY similarity DESC LIMIT ?';
      params.push(limit);
      
      // Note: This uses a simplified approach. In production, use vector database
      const rows = this.db.prepare(sql).all(...params);
      
      return rows.map((row: any) => ({
        entry: this.rowToEntry(row),
        score: row.similarity || 0.5,
        matchType: 'embedding'
      }));
    } catch (error) {
      console.error('Embedding query failed:', error);
      return [];
    }
  }
  
  private queryByText(query: string, agentId?: string, limit: number = 10): SearchResult[] {
    let sql = `
      SELECT m.*
      FROM memories m
      JOIN memories_fts fts ON m.id = fts.rowid
      WHERE memories_fts MATCH ?
    `;
    
    const params: any[] = [query];
    
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
      matchType: 'text'
    }));
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
      embedding: row.embedding ? Array.from(new Float32Array(row.embedding.buffer)) : undefined,
      metadata: JSON.parse(row.metadata || '{}'),
      importance: row.importance,
      accessCount: row.access_count,
      lastAccessed: new Date(row.last_accessed)
    };
  }
  
  // Memory decay - forget low-importance memories
  applyDecay(): void {
    const monthAgo = new Date();
    monthAgo.setMonth(monthAgo.getMonth() - 1);
    
    this.db.prepare(`
      DELETE FROM memories
      WHERE last_accessed < ?
      AND importance < 0.3
      AND access_count < 3
    `).run(monthAgo.toISOString());
    
    // Clean up FTS
    this.db.exec('INSERT INTO memories_fts(memories_fts) VALUES(\'optimize\')');
  }
  
  // Get memory stats for dashboard
  getStats(): { total: number; byType: Record<string, number> } {
    const total = this.db.prepare('SELECT COUNT(*) as count FROM memories').get() as { count: number };
    
    const byType = this.db.prepare(`
      SELECT type, COUNT(*) as count
      FROM memories
      GROUP BY type
    `).all() as Array<{ type: string; count: number }>;
    
    return {
      total: total.count,
      byType: byType.reduce((acc, row) => {
        acc[row.type] = row.count;
        return acc;
      }, {} as Record<string, number>)
    };
  }
  
  close(): void {
    this.db.close();
  }
}
