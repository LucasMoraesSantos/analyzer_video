import { ApiPropertyOptional } from '@nestjs/swagger';
import { TrendClassification, TrendDirection } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsEnum, IsIn, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

export class ListTrendsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Filtro por nicho' })
  @IsOptional()
  @IsString()
  nicheId?: string;

  @ApiPropertyOptional({ enum: TrendClassification })
  @IsOptional()
  @IsEnum(TrendClassification)
  classification?: TrendClassification;

  @ApiPropertyOptional({ enum: TrendDirection })
  @IsOptional()
  @IsEnum(TrendDirection)
  direction?: TrendDirection;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minTrendScore?: number;

  @ApiPropertyOptional({ enum: ['asc', 'desc'], default: 'desc' })
  @IsOptional()
  @IsIn(['asc', 'desc'])
  order?: 'asc' | 'desc' = 'desc';
}
