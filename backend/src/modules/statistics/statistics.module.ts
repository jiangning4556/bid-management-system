import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StatisticsService } from './statistics.service';
import { StatisticsController } from './statistics.controller';
import { ConsultProject } from '../consult-project/entities/consult-project.entity';
import { BidProject } from '../bid-project/entities/bid-project.entity';
import { BidProjectItem } from '../bid-project/entities/bid-project-item.entity';
import { BidSupplier } from '../bid-project/entities/bid-supplier.entity';
import { PaymentRecord } from '../payment/entities/payment-record.entity';
import { ReceiptRecord } from '../payment/entities/receipt-record.entity';
import { SupplierQuote } from '../consult-project/entities/supplier-quote.entity';
import { Supplier } from '../supplier/entities/supplier.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ConsultProject,
      BidProject,
      BidProjectItem,
      BidSupplier,
      PaymentRecord,
      ReceiptRecord,
      SupplierQuote,
      Supplier,
    ]),
  ],
  providers: [StatisticsService],
  controllers: [StatisticsController],
  exports: [StatisticsService],
})
export class StatisticsModule {}
