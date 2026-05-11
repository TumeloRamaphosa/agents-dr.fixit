import { readFileSync } from 'node:fs';

export class WhisperClient {
  private apiKey: string;
  private baseUrl = 'https://api.groq.com/openai/v1';

  constructor() {
    this.apiKey = process.env.GROQ_API_KEY || '';
  }

  async transcribe(audioInput: string | Buffer): Promise<string> {
    if (!this.apiKey) throw new Error('GROQ_API_KEY not set');

    const formData = new FormData();
    const blob = typeof audioInput === 'string'
      ? new Blob([readFileSync(audioInput)])
      : new Blob([audioInput]);
    formData.append('file', blob, 'audio.wav');
    formData.append('model', 'whisper-large-v3');

    const res = await fetch(`${this.baseUrl}/audio/transcriptions`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${this.apiKey}` },
      body: formData,
    });
    if (!res.ok) throw new Error(`Whisper error: ${res.status}`);
    const data = await res.json() as any;
    return data.text || '';
  }

  async transcribeFile(filePath: string): Promise<string> {
    return this.transcribe(filePath);
  }
}
