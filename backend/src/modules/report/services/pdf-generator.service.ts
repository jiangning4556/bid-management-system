import { Injectable } from '@nestjs/common';
import PDFDocument from 'pdfkit';

@Injectable()
export class PdfService {
  generatePdf(options: {
    filename: string;
    data: any[];
    fields: string[];
    headers: Record<string, string>;
    summary?: Record<string, any>;
  }): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: 'A4',
          margin: 50,
          bufferPages: true,
        });
        const buffers: Buffer[] = [];

        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => {
          resolve(Buffer.concat(buffers));
        });
        doc.on('error', reject);

        // 注册中文字体（需要实际字体文件，这里使用默认字体）
        // 实际项目中需要添加中文字体文件支持

        // 添加标题
        doc.fontSize(20).font('Helvetica-Bold').text(options.filename, { align: 'center' });
        doc.moveDown();

        // 添加生成时间
        doc.fontSize(10).font('Helvetica').text(
          `生成时间: ${new Date().toLocaleString('zh-CN')}`,
          { align: 'right' }
        );
        doc.moveDown();

        // 添加汇总信息
        if (options.summary && Object.keys(options.summary).length > 0) {
          doc.fontSize(12).font('Helvetica-Bold').text('汇总信息:', { underline: true });
          doc.fontSize(10).font('Helvetica');
          Object.entries(options.summary).forEach(([key, value]) => {
            doc.text(`${key}: ${value}`);
          });
          doc.moveDown();
        }

        // 绘制表格
        this.drawTable(doc, options.data, options.fields, options.headers);

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  private drawTable(doc: any, data: any[], fields: string[], headers: Record<string, string>) {
    const tableTop = doc.y;
    const rowHeight = 30;
    const colWidths = this.calculateColWidths(fields.length, doc.page.width);

    // 表头
    doc.fontSize(10).fillColor('#0000FF').font('Helvetica-Bold');
    let x = 50;
    fields.forEach((field, i) => {
      doc.rect(x, tableTop, colWidths[i], rowHeight).fillAndStroke('#F0F0F0', '#000');
      doc.fillColor('#000').text(headers[field] || field, x + 5, tableTop + 10, {
        width: colWidths[i] - 10,
        align: 'left',
      });
      x += colWidths[i];
    });

    // 数据行
    doc.fontSize(9).fillColor('#000').font('Helvetica');
    data.forEach((row, rowIndex) => {
      const y = tableTop + (rowIndex + 1) * rowHeight;

      // 检查是否需要新页面
      if (y + rowHeight > doc.page.height - 50) {
        doc.addPage();
        this.drawTableHeader(doc, tableTop, colWidths, fields, headers, rowHeight);
      }

      x = 50;
      fields.forEach((field, i) => {
        doc.rect(x, y, colWidths[i], rowHeight).stroke();
        const value = row[field];
        const displayValue = value === null || value === undefined ? '' : String(value);
        doc.text(displayValue, x + 5, y + 10, {
          width: colWidths[i] - 10,
          align: 'left',
          lineBreak: true,
        });
        x += colWidths[i];
      });
    });
  }

  private drawTableHeader(
    doc: any,
    y: number,
    colWidths: number[],
    fields: string[],
    headers: Record<string, string>,
    rowHeight: number,
  ) {
    doc.fontSize(10).fillColor('#0000FF').font('Helvetica-Bold');
    let x = 50;
    fields.forEach((field, i) => {
      doc.rect(x, y, colWidths[i], rowHeight).fillAndStroke('#F0F0F0', '#000');
      doc.fillColor('#000').text(headers[field] || field, x + 5, y + 10, {
        width: colWidths[i] - 10,
        align: 'left',
      });
      x += colWidths[i];
    });
    doc.fillColor('#000').font('Helvetica');
  }

  private calculateColWidths(colCount: number, pageWidth: number): number[] {
    const usableWidth = pageWidth - 100; // 减去左右边距
    const width = usableWidth / colCount;
    return Array(colCount).fill(width);
  }

  // 生成简单的统计报告
  generateStatisticsReport(options: {
    filename: string;
    statistics: Record<string, any>;
    charts?: any[];
  }): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: 'A4',
          margin: 50,
        });
        const buffers: Buffer[] = [];

        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => resolve(Buffer.concat(buffers)));
        doc.on('error', reject);

        // 标题
        doc.fontSize(20).font('Helvetica-Bold').text(options.filename, { align: 'center' });
        doc.moveDown();

        // 生成时间
        doc.fontSize(10).font('Helvetica').text(
          `生成时间: ${new Date().toLocaleString('zh-CN')}`,
          { align: 'right' }
        );
        doc.moveDown();

        // 统计数据
        doc.fontSize(12).font('Helvetica-Bold').text('统计数据:', { underline: true });
        doc.fontSize(10).font('Helvetica');
        Object.entries(options.statistics).forEach(([key, value]) => {
          doc.text(`${key}: ${value}`);
        });

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }
}
