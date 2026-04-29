import { IsNotEmpty, IsString, IsEnum, IsOptional, IsUUID } from 'class-validator';
import { NotificationType } from '../entities/notification.entity';

export class CreateNotificationDto {
  @IsNotEmpty()
  @IsUUID()
  userId: string;

  @IsNotEmpty()
  @IsEnum(NotificationType)
  type: NotificationType;

  @IsNotEmpty()
  @IsString()
  title: string;

  @IsNotEmpty()
  @IsString()
  content: string;

  @IsOptional()
  @IsUUID()
  relatedId?: string;

  @IsOptional()
  @IsString()
  relatedType?: string;

  @IsOptional()
  metadata?: Record<string, any>;
}
