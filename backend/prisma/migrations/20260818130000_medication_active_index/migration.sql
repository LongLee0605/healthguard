-- Faster medication cron lookup
CREATE INDEX IF NOT EXISTS "MedicationReminder_isActive_idx" ON "MedicationReminder"("isActive");
