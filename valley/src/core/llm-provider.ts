/**
 * LLM Provider
 * Configurable multi-provider inference engine
 * Supports: Xiaomi MiMo, Ollama, Anthropic, any OpenAI-compatible API
 *
 * Priority chain: configured provider → fallback providers
 */

import { costFooter } from './cost-footer.js';

export interface LLMConfig {
  provider: 'mimo' | 'ollama' | 'anthropic' | 'openai-compatible';
  baseUrl: string;
  apiKey?: string;
  model: string;
  name: string;
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LLMResponse {
  content: string;
  model: string;
  provider: string;
  inputTokens: number;
  outputTokens: number;
  latencyMs: number;
}

const DEFAULT_PROVIDERS: LLMConfig[] = [
  {
    provider: 'mimo',
    name: 'Xiaomi MiMo',
    baseUrl: 'https://api.xiaomimimo.com/v1',
    model: 'mimo-v2.5-pro'
  },
  {
    provider: 'ollama',
    name: 'Ollama (Local)',
    baseUrl: 'http://localhost:11434',
    model: 'qwen2.5:7b'
  },
  {
    provider: 'anthropic',
    name: 'Anthropic Claude',
    baseUrl: 'https://api.anthropic.com',
    model: 'claude-3-haiku-20240307'
  }
];

class LLMProvider {
  private providers: LLMConfig[] = [];
  private activeProvider: LLMConfig | null = null;

  constructor() {
    this.loadProviders();
  }

  private loadProviders(): void {
    // Build provider list from environment
    const mimoKey = process.env.MIMO_API_KEY || process.env.ANTHROPIC_API_KEY;
    const ollamaHost = process.env.OLLAMA_HOST || 'http://localhost:11434';
    const anthropicKey = process.env.ANTHROPIC_API_KEY;
    const customBaseUrl = process.env.LLM_BASE_URL;
    const customApiKey = process.env.LLM_API_KEY;
    const customModel = process.env.LLM_MODEL;

    // Custom provider takes highest priority
    if (customBaseUrl && customApiKey) {
      this.providers.push({
        provider: 'openai-compatible',
        name: 'Custom LLM',
        baseUrl: customBaseUrl,
        apiKey: customApiKey,
        model: customModel || 'gpt-4'
      });
    }

    // MiMo (Xiaomi) - check for MiMo-specific key or general key with MiMo URL
    if (mimoKey && mimoKey.startsWith('sk-sx')) {
      this.providers.push({
        provider: 'mimo',
        name: 'Xiaomi MiMo',
        baseUrl: process.env.MIMO_BASE_URL || 'https://api.xiaomimimo.com/v1',
        apiKey: mimoKey,
        model: process.env.MIMO_MODEL || 'mimo-v2.5-pro'
      });
    }

    // Ollama (local)
    this.providers.push({
      provider: 'ollama',
      name: 'Ollama (Local)',
      baseUrl: ollamaHost,
      model: 'qwen2.5:7b'
    });

    // Anthropic
    if (anthropicKey && anthropicKey.startsWith('sk-ant')) {
      this.providers.push({
        provider: 'anthropic',
        name: 'Anthropic Claude',
        baseUrl: 'https://api.anthropic.com',
        apiKey: anthropicKey,
        model: 'claude-3-haiku-20240307'
      });
    }

    // Set active to first available
    this.activeProvider = this.providers[0] || null;
  }

  getActiveProvider(): LLMConfig | null {
    return this.activeProvider;
  }

  getProviders(): LLMConfig[] {
    return this.providers.map(p => ({ ...p, apiKey: p.apiKey ? '***' : undefined }));
  }

  setActiveProvider(name: string): boolean {
    const provider = this.providers.find(p => p.name === name || p.provider === name);
    if (provider) {
      this.activeProvider = provider;
      return true;
    }
    return false;
  }

  async chat(messages: ChatMessage[], options?: {
    model?: string;
    temperature?: number;
    maxTokens?: number;
    agentId?: string;
  }): Promise<LLMResponse> {
    // Try providers in order until one works
    for (const provider of this.providers) {
      try {
        const result = await this.callProvider(provider, messages, options);
        this.activeProvider = provider;
        return result;
      } catch (error: any) {
        console.warn(`[LLM] ${provider.name} failed: ${error.message}`);
        continue;
      }
    }

    throw new Error('All LLM providers failed. Check your API keys and connectivity.');
  }

  private async callProvider(
    config: LLMConfig,
    messages: ChatMessage[],
    options?: { model?: string; temperature?: number; maxTokens?: number; agentId?: string }
  ): Promise<LLMResponse> {
    const startTime = Date.now();

    if (config.provider === 'ollama') {
      return this.callOllama(config, messages, options, startTime);
    }

    if (config.provider === 'anthropic') {
      return this.callAnthropic(config, messages, options, startTime);
    }

    // MiMo and OpenAI-compatible use the same protocol
    return this.callOpenAICompatible(config, messages, options, startTime);
  }

  private async callOpenAICompatible(
    config: LLMConfig,
    messages: ChatMessage[],
    options: any,
    startTime: number
  ): Promise<LLMResponse> {
    const model = options?.model || config.model;

    const response = await fetch(`${config.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model,
        messages,
        max_completion_tokens: options?.maxTokens || 4096,
        temperature: options?.temperature || 0.7,
        stream: false
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`${response.status}: ${error}`);
    }

    const data: any = await response.json();
    const content = data.choices?.[0]?.message?.content || '';
    const usage = data.usage || {};

    const result: LLMResponse = {
      content,
      model: data.model || model,
      provider: config.name,
      inputTokens: usage.prompt_tokens || 0,
      outputTokens: usage.completion_tokens || 0,
      latencyMs: Date.now() - startTime
    };

    // Track cost
    costFooter.track({
      agentId: options?.agentId || 'system',
      model: result.model,
      provider: config.provider === 'mimo' ? 'local' : 'other',
      inputTokens: result.inputTokens,
      outputTokens: result.outputTokens,
      operation: 'chat'
    });

    return result;
  }

  private async callOllama(
    config: LLMConfig,
    messages: ChatMessage[],
    options: any,
    startTime: number
  ): Promise<LLMResponse> {
    const model = options?.model || config.model;

    // Convert to Ollama format
    const systemMsg = messages.find(m => m.role === 'system');
    const userMsgs = messages.filter(m => m.role !== 'system');
    const prompt = (systemMsg ? systemMsg.content + '\n\n' : '') +
      userMsgs.map(m => `${m.role}: ${m.content}`).join('\n');

    const response = await fetch(`${config.baseUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        prompt,
        stream: false,
        options: { temperature: options?.temperature || 0.7, num_ctx: 8192 }
      }),
      signal: AbortSignal.timeout(30000)
    });

    if (!response.ok) throw new Error(`Ollama ${response.status}`);

    const data: any = await response.json();

    return {
      content: data.response || '',
      model,
      provider: config.name,
      inputTokens: Math.ceil(prompt.length / 4),
      outputTokens: Math.ceil((data.response || '').length / 4),
      latencyMs: Date.now() - startTime
    };
  }

  private async callAnthropic(
    config: LLMConfig,
    messages: ChatMessage[],
    options: any,
    startTime: number
  ): Promise<LLMResponse> {
    const model = options?.model || config.model;
    const systemMsg = messages.find(m => m.role === 'system');
    const chatMsgs = messages.filter(m => m.role !== 'system');

    const response = await fetch(`${config.baseUrl}/v1/messages`, {
      method: 'POST',
      headers: {
        'x-api-key': config.apiKey!,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model,
        max_tokens: options?.maxTokens || 4096,
        system: systemMsg?.content || '',
        messages: chatMsgs.map(m => ({ role: m.role, content: m.content })),
        temperature: options?.temperature || 0.7
      })
    });

    if (!response.ok) throw new Error(`Anthropic ${response.status}`);

    const data: any = await response.json();
    const content = data.content?.[0]?.text || '';

    return {
      content,
      model,
      provider: config.name,
      inputTokens: data.usage?.input_tokens || 0,
      outputTokens: data.usage?.output_tokens || 0,
      latencyMs: Date.now() - startTime
    };
  }
}

export const llmProvider = new LLMProvider();
