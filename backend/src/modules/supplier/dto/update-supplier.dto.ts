import { PartialType, OmitType } from '@nestjs/mapped-types';
import { CreateSupplierDto } from './create-supplier.dto';
import { IsInt, Min, Max, IsOptional } from 'class-validator';

export class UpdateSupplierDto extends PartialType(OmitType(CreateSupplierDto, [])) {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  rating?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  deliveryRating?: number;
}
