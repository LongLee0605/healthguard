import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { MedicationsService } from './medications.service';
import { CreateMedicationDto, UpdateMedicationDto, LogMedicationDto } from './dto/medication.dto';

@Controller('medications')
@UseGuards(JwtAuthGuard)
export class MedicationsController {
  constructor(private medicationsService: MedicationsService) {}

  @Post()
  create(@Request() req: { user: { id: string } }, @Body() dto: CreateMedicationDto) {
    return this.medicationsService.create(req.user.id, dto);
  }

  @Get()
  findAll(@Request() req: { user: { id: string } }) {
    return this.medicationsService.findAll(req.user.id);
  }

  @Get('today')
  getToday(@Request() req: { user: { id: string } }) {
    return this.medicationsService.getTodaySchedule(req.user.id);
  }

  @Get('adherence')
  getAdherence(@Request() req: { user: { id: string } }, @Query('days') days?: string) {
    return this.medicationsService.getAdherence(req.user.id, days ? parseInt(days, 10) : 7);
  }

  @Post(':id/log')
  logDose(
    @Request() req: { user: { id: string } },
    @Param('id') id: string,
    @Body() dto: LogMedicationDto,
  ) {
    return this.medicationsService.logDose(req.user.id, id, dto);
  }

  @Patch(':id')
  update(
    @Request() req: { user: { id: string } },
    @Param('id') id: string,
    @Body() dto: UpdateMedicationDto,
  ) {
    return this.medicationsService.update(req.user.id, id, dto);
  }

  @Delete(':id')
  remove(@Request() req: { user: { id: string } }, @Param('id') id: string) {
    return this.medicationsService.remove(req.user.id, id);
  }
}
