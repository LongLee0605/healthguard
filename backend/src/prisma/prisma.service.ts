import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

function withPoolParams(url: string): string {
  const extras: string[] = [];
  if (!url.includes('connection_limit=')) {
    extras.push(`connection_limit=${process.env.DB_POOL_SIZE ?? '20'}`);
  }
  if (!url.includes('pool_timeout=')) {
    extras.push('pool_timeout=10');
  }
  if (!extras.length) return url;
  return `${url}${url.includes('?') ? '&' : '?'}${extras.join('&')}`;
}

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    const url = process.env.DATABASE_URL;
    super(url ? { datasources: { db: { url: withPoolParams(url) } } } : undefined);
  }

  async onModuleInit() {
    await this.$connect();
    await this.ensureHotIndexes();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  private async ensureHotIndexes() {
    const statements = [
      `CREATE INDEX IF NOT EXISTS "Alert_userId_createdAt_idx" ON "Alert" ("userId", "createdAt")`,
      `CREATE INDEX IF NOT EXISTS "MedicationReminder_userId_isActive_idx" ON "MedicationReminder" ("userId", "isActive")`,
    ];
    for (const sql of statements) {
      try {
        await this.$executeRawUnsafe(sql);
      } catch (err) {
        this.logger.warn(`Index skip: ${(err as Error).message}`);
      }
    }
  }
}
