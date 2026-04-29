import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportService } from './report.service';
import { ReportController } from './report.controller';
import { ReportTemplate } from './entities/report-template.entity';
import { ReportSubscription } from './entities/report-subscription.entity';
import { PdfService } from './services/pdf-generator.service';
import { UserModule } from '../user/user.module';
import { ExportModule } from '../../common/export/export.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ReportTemplate, ReportSubscription]),
    UserModule,
    ExportModule,
  ],
  providers: [ReportService, PdfService],
  controllers: [ReportController],
  exports: [ReportService],
})
export class ReportModule {}
