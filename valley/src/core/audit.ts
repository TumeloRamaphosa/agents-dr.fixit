import type { Database } from 'better-sqlite3';
import { randomUUID } from 'node:crypto';

export interface AuditEvent {
  event_type: string;
  agent?: string;
  correlation_id?: string;
  payload?: Record<string, unknown>;
}

export class AuditLog {
  private db: Database.Database;

  constructor(db: Database.Database) {
    this.db = db;
  }

  log(event: AuditEvent): string {
    const correlationId = event.correlation_id || randomUUID();
    this.db.prepare(
      `INSERT INTO audit_log (event_type, agent, correlation_id, payload) VALUES (?, ?, ?, ?)`
    ).run(
      event.event_type,
      event.agent || null,
      correlationId,
      event.payload ? JSON.stringify(event.payload) : null
    );
    return correlationId;
  }

  query(filters: { event_type?: string; agent?: string; since?: string; correlation_id?: string }, limit: number = 100): any[] {
    const conditions: string[] = [];
    const params: any[] = [];

    if (filters.event_type) { conditions.push('event_type = ?'); params.push(filters.event_type); }
    if (filters.agent) { conditions.push('agent = ?'); params.push(filters.agent); }
    if (filters.since) { conditions.push('created_at >= ?'); params.push(filters.since); }
    if (filters.correlation_id) { conditions.push('correlation_id = ?'); params.push(filters.correlation_id); }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const sql = `SELECT * FROM audit_log ${where} ORDER BY created_at DESC LIMIT ?`;
    params.push(limit);

    return this.db.prepare(sql).all(...params);
  }

  prune(daysOld: number = 90): number {
    const cutoff = new Date(Date.now() - daysOld * 86400000).toISOString();
    // Don't prune pinned entries - they have correlation_id starting with 'pin:'
    const result = this.db.prepare(
      `DELETE FROM audit_log WHERE created_at < ? AND correlation_id NOT LIKE 'pin:%'`
    ).run(cutoff);
    return result.changes;
  }
}

export function newCorrelationId(): string {
  return randomUUID();
}