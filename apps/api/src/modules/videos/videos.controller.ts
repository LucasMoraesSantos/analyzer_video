import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiServiceUnavailableResponse,
  ApiTags
} from '@nestjs/swagger';
import { ImportYoutubeVideosDto } from './dto/import-youtube-videos.dto';
import { ListVideosQueryDto } from './dto/list-videos-query.dto';
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

  @Get()
  @ApiOperation({ summary: 'Listar vídeos com paginação, filtros e ordenação' })
  list(@Query() query: ListVideosQueryDto) {
    return this.videosService.list(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detalhar vídeo para tela de detalhe no dashboard' })
  getById(@Param('id') id: string) {
    return this.videosService.getById(id);
  }

  @Get(':id/summary')
  @ApiOperation({ summary: 'Buscar último summary de um vídeo' })
  getSummary(@Param('id') id: string) {
    return this.videosService.getLatestSummary(id);
  }

  @Get(':id/scripts')
  @ApiOperation({ summary: 'Listar scripts de um vídeo' })
  getScripts(@Param('id') id: string) {
    return this.videosService.getScripts(id);
  }
}
