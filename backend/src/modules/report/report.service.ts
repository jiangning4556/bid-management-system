import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ReportTemplate, ReportDataSource, ReportFormat } from './entities/report-template.entity';
import { ReportSubscription } from './entities/report-subscription.entity';
import { CreateReportTemplateDto, UpdateReportTemplateDto, CreateReportSubscriptionDto, UpdateReportSubscriptionDto } from './dto/generate-report.dto';
import { PdfService } from './services/pdf-generator.service';
import { ExcelService } from '../../common/export/excel.service';

@Injectable()
export class ReportService {
  constructor(
    @InjectRepository(ReportTemplate)
    private templateRepository: Repository<ReportTemplate>,
    @InjectRepository(ReportSubscription)
    private subscriptionRepository: Repository<ReportSubscription>,
    private pdfService: PdfService,
    private excelService: ExcelService,
  ) {}

  // 生成报表
  async generateReport(dto: any) {
    const data = await this.fetchData(dto.dataSource, dto);

    if (dto.format === 'excel') {
      const buffer = await this.excelService.generateExcelWithStyle(data.list, {
        sheetName: dto.reportName || 'Report',
        title: dto.reportName,
      });
      return {
        filename: `${dto.reportName}.xlsx`,
        buffer,
        contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      };
    } else if (dto.format === 'pdf') {
      const buffer = await this.pdfService.generatePdf({
        filename: dto.reportName,
        data: data.list,
        fields: dto.fields,
        headers: this.getHeaders(dto.fields),
        summary: data.summary,
      });
      return {
        filename: `${dto.reportName}.pdf`,
        buffer,
        contentType: 'application/pdf',
      };
    }
  }

  // 获取数据
  private async fetchData(dataSource: string, dto: any) {
    // 根据数据源获取数据
    // 这里需要注入相应的Repository来查询数据
    // 简化实现，返回示例数据
    return {
      list: [],
      summary: {},
    };
  }

  // 获取字段映射
  private getHeaders(fields: string[]): Record<string, string> {
    const headerMap: Record<string, string> = {
      // 项目字段
      projectName: '项目名称',
      projectNo: '项目编号',
      customer: '客户',
      totalAmount: '总金额',
      status: '状态',
      createdAt: '创建日期',
      // 供应商字段
      supplierName: '供应商名称',
      contact: '联系人',
      phone: '联系电话',
      email: '邮箱',
      // 物品字段
      itemName: '物品名称',
      itemCode: '物品编码',
      category: '分类',
      unit: '单位',
      // 付款字段
      paymentAmount: '付款金额',
      paymentTime: '付款时间',
      paymentMethod: '付款方式',
      // 收款字段
      receiptAmount: '收款金额',
      receiptTime: '收款时间',
      receiptMethod: '收款方式',
    };
    const headers: Record<string, string> = {};
    fields.forEach(f => {
      headers[f] = headerMap[f] || f;
    });
    return headers;
  }

  // 报表模板管理
  async createTemplate(userId: string, dto: CreateReportTemplateDto) {
    const template = this.templateRepository.create({
      name: dto.name,
      description: dto.description,
      dataSource: dto.dataSource as ReportDataSource,
      fields: dto.fields,
      filters: dto.filters,
      defaultFormat: dto.defaultFormat as ReportFormat,
      userId,
    });
    return await this.templateRepository.save(template);
  }

  async getTemplates(userId: string) {
    return await this.templateRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async getTemplate(id: string, userId: string) {
    const template = await this.templateRepository.findOne({
      where: { id, userId },
    });
    if (!template) {
      throw new NotFoundException('Template not found');
    }
    return template;
  }

  async updateTemplate(id: string, userId: string, dto: UpdateReportTemplateDto) {
    const template = await this.getTemplate(id, userId);
    Object.assign(template, dto);
    return await this.templateRepository.save(template);
  }

  async deleteTemplate(id: string, userId: string) {
    const template = await this.getTemplate(id, userId);
    await this.templateRepository.remove(template);
  }

  // 报表订阅管理
  async createSubscription(userId: string, dto: CreateReportSubscriptionDto) {
    // 验证模板所有权
    const template = await this.templateRepository.findOne({
      where: { id: dto.templateId, userId },
    });
    if (!template) {
      throw new NotFoundException('Template not found');
    }

    const subscription = this.subscriptionRepository.create({
      ...dto,
      userId,
      nextRunAt: this.calculateNextRun(dto),
    });
    return await this.subscriptionRepository.save(subscription);
  }

  async getSubscriptions(userId: string) {
    return await this.subscriptionRepository.find({
      where: { userId },
      relations: ['template'],
      order: { createdAt: 'DESC' },
    });
  }

  async getSubscription(id: string, userId: string) {
    const subscription = await this.subscriptionRepository.findOne({
      where: { id, userId },
      relations: ['template'],
    });
    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }
    return subscription;
  }

  async updateSubscription(id: string, userId: string, dto: UpdateReportSubscriptionDto) {
    const subscription = await this.getSubscription(id, userId);
    Object.assign(subscription, dto);
    if (dto.schedule || dto.scheduleTime) {
      subscription.nextRunAt = this.calculateNextRun(subscription);
    }
    return await this.subscriptionRepository.save(subscription);
  }

  async deleteSubscription(id: string, userId: string) {
    const subscription = await this.getSubscription(id, userId);
    await this.subscriptionRepository.remove(subscription);
  }

  async pauseSubscription(id: string, userId: string) {
    const subscription = await this.getSubscription(id, userId);
    subscription.isActive = false;
    return await this.subscriptionRepository.save(subscription);
  }

  async resumeSubscription(id: string, userId: string) {
    const subscription = await this.getSubscription(id, userId);
    subscription.isActive = true;
    subscription.nextRunAt = this.calculateNextRun(subscription);
    return await this.subscriptionRepository.save(subscription);
  }

  private calculateNextRun(subscription: Partial<ReportSubscription>): Date {
    const now = new Date();
    const [hour, minute] = subscription.scheduleTime!.split(':').map(Number);

    const next = new Date(now);
    next.setHours(hour, minute, 0, 0);

    switch (subscription.schedule) {
      case 'daily':
        next.setDate(next.getDate() + 1);
        break;
      case 'weekly':
        const dayOfWeek = subscription.scheduleConfig?.dayOfWeek || 1;
        const daysUntilWeek = (dayOfWeek + 7 - next.getDay()) % 7 || 7;
        next.setDate(next.getDate() + daysUntilWeek);
        break;
      case 'monthly':
        const dayOfMonth = subscription.scheduleConfig?.dayOfMonth || 1;
        next.setMonth(next.getMonth() + 1);
        next.setDate(Math.min(dayOfMonth, new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate()));
        break;
    }

    return next;
  }
}
