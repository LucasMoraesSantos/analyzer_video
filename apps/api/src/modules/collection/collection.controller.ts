import { Controller, Get, Param, Post } from '@nestjs/common';
import {
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags
} from '@nestjs/swagger';
import { CollectionService } from './collection.service';

@ApiTags('collection')
@Controller('collection')
export class CollectionController {
  constructor(private readonly collectionService: CollectionService) {}

  @Post('run/:nicheId')
  @ApiOperation({ summary: 'Executar coleta para um nicho' })
  @ApiNotFoundResponse({ description: 'Nicho não encontrado.' })
  runForNiche(@Param('nicheId') nicheId: string): Promise<unknown> {
    return this.collectionService.runForNiche(nicheId);
  }

  @Post('run-all')
  @ApiOperation({ summary: 'Executar coleta para todos os nichos ativos' })
  runAll(): Promise<unknown> {
    return this.collectionService.runAll();
  }

  @Get('jobs')
  @ApiOperation({ summary: 'Listar jobs de coleta' })
  @ApiOkResponse({ description: 'Jobs de coleta listados com sucesso.' })
  listJobs(): Promise<unknown> {
    return this.collectionService.listJobs();
  }

  @Get('jobs/:id')
  @ApiOperation({ summary: 'Buscar job de coleta por ID' })
  @ApiNotFoundResponse({ description: 'Job não encontrado.' })
  getJobById(@Param('id') id: string): Promise<unknown> {
    return this.collectionService.getJobById(id);
  }
}
