import { IsNotEmpty, IsOptional, IsString, IsDate, IsEnum, IsArray, ValidateNested, IsUUID, IsInt } from 'class-validator';
import { Type } from 'class-transformer';
import { ConsultProjectStatus } from '../entities/consult-project.entity';

export class SupplierQuoteDto {
  @IsUUID()
  supplierId: string;

  @IsNotEmpty()
  price: number;

  @IsNotEmpty()
  @IsInt()
  quantity: number;

  @IsOptional()
  @IsString()
  brand?: string;

  @IsOptional()
  @IsString()
  contact?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  remarks?: string;
}

export class ProjectItemDto {
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
  @Type(() => SupplierQuoteDto)
  quotes?: SupplierQuoteDto[];
}

export class CreateConsultProjectDto {
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
  consultDate?: string;

  @IsOptional()
  @IsString()
  remarks?: string;

  @IsOptional()
  @IsEnum(ConsultProjectStatus)
  status?: ConsultProjectStatus;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProjectItemDto)
  items?: ProjectItemDto[];
}
