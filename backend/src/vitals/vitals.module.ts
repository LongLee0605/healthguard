import { Module } from '@nestjs/common';
import { VitalsController } from './vitals.controller';
import { VitalsService } from './vitals.service';
import { AlertsModule } from '../alerts/alerts.module';

@Module({
  imports: [AlertsModule],
  controllers: [VitalsController],
  providers: [VitalsService],
  exports: [VitalsService],
})
export class VitalsModule {}
