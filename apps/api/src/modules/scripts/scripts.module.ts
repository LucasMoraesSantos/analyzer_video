import { Module } from '@nestjs/common';
import { AI_PROVIDER_TOKEN } from '../summaries/providers/ai-provider.types';
import { OpenAIProvider } from '../summaries/providers/openai/openai.provider';
import { ScriptsController } from './scripts.controller';
import { ScriptsService } from './scripts.service';

@Module({
  controllers: [ScriptsController],
  providers: [
    ScriptsService,
    {
      provide: AI_PROVIDER_TOKEN,
      useClass: OpenAIProvider
    }
  ],
  exports: [ScriptsService]
})
export class ScriptsModule {}
