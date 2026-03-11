import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { ListTrendsQueryDto } from './dto/list-trends-query.dto';
import { TopListQueryDto } from './dto/top-list-query.dto';

@ApiTags('analytics')
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('trends')
  @ApiOperation({ summary: 'Listar tendências com filtros, paginação e ordenação por trendScore' })
  listTrends(@Query() query: ListTrendsQueryDto) {
    return this.analyticsService.listTrends(query);
  }

  @Get('classifications')
  @ApiOperation({ summary: 'Distribuição de classificações de tendência' })
  listClassifications() {
    return this.analyticsService.listClassifications();
  }

  @Get('top-hooks')
  @ApiOperation({ summary: 'Top ganchos identificados em sumários' })
  listTopHooks(@Query() query: TopListQueryDto) {
    return this.analyticsService.listTopHooks(query);
  }

  @Get('top-keywords')
  @ApiOperation({ summary: 'Top palavras-chave identificadas em sumários' })
  listTopKeywords(@Query() query: TopListQueryDto) {
    return this.analyticsService.listTopKeywords(query);
  }
}
