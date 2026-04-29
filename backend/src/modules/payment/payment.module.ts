import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentService } from './payment.service';
import { PaymentController } from './payment.controller';
import { PaymentRecord } from './entities/payment-record.entity';
import { ReceiptRecord } from './entities/receipt-record.entity';
import { BidProject } from '../bid-project/entities/bid-project.entity';
import { BidProjectItem } from '../bid-project/entities/bid-project-item.entity';
import { BidSupplier } from '../bid-project/entities/bid-supplier.entity';
import { Supplier } from '../supplier/entities/supplier.entity';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([PaymentRecord, ReceiptRecord, BidProject, BidProjectItem, BidSupplier, Supplier]),
    NotificationModule,
  ],
  providers: [PaymentService],
  controllers: [PaymentController],
  exports: [PaymentService],
})
export class PaymentModule {}
