import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, DataSource } from 'typeorm';
import { ConsultProject, ConsultProjectStatus } from '../consult-project/entities/consult-project.entity';
import { BidProject, BidProjectStatus } from '../bid-project/entities/bid-project.entity';
import { BidProjectItem } from '../bid-project/entities/bid-project-item.entity';
import { BidSupplier } from '../bid-project/entities/bid-supplier.entity';
import { PaymentRecord } from '../payment/entities/payment-record.entity';
import { ReceiptRecord } from '../payment/entities/receipt-record.entity';
import { SupplierQuote } from '../consult-project/entities/supplier-quote.entity';
import { Supplier } from '../supplier/entities/supplier.entity';
import { User, UserRole } from '../user/entities/user.entity';

@Injectable()
export class StatisticsService {
  constructor(
    @InjectRepository(ConsultProject)
    private consultProjectRepository: Repository<ConsultProject>,
    @InjectRepository(BidProject)
    private bidProjectRepository: Repository<BidProject>,
    @InjectRepository(BidProjectItem)
    private bidProjectItemRepository: Repository<BidProjectItem>,
    @InjectRepository(BidSupplier)
    private bidSupplierRepository: Repository<BidSupplier>,
    @InjectRepository(PaymentRecord)
    private paymentRecordRepository: Repository<PaymentRecord>,
    @InjectRepository(ReceiptRecord)
    private receiptRecordRepository: Repository<ReceiptRecord>,
    @InjectRepository(SupplierQuote)
    private supplierQuoteRepository: Repository<SupplierQuote>,
    @InjectRepository(Supplier)
    private supplierRepository: Repository<Supplier>,
    private dataSource: DataSource,
  ) {}

  async getOverview(currentUser: User): Promise<any> {
    const consultCondition = currentUser.role === UserRole.ADMIN
      ? { deletedAt: null as any }
      : { userId: currentUser.id, deletedAt: null as any };

    const bidCondition = currentUser.role === UserRole.ADMIN
      ? { deletedAt: null as any }
      : { userId: currentUser.id, deletedAt: null as any };

    // Build raw SQL for payable amount (to ensure correct filtering of deleted projects)
    const userFilter = currentUser.role === UserRole.ADMIN ? '' : `AND project.userId = '${currentUser.id}'`;
    const payableSql = `
      SELECT SUM(supplier.amount) as total
      FROM bid_suppliers supplier
      INNER JOIN bid_project_items item ON item.id = supplier.projectItemId
      INNER JOIN bid_projects project ON project.id = item.projectId
      WHERE supplier.isSelected = 1
        AND project.deletedAt IS NULL
        ${userFilter}
    `;

    const [
      consultProjectCount,
      bidProjectCount,
      supplierCount,
      totalConsultAmount,
      totalBidAmount,
      payableResult,
      totalPaid,
      totalReceived,
    ] = await Promise.all([
      this.consultProjectRepository.count({ where: consultCondition }),
      this.bidProjectRepository.count({ where: bidCondition }),
      this.supplierRepository.count({ where: { deletedAt: null as any } }),
      this.consultProjectRepository
        .createQueryBuilder('project')
        .select('SUM(project.totalAmount)', 'total')
        .where(currentUser.role === UserRole.ADMIN ? 'project.deletedAt IS NULL' : 'project.userId = :userId')
        .setParameter('userId', currentUser.id)
        .getRawOne(),
      this.bidProjectRepository
        .createQueryBuilder('project')
        .select('SUM(COALESCE(project.contractAmount, project.totalAmount, 0))', 'total')
        .where(currentUser.role === UserRole.ADMIN ? 'project.deletedAt IS NULL' : 'project.userId = :userId')
        .setParameter('userId', currentUser.id)
        .getRawOne(),
      this.bidSupplierRepository.query(payableSql),
      this.paymentRecordRepository
        .createQueryBuilder('payment')
        .select('SUM(payment.amount)', 'total')
        .leftJoin('payment.project', 'project')
        .where('project.deletedAt IS NULL')
        .andWhere(currentUser.role === UserRole.ADMIN ? '1=1' : 'payment.userId = :userId')
        .setParameter('userId', currentUser.id)
        .getRawOne(),
      this.receiptRecordRepository
        .createQueryBuilder('receipt')
        .select('SUM(receipt.amount)', 'total')
        .leftJoin('receipt.project', 'project')
        .where('project.deletedAt IS NULL')
        .andWhere(currentUser.role === UserRole.ADMIN ? '1=1' : 'receipt.userId = :userId')
        .setParameter('userId', currentUser.id)
        .getRawOne(),
    ]);

    const totalPayable = parseFloat(payableResult[0]?.total || '0');

    return {
      consultProjectCount,
      bidProjectCount,
      supplierCount,
      totalConsultAmount: parseFloat(totalConsultAmount?.total || '0'),
      totalBidAmount: parseFloat(totalBidAmount?.total || '0'),
      totalPayable,
      totalPaid: parseFloat(totalPaid?.total || '0'),
      totalReceived: parseFloat(totalReceived?.total || '0'),
      estimatedProfit: parseFloat(totalReceived?.total || '0') - parseFloat(totalPaid?.total || '0'),
    };
  }

  async getProjectStatistics(projectId: string, currentUser: User): Promise<any> {
    const project = await this.bidProjectRepository.findOne({
      where: currentUser.role === UserRole.ADMIN
        ? { id: projectId, deletedAt: null as any }
        : { id: projectId, userId: currentUser.id, deletedAt: null as any },
      relations: ['projectItems', 'projectItems.suppliers', 'receipts'],
    });

    if (!project) {
      return null;
    }

    let totalPayable = 0;
    let totalPaid = 0;
    const supplierSummary: Record<string, any> = {};

    for (const item of project.projectItems) {
      for (const supplier of item.suppliers) {
        if (supplier.isSelected) {
          totalPayable += supplier.amount;

          if (supplier.paymentStatus === 'paid') {
            totalPaid += supplier.amount;
          }

          if (!supplierSummary[supplier.supplierId]) {
            supplierSummary[supplier.supplierId] = {
              supplierId: supplier.supplierId,
              totalPayable: 0,
              totalPaid: 0,
            };
          }

          supplierSummary[supplier.supplierId].totalPayable += supplier.amount;
          if (supplier.paymentStatus === 'paid') {
            supplierSummary[supplier.supplierId].totalPaid += supplier.amount;
          }
        }
      }
    }

    const totalReceivable = project.contractAmount || project.totalAmount || 0;
    let totalReceived = 0;
    for (const receipt of project.receipts) {
      totalReceived += receipt.amount;
    }

    return {
      project: {
        id: project.id,
        name: project.name,
        status: project.status,
      },
      payable: {
        total: totalPayable,
        paid: totalPaid,
        unpaid: totalPayable - totalPaid,
        progress: totalPayable > 0 ? (totalPaid / totalPayable) * 100 : 0,
      },
      receivable: {
        total: totalReceivable,
        received: totalReceived,
        unpaid: totalReceivable - totalReceived,
        progress: totalReceivable > 0 ? (totalReceived / totalReceivable) * 100 : 0,
      },
      profit: {
        gross: totalReceivable - totalPayable,
        net: totalReceived - totalPaid,
        margin: totalReceivable > 0 ? ((totalReceivable - totalPayable) / totalReceivable) * 100 : 0,
      },
      supplierSummary: Object.values(supplierSummary),
    };
  }

  async getSupplierStatistics(currentUser: User): Promise<any[]> {
    // Fetch raw data and calculate statistics in JavaScript to avoid TypeORM type issues
    const userFilter = currentUser.role === UserRole.ADMIN ? '' : `AND bp.userId = '${currentUser.id}'`;
    const sql = `
      SELECT
        bs.id,
        bs.supplierId,
        bs.amount,
        bs.isSelected,
        s.name as supplierName,
        bp.id as projectId
      FROM bid_suppliers bs
      INNER JOIN bid_project_items bpi ON bpi.id = bs.projectItemId
      INNER JOIN bid_projects bp ON bp.id = bpi.projectId
      INNER JOIN suppliers s ON s.id = bs.supplierId
      WHERE bs.isSelected = 1
        AND bp.deletedAt IS NULL
        ${userFilter}
    `;

    const rawData = await this.dataSource.query(sql);

    // Calculate statistics manually
    const supplierMap = new Map<string, {
      supplierId: string;
      supplierName: string;
      projectCount: number;
      totalAmount: number;
      amounts: number[];
    }>();

    for (const row of rawData) {
      const supplierId = row.supplierId;
      const amount = parseFloat(row.amount) || 0;

      if (!supplierMap.has(supplierId)) {
        supplierMap.set(supplierId, {
          supplierId,
          supplierName: row.supplierName,
          projectCount: 0,
          totalAmount: 0,
          amounts: [],
        });
      }

      const stats = supplierMap.get(supplierId)!;
      stats.projectCount += 1;
      stats.totalAmount += amount;
      stats.amounts.push(amount);
    }

    // Convert to array and sort by totalAmount
    return Array.from(supplierMap.values())
      .map(stats => ({
        supplierId: stats.supplierId,
        supplierName: stats.supplierName,
        quoteCount: stats.projectCount,
        totalQuoteAmount: stats.totalAmount,
        avgPrice: stats.amounts.length > 0 ? stats.totalAmount / stats.amounts.length : 0,
        minPrice: stats.amounts.length > 0 ? Math.min(...stats.amounts) : 0,
        maxPrice: stats.amounts.length > 0 ? Math.max(...stats.amounts) : 0,
      }))
      .sort((a, b) => b.totalQuoteAmount - a.totalQuoteAmount);
  }

  async getMonthlyStatistics(currentUser: User, year?: number): Promise<any[]> {
    const selectedYear = year || new Date().getFullYear();

    const monthlyStats = [];

    for (let month = 1; month <= 12; month++) {
      const startDate = new Date(selectedYear, month - 1, 1);
      const endDate = new Date(selectedYear, month, 0, 23, 59, 59, 999);

      const consultWhere = currentUser.role === UserRole.ADMIN
        ? { createdAt: Between(startDate, endDate) as any }
        : { userId: currentUser.id, createdAt: Between(startDate, endDate) as any };

      const bidWhere = currentUser.role === UserRole.ADMIN
        ? { createdAt: Between(startDate, endDate) as any }
        : { userId: currentUser.id, createdAt: Between(startDate, endDate) as any };

      const [consultCount, bidCount] = await Promise.all([
        this.consultProjectRepository.count({ where: consultWhere }),
        this.bidProjectRepository.count({ where: bidWhere }),
      ]);

      // Get sum amounts using query builder for better date filtering
      const [consultAmountResult, bidAmountResult] = await Promise.all([
        this.consultProjectRepository
          .createQueryBuilder('project')
          .select('SUM(project.totalAmount)', 'total')
          .where('project.createdAt BETWEEN :start AND :end')
          .andWhere(currentUser.role === UserRole.ADMIN ? 'project.deletedAt IS NULL' : 'project.userId = :userId')
          .setParameter('start', startDate)
          .setParameter('end', endDate)
          .setParameter('userId', currentUser.id)
          .getRawOne(),
        this.bidProjectRepository
          .createQueryBuilder('project')
          .select('SUM(project.totalAmount)', 'total')
          .where('project.createdAt BETWEEN :start AND :end')
          .andWhere(currentUser.role === UserRole.ADMIN ? 'project.deletedAt IS NULL' : 'project.userId = :userId')
          .setParameter('start', startDate)
          .setParameter('end', endDate)
          .setParameter('userId', currentUser.id)
          .getRawOne(),
      ]);

      monthlyStats.push({
        month,
        year: selectedYear,
        consultProjectCount: consultCount,
        bidProjectCount: bidCount,
        consultAmount: parseFloat(consultAmountResult?.total || '0'),
        bidAmount: parseFloat(bidAmountResult?.total || '0'),
      });
    }

    return monthlyStats;
  }

  async getRecentProjects(currentUser: User, limit: number = 5): Promise<any[]> {
    const actualLimit = Math.min(limit, 10);

    const consultCondition = currentUser.role === UserRole.ADMIN
      ? { deletedAt: null as any }
      : { userId: currentUser.id, deletedAt: null as any };

    const bidCondition = currentUser.role === UserRole.ADMIN
      ? { deletedAt: null as any }
      : { userId: currentUser.id, deletedAt: null as any };

    const [recentConsultProjects, recentBidProjects] = await Promise.all([
      this.consultProjectRepository.find({
        where: consultCondition,
        order: { createdAt: 'DESC' },
        take: actualLimit,
        select: ['id', 'name', 'customer', 'totalAmount', 'createdAt'],
      }),
      this.bidProjectRepository.find({
        where: bidCondition,
        order: { createdAt: 'DESC' },
        take: actualLimit,
        select: ['id', 'name', 'customer', 'totalAmount', 'createdAt'],
      }),
    ]);

    const projects = [
      ...recentConsultProjects.map(p => ({
        id: p.id,
        name: p.name,
        customer: p.customer,
        type: 'consult',
        amount: p.totalAmount || 0,
        createdAt: p.createdAt,
      })),
      ...recentBidProjects.map(p => ({
        id: p.id,
        name: p.name,
        customer: p.customer,
        type: 'bid',
        amount: p.totalAmount || 0,
        createdAt: p.createdAt,
      })),
    ];

    return projects
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, actualLimit);
  }

  /**
   * Get receivable statistics (应收账款统计)
   * @param currentUser Current user
   * @param startDate Optional start date for filtering
   * @param endDate Optional end date for filtering
   */
  async getReceivableStats(
    currentUser: User,
    startDate?: Date,
    endDate?: Date,
  ): Promise<any> {
    // Get total receivable from all bid projects (not filtered by date)
    // The receivable amount is what we should collect from customers
    const bidProjectQuery = this.bidProjectRepository
      .createQueryBuilder('project')
      .select('SUM(COALESCE(project.contractAmount, project.totalAmount, 0))', 'totalReceivable')
      .where('project.deletedAt IS NULL');

    // Apply user filter for non-admin users
    if (currentUser.role !== UserRole.ADMIN) {
      bidProjectQuery.andWhere('project.userId = :userId', { userId: currentUser.id });
    }

    const bidProjectResult = await bidProjectQuery.getRawOne();
    const totalReceivable = parseFloat(bidProjectResult?.totalReceivable || '0');

    // Get received amount from receipt records (filtered by date if provided)
    const receiptQuery = this.receiptRecordRepository
      .createQueryBuilder('receipt')
      .select('SUM(receipt.amount)', 'totalReceived')
      .leftJoin('receipt.project', 'project')
      .where('project.deletedAt IS NULL');

    // Apply date filter if provided (filter by receipt time)
    if (startDate && endDate) {
      receiptQuery.andWhere('receipt.receiptTime BETWEEN :start AND :end', {
        start: startDate,
        end: endDate,
      });
    }

    // Apply user filter for non-admin users
    if (currentUser.role !== UserRole.ADMIN) {
      receiptQuery.andWhere('receipt.userId = :userId', { userId: currentUser.id });
    }

    const receiptResult = await receiptQuery.getRawOne();
    const totalReceived = parseFloat(receiptResult?.totalReceived || '0');

    const totalUnreceived = Math.max(0, totalReceivable - totalReceived);
    const collectionRate = totalReceivable > 0 ? (totalReceived / totalReceivable) * 100 : 0;

    return {
      totalReceivable,
      totalReceived,
      totalUnreceived,
      collectionRate: Math.round(collectionRate * 100) / 100,
    };
  }

  /**
   * Get payable statistics (应付账款统计)
   * @param currentUser Current user
   * @param startDate Optional start date for filtering
   * @param endDate Optional end date for filtering
   */
  async getPayableStats(
    currentUser: User,
    startDate?: Date,
    endDate?: Date,
  ): Promise<any> {
    // Get total payable from all selected bid suppliers (not filtered by date)
    // The payable amount is what we should pay to suppliers
    // Use raw query to ensure correct filtering of deleted projects
    let supplierSql = `
      SELECT SUM(supplier.amount) as totalPayable
      FROM bid_suppliers supplier
      INNER JOIN bid_project_items item ON item.id = supplier.projectItemId
      INNER JOIN bid_projects project ON project.id = item.projectId
      WHERE supplier.isSelected = 1
        AND project.deletedAt IS NULL
    `;

    if (currentUser.role !== UserRole.ADMIN) {
      supplierSql += ` AND project.userId = '${currentUser.id}'`;
    }

    const supplierResult = await this.bidSupplierRepository.query(supplierSql);
    const totalPayable = parseFloat(supplierResult[0]?.totalPayable || '0');

    // Get paid amount from payment records (filtered by date if provided)
    // PaymentRecord has projectId field directly, so join through project
    const paymentQuery = this.paymentRecordRepository
      .createQueryBuilder('payment')
      .select('SUM(payment.amount)', 'totalPaid')
      .leftJoin('payment.project', 'project')
      .where('project.deletedAt IS NULL');

    // Apply date filter if provided (filter by payment time)
    if (startDate && endDate) {
      paymentQuery.andWhere('payment.paymentTime BETWEEN :start AND :end', {
        start: startDate,
        end: endDate,
      });
    }

    // Apply user filter for non-admin users
    if (currentUser.role !== UserRole.ADMIN) {
      paymentQuery.andWhere('payment.userId = :userId', { userId: currentUser.id });
    }

    const paymentResult = await paymentQuery.getRawOne();
    const totalPaid = parseFloat(paymentResult?.totalPaid || '0');

    const totalUnpaid = Math.max(0, totalPayable - totalPaid);
    const paymentRate = totalPayable > 0 ? (totalPaid / totalPayable) * 100 : 0;

    return {
      totalPayable,
      totalPaid,
      totalUnpaid,
      paymentRate: Math.round(paymentRate * 100) / 100,
    };
  }

  /**
   * Get date range based on period string
   * @param period 'month' | 'quarter' | 'year' | 'all'
   * @returns { startDate, endDate } or null for 'all'
   */
  private getDateRange(period: string): { startDate: Date; endDate: Date } | null {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    switch (period) {
      case 'month':
        // Current month: from 1st to today
        return {
          startDate: new Date(now.getFullYear(), now.getMonth(), 1),
          endDate: today,
        };
      case 'quarter':
        // Current quarter
        const quarter = Math.floor(now.getMonth() / 3);
        return {
          startDate: new Date(now.getFullYear(), quarter * 3, 1),
          endDate: today,
        };
      case 'year':
        // Current year
        return {
          startDate: new Date(now.getFullYear(), 0, 1),
          endDate: today,
        };
      case 'all':
      default:
        return null;
    }
  }

  /**
   * Get overview with period filtering
   * @param currentUser Current user
   * @param period Time period: 'month' | 'quarter' | 'year' | 'all'
   */
  async getOverviewWithPeriod(currentUser: User, period: string = 'all'): Promise<any> {
    const dateRange = this.getDateRange(period);
    const startDate = dateRange?.startDate;
    const endDate = dateRange?.endDate;

    const [receivableStats, payableStats] = await Promise.all([
      this.getReceivableStats(currentUser, startDate, endDate),
      this.getPayableStats(currentUser, startDate, endDate),
    ]);

    // Get project counts with date filter
    const consultQuery = this.consultProjectRepository
      .createQueryBuilder('project')
      .where('project.deletedAt IS NULL');
    const bidQuery = this.bidProjectRepository
      .createQueryBuilder('project')
      .where('project.deletedAt IS NULL');

    if (startDate && endDate) {
      consultQuery.andWhere('project.createdAt BETWEEN :start AND :end', {
        start: startDate,
        end: endDate,
      });
      bidQuery.andWhere('project.createdAt BETWEEN :start AND :end', {
        start: startDate,
        end: endDate,
      });
    }

    if (currentUser.role !== UserRole.ADMIN) {
      consultQuery.andWhere('project.userId = :userId', { userId: currentUser.id });
      bidQuery.andWhere('project.userId = :userId', { userId: currentUser.id });
    }

    const [consultProjectCount, bidProjectCount] = await Promise.all([
      consultQuery.getCount(),
      bidQuery.getCount(),
    ]);

    return {
      period,
      startDate,
      endDate,
      // Project counts
      consultProjectCount,
      bidProjectCount,

      // Receivable stats
      totalReceivable: receivableStats.totalReceivable,
      totalReceived: receivableStats.totalReceived,
      totalUnreceived: receivableStats.totalUnreceived,
      collectionRate: receivableStats.collectionRate,

      // Payable stats
      totalPayable: payableStats.totalPayable,
      totalPaid: payableStats.totalPaid,
      totalUnpaid: payableStats.totalUnpaid,
      paymentRate: payableStats.paymentRate,

      // Profit calculations
      grossProfit: receivableStats.totalReceivable - payableStats.totalPayable,
      realizedProfit: receivableStats.totalReceived - payableStats.totalPaid,
      profitMargin: receivableStats.totalReceivable > 0
        ? ((receivableStats.totalReceivable - payableStats.totalPayable) / receivableStats.totalReceivable) * 100
        : 0,
    };
  }
}
