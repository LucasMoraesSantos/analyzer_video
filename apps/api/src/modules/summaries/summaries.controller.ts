import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { SummariesService } from './summaries.service';

@ApiTags('summaries')
@Controller('summaries')
export class SummariesController {
  constructor(private readonly summariesService: SummariesService) {}
}
