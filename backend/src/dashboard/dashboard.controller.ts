import { Controller, Get, Query, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { DashboardService } from './dashboard.service';

@Controller('dashboard')
@UseGuards(JwtAuthGuard)
export class DashboardController {
  constructor(private dashboardService: DashboardService) {}

  @Get('stats')
  getStats(@Request() req: { user: { id: string } }) {
    return this.dashboardService.getStats(req.user.id);
  }

  @Get('activity')
  getActivity(@Request() req: { user: { id: string } }) {
    return this.dashboardService.getRecentActivity(req.user.id);
  }

  @Get('timeline')
  getTimeline(
    @Request() req: { user: { id: string } },
    @Query('days') days?: string,
    @Query('type') type?: string,
  ) {
    return this.dashboardService.getTimeline(
      req.user.id,
      days ? parseInt(days, 10) : 30,
      type,
    );
  }

  @Get('report')
  getReport(@Request() req: { user: { id: string } }) {
    return this.dashboardService.getHealthReport(req.user.id);
  }
}
