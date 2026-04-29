import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BidProjectService } from './bid-project.service';
import { BidProjectController } from './bid-project.controller';
import { BidProject } from './entities/bid-project.entity';
import { BidProjectItem } from './entities/bid-project-item.entity';
import { BidSupplier } from './entities/bid-supplier.entity';
import { Item } from '../item/entities/item.entity';
import { ConsultProject } from '../consult-project/entities/consult-project.entity';
import { ConsultProjectItem } from '../consult-project/entities/consult-project-item.entity';
import { SupplierQuote } from '../consult-project/entities/supplier-quote.entity';
import { Supplier } from '../supplier/entities/supplier.entity';
import { PaymentRecord } from '../payment/entities/payment-record.entity';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      BidProject,
      BidProjectItem,
      BidSupplier,
      Item,
      ConsultProject,
      ConsultProjectItem,
      SupplierQuote,
      Supplier,
      PaymentRecord,
    ]),
    NotificationModule,
  ],
  providers: [BidProjectService],
  controllers: [BidProjectController],
  exports: [BidProjectService],
})
export class BidProjectModule {}
