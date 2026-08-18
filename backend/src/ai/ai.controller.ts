import { Controller, Post, Get, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AiAnalysisService } from './ai-analysis.service';
import { ChatService } from './chat.service';
import { AnalyzeSymptomDto } from './dto/analyze-symptom.dto';
import { ChatMessageDto } from './dto/chat-message.dto';

@Controller('ai')
@UseGuards(JwtAuthGuard)
export class AiController {
  constructor(
    private aiAnalysisService: AiAnalysisService,
    private chatService: ChatService,
  ) {}

  @Post('analyze')
  analyze(@Request() req: { user: { id: string } }, @Body() dto: AnalyzeSymptomDto) {
    return this.aiAnalysisService.analyze(req.user.id, dto);
  }

  @Get('history')
  getHistory(@Request() req: { user: { id: string } }) {
    return this.aiAnalysisService.getHistory(req.user.id);
  }

  @Get('history/:id')
  getOne(@Request() req: { user: { id: string } }, @Param('id') id: string) {
    return this.aiAnalysisService.getOne(req.user.id, id);
  }

  @Get('chat')
  getChatHistory(@Request() req: { user: { id: string } }) {
    return this.chatService.getHistory(req.user.id);
  }

  @Post('chat')
  sendChat(@Request() req: { user: { id: string } }, @Body() dto: ChatMessageDto) {
    return this.chatService.sendMessage(req.user.id, dto.message);
  }

  @Delete('chat')
  clearChat(@Request() req: { user: { id: string } }) {
    return this.chatService.clearHistory(req.user.id);
  }

  @Get('weekly-insight')
  weeklyInsight(@Request() req: { user: { id: string } }) {
    return this.chatService.getWeeklyInsight(req.user.id);
  }
}
