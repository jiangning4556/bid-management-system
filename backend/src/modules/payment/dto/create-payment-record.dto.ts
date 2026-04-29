import { IsNotEmpty, IsUUID, IsNumber, IsString, IsDate, IsOptional, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreatePaymentRecordDto {
  @IsNotEmpty()
  @IsUUID()
  projectId: string;

  @IsNotEmpty()
  @IsUUID()
  supplierId: string;

  @IsNumber()
  @Min(0)
  amount: number;

  @IsNotEmpty()
  @IsDate()
  @Type(() => Date)
  paymentTime: Date;

  @IsOptional()
  @IsString()
  paymentMethod?: string;

  @IsOptional()
  @IsString()
  proofUrl?: string;

  @IsOptional()
  @IsString()
  remarks?: string;
}
