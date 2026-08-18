import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { GoalsService } from './goals.service';
import { CreateGoalDto, UpdateGoalDto } from './dto/goal.dto';

@Controller('goals')
@UseGuards(JwtAuthGuard)
export class GoalsController {
  constructor(private goalsService: GoalsService) {}

  @Get()
  findAll(@Request() req: { user: { id: string } }) {
    return this.goalsService.findAll(req.user.id);
  }

  @Post('seed')
  async seed(@Request() req: { user: { id: string } }) {
    await this.goalsService.seedDefaultGoals(req.user.id);
    return this.goalsService.findAll(req.user.id);
  }

  @Post()
  create(@Request() req: { user: { id: string } }, @Body() dto: CreateGoalDto) {
    return this.goalsService.create(req.user.id, dto);
  }

  @Patch(':id/increment')
  increment(@Request() req: { user: { id: string } }, @Param('id') id: string) {
    return this.goalsService.increment(req.user.id, id);
  }

  @Patch(':id')
  update(
    @Request() req: { user: { id: string } },
    @Param('id') id: string,
    @Body() dto: UpdateGoalDto,
  ) {
    return this.goalsService.update(req.user.id, id, dto);
  }

  @Delete(':id')
  remove(@Request() req: { user: { id: string } }, @Param('id') id: string) {
    return this.goalsService.remove(req.user.id, id);
  }
}
