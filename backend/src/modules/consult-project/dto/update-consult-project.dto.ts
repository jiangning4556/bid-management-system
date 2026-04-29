import { PartialType, OmitType } from '@nestjs/mapped-types';
import { CreateConsultProjectDto } from './create-consult-project.dto';

export class UpdateConsultProjectDto extends PartialType(
  OmitType(CreateConsultProjectDto, ['items'] as const)
) {}
