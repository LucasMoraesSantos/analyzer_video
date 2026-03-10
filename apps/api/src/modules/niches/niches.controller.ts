import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { NichesService } from './niches.service';

@ApiTags('niches')
@Controller('niches')
export class NichesController {
  constructor(private readonly nichesService: NichesService) {}
}
