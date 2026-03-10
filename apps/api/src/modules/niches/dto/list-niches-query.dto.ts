import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, Length } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

export class ListNichesQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Filtro por nome' })
  @IsOptional()
  @IsString()
  @Length(1, 80)
  search?: string;
}
