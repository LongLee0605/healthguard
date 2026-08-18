import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMedicationDto, UpdateMedicationDto, LogMedicationDto } from './dto/medication.dto';
import { parseScheduleTimes, todayDateKey } from '../common/schedule.util';

@Injectable()
export class MedicationsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreateMedicationDto) {
    const times = parseScheduleTimes(dto.schedule);
    if (times.length === 0) {
      throw new BadRequestException('Lịch uống phải chứa ít nhất một giờ HH:mm (vd: 08:00, 20:00)');
    }

    const med = await this.prisma.medicationReminder.create({
      data: { userId, ...dto, schedule: times.join(', ') },
    });
    return this.format(med);
  }

  async findAll(userId: string) {
    const items = await this.prisma.medicationReminder.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    return items.map((m) => this.format(m));
  }

  async getTodaySchedule(userId: string) {
    const date = todayDateKey();
    const meds = await this.prisma.medicationReminder.findMany({
      where: { userId, isActive: true },
      include: {
        logs: { where: { scheduledDate: date } },
      },
    });

    const items = meds.flatMap((med) => {
      const times = parseScheduleTimes(med.schedule);
      return times.map((time) => {
        const log = med.logs.find((l) => l.scheduledTime === time);
        return {
          medicationId: med.id,
          medicationName: med.medicationName,
          dosage: med.dosage,
          scheduledTime: time,
          status: log?.status ?? 'PENDING',
          logId: log?.id,
          loggedAt: log?.loggedAt.toISOString(),
        };
      });
    });

    return items.sort((a, b) => a.scheduledTime.localeCompare(b.scheduledTime));
  }

  async getAdherence(userId: string, days = 7) {
    const since = new Date();
    since.setDate(since.getDate() - days);
    const sinceKey = since.toISOString().split('T')[0];

    const logs = await this.prisma.medicationLog.findMany({
      where: { userId, scheduledDate: { gte: sinceKey } },
    });

    const taken = logs.filter((l) => l.status === 'TAKEN').length;
    const missed = logs.filter((l) => l.status === 'MISSED').length;
    const total = taken + missed;

    return {
      days,
      taken,
      missed,
      adherenceRate: total > 0 ? Math.round((taken / total) * 100) : 100,
    };
  }

  async logDose(userId: string, medicationId: string, dto: LogMedicationDto) {
    const med = await this.prisma.medicationReminder.findFirst({
      where: { id: medicationId, userId },
    });
    if (!med) throw new NotFoundException('Không tìm thấy thuốc');

    const times = parseScheduleTimes(med.schedule);
    if (!times.includes(dto.scheduledTime)) {
      throw new BadRequestException('Giờ uống không khớp lịch thuốc');
    }

    const scheduledDate = dto.scheduledDate ?? todayDateKey();

    const log = await this.prisma.medicationLog.upsert({
      where: {
        medicationId_scheduledDate_scheduledTime: {
          medicationId,
          scheduledDate,
          scheduledTime: dto.scheduledTime,
        },
      },
      create: {
        userId,
        medicationId,
        scheduledDate,
        scheduledTime: dto.scheduledTime,
        status: dto.status,
      },
      update: { status: dto.status, loggedAt: new Date() },
    });

    return {
      id: log.id,
      medicationId: log.medicationId,
      scheduledDate: log.scheduledDate,
      scheduledTime: log.scheduledTime,
      status: log.status,
      loggedAt: log.loggedAt.toISOString(),
    };
  }

  async update(userId: string, id: string, dto: UpdateMedicationDto) {
    const existing = await this.prisma.medicationReminder.findFirst({ where: { id, userId } });
    if (!existing) throw new NotFoundException('Không tìm thấy thuốc');

    const data = { ...dto };
    if (dto.schedule) {
      const times = parseScheduleTimes(dto.schedule);
      if (times.length === 0) {
        throw new BadRequestException('Lịch uống phải chứa ít nhất một giờ HH:mm');
      }
      data.schedule = times.join(', ');
    }

    const med = await this.prisma.medicationReminder.update({ where: { id }, data });
    return this.format(med);
  }

  async remove(userId: string, id: string) {
    const existing = await this.prisma.medicationReminder.findFirst({ where: { id, userId } });
    if (!existing) throw new NotFoundException('Không tìm thấy thuốc');
    await this.prisma.medicationReminder.delete({ where: { id } });
    return { success: true };
  }

  async countActive(userId: string) {
    return this.prisma.medicationReminder.count({ where: { userId, isActive: true } });
  }

  private format(med: {
    id: string;
    userId: string;
    medicationName: string;
    dosage: string;
    schedule: string;
    isActive: boolean;
    createdAt: Date;
  }) {
    const scheduleTimes = parseScheduleTimes(med.schedule);
    return {
      id: med.id,
      userId: med.userId,
      medicationName: med.medicationName,
      dosage: med.dosage,
      schedule: med.schedule,
      scheduleTimes,
      isActive: med.isActive,
      createdAt: med.createdAt.toISOString(),
    };
  }
}
