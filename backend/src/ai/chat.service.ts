import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { AiService } from './ai.service';
import { MEDICAL_DISCLAIMER } from '../common/constants';
import { TtlCache } from '../common/ttl-cache';
import { SingleFlight } from '../common/concurrency';

@Injectable()
export class ChatService {
  private readonly insightCache = new TtlCache<{
    period: string;
    stats: {
      symptomCount: number;
      vitalCount: number;
      analysisCount: number;
      topSymptoms: string[];
      avgSeverity: string;
    };
    insight: string;
    generatedAt: string;
  }>(6 * 60 * 60 * 1000, 200);
  private readonly insightFlight = new SingleFlight<{
    period: string;
    stats: {
      symptomCount: number;
      vitalCount: number;
      analysisCount: number;
      topSymptoms: string[];
      avgSeverity: string;
    };
    insight: string;
    generatedAt: string;
  }>();

  constructor(
    private prisma: PrismaService,
    private aiService: AiService,
    private config: ConfigService,
  ) {}

  async getHistory(userId: string, limit = 50) {
    const messages = await this.prisma.chatMessage.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
      take: limit,
    });
    return messages.map((m) => ({
      id: m.id,
      role: m.role as 'user' | 'assistant',
      content: m.content,
      createdAt: m.createdAt.toISOString(),
    }));
  }

  async sendMessage(userId: string, message: string) {
    await this.prisma.chatMessage.create({
      data: { userId, role: 'user', content: message },
    });

    const [history, recentVitals, user] = await Promise.all([
      this.prisma.chatMessage.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 20,
      }),
      this.prisma.vitalSign.findMany({
        where: { userId },
        orderBy: { recordedAt: 'desc' },
        take: 3,
      }),
      this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          gender: true,
          dateOfBirth: true,
          height: true,
          bloodType: true,
          allergies: true,
          chronicConditions: true,
        },
      }),
    ]);

    const profileParts: string[] = [];
    if (user?.gender) profileParts.push(`Giới tính: ${user.gender}`);
    if (user?.dateOfBirth) {
      const age = Math.floor(
        (Date.now() - user.dateOfBirth.getTime()) / (365.25 * 24 * 60 * 60 * 1000),
      );
      profileParts.push(`Tuổi: ${age}`);
    }
    if (user?.allergies) profileParts.push(`Dị ứng: ${user.allergies}`);
    if (user?.chronicConditions) profileParts.push(`Bệnh nền: ${user.chronicConditions}`);

    const vitalsSummary = recentVitals
      .map((v) => `${v.type}: ${v.value}${v.valueSecondary ? `/${v.valueSecondary}` : ''} ${v.unit}`)
      .join('; ');

    const reply = await this.aiService.chat({
      message,
      history: history
        .reverse()
        .slice(0, -1)
        .map((m) => ({ role: m.role, content: m.content })),
      vitalsSummary,
      profileContext: profileParts.join('. '),
      vitals: recentVitals.map((v) => ({
        type: v.type,
        value: v.value,
        valueSecondary: v.valueSecondary,
        unit: v.unit,
      })),
    });

    const assistantMsg = await this.prisma.chatMessage.create({
      data: { userId, role: 'assistant', content: reply },
    });

    return {
      id: assistantMsg.id,
      role: 'assistant' as const,
      content: reply,
      createdAt: assistantMsg.createdAt.toISOString(),
      disclaimer: MEDICAL_DISCLAIMER,
    };
  }

  async clearHistory(userId: string) {
    await this.prisma.chatMessage.deleteMany({ where: { userId } });
    return { success: true };
  }

  async getWeeklyInsight(userId: string) {
    const since = new Date();
    since.setDate(since.getDate() - 7);
    const whereSince = { userId, recordedAt: { gte: since } };
    const analysisSince = { userId, createdAt: { gte: since } };

    const [symptomAgg, vitalCount, analysisCount, topSymptoms, analyses, vitals, user] = await Promise.all([
      this.prisma.symptomLog.aggregate({
        where: whereSince,
        _count: true,
        _avg: { severity: true },
      }),
      this.prisma.vitalSign.count({ where: whereSince }),
      this.prisma.aIAnalysis.count({ where: analysisSince }),
      this.prisma.symptomLog.findMany({
        where: whereSince,
        orderBy: { recordedAt: 'desc' },
        take: 3,
        select: { description: true },
      }),
      this.prisma.aIAnalysis.findMany({
        where: analysisSince,
        orderBy: { createdAt: 'desc' },
        take: 3,
        select: { inputSummary: true, urgencyLevel: true },
      }),
      this.prisma.vitalSign.findMany({
        where: whereSince,
        orderBy: { recordedAt: 'desc' },
        take: 5,
        select: { type: true, value: true, valueSecondary: true, unit: true },
      }),
      this.prisma.user.findUnique({ where: { id: userId }, select: { fullName: true } }),
    ]);

    const summary = {
      symptomCount: symptomAgg._count,
      vitalCount,
      analysisCount,
      topSymptoms: topSymptoms.map((s) => s.description),
      avgSeverity: symptomAgg._avg.severity ? symptomAgg._avg.severity.toFixed(1) : '0',
    };

    const cacheKey = `${userId}:${summary.symptomCount}:${summary.vitalCount}:${summary.analysisCount}:${summary.avgSeverity}`;
    const cached = this.insightCache.get(cacheKey);
    if (cached) return cached;

    return this.insightFlight.do(cacheKey, async () => {
      const again = this.insightCache.get(cacheKey);
      if (again) return again;

      const insight = await this.aiService.generateWeeklyInsight({
        userName: user?.fullName ?? 'Bạn',
        summary,
        vitals,
        analyses,
      });

      const payload = {
        period: '7 ngày qua',
        stats: summary,
        insight,
        generatedAt: new Date().toISOString(),
      };
      this.insightCache.set(cacheKey, payload);
      return payload;
    });
  }
}
