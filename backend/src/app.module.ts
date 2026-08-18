import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import configuration from './config/configuration';
import { validateEnv } from './config/env.validation';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { SymptomsModule } from './symptoms/symptoms.module';
import { VitalsModule } from './vitals/vitals.module';
import { AiModule } from './ai/ai.module';
import { AlertsModule } from './alerts/alerts.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { MedicationsModule } from './medications/medications.module';
import { GoalsModule } from './goals/goals.module';
import { HealthModule } from './modules/health/health.module';
import { NotificationsModule } from './notifications/notifications.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validate: process.env.NODE_ENV === 'production' ? validateEnv : undefined,
    }),
    ScheduleModule.forRoot(),
    ThrottlerModule.forRoot([
      { name: 'short', ttl: 1000, limit: 40 },
      { name: 'default', ttl: 60000, limit: 400 },
      { name: 'auth', ttl: 900000, limit: 20 },
    ]),
    PrismaModule,
    HealthModule,
    AuthModule,
    UsersModule,
    SymptomsModule,
    VitalsModule,
    AiModule,
    AlertsModule,
    DashboardModule,
    MedicationsModule,
    GoalsModule,
    NotificationsModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
