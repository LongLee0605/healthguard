import { Module } from '@nestjs/common';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { AiAnalysisService } from './ai-analysis.service';
import { ChatService } from './chat.service';
import { LocalLlmService } from './local-llm.service';
import { RagService } from './rag.service';
import { AlertsModule } from '../alerts/alerts.module';

@Module({
  imports: [AlertsModule],
  controllers: [AiController],
  providers: [AiService, AiAnalysisService, ChatService, LocalLlmService, RagService],
  exports: [AiService, AiAnalysisService, ChatService, LocalLlmService, RagService],
})
export class AiModule {}
