import { Module } from '@nestjs/common';
import { SummariesController } from './summaries.controller';
import { OpenAIProvider } from './providers/openai/openai.provider';
import { AI_PROVIDER_TOKEN } from './providers/ai-provider.types';
import { SummariesService } from './summaries.service';

@Module({
  controllers: [SummariesController],
  providers: [
    SummariesService,
    {
      provide: AI_PROVIDER_TOKEN,
      useClass: OpenAIProvider
    }
  ],
  exports: [SummariesService]
})
export class SummariesModule {}
