import { Injectable } from '@nestjs/common';
import * as ExcelJS from 'exceljs';

export interface ExportField {
  key: string;
  label: string;
  width?: number;
}

export interface ExportOptions {
  filename: string;
  sheetName?: string;
}

@Injectable()
export class ExportService {
  async exportToExcel(
    data: any[],
    fields: ExportField[],
    options: ExportOptions,
  ): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(options.sheetName || 'Sheet1');

    // Set column widths
    worksheet.columns = fields.map(field => ({
      key: field.key,
      header: field.label,
      width: field.width || 20,
    }));

    // Add data rows
    data.forEach(row => {
      const rowData: any = {};
      fields.forEach(field => {
        rowData[field.key] = this.formatCellValue(row[field.key]);
      });
      worksheet.addRow(rowData);
    });

    // Style header row
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true, size: 12 };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' },
    };
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
    headerRow.height = 25;

    // Add borders to all cells
    worksheet.eachRow((row, rowNumber) => {
      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' },
        };
        cell.alignment = { vertical: 'middle', horizontal: 'left' };
      });
    });

    // Generate buffer
    const buffer = await workbook.xlsx.writeBuffer();
    return buffer as unknown as Buffer;
  }

  private formatCellValue(value: any): string {
    if (value === null || value === undefined) {
      return '';
    }
    if (typeof value === 'number') {
      return value.toString();
    }
    if (typeof value === 'boolean') {
      return value ? '是' : '否';
    }
    if (value instanceof Date) {
      return value.toISOString().split('T')[0];
    }
    return String(value);
  }

  generateFilename(prefix: string): string {
    const now = new Date();
    const timestamp = now.toISOString().replace(/[:.]/g, '-').slice(0, -5);
    return `${prefix}_${timestamp}.xlsx`;
  }
}
