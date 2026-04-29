import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SupplierService } from './supplier.service';
import { SupplierController } from './supplier.controller';
import { Supplier } from './entities/supplier.entity';
import { SupplierQuote } from '../consult-project/entities/supplier-quote.entity';
import { BidSupplier } from '../bid-project/entities/bid-supplier.entity';
import { ConsultProjectItem } from '../consult-project/entities/consult-project-item.entity';
import { BidProjectItem } from '../bid-project/entities/bid-project-item.entity';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Supplier, SupplierQuote, BidSupplier, ConsultProjectItem, BidProjectItem]),
    NotificationModule,
  ],
  providers: [SupplierService],
  controllers: [SupplierController],
  exports: [SupplierService],
})
export class SupplierModule {}
