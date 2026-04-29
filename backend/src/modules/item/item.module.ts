import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ItemService } from './item.service';
import { ItemController } from './item.controller';
import { Item } from './entities/item.entity';
import { Supplier } from '../supplier/entities/supplier.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Item, Supplier])],
  providers: [ItemService],
  controllers: [ItemController],
  exports: [ItemService],
})
export class ItemModule {}
