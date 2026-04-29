import { IsNotEmpty, IsOptional, IsString, IsObject, IsUUID } from 'class-validator';

export class CreateItemDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  code?: string;

  @IsOptional()
  @IsString()
  model?: string;

  @IsOptional()
  @IsString()
  spec?: string;

  @IsOptional()
  @IsString()
  unit?: string;

  @IsOptional()
  @IsString()
  brand?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsObject()
  attributes?: Record<string, any>;

  @IsNotEmpty()
  @IsUUID()
  categoryId: string;

  @IsOptional()
  supplierIds?: string[];
}
