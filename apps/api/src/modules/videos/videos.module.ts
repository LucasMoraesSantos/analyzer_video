import { Module } from '@nestjs/common';
import { VideosController } from './videos.controller';
import { YoutubeVideoProvider } from './providers/youtube/youtube-video.provider';
import { VideosService } from './videos.service';
import { VIDEO_PROVIDER_TOKEN } from './types/video-provider.types';

@Module({
  controllers: [VideosController],
  providers: [
    VideosService,
    {
      provide: VIDEO_PROVIDER_TOKEN,
      useClass: YoutubeVideoProvider
    }
  ]
})
export class VideosModule {}
