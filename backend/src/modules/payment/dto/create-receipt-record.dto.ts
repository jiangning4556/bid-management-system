import { IsNotEmpty, IsNumber, IsString, IsDate, IsOptional, IsEnum, IsUUID, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { InvoiceStatus } from '../entities/receipt-record.entity';

export class CreateReceiptRecordDto {
  @IsNotEmpty()
  @IsUUID()
  projectId: string;

  @IsNumber()
  @Min(0)
  amount: number;

  @IsNotEmpty()
  @IsDate()
  @Type(() => Date)
  receiptTime: Date;

  @IsOptional()
  @IsString()
  receiptMethod?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  ratio?: number;

  @IsOptional()
  @IsEnum(InvoiceStatus)
  invoiceStatus?: InvoiceStatus;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  invoiceTime?: Date;

  @IsOptional()
  @IsString()
  invoiceType?: string;

  @IsOptional()
  @IsString()
  invoiceNo?: string;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  estimatedPaymentTime?: Date;

  @IsOptional()
  isCompleted?: boolean;

  @IsOptional()
  @IsString()
  remarks?: string;
}
