import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags
} from '@nestjs/swagger';
import { ListKeywordsQueryDto } from '../keywords/dto/list-keywords-query.dto';
import { CreateNicheDto } from './dto/create-niche.dto';
import { ListNichesQueryDto } from './dto/list-niches-query.dto';
import { UpdateNicheDto } from './dto/update-niche.dto';
import { NichesService } from './niches.service';

@ApiTags('niches')
@Controller('niches')
export class NichesController {
  constructor(private readonly nichesService: NichesService) {}

  @Get()
  @ApiOperation({ summary: 'Listar nichos (paginado)' })
  @ApiOkResponse({ description: 'Lista de nichos retornada com sucesso.' })
  list(@Query() query: ListNichesQueryDto): Promise<unknown> {
    return this.nichesService.list(query);
  }

  @Post()
  @ApiOperation({ summary: 'Criar nicho' })
  @ApiConflictResponse({ description: 'Nicho duplicado.' })
  @ApiBadRequestResponse({ description: 'Dados inválidos.' })
  create(@Body() body: CreateNicheDto): Promise<unknown> {
    return this.nichesService.create(body);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar nicho por ID' })
  @ApiNotFoundResponse({ description: 'Nicho não encontrado.' })
  getById(@Param('id') id: string): Promise<unknown> {
    return this.nichesService.getById(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar nicho' })
  @ApiConflictResponse({ description: 'Nicho duplicado.' })
  @ApiNotFoundResponse({ description: 'Nicho não encontrado.' })
  update(@Param('id') id: string, @Body() body: UpdateNicheDto): Promise<unknown> {
    return this.nichesService.update(id, body);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Excluir nicho' })
  @ApiNotFoundResponse({ description: 'Nicho não encontrado.' })
  remove(@Param('id') id: string): Promise<unknown> {
    return this.nichesService.delete(id);
  }

  @Get(':id/keywords')
  @ApiOperation({ summary: 'Listar keywords de um nicho (paginado)' })
  @ApiNotFoundResponse({ description: 'Nicho não encontrado.' })
  listKeywordsByNiche(@Param('id') nicheId: string, @Query() query: ListKeywordsQueryDto): Promise<unknown> {
    return this.nichesService.listKeywordsByNiche(nicheId, query);
  }
}
