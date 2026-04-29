import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { ReminderService } from './reminder.service';
import { ReceiptRecord } from '../payment/entities/receipt-record.entity';
import { BidProject } from '../bid-project/entities/bid-project.entity';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ReceiptRecord, BidProject]),
    ScheduleModule.forRoot(),
    NotificationModule,
  ],
  providers: [ReminderService],
  exports: [ReminderService],
})
export class ReminderModule {}
