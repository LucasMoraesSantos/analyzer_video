import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ScriptsService } from './scripts.service';

@ApiTags('scripts')
@Controller('scripts')
export class ScriptsController {
  constructor(private readonly scriptsService: ScriptsService) {}
}
