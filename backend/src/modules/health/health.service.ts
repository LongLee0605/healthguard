import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { LocalLlmService } from '../../ai/local-llm.service';

@Injectable()
export class HealthService {
  private readonly startedAt = Date.now();

  constructor(
    private readonly prisma: PrismaService,
    private readonly localLlm: LocalLlmService,
    private readonly config: ConfigService,
  ) {}

  async check() {
    let dbStatus: 'ok' | 'error' = 'ok';
    try {
      await this.prisma.$queryRaw`SELECT 1`;
    } catch {
      dbStatus = 'error';
    }

    const aiProvider = this.config.get<string>('AI_PROVIDER', 'ollama');
    let ollamaStatus: 'ok' | 'down' | 'no_model' | 'skipped' = 'skipped';
    let activeModel = this.config.get<string>('OLLAMA_MODEL', 'qwen2.5:7b-instruct');
    if (aiProvider === 'ollama') {
      const ready = await this.localLlm.isModelReady();
      const up = ready || (await this.localLlm.isAvailable());
      ollamaStatus = !up ? 'down' : ready ? 'ok' : 'no_model';
      if (up) {
        activeModel = await this.localLlm.getActiveModelName();
      }
    }

    const allOk =
      dbStatus === 'ok' &&
      (ollamaStatus === 'ok' || ollamaStatus === 'skipped' || ollamaStatus === 'no_model');

    return {
      status: allOk ? 'ok' : 'degraded',
      uptime: Math.floor((Date.now() - this.startedAt) / 1000),
      timestamp: new Date().toISOString(),
      database: dbStatus,
      ai: {
        provider: aiProvider,
        model: activeModel,
        embedModel: this.config.get<string>('OLLAMA_EMBED_MODEL', 'nomic-embed-text'),
        ollama: ollamaStatus,
        fallback: ollamaStatus === 'ok' ? 'none' : 'mock',
      },
      runtime: {
        node: process.version,
        env: this.config.get<string>('NODE_ENV', 'development'),
        port: Number(this.config.get<string>('PORT', '3001')),
      },
    };
  }
}
