import { EventEmitter } from 'node:events';

export type Provider = 'ollama' | 'mesh-llm' | 'openai' | 'groq' | 'openrouter' | 'anthropic' | 'custom';

export interface ModelConfig {
  provider: Provider;
  name: string;
  base_url?: string;
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatResponse {
  content: string;
  model: string;
  provider: Provider;
  tokens_in: number;
  tokens_out: number;
  latency_ms: number;
}

const PROVIDER_BASE_URLS: Record<string, string> = {
  ollama: 'http://localhost:11434',
  'mesh-llm': 'http://localhost:9337/v1',
};

export class ModelClient extends EventEmitter {
  private defaultProvider: Provider;
  private defaultModel: string;
  private escalationProvider: Provider;
  private escalationModel: string;
  private baseUrls: Map<Provider, string> = new Map();

  constructor() {
    super();
    this.defaultProvider = (process.env.DEFAULT_PROVIDER as Provider) || 'ollama';
    this.defaultModel = process.env.DEFAULT_MODEL || 'qwen2.5-coder:7b';
    this.escalationProvider = (process.env.ESCALATION_PROVIDER as Provider) || 'anthropic';
    this.escalationModel = process.env.ESCALATION_MODEL || 'claude-sonnet-4-6';

    if (process.env.OLLAMA_BASE_URL) this.baseUrls.set('ollama', process.env.OLLAMA_BASE_URL);
    else this.baseUrls.set('ollama', PROVIDER_BASE_URLS.ollama!);

    if (process.env.MESH_LLM_BASE_URL) this.baseUrls.set('mesh-llm', process.env.MESH_LLM_BASE_URL);
    else this.baseUrls.set('mesh-llm', PROVIDER_BASE_URLS['mesh-llm']!);
  }

  async chat(messages: ChatMessage[], config?: ModelConfig): Promise<ChatResponse> {
    const provider = config?.provider ?? this.defaultProvider;
    const model = config?.name ?? this.defaultModel;
    const baseUrl = config?.base_url || this.baseUrls.get(provider) || '';

    const start = Date.now();

    try {
      const response = await this.dispatch(provider, model, baseUrl, messages);
      const latency = Date.now() - start;

      this.emit('chat', { provider, model, tokens_in: response.tokens_in, tokens_out: response.tokens_out, latency_ms: latency });

      return {
        content: response.content,
        model,
        provider,
        tokens_in: response.tokens_in,
        tokens_out: response.tokens_out,
        latency_ms: latency,
      };
    } catch (err) {
      // Auto-escalate on failure
      if (provider !== this.escalationProvider) {
        this.emit('escalation', { from: provider, to: this.escalationProvider, model, error: String(err) });
        return this.chat(messages, { provider: this.escalationProvider, name: this.escalationModel });
      }
      throw err;
    }
  }

  private async dispatch(provider: Provider, model: string, baseUrl: string, messages: ChatMessage[]): Promise<{ content: string; tokens_in: number; tokens_out: number }> {
    switch (provider) {
      case 'ollama':
        return this.callOllama(baseUrl, model, messages);
      case 'mesh-llm':
      case 'openai':
      case 'openrouter':
      case 'groq':
      case 'custom':
        return this.callOpenAICompat(baseUrl, model, messages, this.getApiKey(provider));
      case 'anthropic':
        return this.callAnthropic(model, messages);
      default:
        throw new Error(`Unknown provider: ${provider}`);
    }
  }

  private getApiKey(provider: Provider): string {
    const map: Record<string, string | undefined> = {
      openai: process.env.OPENAI_API_KEY,
      openrouter: process.env.OPENROUTER_API_KEY,
      groq: process.env.GROQ_API_KEY,
      'mesh-llm': '',
      custom: '',
    };
    return map[provider] || '';
  }

  private async callOllama(baseUrl: string, model: string, messages: ChatMessage[]): Promise<{ content: string; tokens_in: number; tokens_out: number }> {
    const res = await fetch(`${baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, messages, stream: false }),
    });
    if (!res.ok) throw new Error(`Ollama error: ${res.status}`);
    const data = await res.json() as any;
    return {
      content: data.message?.content || '',
      tokens_in: data.prompt_eval_count || 0,
      tokens_out: data.eval_count || 0,
    };
  }

  private async callOpenAICompat(baseUrl: string, model: string, messages: ChatMessage[], apiKey: string): Promise<{ content: string; tokens_in: number; tokens_out: number }> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`;

    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ model, messages }),
    });
    if (!res.ok) throw new Error(`${baseUrl} error: ${res.status}`);
    const data = await res.json() as any;
    const choice = data.choices?.[0];
    return {
      content: choice?.message?.content || '',
      tokens_in: data.usage?.prompt_tokens || 0,
      tokens_out: data.usage?.completion_tokens || 0,
    };
  }

  private async callAnthropic(model: string, messages: ChatMessage[]): Promise<{ content: string; tokens_in: number; tokens_out: number }> {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) throw new Error('ANTHROPIC_API_KEY not set');

    const system = messages.find(m => m.role === 'system')?.content || '';
    const nonSystem = messages.filter(m => m.role !== 'system');

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model,
        max_tokens: 4096,
        system: system || undefined,
        messages: nonSystem,
      }),
    });
    if (!res.ok) throw new Error(`Anthropic error: ${res.status}`);
    const data = await res.json() as any;
    return {
      content: data.content?.[0]?.text || '',
      tokens_in: data.usage?.input_tokens || 0,
      tokens_out: data.usage?.output_tokens || 0,
    };
  }
}