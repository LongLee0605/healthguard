import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { VITAL_UNITS } from '../common/constants';
import { PrismaService } from '../prisma/prisma.service';
import { AlertsService } from '../alerts/alerts.service';
import { CreateVitalDto } from './dto/create-vital.dto';
import { UpdateVitalDto } from './dto/update-vital.dto';
import { ImportVitalsDto } from './dto/import-vitals.dto';
import { parseDevicePayload, type NormalizedVitalReading } from './device-vitals.adapter';
@Injectable()
export class VitalsService {
  constructor(
    private prisma: PrismaService,
    private alertsService: AlertsService,
  ) {}

  async create(userId: string, dto: CreateVitalDto) {
    const unit = VITAL_UNITS[dto.type];
    const vital = await this.prisma.vitalSign.create({
      data: {
        userId,
        type: dto.type,
        value: dto.value,
        valueSecondary: dto.valueSecondary,
        unit,
        note: dto.note,
        source: dto.source ?? 'MANUAL',
        externalId: dto.externalId,
        deviceName: dto.deviceName,
        recordedAt: dto.recordedAt ? new Date(dto.recordedAt) : new Date(),
      },
    });

    await this.checkAnomaly(userId, dto);

    return this.format(vital);
  }

  async importBatch(userId: string, dto: ImportVitalsDto) {
    const source = dto.source;
    const deviceName = dto.deviceName ?? '';
    const now = new Date();

    let readings: NormalizedVitalReading[] = [];
    if (dto.readings?.length) {
      readings = dto.readings.map((r) => ({
        type: r.type,
        value: r.value,
        valueSecondary: r.valueSecondary,
        recordedAt: r.recordedAt,
        externalId: r.externalId ?? `${r.type}-${r.recordedAt}-${r.value}`,
        note: r.note,
      }));
    } else if (dto.payload !== undefined && dto.payload !== null) {
      readings = parseDevicePayload(dto.format ?? 'generic', dto.payload);
    } else {
      throw new BadRequestException('Cần gửi readings hoặc payload để đồng bộ');
    }

    if (readings.length === 0) {
      throw new BadRequestException('Không tìm thấy chỉ số hợp lệ trong dữ liệu');
    }

    let imported = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (const reading of readings) {
      try {
        const existing = await this.prisma.vitalSign.findFirst({
          where: { userId, source, externalId: reading.externalId },
        });
        if (existing) {
          skipped++;
          continue;
        }

        await this.prisma.vitalSign.create({
          data: {
            userId,
            type: reading.type,
            value: reading.value,
            valueSecondary: reading.valueSecondary,
            unit: VITAL_UNITS[reading.type],
            note: reading.note,
            source,
            externalId: reading.externalId,
            deviceName: dto.deviceName,
            recordedAt: new Date(reading.recordedAt),
            syncedAt: now,
          },
        });

        imported++;
        await this.checkAnomaly(userId, {
          type: reading.type,
          value: reading.value,
          valueSecondary: reading.valueSecondary,
        });
      } catch (err) {
        errors.push(
          `${reading.type} @ ${reading.recordedAt}: ${err instanceof Error ? err.message : 'Lỗi'}`,
        );
      }
    }

    if (imported > 0) {
      await this.prisma.healthDevice.upsert({
        where: {
          userId_source_deviceName: { userId, source, deviceName },
        },
        create: {
          userId,
          source,
          deviceName,
          deviceModel: dto.deviceModel,
          lastSyncAt: now,
          readingCount: imported,
        },
        update: {
          deviceModel: dto.deviceModel ?? undefined,
          lastSyncAt: now,
          readingCount: { increment: imported },
        },
      });
    }

    return {
      imported,
      skipped,
      errors,
      total: readings.length,
      devices: await this.getDevices(userId),
    };
  }

  async getDevices(userId: string) {
    const devices = await this.prisma.healthDevice.findMany({
      where: { userId, isActive: true },
      orderBy: { lastSyncAt: 'desc' },
    });
    return devices.map((d) => ({
      id: d.id,
      source: d.source,
      deviceName: d.deviceName || undefined,
      deviceModel: d.deviceModel ?? undefined,
      lastSyncAt: d.lastSyncAt?.toISOString(),
      readingCount: d.readingCount,
    }));
  }
  async findAll(userId: string, type?: string) {
    const vitals = await this.prisma.vitalSign.findMany({
      where: { userId, ...(type ? { type } : {}) },
      orderBy: { recordedAt: 'desc' },
      take: 80,
    });
    return vitals.map((v) => this.format(v));
  }

  async getChartData(userId: string, type: string, days = 30) {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const vitals = await this.prisma.vitalSign.findMany({
      where: { userId, type, recordedAt: { gte: since } },
      orderBy: { recordedAt: 'asc' },
      take: 180,
    });

    return vitals.map((v) => ({
      date: v.recordedAt.toISOString().split('T')[0],
      value: v.value,
      valueSecondary: v.valueSecondary ?? undefined,
    }));
  }

  async findOne(userId: string, id: string) {
    const vital = await this.prisma.vitalSign.findFirst({ where: { id, userId } });
    if (!vital) throw new NotFoundException('Không tìm thấy chỉ số');
    return this.format(vital);
  }

  async update(userId: string, id: string, dto: UpdateVitalDto) {
    await this.findOne(userId, id);
    const unit = dto.type ? VITAL_UNITS[dto.type] : undefined;
    const vital = await this.prisma.vitalSign.update({
      where: { id },
      data: {
        ...(dto.type !== undefined && { type: dto.type, unit: unit ?? VITAL_UNITS[dto.type] }),
        ...(dto.value !== undefined && { value: dto.value }),
        ...(dto.valueSecondary !== undefined && { valueSecondary: dto.valueSecondary }),
        ...(dto.note !== undefined && { note: dto.note }),
        ...(dto.recordedAt !== undefined && { recordedAt: new Date(dto.recordedAt) }),
      },
    });
    return this.format(vital);
  }

  async remove(userId: string, id: string) {
    await this.findOne(userId, id);
    await this.prisma.vitalSign.delete({ where: { id } });
    return { success: true };
  }

  private async checkAnomaly(userId: string, dto: CreateVitalDto) {
    let alert: { title: string; message: string } | null = null;

    if (dto.type === 'BLOOD_PRESSURE') {
      const sys = dto.value;
      const dia = dto.valueSecondary ?? 0;
      if (sys >= 140 || dia >= 90) {
        alert = {
          title: 'Huyết áp cao',
          message: `Huyết áp ${sys}/${dia} mmHg vượt ngưỡng bình thường. Nên theo dõi và tham khảo ý kiến bác sĩ.`,
        };
      } else if (sys < 90 || dia < 60) {
        alert = {
          title: 'Huyết áp thấp',
          message: `Huyết áp ${sys}/${dia} mmHg thấp hơn bình thường. Hãy nghỉ ngơi và theo dõi.`,
        };
      }
    } else if (dto.type === 'BLOOD_SUGAR') {
      if (dto.value >= 126) {
        alert = {
          title: 'Đường huyết cao',
          message: `Đường huyết ${dto.value} mg/dL ở mức cao. Nên kiểm tra lại và tham khảo bác sĩ.`,
        };
      } else if (dto.value < 70) {
        alert = {
          title: 'Đường huyết thấp',
          message: `Đường huyết ${dto.value} mg/dL thấp. Hãy bổ sung đường và theo dõi.`,
        };
      }
    } else if (dto.type === 'HEART_RATE') {
      if (dto.value > 100) {
        alert = {
          title: 'Nhịp tim nhanh',
          message: `Nhịp tim ${dto.value} bpm cao hơn bình thường. Nghỉ ngơi và theo dõi.`,
        };
      } else if (dto.value < 60) {
        alert = {
          title: 'Nhịp tim chậm',
          message: `Nhịp tim ${dto.value} bpm thấp hơn bình thường. Tham khảo bác sĩ nếu kéo dài.`,
        };
      }
    } else if (dto.type === 'TEMPERATURE') {
      if (dto.value >= 38) {
        alert = {
          title: 'Sốt',
          message: `Nhiệt độ ${dto.value}°C — có thể đang sốt. Theo dõi và nghỉ ngơi.`,
        };
      } else if (dto.value < 35.5) {
        alert = {
          title: 'Thân nhiệt thấp',
          message: `Nhiệt độ ${dto.value}°C thấp bất thường. Cần theo dõi.`,
        };
      }
    } else if (dto.type === 'SPO2') {
      if (dto.value < 95) {
        alert = {
          title: 'SpO2 thấp',
          message: `SpO2 ${dto.value}% dưới ngưỡng khuyến nghị. Tham khảo bác sĩ nếu tái diễn.`,
        };
      }
    }

    if (alert) {
      await this.alertsService.create(userId, {
        ...alert,
        type: 'VITAL_ANOMALY',
        severity: 'HIGH',
      });
    }
  }

  private format(vital: {
    id: string;
    userId: string;
    type: string;
    value: number;
    valueSecondary: number | null;
    unit: string;
    note: string | null;
    source?: string;
    externalId?: string | null;
    deviceName?: string | null;
    syncedAt?: Date | null;
    recordedAt: Date;
    createdAt: Date;
  }) {
    return {
      id: vital.id,
      userId: vital.userId,
      type: vital.type,
      value: vital.value,
      valueSecondary: vital.valueSecondary ?? undefined,
      unit: vital.unit,
      note: vital.note ?? undefined,
      source: vital.source ?? 'MANUAL',
      deviceName: vital.deviceName ?? undefined,
      syncedAt: vital.syncedAt?.toISOString(),
      recordedAt: vital.recordedAt.toISOString(),
      createdAt: vital.createdAt.toISOString(),
    };
  }}
