import { IsNotEmpty, IsString, IsEnum, IsArray, IsOptional, IsDateString, IsBoolean } from 'class-validator';

export class GenerateReportDto {
  @IsNotEmpty()
  @IsEnum(['projects', 'suppliers', 'payments', 'receipts', 'items'])
  dataSource: string;

  @IsNotEmpty()
  @IsEnum(['excel', 'pdf'])
  format: 'excel' | 'pdf';

  @IsNotEmpty()
  @IsString()
  reportName: string;

  @IsArray()
  @IsString({ each: true })
  fields: string[];

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  filters?: Record<string, any>;
}

export class CreateReportTemplateDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNotEmpty()
  @IsEnum(['projects', 'suppliers', 'payments', 'receipts', 'items'])
  dataSource: string;

  @IsArray()
  @IsString({ each: true })
  fields: string[];

  @IsOptional()
  filters?: Record<string, any>;

  @IsOptional()
  @IsEnum(['excel', 'pdf'])
  defaultFormat?: 'excel' | 'pdf';
}

export class UpdateReportTemplateDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  fields?: string[];

  @IsOptional()
  filters?: Record<string, any>;

  @IsOptional()
  @IsEnum(['excel', 'pdf'])
  defaultFormat?: 'excel' | 'pdf';
}

export class CreateReportSubscriptionDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  templateId: string;

  @IsNotEmpty()
  @IsArray()
  @IsString({ each: true })
  recipients: string[];

  @IsNotEmpty()
  @IsEnum(['daily', 'weekly', 'monthly'])
  schedule: 'daily' | 'weekly' | 'monthly';

  @IsNotEmpty()
  @IsString()
  scheduleTime: string;

  @IsOptional()
  scheduleConfig?: {
    dayOfWeek?: number;
    dayOfMonth?: number;
  };
}

export class UpdateReportSubscriptionDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  recipients?: string[];

  @IsOptional()
  @IsEnum(['daily', 'weekly', 'monthly'])
  schedule?: 'daily' | 'weekly' | 'monthly';

  @IsOptional()
  @IsString()
  scheduleTime?: string;

  @IsOptional()
  scheduleConfig?: {
    dayOfWeek?: number;
    dayOfMonth?: number;
  };

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
