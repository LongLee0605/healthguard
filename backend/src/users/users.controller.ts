import { Controller, Get, Patch, Body, UseGuards, Request, Res } from '@nestjs/common';
import type { Response } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get('me')
  getProfile(@Request() req: { user: { id: string } }) {
    return this.usersService.getProfile(req.user.id);
  }

  @Patch('me')
  updateProfile(@Request() req: { user: { id: string } }, @Body() dto: UpdateProfileDto) {
    return this.usersService.updateProfile(req.user.id, dto);
  }

  @Get('me/export')
  async exportData(@Request() req: { user: { id: string } }, @Res() res: Response) {
    const data = await this.usersService.exportData(req.user.id);
    const filename = `healthguard-export-${new Date().toISOString().split('T')[0]}.json`;
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(JSON.stringify(data, null, 2));
  }
}
