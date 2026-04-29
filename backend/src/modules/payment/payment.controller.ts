import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, ParseUUIDPipe, Query, BadRequestException } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { CreatePaymentRecordDto } from './dto/create-payment-record.dto';
import { CreateReceiptRecordDto } from './dto/create-receipt-record.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { User } from '../../common/decorators/user.decorator';
import type { UserInfo } from '../user/entities/user.entity';

@Controller('payments')
@UseGuards(JwtAuthGuard)
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  // Payment Records (to suppliers)
  @Post('payments')
  createPayment(@Body() createPaymentDto: CreatePaymentRecordDto, @User() user: UserInfo) {
    return this.paymentService.createPayment(createPaymentDto, user.id);
  }

  @Get('payments')
  findAllPayments(@User() user: UserInfo, @Query('projectId') projectId?: string) {
    return this.paymentService.findAllPayments(user as any, projectId);
  }

  @Get('payments/project/:projectId')
  findPaymentsByProject(@Param('projectId', ParseUUIDPipe) projectId: string, @User() user: UserInfo) {
    return this.paymentService.findPaymentsByProject(projectId, user as any);
  }

  @Get('payments/supplier/:supplierId')
  findPaymentsBySupplier(@Param('supplierId', ParseUUIDPipe) supplierId: string, @User() user: UserInfo) {
    return this.paymentService.findPaymentsBySupplier(supplierId, user as any);
  }

  @Get('payments/:id')
  findOnePayment(@Param('id', ParseUUIDPipe) id: string, @User() user: UserInfo) {
    return this.paymentService.findOnePayment(id, user as any);
  }

  @Delete('payments/:id')
  removePayment(@Param('id', ParseUUIDPipe) id: string, @User() user: UserInfo) {
    return this.paymentService.removePayment(id, user as any);
  }

  @Patch('payments/:id/voucher')
  updatePaymentVoucher(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('proofUrl') proofUrl: string,
    @User() user: UserInfo,
  ) {
    if (!proofUrl) {
      throw new BadRequestException('proofUrl is required');
    }
    return this.paymentService.updatePaymentVoucher(id, proofUrl, user as any);
  }

  // Receipt Records (from customers)
  @Post('receipts')
  createReceipt(@Body() createReceiptDto: CreateReceiptRecordDto, @User() user: UserInfo) {
    return this.paymentService.createReceipt(createReceiptDto, user.id);
  }

  @Get('receipts')
  findAllReceipts(@User() user: UserInfo, @Query('projectId') projectId?: string) {
    return this.paymentService.findAllReceipts(user as any, projectId);
  }

  @Get('receipts/project/:projectId')
  findReceiptsByProject(@Param('projectId', ParseUUIDPipe) projectId: string, @User() user: UserInfo) {
    return this.paymentService.findReceiptsByProject(projectId, user as any);
  }

  @Get('receipts/:id')
  findOneReceipt(@Param('id', ParseUUIDPipe) id: string, @User() user: UserInfo) {
    return this.paymentService.findOneReceipt(id, user as any);
  }

  @Patch('receipts/:id')
  updateReceipt(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDto: any,
    @User() user: UserInfo,
  ) {
    return this.paymentService.updateReceipt(id, updateDto, user as any);
  }

  @Delete('receipts/:id')
  removeReceipt(@Param('id', ParseUUIDPipe) id: string, @User() user: UserInfo) {
    return this.paymentService.removeReceipt(id, user as any);
  }

  @Patch('receipts/:id/voucher')
  updateReceiptVoucher(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('proofUrl') proofUrl: string,
    @User() user: UserInfo,
  ) {
    if (!proofUrl) {
      throw new BadRequestException('proofUrl is required');
    }
    return this.paymentService.updateReceiptVoucher(id, proofUrl, user as any);
  }

  // Statistics
  @Get('statistics/overview')
  getOverviewStatistics(@User() user: UserInfo, @Query('projectId') projectId?: string) {
    return this.paymentService.getOverviewStatistics(user as any, projectId);
  }

  @Get('statistics/payments')
  getPaymentStatistics(@User() user: UserInfo, @Query('projectId') projectId?: string) {
    return this.paymentService.getPaymentStatistics(user as any, projectId);
  }

  @Get('statistics/receipts')
  getReceiptStatistics(@User() user: UserInfo, @Query('projectId') projectId?: string) {
    return this.paymentService.getReceiptStatistics(user as any, projectId);
  }
}
