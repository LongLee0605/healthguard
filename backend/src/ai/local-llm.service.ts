import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TtlCache } from '../common/ttl-cache';
import { FailFastGate } from '../common/concurrency';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface ChatCompletionResponse {
  choices?: { message?: { content?: string } }[];
}

type TagsPayload = { models?: { name: string }[] };

@Injectable()
export class LocalLlmService {
  private readonly logger = new Logger(LocalLlmService.name);
  private readonly baseUrl: string;
  private readonly model: string;
  private readonly timeoutMs: number;
  private readonly tagsCache = new TtlCache<TagsPayload | null>(15_000, 4);
  private readonly embedCache = new TtlCache<number[]>(5 * 60_000, 64);
  private readonly chatGate: FailFastGate;
  private readonly embedGate: FailFastGate;

  constructor(private readonly config: ConfigService) {
    this.baseUrl = this.config.get<string>('OLLAMA_BASE_URL', 'http://localhost:11434/v1');
    this.model = this.config.get<string>('OLLAMA_MODEL', 'qwen2.5:7b-instruct');
    this.timeoutMs = parseInt(this.config.get<string>('OLLAMA_TIMEOUT_MS', '120000'), 10);
    const maxConcurrent = Math.max(1, parseInt(this.config.get<string>('OLLAMA_MAX_CONCURRENT', '1'), 10) || 1);
    this.chatGate = new FailFastGate(maxConcurrent);
    this.embedGate = new FailFastGate(1);
  }

  /** True when a chat completion is already in flight. */
  isSaturated(): boolean {
    return this.chatGate.busy;
  }

  getModelName(): string {
    return this.model;
  }

  private getModelCandidates(): string[] {
    const configured = this.config.get<string>('OLLAMA_MODEL_CANDIDATES', '');
    return [this.model, ...configured.split(',').map((item) => item.trim())].filter(
      (value, index, items) => value && items.indexOf(value) === index,
    );
  }

  private pickBestAvailableModel(tags: TagsPayload | null): string | null {
    const installed = new Set((tags?.models ?? []).map((m) => m.name));
    const installedBases = new Set(
      (tags?.models ?? []).map((m) => m.name.split(':')[0]),
    );

    for (const candidate of this.getModelCandidates()) {
      if (installed.has(candidate) || installedBases.has(candidate.split(':')[0])) {
        return candidate;
      }
    }

    return tags?.models?.[0]?.name ?? null;
  }

  async getActiveModelName(): Promise<string> {
    const tags = await this.fetchTags();
    return this.pickBestAvailableModel(tags) ?? this.model;
  }

  private ollamaRoot(): string {
    return this.baseUrl.replace(/\/v1\/?$/, '');
  }

  private async fetchTags(): Promise<TagsPayload | null> {
    const cached = this.tagsCache.get('tags');
    if (cached !== undefined) return cached;
    try {
      const res = await fetch(`${this.ollamaRoot()}/api/tags`, {
        signal: AbortSignal.timeout(1500),
      });
      if (!res.ok) {
        this.tagsCache.set('tags', null);
        return null;
      }
      const data = (await res.json()) as TagsPayload;
      this.tagsCache.set('tags', data);
      return data;
    } catch {
      this.tagsCache.set('tags', null);
      return null;
    }
  }

  async isAvailable(): Promise<boolean> {
    return (await this.fetchTags()) !== null;
  }

  async isModelReady(): Promise<boolean> {
    const data = await this.fetchTags();
    if (!data) return false;
    return this.pickBestAvailableModel(data) !== null;
  }

  async chatCompletion(params: {
    messages: ChatMessage[];
    temperature?: number;
    jsonMode?: boolean;
    maxTokens?: number;
    timeoutMs?: number;
  }): Promise<string | null> {
    if (!this.chatGate.tryEnter()) {
      this.logger.debug('Ollama chat saturated — skip LLM (rules fallback)');
      return null;
    }

    const body: Record<string, unknown> = {
      model: await this.getActiveModelName(),
      messages: params.messages,
      temperature: params.temperature ?? 0.3,
      stream: false,
      max_tokens: params.maxTokens ?? 400,
    };

    if (params.jsonMode) {
      body.response_format = { type: 'json_object' };
    }

    try {
      const res = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(params.timeoutMs ?? this.timeoutMs),
      });

      if (!res.ok) {
        const errText = await res.text();
        this.logger.warn(`Ollama chat failed (${res.status}): ${errText.slice(0, 200)}`);
        return null;
      }

      const data = (await res.json()) as ChatCompletionResponse;
      return data.choices?.[0]?.message?.content?.trim() || null;
    } catch (err) {
      this.logger.warn(`Ollama chat failed: ${(err as Error).message}`);
      return null;
    } finally {
      this.chatGate.leave();
    }
  }

  async embed(text: string, timeoutMs = 2500): Promise<number[] | null> {
    const cacheKey = text.slice(0, 400);
    const cached = this.embedCache.get(cacheKey);
    if (cached) return cached;
    if (!this.embedGate.tryEnter()) return null;

    const embedModel = this.config.get<string>('OLLAMA_EMBED_MODEL', 'nomic-embed-text');

    try {
      const res = await fetch(`${this.ollamaRoot()}/api/embeddings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: embedModel, prompt: text }),
        signal: AbortSignal.timeout(timeoutMs),
      });

      if (!res.ok) return null;

      const data = (await res.json()) as { embedding?: number[] };
      const embedding = data.embedding ?? null;
      if (embedding) this.embedCache.set(cacheKey, embedding);
      return embedding;
    } catch (err) {
      this.logger.warn(`Ollama embed failed: ${(err as Error).message}`);
      return null;
    } finally {
      this.embedGate.leave();
    }
  }
}
