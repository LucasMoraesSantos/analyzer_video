import { Module } from '@nestjs/common';
import { VideosModule } from '../videos/videos.module';
import { CollectionController } from './collection.controller';
import { CollectionService } from './collection.service';
import { CollectionQueueService } from './queue/collection-queue.service';
import { CollectionWorkersService } from './queue/collection-workers.service';

@Module({
  imports: [VideosModule],
  controllers: [CollectionController],
  providers: [CollectionService, CollectionQueueService, CollectionWorkersService]
})
export class CollectionModule {}
