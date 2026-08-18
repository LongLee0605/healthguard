import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('Demo@123', 10);

  const user = await prisma.user.upsert({
    where: { email: 'demo@healthguard.vn' },
    update: {},
    create: {
      email: 'demo@healthguard.vn',
      passwordHash,
      fullName: 'Nguyễn Văn Demo',
      gender: 'male',
      dateOfBirth: new Date('1998-05-15'),
    },
  });

  const now = new Date();
  const daysAgo = (d: number) => {
    const date = new Date(now);
    date.setDate(date.getDate() - d);
    return date;
  };

  await prisma.symptomLog.deleteMany({ where: { userId: user.id } });
  await prisma.vitalSign.deleteMany({ where: { userId: user.id } });
  await prisma.aIAnalysis.deleteMany({ where: { userId: user.id } });
  await prisma.alert.deleteMany({ where: { userId: user.id } });

  await prisma.symptomLog.createMany({
    data: [
      { userId: user.id, description: 'Đau đầu nhẹ, căng thẳng do làm việc', severity: 4, bodyPart: 'Đầu', recordedAt: daysAgo(2) },
      { userId: user.id, description: 'Mệt mỏi, khó ngủ', severity: 5, bodyPart: 'Toàn thân', recordedAt: daysAgo(5) },
      { userId: user.id, description: 'Đau họng, sổ mũi', severity: 3, bodyPart: 'Họng', recordedAt: daysAgo(10) },
    ],
  });

  await prisma.vitalSign.createMany({
    data: [
      { userId: user.id, type: 'BLOOD_PRESSURE', value: 118, valueSecondary: 76, unit: 'mmHg', recordedAt: daysAgo(1) },
      { userId: user.id, type: 'BLOOD_PRESSURE', value: 122, valueSecondary: 80, unit: 'mmHg', recordedAt: daysAgo(7) },
      { userId: user.id, type: 'BLOOD_PRESSURE', value: 125, valueSecondary: 82, unit: 'mmHg', recordedAt: daysAgo(14) },
      { userId: user.id, type: 'BLOOD_SUGAR', value: 95, unit: 'mg/dL', recordedAt: daysAgo(1) },
      { userId: user.id, type: 'BLOOD_SUGAR', value: 102, unit: 'mg/dL', recordedAt: daysAgo(7) },
      { userId: user.id, type: 'WEIGHT', value: 68.5, unit: 'kg', recordedAt: daysAgo(1) },
      { userId: user.id, type: 'WEIGHT', value: 68.8, unit: 'kg', recordedAt: daysAgo(7) },
      { userId: user.id, type: 'WEIGHT', value: 69.0, unit: 'kg', recordedAt: daysAgo(14) },
    ],
  });

  await prisma.aIAnalysis.create({
    data: {
      userId: user.id,
      inputSummary: 'Đau đầu nhẹ (mức 4/10)',
      analysis: 'Đau đầu mức nhẹ có thể do căng thẳng. Nghỉ ngơi, uống đủ nước và tránh màn hình lâu.',
      suggestedSpecialty: 'Thần kinh',
      urgencyLevel: 'LOW',
    },
  });

  await prisma.medicationReminder.deleteMany({ where: { userId: user.id } });

  await prisma.medicationReminder.createMany({
    data: [
      { userId: user.id, medicationName: 'Paracetamol', dosage: '500mg, 1 viên', schedule: '08:00, 20:00 hàng ngày' },
      { userId: user.id, medicationName: 'Vitamin D3', dosage: '1000 IU, 1 viên', schedule: '07:30 sáng' },
    ],
  });

  await prisma.alert.create({
    data: {
      userId: user.id,
      title: 'Chào mừng HealthGuard',
      message: 'Hệ thống đã sẵn sàng. Thông tin chỉ mang tính tham khảo, không thay thế tư vấn y khoa.',
      type: 'SYSTEM',
    },
  });

  console.log('Seed completed. Demo user: demo@healthguard.vn / Demo@123');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
