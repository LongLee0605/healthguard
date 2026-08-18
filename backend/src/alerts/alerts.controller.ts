import { Controller, Get, Patch, Param, Query, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AlertsService } from './alerts.service';

@Controller('alerts')
@UseGuards(JwtAuthGuard)
export class AlertsController {
  constructor(private alertsService: AlertsService) {}

  @Get('since')
  findSince(
    @Request() req: { user: { id: string } },
    @Query('after') after: string,
  ) {
    return this.alertsService.findSince(req.user.id, after ?? '');
  }

  @Get('unread-count')
  unreadCount(@Request() req: { user: { id: string } }) {
    return this.alertsService.unreadCount(req.user.id);
  }

  @Get()
  findAll(
    @Request() req: { user: { id: string } },
    @Query('unreadOnly') unreadOnly?: string,
  ) {
    return this.alertsService.findAll(req.user.id, unreadOnly === 'true');
  }

  @Patch(':id/read')
  markRead(@Request() req: { user: { id: string } }, @Param('id') id: string) {
    return this.alertsService.markRead(req.user.id, id);
  }

  @Patch('read-all')
  markAllRead(@Request() req: { user: { id: string } }) {
    return this.alertsService.markAllRead(req.user.id);
  }
}
