/**
 * Voice Engine
 * ElevenLabs text-to-speech integration for agent voices
 * Each agent has a unique voice personality
 */

import { eventBus } from './event-bus.js';

interface VoiceConfig {
  voiceId: string;
  name: string;
  stability: number;
  similarityBoost: number;
  style?: number;
}

const AGENT_VOICES: Record<string, VoiceConfig> = {
  robusca: { voiceId: 'XB0fDUnXU5powFXDhCwa', name: 'Charlotte', stability: 0.5, similarityBoost: 0.75 },
  cto: { voiceId: 'AZnzlk1XvdvUeBnXmlld', name: 'Domi', stability: 0.65, similarityBoost: 0.75 },
  openclaw: { voiceId: 'pNInz6obpgDQGcFmaJgB', name: 'Adam', stability: 0.6, similarityBoost: 0.7 },
  cashclaw: { voiceId: 'TxGEqnHWrfWFT9NGDgqt', name: 'Todd', stability: 0.55, similarityBoost: 0.8 },
  denchclaw: { voiceId: 'yoZ06aMxZJJ28mfd3POQ', name: 'Jessica', stability: 0.5, similarityBoost: 0.75 },
  charlie: { voiceId: 'EXAVITQu4vr4xnSDxMaL', name: 'Sarah', stability: 0.5, similarityBoost: 0.75 },
  goose: { voiceId: 'LcfcDJNUP1GQjkzn1xUU', name: 'Matilda', stability: 0.55, similarityBoost: 0.7 },
  hermes: { voiceId: '21m00Tcm4TlvDq8ikWAM', name: 'Rachel', stability: 0.6, similarityBoost: 0.75 },
  skunkworks: { voiceId: 'cjVigY5qzO86HufIinON', name: 'Callum', stability: 0.6, similarityBoost: 0.7 },
};

export class VoiceEngine {
  private apiKey: string | null;
  private baseUrl: string = 'https://api.elevenlabs.io/v1';
  private enabled: boolean = false;

  constructor() {
    this.apiKey = process.env.ELEVENLABS_API_KEY || null;
    this.enabled = !!this.apiKey;
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  getVoiceConfig(agentId: string): VoiceConfig | null {
    return AGENT_VOICES[agentId] || null;
  }

  async synthesize(agentId: string, text: string): Promise<Buffer | null> {
    if (!this.enabled || !this.apiKey) return null;

    const voice = AGENT_VOICES[agentId];
    if (!voice) return null;

    try {
      const response = await fetch(`${this.baseUrl}/text-to-speech/${voice.voiceId}`, {
        method: 'POST',
        headers: {
          'xi-api-key': this.apiKey,
          'Content-Type': 'application/json',
          'Accept': 'audio/mpeg'
        },
        body: JSON.stringify({
          text: text.slice(0, 5000),
          model_id: 'eleven_monolingual_v1',
          voice_settings: {
            stability: voice.stability,
            similarity_boost: voice.similarityBoost,
            style: voice.style || 0,
            use_speaker_boost: true
          }
        })
      });

      if (!response.ok) {
        console.error(`Voice synthesis failed for ${agentId}: ${response.status}`);
        return null;
      }

      const buffer = Buffer.from(await response.arrayBuffer());

      eventBus.publish({
        type: 'voice.synthesized',
        source: agentId,
        payload: { textLength: text.length, audioBytes: buffer.length, voice: voice.name },
        priority: 'low'
      });

      return buffer;
    } catch (error) {
      console.error(`Voice synthesis error for ${agentId}:`, error);
      return null;
    }
  }

  getAvailableVoices(): Array<{ agentId: string; voiceName: string }> {
    return Object.entries(AGENT_VOICES).map(([agentId, config]) => ({
      agentId,
      voiceName: config.name
    }));
  }
}

export const voiceEngine = new VoiceEngine();
