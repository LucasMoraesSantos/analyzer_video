import { PartialType } from '@nestjs/swagger';
import { CreateNicheDto } from './create-niche.dto';

export class UpdateNicheDto extends PartialType(CreateNicheDto) {}
