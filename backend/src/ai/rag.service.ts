import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { MEDICAL_DISCLAIMER } from '../common/constants';
import { PrismaService } from '../prisma/prisma.service';
import { LocalLlmService } from './local-llm.service';
import { MEDICAL_KNOWLEDGE } from './knowledge.constants';
import { assessTriage, fold } from './clinical-triage';

@Injectable()
export class RagService implements OnModuleInit {
  private readonly logger = new Logger(RagService.name);
  private vectorReady = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly localLlm: LocalLlmService,
  ) {}

  async onModuleInit() {
    await this.ensureVectorSchema();
    await this.syncKnowledge();
  }

  private async ensureVectorSchema() {
    try {
      await this.prisma.$executeRawUnsafe('CREATE EXTENSION IF NOT EXISTS vector');
      await this.prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS knowledge_chunks (
          id TEXT PRIMARY KEY,
          content TEXT NOT NULL,
          keywords TEXT[] DEFAULT ARRAY[]::TEXT[],
          embedding vector(768),
          created_at TIMESTAMP DEFAULT NOW()
        )
      `);
      this.vectorReady = true;
    } catch (err) {
      this.logger.warn(`pgvector not available, using keyword RAG only: ${(err as Error).message}`);
      this.vectorReady = false;
    }
  }

  private async syncKnowledge() {
    if (!this.vectorReady) return;

    try {
      const existing = await this.prisma.$queryRawUnsafe<{ id: string; content: string }[]>(
        'SELECT id, content FROM knowledge_chunks',
      );
      const byId = new Map(existing.map((r) => [r.id, r.content]));
      const ollamaUp = await this.localLlm.isAvailable();
      let updated = 0;

      for (const doc of MEDICAL_KNOWLEDGE) {
        if (byId.get(doc.id) === doc.content) continue;
        if (!ollamaUp) {
          this.logger.warn('Ollama unavailable — skip embedding update (keyword RAG still works)');
          break;
        }
        const embedding = await this.localLlm.embed(doc.content);
        if (!embedding) continue;

        const vectorLiteral = `[${embedding.join(',')}]`;
        const keywordsPg = `{${doc.keywords.map((k) => `"${k.replace(/"/g, '')}"`).join(',')}}`;
        const escapedContent = doc.content.replace(/'/g, "''");
        await this.prisma.$executeRawUnsafe(
          `INSERT INTO knowledge_chunks (id, content, keywords, embedding)
           VALUES ('${doc.id}', '${escapedContent}', '${keywordsPg}'::text[], '${vectorLiteral}'::vector)
           ON CONFLICT (id) DO UPDATE SET
             content = EXCLUDED.content,
             keywords = EXCLUDED.keywords,
             embedding = EXCLUDED.embedding`,
        );
        updated += 1;
      }
      if (updated > 0) {
        this.logger.log(`Synced ${updated}/${MEDICAL_KNOWLEDGE.length} medical knowledge chunks`);
      }
    } catch (err) {
      this.logger.warn(`Knowledge sync failed: ${(err as Error).message}`);
    }
  }

  async retrieveRelevantKnowledge(query: string, limit = 5): Promise<string[]> {
    const keywordHits = this.retrieveByKeywords(query, limit);
    if (!this.vectorReady) return keywordHits;
    if (keywordHits.length >= 2) return keywordHits.slice(0, limit);

    const vectorHits = await this.retrieveByVector(query, limit);
    const seen = new Set<string>();
    const merged: string[] = [];
    for (const chunk of [...keywordHits, ...vectorHits]) {
      const key = chunk.slice(0, 80);
      if (seen.has(key)) continue;
      seen.add(key);
      merged.push(chunk);
      if (merged.length >= limit) break;
    }
    return merged.length ? merged : keywordHits;
  }

  private async retrieveByVector(query: string, limit: number): Promise<string[]> {
    try {
      const embedding = await this.localLlm.embed(query, 2500);
      if (!embedding) return [];

      // Use tagged template literal — Prisma interpolates safely
      const safeLimit = Math.min(Math.max(1, Math.floor(limit)), 20);
      const vectorLiteral = `[${embedding.map(Number).join(',')}]`;
      const rows = await this.prisma.$queryRaw<{ content: string }[]>`
        SELECT content FROM knowledge_chunks
        WHERE embedding IS NOT NULL
        ORDER BY embedding <=> ${vectorLiteral}::vector
        LIMIT ${safeLimit}
      `;
      return rows.map((r) => r.content);
    } catch {
      return [];
    }
  }

  retrieveByKeywords(query: string, limit = 3): string[] {
    const lowerQuery = query.toLowerCase();
    const folded = fold(query);
    const scored = MEDICAL_KNOWLEDGE.map((doc) => {
      const kwScore = doc.keywords.reduce((acc, kw) => {
        const k = kw.toLowerCase();
        return acc + (lowerQuery.includes(k) || folded.includes(fold(kw)) ? 3 : 0);
      }, 0);
      const foldedContent = fold(doc.content);
      const contentHit = folded
        .split(/\s+/)
        .filter((w) => w.length > 3)
        .some((w) => foldedContent.includes(w));
      return { doc, score: kwScore + (contentHit ? 1 : 0) };
    });

    return scored
      .filter((s) => s.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map((s) => s.doc.content);
  }

  buildAnalysisPrompt(
    symptom: string,
    severity: number,
    bodyPart: string | undefined,
    recentVitals: string,
    knowledge: string[],
    triage?: {
      urgency: string;
      specialty: string;
      redFlags: string[];
      differentials: string[];
      matchedRules: string[];
    },
  ): string {
    const triageBlock = triage
      ? `
Sàng lọc luật nội bộ (BẮT BUỘC: không được urgencyLevel thấp hơn ${triage.urgency}):
- urgency: ${triage.urgency}
- specialty: ${triage.specialty}
- rules: ${triage.matchedRules.join(', ') || 'không khớp rule đặc hiệu'}
- redFlags: ${triage.redFlags.join('; ') || 'không'}
- differentials gợi ý: ${triage.differentials.join('; ') || 'không'}
`
      : '';

    return `Triệu chứng: ${symptom}
Mức độ (1-10): ${severity}
Vị trí: ${bodyPart ?? 'Không rõ'}
Chỉ số gần đây: ${recentVitals || 'Chưa có'}
${triageBlock}
Kiến thức nội bộ:
${knowledge.length ? knowledge.map((k, i) => `${i + 1}. ${k}`).join('\n') : 'Không có đoạn khớp — hãy thận trọng, ưu tiên an toàn.'}

Trả đúng JSON:
{"analysis":"...","suggestedSpecialty":"...","urgencyLevel":"LOW|MEDIUM|HIGH"}

${MEDICAL_DISCLAIMER}`;
  }

  parseMockAnalysis(
    symptom: string,
    severity: number,
    bodyPart?: string,
    vitals?: { type: string; value: number; valueSecondary?: number | null }[],
  ): {
    analysis: string;
    suggestedSpecialty: string;
    urgencyLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  } {
    const t = assessTriage(symptom, severity, bodyPart, vitals);
    return {
      analysis: t.analysis,
      suggestedSpecialty: t.specialty,
      urgencyLevel: t.urgency,
    };
  }
}
