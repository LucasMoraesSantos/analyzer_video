import { Controller, Get, Param } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ScriptsService } from './scripts.service';

@ApiTags('scripts')
@Controller('scripts')
export class ScriptsController {
  constructor(private readonly scriptsService: ScriptsService) {}

  @Get('video/:videoId')
  @ApiOperation({ summary: 'Listar roteiros por vídeo' })
  listByVideo(@Param('videoId') videoId: string): Promise<unknown> {
    return this.scriptsService.listByVideo(videoId);
  }

  @Get('summary/:summaryId')
  @ApiOperation({ summary: 'Listar roteiros por content summary' })
  listBySummary(@Param('summaryId') summaryId: string): Promise<unknown> {
    return this.scriptsService.listBySummary(summaryId);
  }
}
