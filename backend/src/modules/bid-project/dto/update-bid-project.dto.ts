import { PartialType, OmitType } from '@nestjs/mapped-types';
import { CreateBidProjectDto } from './create-bid-project.dto';

export class UpdateBidProjectDto extends PartialType(
  OmitType(CreateBidProjectDto, ['items'] as const)
) {}
