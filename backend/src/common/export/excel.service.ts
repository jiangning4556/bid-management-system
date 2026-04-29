import { Injectable } from '@nestjs/common';
import * as ExcelJS from 'exceljs';

@Injectable()
export class ExcelService {
  async generateExcel(data: any[], sheetName: string = 'Sheet1'): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(sheetName);

    if (data.length === 0) {
      return workbook.xlsx.writeBuffer() as unknown as Promise<Buffer>;
    }

    // Add headers
    const headers = Object.keys(data[0]);
    worksheet.columns = headers.map(header => ({ header, key: header }));

    // Add rows
    worksheet.addRows(data);

    return workbook.xlsx.writeBuffer() as unknown as Promise<Buffer>;
  }

  async generateExcelWithStyle(data: any[], options: {
    sheetName?: string;
    title?: string;
  } = {}): Promise<Buffer> {
    const { sheetName = 'Sheet1', title } = options;
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(sheetName);

    if (data.length === 0) {
      return workbook.xlsx.writeBuffer() as unknown as Promise<Buffer>;
    }

    // Add headers with style
    const headers = Object.keys(data[0]);
    const headerRow = worksheet.addRow(headers);

    headerRow.eachCell((cell) => {
      cell.font = { bold: true };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' },
      };
    });

    // Add rows
    worksheet.addRows(data);

    // Auto fit columns
    worksheet.columns.forEach((column) => {
      if (column.eachCell) {
        let maxLength = 0;
        column.eachCell({ includeEmpty: true }, (cell) => {
          const length = cell.value ? cell.value.toString().length : 10;
          if (length > maxLength) {
            maxLength = length;
          }
        });
        column.width = maxLength < 10 ? 10 : maxLength + 2;
      }
    });

    return workbook.xlsx.writeBuffer() as unknown as Promise<Buffer>;
  }
}
