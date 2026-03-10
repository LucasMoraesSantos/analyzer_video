import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, Length } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

export class ListKeywordsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Filtro opcional por nicho' })
  @IsOptional()
  @IsString()
  @Length(8, 40)
  nicheId?: string;

  @ApiPropertyOptional({ description: 'Filtro por termo' })
  @IsOptional()
  @IsString()
  @Length(1, 120)
  search?: string;
}
