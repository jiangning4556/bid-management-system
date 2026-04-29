import { Controller, Get, Post, Patch, Delete, UseGuards, Body, Param, Query, Res } from '@nestjs/common';
import type { Response } from 'express';
import { ReportService } from './report.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { User } from '../../common/decorators/user.decorator';
import type { UserInfo } from '../user/entities/user.entity';
import { CreateReportTemplateDto, UpdateReportTemplateDto, CreateReportSubscriptionDto, UpdateReportSubscriptionDto } from './dto/generate-report.dto';

@Controller('reports')
@UseGuards(JwtAuthGuard)
export class ReportController {
  constructor(private readonly reportService: ReportService) {}

  // 生成报表
  @Post('generate')
  async generateReport(@User() user: UserInfo, @Body() dto: any, @Res() res: Response) {
    try {
      const result = await this.reportService.generateReport(dto);

      if (!result) {
        return res.status(400).json({ message: '不支持的报表格式' });
      }

      if (dto.format === 'excel') {
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(dto.reportName)}.xlsx"`);
        return res.send(result.buffer);
      } else if (dto.format === 'pdf') {
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(result.filename)}"`);
        return res.send(result.buffer);
      }

      return res.status(400).json({ message: '不支持的报表格式' });
    } catch (error: any) {
      res.status(500).json({ message: '生成报表失败', error: error.message });
    }
  }

  // 报表模板
  @Get('templates')
  getTemplates(@User() user: UserInfo) {
    return this.reportService.getTemplates(user.id);
  }

  @Get('templates/:id')
  getTemplate(@Param('id') id: string, @User() user: UserInfo) {
    return this.reportService.getTemplate(id, user.id);
  }

  @Post('templates')
  createTemplate(@User() user: UserInfo, @Body() dto: CreateReportTemplateDto) {
    return this.reportService.createTemplate(user.id, dto);
  }

  @Patch('templates/:id')
  updateTemplate(@Param('id') id: string, @User() user: UserInfo, @Body() dto: UpdateReportTemplateDto) {
    return this.reportService.updateTemplate(id, user.id, dto);
  }

  @Delete('templates/:id')
  deleteTemplate(@Param('id') id: string, @User() user: UserInfo) {
    return this.reportService.deleteTemplate(id, user.id);
  }

  // 报表订阅
  @Get('subscriptions')
  getSubscriptions(@User() user: UserInfo) {
    return this.reportService.getSubscriptions(user.id);
  }

  @Get('subscriptions/:id')
  getSubscription(@Param('id') id: string, @User() user: UserInfo) {
    return this.reportService.getSubscription(id, user.id);
  }

  @Post('subscriptions')
  createSubscription(@User() user: UserInfo, @Body() dto: CreateReportSubscriptionDto) {
    return this.reportService.createSubscription(user.id, dto);
  }

  @Patch('subscriptions/:id')
  updateSubscription(@Param('id') id: string, @User() user: UserInfo, @Body() dto: UpdateReportSubscriptionDto) {
    return this.reportService.updateSubscription(id, user.id, dto);
  }

  @Delete('subscriptions/:id')
  deleteSubscription(@Param('id') id: string, @User() user: UserInfo) {
    return this.reportService.deleteSubscription(id, user.id);
  }

  @Post('subscriptions/:id/pause')
  pauseSubscription(@Param('id') id: string, @User() user: UserInfo) {
    return this.reportService.pauseSubscription(id, user.id);
  }

  @Post('subscriptions/:id/resume')
  resumeSubscription(@Param('id') id: string, @User() user: UserInfo) {
    return this.reportService.resumeSubscription(id, user.id);
  }
}
