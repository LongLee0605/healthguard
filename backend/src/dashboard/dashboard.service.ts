import { Injectable } from '@nestjs/common';
import { VITAL_LABELS } from '../common/constants';
import { PrismaService } from '../prisma/prisma.service';
import { MedicationsService } from '../medications/medications.service';
import { TtlCache } from '../common/ttl-cache';
import { SingleFlight } from '../common/concurrency';

@Injectable()
export class DashboardService {
  private readonly statsCache = new TtlCache<Awaited<ReturnType<DashboardService['loadStats']>>>(12_000, 500);
  private readonly statsFlight = new SingleFlight<Awaited<ReturnType<DashboardService['loadStats']>>>();
  private readonly activityCache = new TtlCache<Awaited<ReturnType<DashboardService['loadActivity']>>>(12_000, 500);
  private readonly activityFlight = new SingleFlight<Awaited<ReturnType<DashboardService['loadActivity']>>>();

  constructor(
    private prisma: PrismaService,
    private medicationsService: MedicationsService,
  ) {}

  getStats(userId: string) {
    const cached = this.statsCache.get(userId);
    if (cached) return Promise.resolve(cached);
    return this.statsFlight.do(userId, async () => {
      const data = await this.loadStats(userId);
      this.statsCache.set(userId, data);
      return data;
    });
  }

  getRecentActivity(userId: string) {
    const cached = this.activityCache.get(userId);
    if (cached) return Promise.resolve(cached);
    return this.activityFlight.do(userId, async () => {
      const data = await this.loadActivity(userId);
      this.activityCache.set(userId, data);
      return data;
    });
  }

  async loadStats(userId: string) {
    const [totalSymptoms, totalVitals, unreadAlerts, totalMedications, lastAnalysis, latestVital, streak] =
      await Promise.all([
        this.prisma.symptomLog.count({ where: { userId } }),
        this.prisma.vitalSign.count({ where: { userId } }),
        this.prisma.alert.count({ where: { userId, isRead: false } }),
        this.medicationsService.countActive(userId),
        this.prisma.aIAnalysis.findFirst({
          where: { userId },
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            userId: true,
            inputSummary: true,
            analysis: true,
            suggestedSpecialty: true,
            urgencyLevel: true,
            createdAt: true,
          },
        }),
        this.prisma.vitalSign.findFirst({
          where: { userId },
          orderBy: { recordedAt: 'desc' },
          select: { type: true, value: true, valueSecondary: true },
        }),
        this.calculateStreak(userId),
      ]);

    const healthScore = this.calculateHealthScore({
      unreadAlerts,
      lastUrgency: lastAnalysis?.urgencyLevel,
      latestVital,
    });

    const achievements = this.getAchievements({ totalSymptoms, totalVitals, streak, healthScore });

    return {
      totalSymptoms,
      totalVitals,
      unreadAlerts,
      totalMedications,
      healthScore,
      streak,
      achievements,
      lastAnalysis: lastAnalysis
        ? {
            id: lastAnalysis.id,
            userId: lastAnalysis.userId,
            inputSummary: lastAnalysis.inputSummary,
            analysis: lastAnalysis.analysis,
            suggestedSpecialty: lastAnalysis.suggestedSpecialty ?? undefined,
            urgencyLevel: lastAnalysis.urgencyLevel,
            createdAt: lastAnalysis.createdAt.toISOString(),
          }
        : undefined,
    };
  }

  async loadActivity(userId: string) {
    const [symptoms, vitals, analyses, alerts] = await Promise.all([
      this.prisma.symptomLog.findMany({
        where: { userId },
        orderBy: { recordedAt: 'desc' },
        take: 5,
      }),
      this.prisma.vitalSign.findMany({
        where: { userId },
        orderBy: { recordedAt: 'desc' },
        take: 5,
      }),
      this.prisma.aIAnalysis.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
      this.prisma.alert.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
    ]);

    const items = [
      ...symptoms.map((s) => ({
        id: s.id,
        type: 'symptom' as const,
        title: s.description.slice(0, 60),
        subtitle: `Mức ${s.severity}/10${s.bodyPart ? ` • ${s.bodyPart}` : ''}`,
        timestamp: s.recordedAt.toISOString(),
      })),
      ...vitals.map((v) => ({
        id: v.id,
        type: 'vital' as const,
        title: VITAL_LABELS[v.type as keyof typeof VITAL_LABELS] ?? v.type,
        subtitle: v.valueSecondary
          ? `${v.value}/${v.valueSecondary} ${v.unit}`
          : `${v.value} ${v.unit}`,
        timestamp: v.recordedAt.toISOString(),
      })),
      ...analyses.map((a) => ({
        id: a.id,
        type: 'ai' as const,
        title: a.inputSummary,
        subtitle: a.suggestedSpecialty ?? 'Phân tích AI',
        timestamp: a.createdAt.toISOString(),
        meta: a.urgencyLevel,
      })),
      ...alerts.map((a) => ({
        id: a.id,
        type: 'alert' as const,
        title: a.title,
        subtitle: a.message.slice(0, 80),
        timestamp: a.createdAt.toISOString(),
      })),
    ];

    return items
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 12);
  }

  async getTimeline(userId: string, days = 30, typeFilter?: string) {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const [symptoms, vitals, analyses, alerts, medLogs] = await Promise.all([
      this.prisma.symptomLog.findMany({
        where: { userId, recordedAt: { gte: since } },
        orderBy: { recordedAt: 'desc' },
        take: 80,
      }),
      this.prisma.vitalSign.findMany({
        where: { userId, recordedAt: { gte: since } },
        orderBy: { recordedAt: 'desc' },
        take: 80,
      }),
      this.prisma.aIAnalysis.findMany({
        where: { userId, createdAt: { gte: since } },
        orderBy: { createdAt: 'desc' },
        take: 80,
      }),
      this.prisma.alert.findMany({
        where: { userId, createdAt: { gte: since } },
        orderBy: { createdAt: 'desc' },
        take: 80,
      }),
      this.prisma.medicationLog.findMany({
        where: { userId, loggedAt: { gte: since } },
        include: { medication: true },
        orderBy: { loggedAt: 'desc' },
        take: 80,
      }),
    ]);

    const items = [
      ...symptoms.map((s) => ({
        id: s.id,
        type: 'symptom' as const,
        title: s.description.slice(0, 80),
        subtitle: `Mức ${s.severity}/10${s.bodyPart ? ` • ${s.bodyPart}` : ''}`,
        timestamp: s.recordedAt.toISOString(),
        meta: String(s.severity),
      })),
      ...vitals.map((v) => ({
        id: v.id,
        type: 'vital' as const,
        title: VITAL_LABELS[v.type as keyof typeof VITAL_LABELS] ?? v.type,
        subtitle: v.valueSecondary
          ? `${v.value}/${v.valueSecondary} ${v.unit}`
          : `${v.value} ${v.unit}`,
        timestamp: v.recordedAt.toISOString(),
      })),
      ...analyses.map((a) => ({
        id: a.id,
        type: 'ai' as const,
        title: a.inputSummary,
        subtitle: a.suggestedSpecialty ?? 'Phân tích AI',
        timestamp: a.createdAt.toISOString(),
        meta: a.urgencyLevel,
      })),
      ...alerts.map((a) => ({
        id: a.id,
        type: 'alert' as const,
        title: a.title,
        subtitle: a.message.slice(0, 100),
        timestamp: a.createdAt.toISOString(),
        meta: a.severity,
      })),
      ...medLogs.map((l) => ({
        id: l.id,
        type: 'medication' as const,
        title: l.medication.medicationName,
        subtitle: `${l.status === 'TAKEN' ? 'Đã uống' : 'Bỏ lỡ'} lúc ${l.scheduledTime}`,
        timestamp: l.loggedAt.toISOString(),
        meta: l.status,
      })),
    ];

    const filtered = typeFilter
      ? items.filter((i) => i.type === typeFilter)
      : items;

    return filtered
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 120);
  }

  async getHealthReport(userId: string) {
    const [user, summary, recentSymptoms, recentVitals, recentAnalyses, alerts] =
      await Promise.all([
        this.prisma.user.findUnique({
          where: { id: userId },
          select: { fullName: true, email: true, dateOfBirth: true, gender: true },
        }),
        this.getStats(userId),
        this.prisma.symptomLog.findMany({
          where: { userId },
          orderBy: { recordedAt: 'desc' },
          take: 10,
        }),
        this.prisma.vitalSign.findMany({
          where: { userId },
          orderBy: { recordedAt: 'desc' },
          take: 10,
        }),
        this.prisma.aIAnalysis.findMany({
          where: { userId },
          orderBy: { createdAt: 'desc' },
          take: 5,
        }),
        this.prisma.alert.findMany({
          where: { userId },
          orderBy: { createdAt: 'desc' },
          take: 10,
        }),
      ]);

    return {
      generatedAt: new Date().toISOString(),
      user: {
        fullName: user!.fullName,
        email: user!.email,
        dateOfBirth: user!.dateOfBirth?.toISOString(),
        gender: user!.gender ?? undefined,
      },
      summary,
      recentSymptoms: recentSymptoms.map((s) => ({
        ...s,
        bodyPart: s.bodyPart ?? undefined,
        recordedAt: s.recordedAt.toISOString(),
        createdAt: s.createdAt.toISOString(),
      })),
      recentVitals: recentVitals.map((v) => ({
        ...v,
        type: v.type as 'BLOOD_PRESSURE' | 'BLOOD_SUGAR' | 'WEIGHT',
        valueSecondary: v.valueSecondary ?? undefined,
        note: v.note ?? undefined,
        recordedAt: v.recordedAt.toISOString(),
        createdAt: v.createdAt.toISOString(),
      })),
      recentAnalyses: recentAnalyses.map((a) => ({
        id: a.id,
        userId: a.userId,
        symptomLogId: a.symptomLogId ?? undefined,
        inputSummary: a.inputSummary,
        analysis: a.analysis,
        suggestedSpecialty: a.suggestedSpecialty ?? undefined,
        urgencyLevel: a.urgencyLevel as 'LOW' | 'MEDIUM' | 'HIGH',
        createdAt: a.createdAt.toISOString(),
      })),
      alerts: alerts.map((a) => ({
        ...a,
        type: a.type as 'VITAL_ANOMALY' | 'AI_SUGGESTION' | 'MEDICATION' | 'SYSTEM',
        createdAt: a.createdAt.toISOString(),
      })),
    };
  }

  private calculateHealthScore(input: {
    unreadAlerts: number;
    lastUrgency?: string;
    latestVital: { type: string; value: number; valueSecondary: number | null } | null;
  }): number {
    let score = 85;

    if (input.unreadAlerts > 0) score -= Math.min(input.unreadAlerts * 5, 20);
    if (input.lastUrgency === 'HIGH') score -= 25;
    else if (input.lastUrgency === 'MEDIUM') score -= 10;

    if (input.latestVital?.type === 'BLOOD_PRESSURE') {
      const sys = input.latestVital.value;
      const dia = input.latestVital.valueSecondary ?? 0;
      if (sys >= 140 || dia >= 90) score -= 15;
      else if (sys < 90 || dia < 60) score -= 10;
    }

    if (input.latestVital?.type === 'BLOOD_SUGAR') {
      const val = input.latestVital.value;
      if (val >= 126 || val < 70) score -= 15;
      else if (val >= 100) score -= 5;
    }

    return Math.max(20, Math.min(100, score));
  }

  private async calculateStreak(userId: string): Promise<number> {
    const since = new Date();
    since.setDate(since.getDate() - 60);

    const [symptoms, vitals] = await Promise.all([
      this.prisma.symptomLog.findMany({
        where: { userId, recordedAt: { gte: since } },
        select: { recordedAt: true },
      }),
      this.prisma.vitalSign.findMany({
        where: { userId, recordedAt: { gte: since } },
        select: { recordedAt: true },
      }),
    ]);

    const days = new Set<string>();
    for (const item of [...symptoms, ...vitals]) {
      days.add(item.recordedAt.toISOString().split('T')[0]);
    }

    let streak = 0;
    const today = new Date();
    for (let i = 0; i < 60; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split('T')[0];
      if (days.has(key)) streak++;
      else if (i > 0) break;
    }
    return streak;
  }

  private getAchievements(data: {
    totalSymptoms: number;
    totalVitals: number;
    streak: number;
    healthScore: number;
  }) {
    const badges: { id: string; name: string; icon: string; unlocked: boolean }[] = [
      { id: 'first_log', name: 'Bước đầu', icon: '🌱', unlocked: data.totalSymptoms + data.totalVitals >= 1 },
      { id: 'streak_3', name: 'Kiên trì 3 ngày', icon: '🔥', unlocked: data.streak >= 3 },
      { id: 'streak_7', name: 'Tuần vàng', icon: '⭐', unlocked: data.streak >= 7 },
      { id: 'health_80', name: 'Sức khỏe tốt', icon: '💚', unlocked: data.healthScore >= 80 },
      { id: 'data_10', name: 'Chuyên gia dữ liệu', icon: '📊', unlocked: data.totalVitals >= 10 },
    ];
    return badges;
  }
}
