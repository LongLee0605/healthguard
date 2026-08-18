import { Injectable, Logger } from '@nestjs/common';

import { Cron } from '@nestjs/schedule';

import { PrismaService } from '../prisma/prisma.service';

import { AlertsService } from '../alerts/alerts.service';

import { parseScheduleTimes, currentTimeKey } from '../common/schedule.util';



@Injectable()

export class MedicationReminderService {

  private readonly logger = new Logger(MedicationReminderService.name);



  constructor(

    private prisma: PrismaService,

    private alertsService: AlertsService,

  ) {}



  @Cron('* * * * *')

  async checkMedicationReminders() {

    const currentTime = currentTimeKey();



    const medications = await this.prisma.medicationReminder.findMany({

      where: { isActive: true },

    });



    for (const med of medications) {

      const scheduleTimes = parseScheduleTimes(med.schedule);

      if (!scheduleTimes.includes(currentTime)) continue;



      const created = await this.alertsService.createMedicationReminder(med.userId, {

        medicationId: med.id,

        medicationName: med.medicationName,

        dosage: med.dosage,

        schedule: currentTime,

      });



      if (created) {

        this.logger.log(`Medication alert created for ${med.medicationName} (${med.userId})`);

      }

    }

  }

}


