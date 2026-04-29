import { IsNotEmpty, IsOptional, IsString, IsDate, IsEnum, IsArray, ValidateNested, IsUUID, IsInt, IsDecimal, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';
import { BidProjectStatus } from '../entities/bid-project.entity';

export class BidSupplierDto {
  @IsUUID()
  supplierId: string;

  @IsNotEmpty()
  amount: number;

  @IsOptional()
  progress?: string;

  @IsOptional()
  paymentStatus?: string;

  @IsOptional()
  @IsString()
  paymentTime?: string;

  @IsOptional()
  @IsString()
  remarks?: string;

  @IsOptional()
  isSelected?: boolean;
}

export class BidProjectItemDto {
  @IsUUID()
  itemId: string;

  @IsNotEmpty()
  @IsInt()
  quantity: number;

  @IsOptional()
  @IsString()
  remarks?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BidSupplierDto)
  suppliers?: BidSupplierDto[];
}

export class CreateBidProjectDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  projectCode?: string;

  @IsOptional()
  @IsString()
  customer?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  contractDate?: string;

  @IsOptional()
  @IsNumber()
  contractAmount?: number;

  @IsOptional()
  amount?: number;

  @IsOptional()
  @IsString()
  remarks?: string;

  @IsOptional()
  @IsEnum(BidProjectStatus)
  status?: BidProjectStatus;

  @IsOptional()
  @IsUUID()
  consultProjectId?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BidProjectItemDto)
  items?: BidProjectItemDto[];
}
