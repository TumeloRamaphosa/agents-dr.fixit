import { isEnabled } from '../core/kill-switches.js';

export class DiscordBridge {
  private botToken: string;
  private guildId: string;
  private running = false;

  constructor() {
    this.botToken = process.env.DISCORD_BOT_TOKEN || '';
    this.guildId = process.env.DISCORD_GUILD_ID || '';
  }

  async start(): Promise<void> {
    if (!this.botToken) {
      console.warn('[discord] Missing bot token, not starting');
      return;
    }
    this.running = true;
    console.log('[discord] Bridge started');
  }

  async send(channelId: string, message: string): Promise<void> {
    if (!this.running) throw new Error('Discord bridge not running');
    console.log(`[discord] → ${channelId}: ${message}`);
  }

  onMessage(handler: (channelId: string, userId: string, content: string) => void): void {
    // In production: register event handler via discord.js
  }

  stop(): void {
    this.running = false;
    console.log('[discord] Bridge stopped');
  }
}
