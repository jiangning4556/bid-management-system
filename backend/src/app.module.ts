import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './modules/auth/auth.module';
import { UserModule } from './modules/user/user.module';
import { SupplierModule } from './modules/supplier/supplier.module';
import { CategoryModule } from './modules/category/category.module';
import { ItemModule } from './modules/item/item.module';
import { ConsultProjectModule } from './modules/consult-project/consult-project.module';
import { BidProjectModule } from './modules/bid-project/bid-project.module';
import { PaymentModule } from './modules/payment/payment.module';
import { PriceQueryModule } from './modules/price-query/price-query.module';
import { StatisticsModule } from './modules/statistics/statistics.module';
import { FileModule } from './modules/file/file.module';
import { NotificationModule } from './modules/notification/notification.module';
import { ReminderModule } from './modules/reminder/reminder.module';
import { ReportModule } from './modules/report/report.module';
import { ExportModule } from './common/export/export.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import configuration from './config/configuration';

// Entities
import { User } from './modules/user/entities/user.entity';
import { Supplier } from './modules/supplier/entities/supplier.entity';
import { Category } from './modules/category/entities/category.entity';
import { Item } from './modules/item/entities/item.entity';
import { ConsultProject } from './modules/consult-project/entities/consult-project.entity';
import { ConsultProjectItem } from './modules/consult-project/entities/consult-project-item.entity';
import { SupplierQuote } from './modules/consult-project/entities/supplier-quote.entity';
import { BidProject } from './modules/bid-project/entities/bid-project.entity';
import { BidProjectItem } from './modules/bid-project/entities/bid-project-item.entity';
import { BidSupplier } from './modules/bid-project/entities/bid-supplier.entity';
import { PaymentRecord } from './modules/payment/entities/payment-record.entity';
import { ReceiptRecord } from './modules/payment/entities/receipt-record.entity';
import { FileRecord } from './modules/file/entities/file-record.entity';
import { Notification } from './modules/notification/entities/notification.entity';
import { NotificationPreference } from './modules/notification/entities/notification-preference.entity';
import { ReportTemplate } from './modules/report/entities/report-template.entity';
import { ReportSubscription } from './modules/report/entities/report-subscription.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: configService.get<any>('database.type'),
        host: configService.get<string>('database.host'),
        port: configService.get<number>('database.port'),
        username: configService.get<string>('database.username'),
        password: configService.get<string>('database.password'),
        database: configService.get<string>('database.database'),
        entities: [
          User,
          Supplier,
          Category,
          Item,
          ConsultProject,
          ConsultProjectItem,
          SupplierQuote,
          BidProject,
          BidProjectItem,
          BidSupplier,
          PaymentRecord,
          ReceiptRecord,
          FileRecord,
          Notification,
          NotificationPreference,
          ReportTemplate,
          ReportSubscription,
        ],
        synchronize: configService.get<boolean>('database.synchronize'),
        logging: configService.get<boolean>('database.logging'),
      }),
      inject: [ConfigService],
    }),
    AuthModule,
    UserModule,
    SupplierModule,
    CategoryModule,
    ItemModule,
    ConsultProjectModule,
    BidProjectModule,
    PaymentModule,
    PriceQueryModule,
    StatisticsModule,
    FileModule,
    NotificationModule,
    ReminderModule,
    ReportModule,
    ExportModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
