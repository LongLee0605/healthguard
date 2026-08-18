import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SymptomsService } from './symptoms.service';
import { CreateSymptomDto } from './dto/create-symptom.dto';
import { UpdateSymptomDto } from './dto/update-symptom.dto';

@Controller('symptoms')
@UseGuards(JwtAuthGuard)
export class SymptomsController {
  constructor(private symptomsService: SymptomsService) {}

  @Post()
  create(@Request() req: { user: { id: string } }, @Body() dto: CreateSymptomDto) {
    return this.symptomsService.create(req.user.id, dto);
  }

  @Get()
  findAll(@Request() req: { user: { id: string } }) {
    return this.symptomsService.findAll(req.user.id);
  }

  @Get('trends')
  getTrends(@Request() req: { user: { id: string } }, @Query('days') days?: string) {
    return this.symptomsService.getTrends(req.user.id, days ? parseInt(days, 10) : 30);
  }

  @Get(':id')
  findOne(@Request() req: { user: { id: string } }, @Param('id') id: string) {
    return this.symptomsService.findOne(req.user.id, id);
  }

  @Patch(':id')
  update(
    @Request() req: { user: { id: string } },
    @Param('id') id: string,
    @Body() dto: UpdateSymptomDto,
  ) {
    return this.symptomsService.update(req.user.id, id, dto);
  }

  @Delete(':id')
  remove(@Request() req: { user: { id: string } }, @Param('id') id: string) {
    return this.symptomsService.remove(req.user.id, id);
  }
}
