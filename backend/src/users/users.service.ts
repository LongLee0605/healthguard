import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';

const profileSelect = {
  id: true,
  email: true,
  fullName: true,
  dateOfBirth: true,
  gender: true,
  height: true,
  bloodType: true,
  allergies: true,
  chronicConditions: true,
  emergencyContact: true,
  emergencyPhone: true,
  createdAt: true,
} as const;

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: profileSelect,
    });

    if (!user) throw new NotFoundException('Không tìm thấy người dùng');

    return this.format(user);
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        fullName: dto.fullName,
        gender: dto.gender,
        dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : undefined,
        height: dto.height,
        bloodType: dto.bloodType,
        allergies: dto.allergies,
        chronicConditions: dto.chronicConditions,
        emergencyContact: dto.emergencyContact,
        emergencyPhone: dto.emergencyPhone,
      },
      select: profileSelect,
    });

    return this.format(user);
  }

  async exportData(userId: string) {
    const [user, symptoms, vitals, medications, alerts, analyses, chat, goals, medLogs] =
      await Promise.all([
        this.prisma.user.findUnique({ where: { id: userId }, select: profileSelect }),
        this.prisma.symptomLog.findMany({ where: { userId }, orderBy: { recordedAt: 'desc' } }),
        this.prisma.vitalSign.findMany({ where: { userId }, orderBy: { recordedAt: 'desc' } }),
        this.prisma.medicationReminder.findMany({ where: { userId } }),
        this.prisma.alert.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } }),
        this.prisma.aIAnalysis.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } }),
        this.prisma.chatMessage.findMany({ where: { userId }, orderBy: { createdAt: 'asc' } }),
        this.prisma.healthGoal.findMany({ where: { userId } }),
        this.prisma.medicationLog.findMany({ where: { userId }, orderBy: { loggedAt: 'desc' } }),
      ]);

    return {
      exportedAt: new Date().toISOString(),
      version: '1.0',
      profile: user ? this.format(user) : null,
      symptoms,
      vitals,
      medications,
      medicationLogs: medLogs,
      alerts,
      aiAnalyses: analyses,
      chatMessages: chat,
      healthGoals: goals,
    };
  }

  async getHealthContext(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        fullName: true,
        dateOfBirth: true,
        gender: true,
        height: true,
        bloodType: true,
        allergies: true,
        chronicConditions: true,
      },
    });
    if (!user) return '';

    const parts: string[] = [];
    if (user.gender) parts.push(`Giới tính: ${user.gender}`);
    if (user.dateOfBirth) {
      const age = Math.floor(
        (Date.now() - user.dateOfBirth.getTime()) / (365.25 * 24 * 60 * 60 * 1000),
      );
      parts.push(`Tuổi: ${age}`);
    }
    if (user.height) parts.push(`Chiều cao: ${user.height} cm`);
    if (user.bloodType) parts.push(`Nhóm máu: ${user.bloodType}`);
    if (user.allergies) parts.push(`Dị ứng: ${user.allergies}`);
    if (user.chronicConditions) parts.push(`Bệnh nền: ${user.chronicConditions}`);

    return parts.join('. ');
  }

  private format(user: {
    id: string;
    email: string;
    fullName: string;
    dateOfBirth: Date | null;
    gender: string | null;
    height: number | null;
    bloodType: string | null;
    allergies: string | null;
    chronicConditions: string | null;
    emergencyContact: string | null;
    emergencyPhone: string | null;
    createdAt: Date;
  }) {
    return {
      ...user,
      dateOfBirth: user.dateOfBirth?.toISOString(),
      height: user.height ?? undefined,
      bloodType: user.bloodType ?? undefined,
      allergies: user.allergies ?? undefined,
      chronicConditions: user.chronicConditions ?? undefined,
      emergencyContact: user.emergencyContact ?? undefined,
      emergencyPhone: user.emergencyPhone ?? undefined,
      createdAt: user.createdAt.toISOString(),
    };
  }
}
