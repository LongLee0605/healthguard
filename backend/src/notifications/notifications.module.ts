import { Module } from '@nestjs/common';
import { AlertsModule } from '../alerts/alerts.module';
import { MedicationReminderService } from './medication-reminder.service';

@Module({
  imports: [AlertsModule],
  providers: [MedicationReminderService],
})
export class NotificationsModule {}
