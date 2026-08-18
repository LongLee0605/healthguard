-- AlterTable
ALTER TABLE "Alert" ADD COLUMN "severity" TEXT NOT NULL DEFAULT 'MEDIUM';
ALTER TABLE "Alert" ADD COLUMN "sourceId" TEXT;

-- CreateIndex
CREATE INDEX "Alert_userId_type_sourceId_createdAt_idx" ON "Alert"("userId", "type", "sourceId", "createdAt");
