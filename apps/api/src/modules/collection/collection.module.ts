import { Module } from '@nestjs/common';
import { AnalyticsModule } from '../analytics/analytics.module';
import { SummariesModule } from '../summaries/summaries.module';
import { VideosModule } from '../videos/videos.module';
import { CollectionController } from './collection.controller';
import { CollectionService } from './collection.service';
import { CollectionQueueService } from './queue/collection-queue.service';
import { CollectionWorkersService } from './queue/collection-workers.service';

@Module({
  imports: [VideosModule, AnalyticsModule, SummariesModule],
  controllers: [CollectionController],
  providers: [CollectionService, CollectionQueueService, CollectionWorkersService]
})
export class CollectionModule {}
