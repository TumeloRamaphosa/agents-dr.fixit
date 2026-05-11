import { isEnabled } from '../core/kill-switches.js';

export class SlackBridge {
  private botToken: string;
  private signingSecret: string;
  private appToken: string;
  private running = false;

  constructor() {
    this.botToken = process.env.SLACK_BOT_TOKEN || '';
    this.signingSecret = process.env.SLACK_SIGNING_SECRET || '';
    this.appToken = process.env.SLACK_APP_TOKEN || '';
  }

  async start(): Promise<void> {
    if (!this.botToken || !this.signingSecret) {
      console.warn('[slack] Missing credentials, not starting');
      return;
    }
    this.running = true;
    console.log('[slack] Bridge started');
  }

  async send(channel: string, message: string): Promise<void> {
    if (!this.running) throw new Error('Slack bridge not running');
    // In production: post via Slack Web API
    console.log(`[slack] → ${channel}: ${message}`);
  }

  onMessage(handler: (channel: string, user: string, text: string) => void): void {
    // In production: register event handler via Bolt
  }

  stop(): void {
    this.running = false;
    console.log('[slack] Bridge stopped');
  }
}
