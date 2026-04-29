import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateNotificationPreferenceDto {
  @IsOptional()
  @IsBoolean()
  projectNotify?: boolean;

  @IsOptional()
  @IsBoolean()
  paymentNotify?: boolean;

  @IsOptional()
  @IsBoolean()
  receiptNotify?: boolean;

  @IsOptional()
  @IsBoolean()
  supplierNotify?: boolean;

  @IsOptional()
  @IsBoolean()
  systemNotify?: boolean;

  @IsOptional()
  @IsBoolean()
  enableSound?: boolean;
}

export class NotificationFilterDto {
  projectNotify?: boolean;
  paymentNotify?: boolean;
  receiptNotify?: boolean;
  supplierNotify?: boolean;
  systemNotify?: boolean;
  isRead?: boolean;
}
