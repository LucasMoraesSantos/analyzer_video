import { Body, Controller, Post } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiServiceUnavailableResponse,
  ApiTags
} from '@nestjs/swagger';
import { ImportYoutubeVideosDto } from './dto/import-youtube-videos.dto';
import { VideosService } from './videos.service';

@ApiTags('videos')
@Controller('videos')
export class VideosController {
  constructor(private readonly videosService: VideosService) {}

  @Post('import/youtube')
  @ApiOperation({ summary: 'Buscar vídeos recentes no YouTube por keyword e persistir normalizado' })
  @ApiBadRequestResponse({ description: 'Payload inválido.' })
  @ApiNotFoundResponse({ description: 'Nicho informado não encontrado.' })
  @ApiServiceUnavailableResponse({ description: 'Erro temporário/rate limit da API externa.' })
  importYoutube(@Body() body: ImportYoutubeVideosDto): Promise<unknown> {
    return this.videosService.importRecentFromYoutube(body);
  }
}
