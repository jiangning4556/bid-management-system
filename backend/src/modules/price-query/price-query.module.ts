import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PriceQueryService } from './price-query.service';
import { PriceQueryController } from './price-query.controller';
import { Item } from '../item/entities/item.entity';
import { SupplierQuote } from '../consult-project/entities/supplier-quote.entity';
import { ConsultProjectItem } from '../consult-project/entities/consult-project-item.entity';
import { ConsultProject } from '../consult-project/entities/consult-project.entity';
import { BidSupplier } from '../bid-project/entities/bid-supplier.entity';
import { BidProjectItem } from '../bid-project/entities/bid-project-item.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Item,
      SupplierQuote,
      ConsultProjectItem,
      ConsultProject,
      BidSupplier,
      BidProjectItem,
    ]),
  ],
  providers: [PriceQueryService],
  controllers: [PriceQueryController],
  exports: [PriceQueryService],
})
export class PriceQueryModule {}
