/**
 * Event Bus
 * Central nervous system for Valley OS
 * Handles agent-to-agent messaging, system events, and real-time broadcast
 */

import { EventEmitter } from 'events';

export interface ValleyEvent {
  id: string;
  type: string;
  source: string;
  target?: string;
  payload: any;
  timestamp: Date;
  priority: 'critical' | 'high' | 'normal' | 'low';
}

export interface AgentMessage {
  from: string;
  to: string;
  content: string;
  type: 'request' | 'response' | 'broadcast' | 'notification';
  metadata?: Record<string, any>;
}

type EventHandler = (event: ValleyEvent) => void | Promise<void>;

class ValleyEventBus extends EventEmitter {
  private history: ValleyEvent[] = [];
  private maxHistory: number = 1000;
  private subscribers: Map<string, Set<EventHandler>> = new Map();
  private agentQueues: Map<string, ValleyEvent[]> = new Map();

  constructor() {
    super();
    this.setMaxListeners(50);
  }

  publish(event: Omit<ValleyEvent, 'id' | 'timestamp'>): ValleyEvent {
    const fullEvent: ValleyEvent = {
      ...event,
      id: crypto.randomUUID(),
      timestamp: new Date()
    };

    this.history.push(fullEvent);
    if (this.history.length > this.maxHistory) {
      this.history = this.history.slice(-this.maxHistory);
    }

    // Emit to general listeners
    this.emit('event', fullEvent);
    this.emit(event.type, fullEvent);

    // Route to specific agent if targeted
    if (event.target) {
      this.emit(`agent:${event.target}`, fullEvent);
      const queue = this.agentQueues.get(event.target) || [];
      queue.push(fullEvent);
      this.agentQueues.set(event.target, queue);
    }

    // Notify subscribers
    const handlers = this.subscribers.get(event.type);
    if (handlers) {
      handlers.forEach(handler => {
        try { handler(fullEvent); } catch (e) { console.error('Event handler error:', e); }
      });
    }

    return fullEvent;
  }

  subscribe(eventType: string, handler: EventHandler): () => void {
    if (!this.subscribers.has(eventType)) {
      this.subscribers.set(eventType, new Set());
    }
    this.subscribers.get(eventType)!.add(handler);

    return () => {
      this.subscribers.get(eventType)?.delete(handler);
    };
  }

  sendMessage(message: AgentMessage): ValleyEvent {
    return this.publish({
      type: 'agent.message',
      source: message.from,
      target: message.to,
      payload: message,
      priority: 'normal'
    });
  }

  broadcast(source: string, content: string, metadata?: Record<string, any>): ValleyEvent {
    return this.publish({
      type: 'agent.broadcast',
      source,
      payload: { content, metadata },
      priority: 'normal'
    });
  }

  getAgentQueue(agentId: string): ValleyEvent[] {
    const queue = this.agentQueues.get(agentId) || [];
    this.agentQueues.set(agentId, []);
    return queue;
  }

  getHistory(filter?: { type?: string; source?: string; limit?: number }): ValleyEvent[] {
    let events = [...this.history];

    if (filter?.type) {
      events = events.filter(e => e.type === filter.type);
    }
    if (filter?.source) {
      events = events.filter(e => e.source === filter.source);
    }

    events.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    if (filter?.limit) {
      events = events.slice(0, filter.limit);
    }

    return events;
  }

  getStats(): { totalEvents: number; eventTypes: Record<string, number>; agentActivity: Record<string, number> } {
    const eventTypes: Record<string, number> = {};
    const agentActivity: Record<string, number> = {};

    this.history.forEach(e => {
      eventTypes[e.type] = (eventTypes[e.type] || 0) + 1;
      agentActivity[e.source] = (agentActivity[e.source] || 0) + 1;
    });

    return { totalEvents: this.history.length, eventTypes, agentActivity };
  }
}

export const eventBus = new ValleyEventBus();
