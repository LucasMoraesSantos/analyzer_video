import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { ListTopTrendsQueryDto } from './dto/list-top-trends-query.dto';

@ApiTags('dashboard')
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('overview')
  @ApiOperation({ summary: 'Visão geral de indicadores para dashboard' })
  getOverview() {
    return this.dashboardService.getOverview();
  }

  @Get('top-trends')
  @ApiOperation({ summary: 'Top vídeos por trendScore para dashboard' })
  getTopTrends(@Query() query: ListTopTrendsQueryDto) {
    return this.dashboardService.getTopTrends(query);
  }

  @Get('niches')
  @ApiOperation({ summary: 'Resumo por nicho para cards/tabela de dashboard' })
  getNiches() {
    return this.dashboardService.getNiches();
  }
}
