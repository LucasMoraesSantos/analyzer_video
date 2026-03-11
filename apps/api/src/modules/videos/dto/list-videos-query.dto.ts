import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsIn, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

export class ListVideosQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Filtro por nicho' })
  @IsOptional()
  @IsString()
  nicheId?: string;

  @ApiPropertyOptional({ description: 'Busca por título/canal' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Filtrar apenas prováveis shorts' })
  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'boolean') {
      return value;
    }

    if (value === 'true') {
      return true;
    }

    if (value === 'false') {
      return false;
    }

    return value;
  })
  @IsBoolean()
  probableShort?: boolean;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minTrendScore?: number;

  @ApiPropertyOptional({ enum: ['trendScore', 'publishedAt'], default: 'trendScore' })
  @IsOptional()
  @IsIn(['trendScore', 'publishedAt'])
  sortBy?: 'trendScore' | 'publishedAt' = 'trendScore';

  @ApiPropertyOptional({ enum: ['asc', 'desc'], default: 'desc' })
  @IsOptional()
  @IsIn(['asc', 'desc'])
  order?: 'asc' | 'desc' = 'desc';
}
