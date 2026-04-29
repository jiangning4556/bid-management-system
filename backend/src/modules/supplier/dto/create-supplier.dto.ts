import { IsNotEmpty, IsOptional, IsString, IsEmail, IsInt, IsEnum, Min, Max } from 'class-validator';
import { SupplierStatus } from '../entities/supplier.entity';

export class CreateSupplierDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  contact?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  email?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  bankName?: string;

  @IsOptional()
  @IsString()
  bankAccount?: string;

  @IsOptional()
  @IsString()
  taxNumber?: string;

  @IsOptional()
  @IsString()
  invoiceInfo?: string;

  @IsOptional()
  @IsString()
  remarks?: string;

  @IsOptional()
  @IsEnum(SupplierStatus)
  status?: SupplierStatus;
}
