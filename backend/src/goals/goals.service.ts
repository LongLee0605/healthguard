import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateGoalDto, UpdateGoalDto } from './dto/goal.dto';
import { weekStartKey } from '../common/schedule.util';

@Injectable()
export class GoalsService {
  constructor(private prisma: PrismaService) {}

  async findAll(userId: string) {
    const weekStart = weekStartKey();
    let goals = await this.prisma.healthGoal.findMany({
      where: { userId, weekStart },
      orderBy: { createdAt: 'asc' },
    });

    if (goals.length === 0) {
      await this.seedDefaultGoals(userId);
      goals = await this.prisma.healthGoal.findMany({
        where: { userId, weekStart },
        orderBy: { createdAt: 'asc' },
      });
    }

    return goals.map((g) => this.format(g));
  }

  async create(userId: string, dto: CreateGoalDto) {
    const goal = await this.prisma.healthGoal.create({
      data: {
        userId,
        title: dto.title,
        description: dto.description,
        targetCount: dto.targetCount ?? 1,
        unit: dto.unit ?? 'lần',
        period: 'WEEKLY',
        weekStart: weekStartKey(),
      },
    });
    return this.format(goal);
  }

  async update(userId: string, id: string, dto: UpdateGoalDto) {
    const existing = await this.prisma.healthGoal.findFirst({ where: { id, userId } });
    if (!existing) throw new NotFoundException('Không tìm thấy mục tiêu');

    const currentCount = dto.currentCount ?? existing.currentCount;
    const isCompleted =
      dto.isCompleted ?? (currentCount >= existing.targetCount || existing.isCompleted);

    const goal = await this.prisma.healthGoal.update({
      where: { id },
      data: {
        title: dto.title,
        description: dto.description,
        currentCount,
        isCompleted,
      },
    });
    return this.format(goal);
  }

  async increment(userId: string, id: string) {
    const existing = await this.prisma.healthGoal.findFirst({ where: { id, userId } });
    if (!existing) throw new NotFoundException('Không tìm thấy mục tiêu');

    const currentCount = Math.min(existing.currentCount + 1, existing.targetCount);
    const goal = await this.prisma.healthGoal.update({
      where: { id },
      data: {
        currentCount,
        isCompleted: currentCount >= existing.targetCount,
      },
    });
    return this.format(goal);
  }

  async remove(userId: string, id: string) {
    const existing = await this.prisma.healthGoal.findFirst({ where: { id, userId } });
    if (!existing) throw new NotFoundException('Không tìm thấy mục tiêu');
    await this.prisma.healthGoal.delete({ where: { id } });
    return { success: true };
  }

  async seedDefaultGoals(userId: string) {
    const weekStart = weekStartKey();
    const count = await this.prisma.healthGoal.count({ where: { userId, weekStart } });
    if (count > 0) return;

    const defaults = [
      { title: 'Đo huyết áp', targetCount: 3, unit: 'lần/tuần' },
      { title: 'Ghi triệu chứng', targetCount: 2, unit: 'lần/tuần' },
      { title: 'Uống thuốc đúng giờ', targetCount: 7, unit: 'ngày' },
    ];

    await this.prisma.healthGoal.createMany({
      data: defaults.map((d) => ({
        userId,
        title: d.title,
        targetCount: d.targetCount,
        unit: d.unit,
        period: 'WEEKLY',
        weekStart,
      })),
    });
  }

  private format(goal: {
    id: string;
    userId: string;
    title: string;
    description: string | null;
    targetCount: number;
    currentCount: number;
    unit: string | null;
    period: string;
    weekStart: string | null;
    isCompleted: boolean;
    createdAt: Date;
  }) {
    return {
      id: goal.id,
      title: goal.title,
      description: goal.description ?? undefined,
      targetCount: goal.targetCount,
      currentCount: goal.currentCount,
      unit: goal.unit ?? undefined,
      period: goal.period,
      weekStart: goal.weekStart ?? undefined,
      isCompleted: goal.isCompleted,
      progress: Math.min(100, Math.round((goal.currentCount / goal.targetCount) * 100)),
      createdAt: goal.createdAt.toISOString(),
    };
  }
}
