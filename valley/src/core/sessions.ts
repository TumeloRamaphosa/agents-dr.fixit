/**
 * Session Manager
 * Persistent conversation sessions per agent
 * Inspired by OpenHuman's session persistence + Hermes Workspace multi-session
 */

import Database from 'better-sqlite3';
import { eventBus } from './event-bus.js';

export interface Session {
  id: string;
  agentId: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
  messageCount: number;
  metadata?: Record<string, any>;
}

export interface SessionMessage {
  id: string;
  sessionId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

class SessionManager {
  private db: Database.Database;

  constructor() {
    this.db = new Database('./data/sessions.db');
    this.initialize();
  }

  private initialize(): void {
    this.db.pragma('journal_mode = WAL');
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY,
        agent_id TEXT NOT NULL,
        title TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        message_count INTEGER DEFAULT 0,
        metadata TEXT
      );
      CREATE TABLE IF NOT EXISTS messages (
        id TEXT PRIMARY KEY,
        session_id TEXT NOT NULL,
        role TEXT NOT NULL,
        content TEXT NOT NULL,
        timestamp TEXT NOT NULL,
        metadata TEXT,
        FOREIGN KEY (session_id) REFERENCES sessions(id)
      );
      CREATE INDEX IF NOT EXISTS idx_session_agent ON sessions(agent_id);
      CREATE INDEX IF NOT EXISTS idx_msg_session ON messages(session_id);
      CREATE INDEX IF NOT EXISTS idx_msg_time ON messages(timestamp);
    `);
  }

  createSession(agentId: string, title?: string): Session {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const sessionTitle = title || `Session ${new Date().toLocaleString('en-ZA')}`;

    this.db.prepare(`
      INSERT INTO sessions (id, agent_id, title, created_at, updated_at, message_count)
      VALUES (?, ?, ?, ?, ?, 0)
    `).run(id, agentId, sessionTitle, now, now);

    eventBus.publish({ type: 'session.created', source: 'sessions', payload: { id, agentId, title: sessionTitle }, priority: 'low' });

    return { id, agentId, title: sessionTitle, createdAt: new Date(now), updatedAt: new Date(now), messageCount: 0 };
  }

  addMessage(sessionId: string, role: 'user' | 'assistant' | 'system', content: string, metadata?: Record<string, any>): SessionMessage {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    this.db.prepare(`INSERT INTO messages (id, session_id, role, content, timestamp, metadata) VALUES (?, ?, ?, ?, ?, ?)`)
      .run(id, sessionId, role, content, now, JSON.stringify(metadata || {}));

    this.db.prepare(`UPDATE sessions SET updated_at = ?, message_count = message_count + 1 WHERE id = ?`)
      .run(now, sessionId);

    return { id, sessionId, role, content, timestamp: new Date(now), metadata };
  }

  getSessions(agentId?: string, limit: number = 50): Session[] {
    let sql = 'SELECT * FROM sessions';
    const params: any[] = [];
    if (agentId) { sql += ' WHERE agent_id = ?'; params.push(agentId); }
    sql += ' ORDER BY updated_at DESC LIMIT ?';
    params.push(limit);

    return this.db.prepare(sql).all(...params).map((r: any) => ({
      id: r.id, agentId: r.agent_id, title: r.title,
      createdAt: new Date(r.created_at), updatedAt: new Date(r.updated_at),
      messageCount: r.message_count, metadata: r.metadata ? JSON.parse(r.metadata) : undefined
    }));
  }

  getMessages(sessionId: string, limit: number = 100): SessionMessage[] {
    return this.db.prepare('SELECT * FROM messages WHERE session_id = ? ORDER BY timestamp ASC LIMIT ?')
      .all(sessionId, limit).map((r: any) => ({
        id: r.id, sessionId: r.session_id, role: r.role, content: r.content,
        timestamp: new Date(r.timestamp), metadata: r.metadata ? JSON.parse(r.metadata) : undefined
      }));
  }

  getContextMessages(sessionId: string, maxMessages: number = 10): Array<{ role: string; content: string }> {
    return this.db.prepare('SELECT role, content FROM messages WHERE session_id = ? ORDER BY timestamp DESC LIMIT ?')
      .all(sessionId, maxMessages).reverse().map((r: any) => ({ role: r.role, content: r.content }));
  }

  deleteSession(id: string): void {
    this.db.prepare('DELETE FROM messages WHERE session_id = ?').run(id);
    this.db.prepare('DELETE FROM sessions WHERE id = ?').run(id);
  }

  renameSession(id: string, title: string): void {
    this.db.prepare('UPDATE sessions SET title = ? WHERE id = ?').run(title, id);
  }
}

export const sessionManager = new SessionManager();
