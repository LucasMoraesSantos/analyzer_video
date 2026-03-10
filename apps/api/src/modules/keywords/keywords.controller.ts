import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { KeywordsService } from './keywords.service';

@ApiTags('keywords')
@Controller('keywords')
export class KeywordsController {
  constructor(private readonly keywordsService: KeywordsService) {}
}
