import { PartialType } from '@nestjs/swagger';
import { IsOptional, IsString, Length } from 'class-validator';
import { CreateKeywordDto } from './create-keyword.dto';

export class UpdateKeywordDto extends PartialType(CreateKeywordDto) {
  @IsOptional()
  @IsString()
  @Length(8, 40)
  override nicheId?: string;
}
