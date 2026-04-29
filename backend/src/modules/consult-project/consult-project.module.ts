import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConsultProjectService } from './consult-project.service';
import { ConsultProjectController } from './consult-project.controller';
import { ConsultProject } from './entities/consult-project.entity';
import { ConsultProjectItem } from './entities/consult-project-item.entity';
import { SupplierQuote } from './entities/supplier-quote.entity';
import { Item } from '../item/entities/item.entity';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ConsultProject, ConsultProjectItem, SupplierQuote, Item]),
    NotificationModule,
  ],
  providers: [ConsultProjectService],
  controllers: [ConsultProjectController],
  exports: [ConsultProjectService],
})
export class ConsultProjectModule {}
