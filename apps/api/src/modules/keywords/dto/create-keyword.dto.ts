import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, Length } from 'class-validator';

export class CreateKeywordDto {
  @ApiProperty({ example: 'cm8abcd1234' })
  @IsString()
  @Length(8, 40)
  nicheId!: string;

  @ApiProperty({ example: 'renda extra' })
  @IsString()
  @Length(2, 120)
  term!: string;

  @ApiProperty({ example: true, required: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
