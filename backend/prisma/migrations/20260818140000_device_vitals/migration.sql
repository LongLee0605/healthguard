-- Device sync metadata on vital signs
ALTER TABLE "VitalSign" ADD COLUMN IF NOT EXISTS "source" TEXT NOT NULL DEFAULT 'MANUAL';
ALTER TABLE "VitalSign" ADD COLUMN IF NOT EXISTS "externalId" TEXT;
ALTER TABLE "VitalSign" ADD COLUMN IF NOT EXISTS "deviceName" TEXT;
ALTER TABLE "VitalSign" ADD COLUMN IF NOT EXISTS "syncedAt" TIMESTAMP(3);

CREATE INDEX IF NOT EXISTS "VitalSign_userId_source_idx" ON "VitalSign"("userId", "source");

CREATE UNIQUE INDEX IF NOT EXISTS "VitalSign_userId_source_externalId_key"
  ON "VitalSign"("userId", "source", "externalId")
  WHERE "externalId" IS NOT NULL;

CREATE TABLE IF NOT EXISTS "HealthDevice" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "source" TEXT NOT NULL,
  "deviceName" TEXT,
  "deviceModel" TEXT,
  "lastSyncAt" TIMESTAMP(3),
  "readingCount" INTEGER NOT NULL DEFAULT 0,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "HealthDevice_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "HealthDevice_userId_source_deviceName_key"
  ON "HealthDevice"("userId", "source", "deviceName");

CREATE INDEX IF NOT EXISTS "HealthDevice_userId_isActive_idx" ON "HealthDevice"("userId", "isActive");

ALTER TABLE "HealthDevice" ADD CONSTRAINT "HealthDevice_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
