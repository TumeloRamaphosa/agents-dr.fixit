import { EventEmitter } from 'node:events';
import { getValleyOSPath } from '../core/vault.js';

export interface WarRoomSession {
  id: string;
  type: string;
  agents: string[];
  startTime: Date;
  active: boolean;
  voiceEnabled: boolean;
}

export class WarRoom extends EventEmitter {
  private sessions: Map<string, WarRoomSession> = new Map();
  private currentSession: WarRoomSession | null = null;

  start(sessionType: string, agents?: string[]): WarRoomSession {
    const id = `wr-${Date.now()}`;
    const session: WarRoomSession = {
      id,
      type: sessionType,
      agents: agents || [],
      startTime: new Date(),
      active: true,
      voiceEnabled: false,
    };
    this.sessions.set(id, session);
    this.currentSession = session;
    this.emit('started', session);
    return session;
  }

  addAgent(codename: string): void {
    if (!this.currentSession) throw new Error('No active war room session');
    if (!this.currentSession.agents.includes(codename)) {
      this.currentSession.agents.push(codename);
      this.emit('agent_added', { session: this.currentSession, agent: codename });
    }
  }

  removeAgent(codename: string): void {
    if (!this.currentSession) throw new Error('No active war room session');
    this.currentSession.agents = this.currentSession.agents.filter(a => a !== codename);
    this.emit('agent_removed', { session: this.currentSession, agent: codename });
  }

  getRoster(): string[] {
    return this.currentSession?.agents || [];
  }

  isActive(): boolean {
    return this.currentSession?.active ?? false;
  }

  end(): void {
    if (!this.currentSession) return;
    this.currentSession.active = false;
    this.emit('ended', this.currentSession);
    this.currentSession = null;
  }

  getCurrentSession(): WarRoomSession | null {
    return this.currentSession;
  }
}
