import { isEnabled } from '../core/kill-switches.js';

export class ElevenLabsClient {
  private apiKey: string;
  private baseUrl = 'https://api.elevenlabs.io/v1';

  constructor() {
    this.apiKey = process.env.ELEVENLABS_API_KEY || '';
  }

  async synthesize(text: string, voiceId: string): Promise<Buffer> {
    if (!isEnabled('COUNCIL_ENABLED')) throw new Error('Voice is disabled by COUNCIL_ENABLED kill switch');
    if (!this.apiKey) throw new Error('ELEVENLABS_API_KEY not set');

    const res = await fetch(`${this.baseUrl}/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'xi-api-key': this.apiKey },
      body: JSON.stringify({ text, model_id: 'eleven_multilingual_v2' }),
    });
    if (!res.ok) throw new Error(`ElevenLabs error: ${res.status}`);
    return Buffer.from(await res.arrayBuffer());
  }

  async synthesizeToFile(text: string, voiceId: string, outputPath: string): Promise<void> {
    const audio = await this.synthesize(text, voiceId);
    const { writeFileSync } = await import('node:fs');
    writeFileSync(outputPath, audio);
  }

  async listVoices(): Promise<any[]> {
    if (!this.apiKey) throw new Error('ELEVENLABS_API_KEY not set');
    const res = await fetch(`${this.baseUrl}/voices`, {
      headers: { 'xi-api-key': this.apiKey },
    });
    if (!res.ok) throw new Error(`ElevenLabs error: ${res.status}`);
    const data = await res.json() as any;
    return data.voices || [];
  }
}
