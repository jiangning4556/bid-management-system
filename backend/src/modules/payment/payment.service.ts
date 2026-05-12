import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaymentRecord } from './entities/payment-record.entity';
import { ReceiptRecord } from './entities/receipt-record.entity';
import { CreatePaymentRecordDto } from './dto/create-payment-record.dto';
import { CreateReceiptRecordDto } from './dto/create-receipt-record.dto';
import { User, UserRole } from '../user/entities/user.entity';
import { BidProject } from '../bid-project/entities/bid-project.entity';
import { BidProjectItem } from '../bid-project/entities/bid-project-item.entity';
import { BidSupplier } from '../bid-project/entities/bid-supplier.entity';
import { Supplier } from '../supplier/entities/supplier.entity';
import { NotificationService } from '../notification/notification.service';
import { NotificationGateway } from '../notification/notification.gateway';
import { NotificationType } from '../notification/entities/notification.entity';

@Injectable()
export class PaymentService {
  constructor(
    @InjectRepository(PaymentRecord)
    private paymentRecordRepository: Repository<PaymentRecord>,
    @InjectRepository(ReceiptRecord)
    private receiptRecordRepository: Repository<ReceiptRecord>,
    @InjectRepository(BidProject)
    private bidProjectRepository: Repository<BidProject>,
    @InjectRepository(BidProjectItem)
    private bidProjectItemRepository: Repository<BidProjectItem>,
    @InjectRepository(BidSupplier)
    private bidSupplierRepository: Repository<BidSupplier>,
    @InjectRepository(Supplier)
    private supplierRepository: Repository<Supplier>,
    private notificationService: NotificationService,
    private notificationGateway: NotificationGateway,
  ) {}

  // Payment Records (to suppliers)
  async createPayment(createPaymentDto: CreatePaymentRecordDto, userId: string): Promise<PaymentRecord> {
    // Verify project exists and user has access
    const project = await this.bidProjectRepository.findOne({
      where: { id: createPaymentDto.projectId },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    // Verify supplier exists
    const supplier = await this.supplierRepository.findOne({
      where: { id: createPaymentDto.supplierId },
    });

    if (!supplier) {
      throw new NotFoundException('Supplier not found');
    }

    const payment = this.paymentRecordRepository.create({
      ...createPaymentDto,
      userId,
    });

    const savedPayment = await this.paymentRecordRepository.save(payment);

    // 创建通知
    const shouldNotify = await this.notificationService.shouldNotify(userId, NotificationType.PAYMENT);
    if (shouldNotify) {
      const notification = await this.notificationService.create({
        userId,
        type: NotificationType.PAYMENT,
        title: '新付款记录',
        content: `已向供应商 "${supplier.name}" 支付 ¥${createPaymentDto.amount}，项目：${project.name}`,
        relatedId: savedPayment.id,
        relatedType: 'PaymentRecord',
        metadata: {
          amount: createPaymentDto.amount,
          supplierName: supplier.name,
          projectName: project.name,
          projectId: project.id,
        },
      });
      await this.notificationGateway.sendNotificationToUser(userId, notification);
    }

    return savedPayment;
  }

  async findAllPayments(currentUser: User, projectId?: string): Promise<PaymentRecord[]> {
    const queryBuilder = this.paymentRecordRepository
      .createQueryBuilder('payment')
      .leftJoinAndSelect('payment.project', 'project')
      .leftJoinAndSelect('payment.supplier', 'supplier');

    if (currentUser.role !== UserRole.ADMIN) {
      queryBuilder.andWhere('payment.userId = :userId', { userId: currentUser.id });
    }

    if (projectId) {
      queryBuilder.andWhere('payment.projectId = :projectId', { projectId });
    }

    return queryBuilder.orderBy('payment.paymentTime', 'DESC').getMany();
  }

  async findPaymentsByProject(projectId: string, currentUser: User): Promise<PaymentRecord[]> {
    return this.findAllPayments(currentUser, projectId);
  }

  async findPaymentsBySupplier(supplierId: string, currentUser: User): Promise<PaymentRecord[]> {
    const queryBuilder = this.paymentRecordRepository
      .createQueryBuilder('payment')
      .leftJoinAndSelect('payment.project', 'project')
      .leftJoinAndSelect('payment.supplier', 'supplier')
      .where('payment.supplierId = :supplierId', { supplierId });

    if (currentUser.role !== UserRole.ADMIN) {
      queryBuilder.andWhere('payment.userId = :userId', { userId: currentUser.id });
    }

    return queryBuilder.orderBy('payment.paymentTime', 'DESC').getMany();
  }

  async findOnePayment(id: string, currentUser: User): Promise<PaymentRecord> {
    const payment = await this.paymentRecordRepository.findOne({
      where: { id },
      relations: ['project', 'supplier'],
    });

    if (!payment) {
      throw new NotFoundException('Payment record not found');
    }

    if (currentUser.role !== UserRole.ADMIN && payment.userId !== currentUser.id) {
      throw new NotFoundException('Payment record not found');
    }

    return payment;
  }

  async removePayment(id: string, currentUser: User): Promise<void> {
    const payment = await this.findOnePayment(id, currentUser);
    await this.paymentRecordRepository.softRemove(payment);
  }

  async updatePaymentVoucher(id: string, proofUrl: string, currentUser: User): Promise<PaymentRecord> {
    const payment = await this.findOnePayment(id, currentUser);
    payment.proofUrl = proofUrl;
    return this.paymentRecordRepository.save(payment);
  }

  // Receipt Records (from customers)
  async createReceipt(createReceiptDto: CreateReceiptRecordDto, userId: string): Promise<ReceiptRecord> {
    // Verify project exists and user has access
    const project = await this.bidProjectRepository.findOne({
      where: { id: createReceiptDto.projectId },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    const receipt = this.receiptRecordRepository.create({
      ...createReceiptDto,
      userId,
    });

    const savedReceipt = await this.receiptRecordRepository.save(receipt);

    // 创建通知
    const shouldNotify = await this.notificationService.shouldNotify(userId, NotificationType.RECEIPT);
    if (shouldNotify) {
      const notification = await this.notificationService.create({
        userId,
        type: NotificationType.RECEIPT,
        title: '新收款记录',
        content: `收到客户付款 ¥${createReceiptDto.amount}，项目：${project.name}`,
        relatedId: savedReceipt.id,
        relatedType: 'ReceiptRecord',
        metadata: {
          amount: createReceiptDto.amount,
          projectName: project.name,
          projectId: project.id,
        },
      });
      await this.notificationGateway.sendNotificationToUser(userId, notification);
    }

    return savedReceipt;
  }

  async findAllReceipts(currentUser: User, projectId?: string): Promise<ReceiptRecord[]> {
    const queryBuilder = this.receiptRecordRepository
      .createQueryBuilder('receipt')
      .leftJoinAndSelect('receipt.project', 'project');

    if (currentUser.role !== UserRole.ADMIN) {
      queryBuilder.andWhere('receipt.userId = :userId', { userId: currentUser.id });
    }

    if (projectId) {
      queryBuilder.andWhere('receipt.projectId = :projectId', { projectId });
    }

    return queryBuilder.orderBy('receipt.receiptTime', 'DESC').getMany();
  }

  async findReceiptsByProject(projectId: string, currentUser: User): Promise<ReceiptRecord[]> {
    return this.findAllReceipts(currentUser, projectId);
  }

  async findOneReceipt(id: string, currentUser: User): Promise<ReceiptRecord> {
    const receipt = await this.receiptRecordRepository.findOne({
      where: { id },
      relations: ['project'],
    });

    if (!receipt) {
      throw new NotFoundException('Receipt record not found');
    }

    if (currentUser.role !== UserRole.ADMIN && receipt.userId !== currentUser.id) {
      throw new NotFoundException('Receipt record not found');
    }

    return receipt;
  }

  async updateReceipt(id: string, updateDto: any, currentUser: User): Promise<ReceiptRecord> {
    const receipt = await this.findOneReceipt(id, currentUser);
    Object.assign(receipt, updateDto);
    return this.receiptRecordRepository.save(receipt);
  }

  async removeReceipt(id: string, currentUser: User): Promise<void> {
    const receipt = await this.findOneReceipt(id, currentUser);
    await this.receiptRecordRepository.softRemove(receipt);
  }

  async updateReceiptVoucher(id: string, proofUrl: string, currentUser: User): Promise<ReceiptRecord> {
    const receipt = await this.findOneReceipt(id, currentUser);
    receipt.proofUrl = proofUrl;
    return this.receiptRecordRepository.save(receipt);
  }

  // Statistics
  async getOverviewStatistics(currentUser: User, projectId?: string): Promise<{
    totalPayable: number;
    totalPaid: number;
    totalReceivable: number;
    totalReceived: number;
  }> {
    // Calculate totalPayable: sum of all selected supplier amounts from active (non-deleted) projects
    let totalPayable = 0;
    const supplierQuery = this.bidSupplierRepository
      .createQueryBuilder('bs')
      .leftJoin('bs.projectItem', 'bpi')
      .leftJoin('bpi.project', 'bp')
      .select('SUM(bs.amount)', 'total')
      .where('bs.isSelected = :isSelected', { isSelected: true })
      .andWhere('bp.deletedAt IS NULL');

    if (currentUser.role !== UserRole.ADMIN) {
      supplierQuery.andWhere('bp.userId = :userId', { userId: currentUser.id });
    }

    if (projectId) {
      supplierQuery.andWhere('bp.id = :projectId', { projectId });
    }

    // Use raw query to ensure deletedAt filter works correctly
    let rawQuery = `
      SELECT SUM(bs.amount) as total
      FROM bid_suppliers bs
      LEFT JOIN bid_project_items bpi ON bpi.id = bs.projectItemId
      LEFT JOIN bid_projects bp ON bp.id = bpi.projectId
      WHERE bs.isSelected = 1 AND bp.deletedAt IS NULL
    `;

    // Add user filter for non-admin users
    if (currentUser.role !== UserRole.ADMIN) {
      rawQuery += ` AND bp.userId = '${currentUser.id}'`;
    }

    // Add project filter if specified
    if (projectId) {
      rawQuery += ` AND bp.id = '${projectId}'`;
    }

    const rawResult = await this.paymentRecordRepository.query(rawQuery);
    totalPayable = parseFloat(rawResult[0]?.total || '0');
    console.log('[PaymentService] totalPayable calculated (raw query):', totalPayable, 'for user:', currentUser.username);

    // Calculate totalPaid: sum of all payment records
    let totalPaid = 0;
    const paidQuery = this.paymentRecordRepository
      .createQueryBuilder('payment')
      .select('SUM(payment.amount)', 'total');

    if (currentUser.role !== UserRole.ADMIN) {
      paidQuery.andWhere('payment.userId = :userId', { userId: currentUser.id });
    }

    if (projectId) {
      paidQuery.andWhere('payment.projectId = :projectId', { projectId });
    }

    const paidResult = await paidQuery.getRawOne();
    totalPaid = parseFloat(paidResult?.total || '0');

    // Calculate totalReceivable: sum of contractAmount (or totalAmount if contractAmount is null)
    let totalReceivable = 0;
    const receivableQuery = this.bidProjectRepository
      .createQueryBuilder('project')
      .select('SUM(COALESCE(project.contractAmount, project.totalAmount, 0))', 'total');

    if (currentUser.role !== UserRole.ADMIN) {
      receivableQuery.andWhere('project.userId = :userId', { userId: currentUser.id });
    }

    if (projectId) {
      receivableQuery.andWhere('project.id = :projectId', { projectId });
    }

    const receivableResult = await receivableQuery.getRawOne();
    totalReceivable = parseFloat(receivableResult?.total || '0');

    // Calculate totalReceived: sum of all receipt records
    let totalReceived = 0;
    const receivedQuery = this.receiptRecordRepository
      .createQueryBuilder('receipt')
      .select('SUM(receipt.amount)', 'total');

    if (currentUser.role !== UserRole.ADMIN) {
      receivedQuery.andWhere('receipt.userId = :userId', { userId: currentUser.id });
    }

    if (projectId) {
      receivedQuery.andWhere('receipt.projectId = :projectId', { projectId });
    }

    const receivedResult = await receivedQuery.getRawOne();
    totalReceived = parseFloat(receivedResult?.total || '0');

    return {
      totalPayable,
      totalPaid,
      totalReceivable,
      totalReceived,
    };
  }

  async getPaymentStatistics(currentUser: User, projectId?: string): Promise<any> {
    const queryBuilder = this.paymentRecordRepository
      .createQueryBuilder('payment')
      .select('SUM(payment.amount)', 'totalPaid');

    if (currentUser.role !== UserRole.ADMIN) {
      queryBuilder.andWhere('payment.userId = :userId', { userId: currentUser.id });
    }

    if (projectId) {
      queryBuilder.andWhere('payment.projectId = :projectId', { projectId });
    }

    const result = await queryBuilder.getRawOne();
    return {
      totalPaid: parseFloat(result?.totalPaid || '0'),
    };
  }

  async getReceiptStatistics(currentUser: User, projectId?: string): Promise<any> {
    const queryBuilder = this.receiptRecordRepository
      .createQueryBuilder('receipt')
      .select('SUM(receipt.amount)', 'totalReceived');

    if (currentUser.role !== UserRole.ADMIN) {
      queryBuilder.andWhere('receipt.userId = :userId', { userId: currentUser.id });
    }

    if (projectId) {
      queryBuilder.andWhere('receipt.projectId = :projectId', { projectId });
    }

    const result = await queryBuilder.getRawOne();
    return {
      totalReceived: parseFloat(result?.totalReceived || '0'),
    };
  }
}
