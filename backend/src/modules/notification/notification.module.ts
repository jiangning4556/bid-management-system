import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationService } from './notification.service';
import { NotificationController, AdminNotificationController } from './notification.controller';
import { NotificationGateway } from './notification.gateway';
import { Notification } from './entities/notification.entity';
import { NotificationPreference } from './entities/notification-preference.entity';
import { UserModule } from '../user/user.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Notification, NotificationPreference]),
    UserModule,
  ],
  providers: [NotificationService, NotificationGateway],
  controllers: [NotificationController, AdminNotificationController],
  exports: [NotificationService, NotificationGateway],
})
export class NotificationModule {}
