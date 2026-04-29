import { Module, Global } from '@nestjs/common';
import { ExportService } from './export.service';
import { ExcelService } from './excel.service';

@Global()
@Module({
  providers: [ExportService, ExcelService],
  exports: [ExportService, ExcelService],
})
export class ExportModule {}
