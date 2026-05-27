/**
 * Ritual Scheduler
 * Manages automated daily rituals: morning standup, board meeting, day close
 * Uses node-cron for scheduling, fires events on the event bus
 */

import cron from 'node-cron';
import { eventBus } from './event-bus.js';

export interface ScheduledRitual {
  name: string;
  cron: string;
  description: string;
  agent: string;
  enabled: boolean;
  lastRun?: Date;
  nextRun?: Date;
}

class RitualScheduler {
  private jobs: Map<string, cron.ScheduledTask> = new Map();
  private rituals: Map<string, ScheduledRitual> = new Map();
  private timezone: string = 'Africa/Johannesburg';
  private running: boolean = false;

  constructor() {
    this.loadDefaultRituals();
  }

  private loadDefaultRituals(): void {
    const defaults: ScheduledRitual[] = [
      {
        name: 'heartbeat_sweep',
        cron: '55 7 * * *',
        description: 'Dr Fix-It pings every agent, prepares health report',
        agent: 'drfixit',
        enabled: true
      },
      {
        name: 'morning_standup',
        cron: '0 8 * * *',
        description: 'Daily standup: yesterday wins, sales, social, costs, plan',
        agent: 'robusca',
        enabled: true
      },
      {
        name: 'board_of_chiefs',
        cron: '0 9 * * *',
        description: 'Board of Chiefs meeting - all agents report',
        agent: 'robusca',
        enabled: true
      },
      {
        name: 'hourly_heartbeat',
        cron: '0 * * * *',
        description: 'Hourly health check of all agents',
        agent: 'drfixit',
        enabled: true
      },
      {
        name: 'research_scrape',
        cron: '0 */6 * * *',
        description: 'Scan trends on social and web',
        agent: 'research',
        enabled: true
      },
      {
        name: 'day_close',
        cron: '0 23 * * *',
        description: 'Day-close: token spend, runtime, break-even delta',
        agent: 'robusca',
        enabled: true
      }
    ];

    defaults.forEach(r => this.rituals.set(r.name, r));
  }

  start(): void {
    if (this.running) return;
    this.running = true;

    for (const [name, ritual] of this.rituals) {
      if (!ritual.enabled) continue;

      const job = cron.schedule(ritual.cron, () => {
        this.executeRitual(name);
      }, { timezone: this.timezone });

      this.jobs.set(name, job);
    }

    console.log(`⏰ Scheduler started: ${this.jobs.size} rituals scheduled (TZ: ${this.timezone})`);

    eventBus.publish({
      type: 'scheduler.started',
      source: 'scheduler',
      payload: { rituals: Array.from(this.rituals.keys()), timezone: this.timezone },
      priority: 'normal'
    });
  }

  stop(): void {
    this.jobs.forEach(job => job.stop());
    this.jobs.clear();
    this.running = false;

    eventBus.publish({
      type: 'scheduler.stopped',
      source: 'scheduler',
      payload: {},
      priority: 'normal'
    });
  }

  private executeRitual(name: string): void {
    const ritual = this.rituals.get(name);
    if (!ritual) return;

    ritual.lastRun = new Date();

    console.log(`🔔 Executing ritual: ${name} (agent: ${ritual.agent})`);

    eventBus.publish({
      type: 'ritual.execute',
      source: 'scheduler',
      target: ritual.agent,
      payload: { ritual: name, description: ritual.description, timestamp: new Date().toISOString() },
      priority: 'high'
    });
  }

  async triggerManual(name: string): Promise<void> {
    const ritual = this.rituals.get(name);
    if (!ritual) throw new Error(`Ritual '${name}' not found`);
    this.executeRitual(name);
  }

  getRituals(): ScheduledRitual[] {
    return Array.from(this.rituals.values());
  }

  getStatus(): { running: boolean; rituals: ScheduledRitual[]; timezone: string } {
    return {
      running: this.running,
      rituals: this.getRituals(),
      timezone: this.timezone
    };
  }

  enableRitual(name: string): void {
    const ritual = this.rituals.get(name);
    if (ritual) ritual.enabled = true;
  }

  disableRitual(name: string): void {
    const ritual = this.rituals.get(name);
    if (ritual) {
      ritual.enabled = false;
      const job = this.jobs.get(name);
      if (job) { job.stop(); this.jobs.delete(name); }
    }
  }
}

export const scheduler = new RitualScheduler();
