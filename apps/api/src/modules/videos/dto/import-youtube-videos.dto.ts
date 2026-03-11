import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length } from 'class-validator';

export class ImportYoutubeVideosDto {
  @ApiProperty({ example: 'renda extra' })
  @IsString()
  @Length(2, 120)
  keyword!: string;

  @ApiProperty({ example: 'cm8abcd1234' })
  @IsString()
  @Length(8, 40)
  nicheId!: string;
}
