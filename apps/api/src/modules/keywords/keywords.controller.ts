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
import { CreateKeywordDto } from './dto/create-keyword.dto';
import { ListKeywordsQueryDto } from './dto/list-keywords-query.dto';
import { UpdateKeywordDto } from './dto/update-keyword.dto';
import { KeywordsService } from './keywords.service';

@ApiTags('keywords')
@Controller('keywords')
export class KeywordsController {
  constructor(private readonly keywordsService: KeywordsService) {}

  @Get()
  @ApiOperation({ summary: 'Listar keywords (paginado)' })
  @ApiOkResponse({ description: 'Lista de keywords retornada com sucesso.' })
  list(@Query() query: ListKeywordsQueryDto): Promise<unknown> {
    return this.keywordsService.list(query);
  }

  @Post()
  @ApiOperation({ summary: 'Criar keyword' })
  @ApiBadRequestResponse({ description: 'Dados inválidos.' })
  @ApiConflictResponse({ description: 'Keyword duplicada no mesmo nicho.' })
  @ApiNotFoundResponse({ description: 'Nicho informado não existe.' })
  create(@Body() body: CreateKeywordDto): Promise<unknown> {
    return this.keywordsService.create(body);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar keyword por ID' })
  @ApiNotFoundResponse({ description: 'Palavra-chave não encontrada.' })
  getById(@Param('id') id: string): Promise<unknown> {
    return this.keywordsService.getById(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar keyword' })
  @ApiNotFoundResponse({ description: 'Palavra-chave não encontrada.' })
  @ApiConflictResponse({ description: 'Keyword duplicada no mesmo nicho.' })
  update(@Param('id') id: string, @Body() body: UpdateKeywordDto): Promise<unknown> {
    return this.keywordsService.update(id, body);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Excluir keyword' })
  @ApiNotFoundResponse({ description: 'Palavra-chave não encontrada.' })
  remove(@Param('id') id: string): Promise<unknown> {
    return this.keywordsService.delete(id);
  }
}
