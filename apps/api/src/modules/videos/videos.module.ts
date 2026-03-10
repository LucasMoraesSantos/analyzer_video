import { Module } from '@nestjs/common';
import { VideosController } from './videos.controller';
import { YoutubeVideoProvider } from './providers/youtube/youtube-video.provider';
import { ShortClassifierService } from './services/short-classifier.service';
import { VideosService } from './videos.service';
import { VIDEO_PROVIDER_TOKEN } from './types/video-provider.types';

@Module({
  controllers: [VideosController],
  providers: [
    VideosService,
    ShortClassifierService,
    {
      provide: VIDEO_PROVIDER_TOKEN,
      useClass: YoutubeVideoProvider
    }
  ],
  exports: [VideosService, ShortClassifierService]
})
export class VideosModule {}
