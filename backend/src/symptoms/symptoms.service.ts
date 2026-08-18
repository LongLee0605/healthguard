import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSymptomDto } from './dto/create-symptom.dto';
import { UpdateSymptomDto } from './dto/update-symptom.dto';

@Injectable()
export class SymptomsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreateSymptomDto) {
    const log = await this.prisma.symptomLog.create({
      data: {
        userId,
        description: dto.description,
        severity: dto.severity,
        bodyPart: dto.bodyPart,
        recordedAt: dto.recordedAt ? new Date(dto.recordedAt) : new Date(),
      },
    });

    return this.format(log);
  }

  async findAll(userId: string) {
    const logs = await this.prisma.symptomLog.findMany({
      where: { userId },
      orderBy: { recordedAt: 'desc' },
      take: 80,
    });
    return logs.map((l) => this.format(l));
  }

  async findOne(userId: string, id: string) {
    const log = await this.prisma.symptomLog.findFirst({
      where: { id, userId },
    });
    if (!log) throw new NotFoundException('Không tìm thấy triệu chứng');
    return this.format(log);
  }

  async update(userId: string, id: string, dto: UpdateSymptomDto) {
    await this.findOne(userId, id);
    const log = await this.prisma.symptomLog.update({
      where: { id },
      data: {
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.severity !== undefined && { severity: dto.severity }),
        ...(dto.bodyPart !== undefined && { bodyPart: dto.bodyPart }),
        ...(dto.recordedAt !== undefined && { recordedAt: new Date(dto.recordedAt) }),
      },
    });
    return this.format(log);
  }

  async remove(userId: string, id: string) {
    await this.findOne(userId, id);
    await this.prisma.symptomLog.delete({ where: { id } });
    return { success: true };
  }

  async getTrends(userId: string, days = 30) {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const logs = await this.prisma.symptomLog.findMany({
      where: { userId, recordedAt: { gte: since } },
      orderBy: { recordedAt: 'desc' },
      take: 200,
    });

    const byBodyPart = new Map<string, { count: number; severities: number[]; lastAt: Date }>();
    for (const log of logs) {
      const key = log.bodyPart?.trim() || 'Toàn thân';
      const entry = byBodyPart.get(key) ?? { count: 0, severities: [], lastAt: log.recordedAt };
      entry.count += 1;
      entry.severities.push(log.severity);
      if (log.recordedAt > entry.lastAt) entry.lastAt = log.recordedAt;
      byBodyPart.set(key, entry);
    }

    return Array.from(byBodyPart.entries())
      .map(([bodyPart, data]) => ({
        bodyPart,
        count: data.count,
        avgSeverity: Math.round((data.severities.reduce((a, b) => a + b, 0) / data.count) * 10) / 10,
        lastRecordedAt: data.lastAt.toISOString(),
        trend: data.count >= 3 ? 'RECURRING' : data.count >= 2 ? 'REPEAT' : 'NORMAL',
      }))
      .sort((a, b) => b.count - a.count);
  }

  private format(log: {
    id: string;
    userId: string;
    description: string;
    severity: number;
    bodyPart: string | null;
    recordedAt: Date;
    createdAt: Date;
  }) {
    return {
      id: log.id,
      userId: log.userId,
      description: log.description,
      severity: log.severity,
      bodyPart: log.bodyPart ?? undefined,
      recordedAt: log.recordedAt.toISOString(),
      createdAt: log.createdAt.toISOString(),
    };
  }
}
