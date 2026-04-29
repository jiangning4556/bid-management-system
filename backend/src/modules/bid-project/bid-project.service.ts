import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { BidProject, BidProjectStatus } from './entities/bid-project.entity';
import { BidProjectItem } from './entities/bid-project-item.entity';
import { BidSupplier, PaymentStatus, ProgressStage } from './entities/bid-supplier.entity';
import { CreateBidProjectDto } from './dto/create-bid-project.dto';
import { UpdateBidProjectDto } from './dto/update-bid-project.dto';
import { User, UserRole } from '../user/entities/user.entity';
import { Item } from '../item/entities/item.entity';
import { ConsultProject } from '../consult-project/entities/consult-project.entity';
import { ConsultProjectItem } from '../consult-project/entities/consult-project-item.entity';
import { SupplierQuote } from '../consult-project/entities/supplier-quote.entity';
import { Supplier } from '../supplier/entities/supplier.entity';
import { PaginationDto, PaginatedResponse, AdvancedSearchDto, SearchOperator, SearchLogic } from '../../common/dto';
import { PaymentRecord } from '../payment/entities/payment-record.entity';
import { NotificationService } from '../notification/notification.service';
import { NotificationGateway } from '../notification/notification.gateway';
import { NotificationType } from '../notification/entities/notification.entity';

@Injectable()
export class BidProjectService {
  constructor(
    @InjectRepository(BidProject)
    private bidProjectRepository: Repository<BidProject>,
    @InjectRepository(BidProjectItem)
    private bidProjectItemRepository: Repository<BidProjectItem>,
    @InjectRepository(BidSupplier)
    private bidSupplierRepository: Repository<BidSupplier>,
    @InjectRepository(Item)
    private itemRepository: Repository<Item>,
    @InjectRepository(ConsultProject)
    private consultProjectRepository: Repository<ConsultProject>,
    @InjectRepository(ConsultProjectItem)
    private consultProjectItemRepository: Repository<ConsultProjectItem>,
    @InjectRepository(SupplierQuote)
    private supplierQuoteRepository: Repository<SupplierQuote>,
    @InjectRepository(Supplier)
    private supplierRepository: Repository<Supplier>,
    @InjectRepository(PaymentRecord)
    private paymentRecordRepository: Repository<PaymentRecord>,
    private dataSource: DataSource,
    private notificationService: NotificationService,
    private notificationGateway: NotificationGateway,
  ) {}

  async createFromConsult(consultProjectId: string, userId: string): Promise<BidProject> {
    const consultProject = await this.consultProjectRepository.findOne({
      where: { id: consultProjectId, deletedAt: null as any },
      relations: ['projectItems', 'projectItems.quotes'],
    });

    if (!consultProject) {
      throw new NotFoundException('Consult project not found');
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Create bid project from consult project
      const bidProject = queryRunner.manager.create(BidProject, {
        name: consultProject.name,
        projectCode: consultProject.projectCode,
        customer: consultProject.customer,
        address: consultProject.address,
        consultProjectId: consultProject.id,
        userId,
        totalAmount: 0,
      });

      const savedBidProject = await queryRunner.manager.save(bidProject);

      let totalAmount = 0;

      // Copy items from consult project - only items with selected suppliers
      for (const consultItem of consultProject.projectItems) {
        // Filter for selected quotes only
        const selectedQuotes = consultItem.quotes.filter(q => q.isSelected);

        // Only create bid item if there are selected suppliers
        if (selectedQuotes.length === 0) {
          continue;
        }

        // 使用第一个被选中供应商报价的数量作为物品数量
        // quantity 字段可能是 int 类型或 string 类型，确保转换为数字
        const quoteQuantity = typeof selectedQuotes[0].quantity === 'string'
          ? parseInt(selectedQuotes[0].quantity, 10)
          : selectedQuotes[0].quantity;
        const itemQuantity = quoteQuantity && quoteQuantity > 0 ? quoteQuantity : consultItem.quantity;

        const bidProjectItem = queryRunner.manager.create(BidProjectItem, {
          projectId: savedBidProject.id,
          itemId: consultItem.itemId,
          quantity: itemQuantity,
          remarks: consultItem.remarks,
        });

        const savedBidItem = await queryRunner.manager.save(bidProjectItem);

        // Copy only selected supplier quotes
        for (const quote of selectedQuotes) {
          const amount = typeof quote.totalAmount === 'string'
            ? parseFloat(quote.totalAmount)
            : quote.totalAmount;

          const bidSupplier = queryRunner.manager.create(BidSupplier, {
            projectItemId: savedBidItem.id,
            supplierId: quote.supplierId,
            amount,
            progress: ProgressStage.ORDERED,
            paymentStatus: PaymentStatus.UNPAID,
            isSelected: true, // All copied suppliers are selected
          });

          await queryRunner.manager.save(bidSupplier);

          // Add to total
          totalAmount += amount;
        }
      }

      savedBidProject.totalAmount = totalAmount;
      await queryRunner.manager.save(savedBidProject);


      // 更新咨询项目的标记：已转为中标项目
      await queryRunner.manager.update(ConsultProject, consultProjectId, {
        hasBidProject: true,
        bidProjectId: savedBidProject.id,
      });
      await queryRunner.commitTransaction();

      const result = await this.findOne(savedBidProject.id, { id: userId, role: UserRole.ADMIN } as any);

      // 创建通知
      const shouldNotify = await this.notificationService.shouldNotify(userId, NotificationType.PROJECT);
      if (shouldNotify) {
        const notification = await this.notificationService.create({
          userId,
          type: NotificationType.PROJECT,
          title: '咨询项目已转为中标项目',
          content: `咨询项目 "${consultProject.name}" 已成功转为中标项目，项目编号：${savedBidProject.projectCode}`,
          relatedId: savedBidProject.id,
          relatedType: 'BidProject',
          metadata: {
            projectCode: savedBidProject.projectCode,
            customer: savedBidProject.customer,
            totalAmount: savedBidProject.totalAmount,
            consultProjectId: consultProjectId,
          },
        });
        await this.notificationGateway.sendNotificationToUser(userId, notification);
      }

      return result;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async create(createBidProjectDto: CreateBidProjectDto, userId: string): Promise<BidProject> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Create project
      const project = queryRunner.manager.create(BidProject, {
        ...createBidProjectDto,
        userId,
        totalAmount: createBidProjectDto.amount || 0,
      });

      const savedProject = await queryRunner.manager.save(project);

      // Create project items and suppliers
      let totalAmount = 0;

      if (createBidProjectDto.items && createBidProjectDto.items.length > 0) {
        for (const itemDto of createBidProjectDto.items) {
          const item = await this.itemRepository.findOne({
            where: { id: itemDto.itemId },
          });

          if (!item) {
            throw new NotFoundException(`Item with ID ${itemDto.itemId} not found`);
          }

          const projectItem = queryRunner.manager.create(BidProjectItem, {
            projectId: savedProject.id,
            itemId: itemDto.itemId,
            quantity: itemDto.quantity,
            remarks: itemDto.remarks,
          });

          const savedProjectItem = await queryRunner.manager.save(projectItem);

          if (itemDto.suppliers && itemDto.suppliers.length > 0) {
            for (const supplierDto of itemDto.suppliers) {
              const supplier = new BidSupplier();
              supplier.projectItemId = savedProjectItem.id;
              supplier.supplierId = supplierDto.supplierId;
              supplier.amount = supplierDto.amount;
              supplier.progress = (supplierDto.progress || ProgressStage.ORDERED) as ProgressStage;
              supplier.paymentStatus = (supplierDto.paymentStatus || PaymentStatus.UNPAID) as PaymentStatus;
              supplier.paymentTime = supplierDto.paymentTime || null;
              supplier.remarks = supplierDto.remarks || null;
              supplier.isSelected = supplierDto.isSelected ?? true;

              await queryRunner.manager.save(supplier);

              if (supplierDto.isSelected ?? true) {
                totalAmount += supplierDto.amount;
              }
            }
          }
        }
      }

      savedProject.totalAmount = totalAmount;
      await queryRunner.manager.save(savedProject);

      await queryRunner.commitTransaction();

      return this.findOne(savedProject.id, { id: userId, role: UserRole.ADMIN } as any);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async findAll(currentUser: User, paginationDto: PaginationDto): Promise<PaginatedResponse<BidProject>> {
    const { page = 1, limit = 10, sortBy, sortOrder = 'DESC' } = paginationDto;
    const skip = (page - 1) * limit;

    const where: any = { deletedAt: null as any };
    if (currentUser.role !== UserRole.ADMIN) {
      where.userId = currentUser.id;
    }

    // Build order object
    let order: any = { createdAt: 'DESC' };
    if (sortBy) {
      const validFields = ['name', 'projectCode', 'customer', 'totalAmount', 'status', 'createdAt', 'updatedAt'];
      if (validFields.includes(sortBy)) {
        order = { [sortBy]: sortOrder };
      }
    }

    const [data, total] = await this.bidProjectRepository.findAndCount({
      where,
      relations: [
        'projectItems',
        'projectItems.item',
        'projectItems.suppliers',
        'projectItems.suppliers.supplier',
        'consultProject',
      ],
      order,
      skip,
      take: limit,
    });

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string, currentUser: User): Promise<BidProject> {
    const project = await this.bidProjectRepository.findOne({
      where: { id, deletedAt: null as any },
      relations: [
        'projectItems',
        'projectItems.item',
        'projectItems.suppliers',
        'projectItems.suppliers.supplier',
        'consultProject',
        'receipts',
        'user',
      ],
    });

    if (!project) {
      throw new NotFoundException('Bid project not found');
    }

    if (currentUser.role !== UserRole.ADMIN && project.userId !== currentUser.id) {
      throw new NotFoundException('Bid project not found');
    }

    return project;
  }

  async update(id: string, updateBidProjectDto: UpdateBidProjectDto, currentUser: User): Promise<BidProject> {
    const project = await this.findOne(id, currentUser);

    const { items, ...updateData } = updateBidProjectDto as any;
    Object.assign(project, updateData);

    return this.bidProjectRepository.save(project);
  }

  async remove(id: string, currentUser: User): Promise<void> {
    const project = await this.findOne(id, currentUser);
    const consultProjectId = project.consultProjectId;

    console.log(`准备删除中标项目 ${id}，关联的咨询项目ID: ${consultProjectId}`);

    // 先清除咨询项目的标记，再删除中标项目
    if (consultProjectId) {
      // 先检查咨询项目是否存在
      const consultProject = await this.consultProjectRepository.findOne({
        where: { id: consultProjectId },
      });

      if (consultProject) {
        console.log(`咨询项目 ${consultProjectId} 存在，当前 hasBidProject: ${consultProject.hasBidProject}, bidProjectId: ${consultProject.bidProjectId}`);

        // Use repository.update() to properly handle nullable field
        await this.consultProjectRepository.update(
          { id: consultProjectId },
          {
            hasBidProject: false,
            bidProjectId: null as any, // TypeORM nullable field workaround
          }
        );

        console.log(`清除咨询项目 ${consultProjectId} 的中标标记`);

        // 验证更新是否成功
        const updated = await this.consultProjectRepository.findOne({
          where: { id: consultProjectId },
          select: ['id', 'hasBidProject', 'bidProjectId'],
        });
        console.log(`验证更新结果 - hasBidProject: ${updated?.hasBidProject}, bidProjectId: ${updated?.bidProjectId}`);
      } else {
        console.warn(`咨询项目 ${consultProjectId} 不存在，可能已被删除`);
      }
    } else {
      console.log(`中标项目 ${id} 没有关联的咨询项目`);
    }

    await this.bidProjectRepository.softRemove(project);
    console.log(`中标项目 ${id} 已软删除`);
  }

  async updateSupplierInfo(
    supplierId: string,
    updateDto: any,
    currentUser: User,
  ): Promise<BidSupplier> {
    const supplier = await this.bidSupplierRepository.findOne({
      where: { id: supplierId },
      relations: ['projectItem', 'projectItem.project'],
    });

    if (!supplier) {
      throw new NotFoundException('Bid supplier not found');
    }

    if (currentUser.role !== UserRole.ADMIN && supplier.projectItem.project.userId !== currentUser.id) {
      throw new NotFoundException('Bid supplier not found');
    }

    // 如果更新了 price，自动重新计算 amount
    if (updateDto.price !== undefined) {
      const price = updateDto.price;
      const quantity = supplier.projectItem.quantity || 1;
      updateDto.amount = price * quantity;
    }

    Object.assign(supplier, updateDto);
    const savedSupplier = await this.bidSupplierRepository.save(supplier);

    // 重新计算项目总金额（因为供应商的 amount 或 isSelected 可能变化）
    await this.recalculateProjectAmount(supplier.projectItem.projectId);

    // Fetch again with supplier relation included
    // Use query builder to ensure proper loading
    const result = await this.bidSupplierRepository
      .createQueryBuilder('bs')
      .leftJoinAndSelect('bs.supplier', 'supplier')
      .where('bs.id = :id', { id: savedSupplier.id })
      .getOne();

    if (!result) {
      // If query builder fails, fetch supplier separately and attach
      const supplierEntity = await this.supplierRepository.findOne({
        where: { id: savedSupplier.supplierId }
      });
      if (supplierEntity) {
        savedSupplier.supplier = supplierEntity;
      }
      return savedSupplier;
    }

    return result;
  }

  async toggleSupplierSelection(
    supplierId: string,
    currentUser: User,
  ): Promise<BidSupplier> {
    const supplier = await this.bidSupplierRepository.findOne({
      where: { id: supplierId },
      relations: ['projectItem', 'projectItem.project'],
    });

    if (!supplier) {
      throw new NotFoundException('Bid supplier not found');
    }

    if (currentUser.role !== UserRole.ADMIN && supplier.projectItem.project.userId !== currentUser.id) {
      throw new NotFoundException('Bid supplier not found');
    }

    // 切换选中状态
    supplier.isSelected = !supplier.isSelected;
    const savedSupplier = await this.bidSupplierRepository.save(supplier);

    // 重新计算项目总金额（因为选中状态变化）
    await this.recalculateProjectAmount(supplier.projectItem.projectId);

    // Fetch again with supplier relation included
    // Use query builder to ensure proper loading
    const result = await this.bidSupplierRepository
      .createQueryBuilder('bs')
      .leftJoinAndSelect('bs.supplier', 'supplier')
      .where('bs.id = :id', { id: savedSupplier.id })
      .getOne();

    if (!result) {
      // If query builder fails, fetch supplier separately and attach
      const supplierEntity = await this.supplierRepository.findOne({
        where: { id: savedSupplier.supplierId }
      });
      if (supplierEntity) {
        savedSupplier.supplier = supplierEntity;
      }
      return savedSupplier;
    }

    return result;
  }

  async deleteSupplier(supplierId: string, currentUser: User): Promise<void> {
    const supplier = await this.bidSupplierRepository.findOne({
      where: { id: supplierId },
      relations: ['projectItem', 'projectItem.project'],
    });

    if (!supplier) {
      throw new NotFoundException('Bid supplier not found');
    }

    if (currentUser.role !== UserRole.ADMIN && supplier.projectItem.project.userId !== currentUser.id) {
      throw new NotFoundException('Bid supplier not found');
    }

    await this.bidSupplierRepository.remove(supplier);

    // Recalculate project total amount
    await this.recalculateProjectAmount(supplier.projectItem.projectId);
  }

  async getProjectStatistics(projectId: string, currentUser: User): Promise<any> {
    const project = await this.findOne(projectId, currentUser);

    let totalPayable = 0;
    let totalPaid = 0;
    const suppliersByStatus: Record<string, any> = {};

    // Calculate from suppliers (expected payments)
    for (const item of project.projectItems) {
      for (const supplier of item.suppliers) {
        if (supplier.isSelected) {
          // amount 可能是字符串，需要转换为数字
          const amount = typeof supplier.amount === 'string'
            ? parseFloat(supplier.amount)
            : supplier.amount;
          totalPayable += amount;

          if (supplier.paymentStatus === PaymentStatus.PAID) {
            totalPaid += amount;
          }
        }
      }
    }

    // Get actual payment records for this project
    const paymentRecords = await this.paymentRecordRepository
      .createQueryBuilder('payment')
      .where('payment.projectId = :projectId', { projectId })
      .getMany();

    // Calculate actual paid amount from payment records
    const actualTotalPaid = paymentRecords.reduce((sum, record) => sum + Number(record.amount), 0);

    // Calculate aging analysis for unpaid amounts
    const totalUnpaid = totalPayable - actualTotalPaid;
    const agingAnalysis = this.calculateAgingAnalysis(project, totalUnpaid);

    return {
      projectId: project.id,
      projectName: project.name,
      totalPayable,
      totalPaid: actualTotalPaid,
      totalUnpaid,
      paymentProgress: totalPayable > 0 ? Math.round((actualTotalPaid / totalPayable) * 10000) / 100 : 0,
      agingAnalysis,
    };
  }

  /**
   * Calculate aging analysis based on project creation date
   * @param project - The bid project
   * @param totalUnpaid - Total unpaid amount
   * @returns Aging analysis by time periods
   */
  private calculateAgingAnalysis(project: BidProject, totalUnpaid: number): {
    within30days: number;
    within60days: number;
    within90days: number;
    over90days: number;
  } {
    const now = new Date();
    const projectDate = new Date(project.createdAt);
    const daysSinceProject = Math.floor((now.getTime() - projectDate.getTime()) / (1000 * 60 * 60 * 24));

    // For simplicity, distribute unpaid amount based on project age
    // In a more complex system, this would be based on individual payment due dates
    if (totalUnpaid <= 0) {
      return {
        within30days: 0,
        within60days: 0,
        within90days: 0,
        over90days: 0,
      };
    }

    // Categorize by age
    if (daysSinceProject <= 30) {
      return {
        within30days: totalUnpaid,
        within60days: 0,
        within90days: 0,
        over90days: 0,
      };
    } else if (daysSinceProject <= 60) {
      return {
        within30days: 0,
        within60days: totalUnpaid,
        within90days: 0,
        over90days: 0,
      };
    } else if (daysSinceProject <= 90) {
      return {
        within30days: 0,
        within60days: 0,
        within90days: totalUnpaid,
        over90days: 0,
      };
    } else {
      return {
        within30days: 0,
        within60days: 0,
        within90days: 0,
        over90days: totalUnpaid,
      };
    }
  }

  async addItem(projectId: string, itemDto: any, currentUser: User): Promise<BidProjectItem> {
    const project = await this.findOne(projectId, currentUser);

    // Verify item exists
    const item = await this.itemRepository.findOne({
      where: { id: itemDto.itemId },
    });

    if (!item) {
      throw new NotFoundException(`Item with ID ${itemDto.itemId} not found`);
    }

    const projectItem = this.bidProjectItemRepository.create({
      projectId,
      itemId: itemDto.itemId,
      quantity: itemDto.quantity,
      remarks: itemDto.remarks,
    });

    const savedItem = await this.bidProjectItemRepository.save(projectItem);

    // 重新计算项目总金额（虽然新物品没有供应商，但保持一致性）
    await this.recalculateProjectAmount(projectId);

    return savedItem;
  }

  async updateItem(
    projectId: string,
    itemId: string,
    updateDto: { quantity?: number; remarks?: string },
    currentUser: User,
  ): Promise<BidProjectItem> {
    // 1. 验证项目存在且用户有权限
    await this.findOne(projectId, currentUser);

    // 2. 查找项目项（包含供应商关系）
    const item = await this.bidProjectItemRepository.findOne({
      where: { id: itemId, projectId },
      relations: ['suppliers'],
    });

    if (!item) {
      throw new NotFoundException('Project item not found');
    }

    // 3. 更新字段
    if (updateDto.quantity !== undefined) {
      const oldQuantity = item.quantity;
      const newQuantity = updateDto.quantity;

      item.quantity = newQuantity;

      // 如果数量变化，更新该物品下所有供应商的 amount
      if (oldQuantity !== newQuantity && item.suppliers && item.suppliers.length > 0) {
        for (const supplier of item.suppliers) {
          // amount = price × new quantity
          supplier.amount = supplier.price * newQuantity;
          await this.bidSupplierRepository.save(supplier);
        }
      }
    }
    if (updateDto.remarks !== undefined) {
      item.remarks = updateDto.remarks;
    }

    // 4. 保存物品
    const savedItem = await this.bidProjectItemRepository.save(item);

    // 5. 重新计算项目总金额（因为数量变化影响了所有供应商的 amount）
    await this.recalculateProjectAmount(projectId);

    return savedItem;
  }

  async removeItem(projectId: string, itemId: string, currentUser: User): Promise<void> {
    // 1. 验证项目存在且用户有权限
    const project = await this.findOne(projectId, currentUser);

    // 2. 查找项目项
    const item = await this.bidProjectItemRepository.findOne({
      where: { id: itemId, projectId },
      relations: ['suppliers'],
    });

    if (!item) {
      throw new NotFoundException('Project item not found');
    }

    // 3. 删除项目项（CASCADE会自动删除关联的供应商）
    await this.bidProjectItemRepository.remove(item);

    // 4. 重新计算项目总金额
    await this.recalculateProjectAmount(projectId);
  }

  async recalculateProjectAmount(projectId: string): Promise<void> {
    const project = await this.bidProjectRepository.findOne({
      where: { id: projectId },
      relations: ['projectItems', 'projectItems.suppliers'],
    });

    if (!project) return;

    let totalAmount = 0;
    for (const item of project.projectItems) {
      for (const supplier of item.suppliers) {
        if (supplier.isSelected) {
          totalAmount += supplier.amount;
        }
      }
    }

    project.totalAmount = totalAmount;
    await this.bidProjectRepository.save(project);
  }

  async addSupplierToItem(itemId: string, supplierDto: any, currentUser: User): Promise<BidSupplier> {
    // 1. 查找项目项并验证权限
    const item = await this.bidProjectItemRepository.findOne({
      where: { id: itemId },
      relations: ['project', 'project.user', 'suppliers'],
    });

    if (!item) {
      throw new NotFoundException('Project item not found');
    }

    if (currentUser.role !== UserRole.ADMIN && item.project.userId !== currentUser.id) {
      throw new NotFoundException('Project item not found');
    }

    // 2. 验证供应商存在
    const supplierExists = await this.supplierRepository.findOne({
      where: { id: supplierDto.supplierId },
    });

    if (!supplierExists) {
      throw new NotFoundException('Supplier not found');
    }

    // 3. 检查是否已添加该供应商
    const existingSupplier = item.suppliers?.find(s => s.supplierId === supplierDto.supplierId);
    if (existingSupplier) {
      throw new BadRequestException('该供应商已添加到此物品');
    }

    // 4. 创建供应商关联
    // 计算总金额 = 单价 × 数量
    const price = supplierDto.price ?? 0;
    const quantity = item.quantity || 1;
    const totalAmount = price * quantity;

    const bidSupplier = this.bidSupplierRepository.create({
      projectItemId: itemId,
      supplierId: supplierDto.supplierId,
      price: price,
      amount: totalAmount,
      progress: supplierDto.progress || ProgressStage.ORDERED,
      paymentStatus: supplierDto.paymentStatus || PaymentStatus.UNPAID,
      paymentTime: supplierDto.paymentTime || null,
      remarks: supplierDto.remarks || null,
      isSelected: supplierDto.isSelected ?? true,
    });

    const savedSupplier = await this.bidSupplierRepository.save(bidSupplier);

    // 5. 如果供应商被选中，更新项目总金额
    if (bidSupplier.isSelected) {
      await this.recalculateProjectAmount(item.projectId);
    }

    // Fetch again with supplier relation included
    // Use query builder to ensure proper loading
    const result = await this.bidSupplierRepository
      .createQueryBuilder('bs')
      .leftJoinAndSelect('bs.supplier', 'supplier')
      .where('bs.id = :id', { id: savedSupplier.id })
      .getOne();

    if (!result) {
      // If query builder fails, fetch supplier separately and attach
      const supplierEntity = await this.supplierRepository.findOne({
        where: { id: savedSupplier.supplierId }
      });
      if (supplierEntity) {
        savedSupplier.supplier = supplierEntity;
      }
      return savedSupplier;
    }

    return result;
  }

  async advancedSearch(
    currentUser: User,
    searchDto: AdvancedSearchDto,
    paginationDto: PaginationDto,
  ): Promise<PaginatedResponse<BidProject>> {
    const { page = 1, limit = 10, sortBy, sortOrder = 'DESC' } = paginationDto;
    const skip = (page - 1) * limit;

    const queryBuilder = this.bidProjectRepository.createQueryBuilder('project');
    queryBuilder.where('project.deletedAt IS NULL');

    // Apply user permission filter
    if (currentUser.role !== UserRole.ADMIN) {
      queryBuilder.andWhere('project.userId = :userId', { userId: currentUser.id });
    }

    // Apply date range filter
    if (searchDto.dateFrom || searchDto.dateTo) {
      const dateField = searchDto.dateField || 'createdAt';
      if (searchDto.dateFrom && searchDto.dateTo) {
        queryBuilder.andWhere(`project.${dateField} BETWEEN :dateFrom AND :dateTo`, {
          dateFrom: new Date(searchDto.dateFrom),
          dateTo: new Date(searchDto.dateTo),
        });
      } else if (searchDto.dateFrom) {
        queryBuilder.andWhere(`project.${dateField} >= :dateFrom`, {
          dateFrom: new Date(searchDto.dateFrom),
        });
      } else if (searchDto.dateTo) {
        queryBuilder.andWhere(`project.${dateField} <= :dateTo`, {
          dateTo: new Date(searchDto.dateTo),
        });
      }
    }

    // Apply status filter
    if (searchDto.statuses && searchDto.statuses.length > 0) {
      const statusField = searchDto.statusField || 'status';
      queryBuilder.andWhere(`project.${statusField} IN (:...statuses)`, {
        statuses: searchDto.statuses,
      });
    }

    // Apply custom conditions
    if (searchDto.conditions && searchDto.conditions.length > 0) {
      const logic = searchDto.logic || SearchLogic.AND;
      const conditionMethod = logic === SearchLogic.AND ? 'andWhere' : 'orWhere';

      searchDto.conditions.forEach((condition, index) => {
        const paramKey = `condition${index}`;
        const { field, operator, value, value2, values } = condition;

        switch (operator) {
          case SearchOperator.EQUALS:
            queryBuilder[conditionMethod](`project.${field} = :${paramKey}`, { [paramKey]: value });
            break;
          case SearchOperator.CONTAINS:
            queryBuilder[conditionMethod](`project.${field} LIKE :${paramKey}`, { [paramKey]: `%${value}%` });
            break;
          case SearchOperator.STARTS_WITH:
            queryBuilder[conditionMethod](`project.${field} LIKE :${paramKey}`, { [paramKey]: `${value}%` });
            break;
          case SearchOperator.ENDS_WITH:
            queryBuilder[conditionMethod](`project.${field} LIKE :${paramKey}`, { [paramKey]: `%${value}` });
            break;
          case SearchOperator.GREATER_THAN:
            queryBuilder[conditionMethod](`project.${field} > :${paramKey}`, { [paramKey]: parseFloat(value!) });
            break;
          case SearchOperator.LESS_THAN:
            queryBuilder[conditionMethod](`project.${field} < :${paramKey}`, { [paramKey]: parseFloat(value!) });
            break;
          case SearchOperator.GREATER_EQUAL:
            queryBuilder[conditionMethod](`project.${field} >= :${paramKey}`, { [paramKey]: parseFloat(value!) });
            break;
          case SearchOperator.LESS_EQUAL:
            queryBuilder[conditionMethod](`project.${field} <= :${paramKey}`, { [paramKey]: parseFloat(value!) });
            break;
          case SearchOperator.BETWEEN:
            if (value && value2) {
              queryBuilder[conditionMethod](`project.${field} BETWEEN :${paramKey}1 AND :${paramKey}2`, {
                [`${paramKey}1`]: parseFloat(value),
                [`${paramKey}2`]: parseFloat(value2),
              });
            }
            break;
          case SearchOperator.IN:
            if (values && values.length > 0) {
              queryBuilder[conditionMethod](`project.${field} IN (:...${paramKey})`, { [paramKey]: values });
            }
            break;
        }
      });
    }

    // Build order object
    let order: any = { createdAt: 'DESC' };
    if (sortBy) {
      const validFields = ['name', 'projectCode', 'customer', 'status', 'contractDate', 'totalAmount', 'createdAt', 'updatedAt'];
      if (validFields.includes(sortBy)) {
        order = { [sortBy]: sortOrder };
      }
    }

    queryBuilder.orderBy(order);

    const [data, total] = await queryBuilder
      .leftJoinAndSelect('project.projectItems', 'projectItems')
      .leftJoinAndSelect('projectItems.item', 'item')
      .leftJoinAndSelect('projectItems.suppliers', 'suppliers')
      .leftJoinAndSelect('suppliers.supplier', 'supplier')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}
