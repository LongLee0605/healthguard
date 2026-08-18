-- Extended user profile
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "height" DOUBLE PRECISION;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "bloodType" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "allergies" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "chronicConditions" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "emergencyContact" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "emergencyPhone" TEXT;

-- Medication adherence logs
CREATE TABLE IF NOT EXISTS "MedicationLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "medicationId" TEXT NOT NULL,
    "scheduledDate" TEXT NOT NULL,
    "scheduledTime" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "loggedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MedicationLog_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "MedicationLog_medicationId_scheduledDate_scheduledTime_key"
    ON "MedicationLog"("medicationId", "scheduledDate", "scheduledTime");
CREATE INDEX IF NOT EXISTS "MedicationLog_userId_loggedAt_idx" ON "MedicationLog"("userId", "loggedAt");

ALTER TABLE "MedicationLog" ADD CONSTRAINT "MedicationLog_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MedicationLog" ADD CONSTRAINT "MedicationLog_medicationId_fkey"
    FOREIGN KEY ("medicationId") REFERENCES "MedicationReminder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Weekly health goals
CREATE TABLE IF NOT EXISTS "HealthGoal" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "targetCount" INTEGER NOT NULL DEFAULT 1,
    "currentCount" INTEGER NOT NULL DEFAULT 0,
    "unit" TEXT,
    "period" TEXT NOT NULL DEFAULT 'WEEKLY',
    "weekStart" TEXT,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "HealthGoal_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "HealthGoal_userId_weekStart_idx" ON "HealthGoal"("userId", "weekStart");

ALTER TABLE "HealthGoal" ADD CONSTRAINT "HealthGoal_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
