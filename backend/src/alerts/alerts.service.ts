import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export type AlertSeverity = 'LOW' | 'MEDIUM' | 'HIGH';

@Injectable()
export class AlertsService {
  constructor(private prisma: PrismaService) {}

  async create(
    userId: string,
    data: {
      title: string;
      message: string;
      type: string;
      severity?: AlertSeverity;
      sourceId?: string;
    },
  ) {
    const severity = data.severity ?? this.defaultSeverity(data.type);
    const alert = await this.prisma.alert.create({
      data: {
        userId,
        title: data.title,
        message: data.message,
        type: data.type,
        severity,
        sourceId: data.sourceId,
      },
    });
    return this.format(alert);
  }

  async createMedicationReminder(
    userId: string,
    data: {
      medicationId: string;
      medicationName: string;
      dosage: string;
      schedule: string;
    },
  ): Promise<ReturnType<typeof this.format> | null> {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const existing = await this.prisma.alert.findFirst({
      where: {
        userId,
        type: 'MEDICATION',
        sourceId: data.medicationId,
        createdAt: { gte: startOfDay, lte: endOfDay },
        title: { contains: data.schedule },
      },
    });

    if (existing) return null;

    return this.create(userId, {
      title: `Nhắc uống thuốc (${data.schedule})`,
      message: `Đã đến giờ uống ${data.medicationName}${data.dosage ? ` — ${data.dosage}` : ''}.`,
      type: 'MEDICATION',
      severity: 'MEDIUM',
      sourceId: data.medicationId,
    });
  }

  async findAll(userId: string, unreadOnly = false) {
    const alerts = await this.prisma.alert.findMany({
      where: { userId, ...(unreadOnly ? { isRead: false } : {}) },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    return alerts.map((a) => this.format(a));
  }

  async unreadCount(userId: string) {
    const count = await this.prisma.alert.count({ where: { userId, isRead: false } });
    return { count };
  }

  async findSince(userId: string, after: string) {
    const afterDate = new Date(after);
    if (Number.isNaN(afterDate.getTime())) {
      return [];
    }

    const alerts = await this.prisma.alert.findMany({
      where: {
        userId,
        createdAt: { gt: afterDate },
      },
      orderBy: { createdAt: 'asc' },
      take: 20,
    });
    return alerts.map((a) => this.format(a));
  }

  async markRead(userId: string, id: string) {
    await this.prisma.alert.updateMany({
      where: { id, userId },
      data: { isRead: true },
    });
    return { success: true };
  }

  async markAllRead(userId: string) {
    await this.prisma.alert.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
    return { success: true };
  }

  private defaultSeverity(type: string): AlertSeverity {
    switch (type) {
      case 'VITAL_ANOMALY':
        return 'HIGH';
      case 'MEDICATION':
        return 'MEDIUM';
      case 'AI_SUGGESTION':
        return 'HIGH';
      default:
        return 'MEDIUM';
    }
  }

  private format(alert: {
    id: string;
    userId: string;
    title: string;
    message: string;
    type: string;
    severity: string;
    sourceId: string | null;
    isRead: boolean;
    createdAt: Date;
  }) {
    return {
      id: alert.id,
      userId: alert.userId,
      title: alert.title,
      message: alert.message,
      type: alert.type,
      severity: alert.severity as AlertSeverity,
      sourceId: alert.sourceId ?? undefined,
      isRead: alert.isRead,
      createdAt: alert.createdAt.toISOString(),
    };
  }
}
