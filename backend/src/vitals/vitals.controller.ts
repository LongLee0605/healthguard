import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { VitalsService } from './vitals.service';
import { CreateVitalDto } from './dto/create-vital.dto';
import { UpdateVitalDto } from './dto/update-vital.dto';
import { ImportVitalsDto } from './dto/import-vitals.dto';

@Controller('vitals')
@UseGuards(JwtAuthGuard)
export class VitalsController {
  constructor(private vitalsService: VitalsService) {}

  @Post()
  create(@Request() req: { user: { id: string } }, @Body() dto: CreateVitalDto) {
    return this.vitalsService.create(req.user.id, dto);
  }

  @Post('import')
  importBatch(@Request() req: { user: { id: string } }, @Body() dto: ImportVitalsDto) {
    return this.vitalsService.importBatch(req.user.id, dto);
  }

  @Get()
  findAll(@Request() req: { user: { id: string } }, @Query('type') type?: string) {
    return this.vitalsService.findAll(req.user.id, type);
  }

  @Get('chart')
  getChart(
    @Request() req: { user: { id: string } },
    @Query('type') type: string,
    @Query('days') days?: string,
  ) {
    return this.vitalsService.getChartData(req.user.id, type, days ? parseInt(days, 10) : 30);
  }

  @Get('devices')
  getDevices(@Request() req: { user: { id: string } }) {
    return this.vitalsService.getDevices(req.user.id);
  }
  @Get(':id')
  findOne(@Request() req: { user: { id: string } }, @Param('id') id: string) {
    return this.vitalsService.findOne(req.user.id, id);
  }

  @Patch(':id')
  update(
    @Request() req: { user: { id: string } },
    @Param('id') id: string,
    @Body() dto: UpdateVitalDto,
  ) {
    return this.vitalsService.update(req.user.id, id, dto);
  }

  @Delete(':id')
  remove(@Request() req: { user: { id: string } }, @Param('id') id: string) {
    return this.vitalsService.remove(req.user.id, id);
  }
}
