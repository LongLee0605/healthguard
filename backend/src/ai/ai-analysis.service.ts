import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AiService } from './ai.service';
import { AlertsService } from '../alerts/alerts.service';
import { AnalyzeSymptomDto } from './dto/analyze-symptom.dto';
import { VITAL_LABELS } from '../common/constants';

@Injectable()
export class AiAnalysisService {
  constructor(
    private prisma: PrismaService,
    private aiService: AiService,
    private alertsService: AlertsService,
  ) {}

  async analyze(userId: string, dto: AnalyzeSymptomDto) {
    const recentVitals = await this.prisma.vitalSign.findMany({
      where: { userId },
      orderBy: { recordedAt: 'desc' },
      take: 5,
    });

    const recentVitalsSummary = recentVitals
      .map((v) => {
        const label = VITAL_LABELS[v.type as keyof typeof VITAL_LABELS] ?? v.type;
        const val = v.valueSecondary ? `${v.value}/${v.valueSecondary}` : `${v.value}`;
        return `${label}: ${val} ${v.unit}`;
      })
      .join('; ');

    const result = await this.aiService.analyzeSymptoms({
      description: dto.description,
      severity: dto.severity,
      bodyPart: dto.bodyPart,
      recentVitalsSummary,
      vitals: recentVitals.map((v) => ({
        type: v.type,
        value: v.value,
        valueSecondary: v.valueSecondary,
        unit: v.unit,
      })),
    });

    const analysis = await this.prisma.aIAnalysis.create({
      data: {
        userId,
        symptomLogId: dto.symptomLogId,
        inputSummary: `${dto.description} (mức ${dto.severity}/10)`,
        analysis: result.analysis,
        suggestedSpecialty: result.suggestedSpecialty,
        urgencyLevel: result.urgencyLevel,
      },
    });

    if (result.urgencyLevel === 'HIGH') {
      const truncated =
        result.analysis.length > 120
          ? `${result.analysis.slice(0, 117)}...`
          : result.analysis;
      await this.alertsService.create(userId, {
        title: `Cảnh báo AI: ${result.suggestedSpecialty ?? 'Cần chú ý'}`,
        message: truncated,
        type: 'AI_SUGGESTION',
        severity: 'HIGH',
      });
    } else if (result.urgencyLevel === 'MEDIUM') {
      await this.alertsService.create(userId, {
        title: `Gợi ý AI: ${result.suggestedSpecialty ?? 'Theo dõi'}`,
        message: result.analysis,
        type: 'AI_SUGGESTION',
        severity: 'MEDIUM',
      });
    }

    return {
      ...this.format(analysis),
      differentials: result.differentials ?? [],
      redFlags: result.redFlags ?? [],
    };
  }

  async getHistory(userId: string) {
    const items = await this.prisma.aIAnalysis.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    return items.map((a) => this.format(a));
  }

  async getOne(userId: string, id: string) {
    const item = await this.prisma.aIAnalysis.findFirst({ where: { id, userId } });
    return item ? this.format(item) : null;
  }

  private format(item: {
    id: string;
    userId: string;
    symptomLogId: string | null;
    inputSummary: string;
    analysis: string;
    suggestedSpecialty: string | null;
    urgencyLevel: string;
    createdAt: Date;
  }) {
    return {
      id: item.id,
      userId: item.userId,
      symptomLogId: item.symptomLogId ?? undefined,
      inputSummary: item.inputSummary,
      analysis: item.analysis,
      suggestedSpecialty: item.suggestedSpecialty ?? undefined,
      urgencyLevel: item.urgencyLevel,
      createdAt: item.createdAt.toISOString(),
    };
  }
}
