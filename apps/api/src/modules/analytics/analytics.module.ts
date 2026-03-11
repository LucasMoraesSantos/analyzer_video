import { Module } from '@nestjs/common';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { TrendScoreService } from './services/trend-score.service';

@Module({
  controllers: [AnalyticsController],
  providers: [AnalyticsService, TrendScoreService],
  exports: [AnalyticsService]
})
export class AnalyticsModule {}
