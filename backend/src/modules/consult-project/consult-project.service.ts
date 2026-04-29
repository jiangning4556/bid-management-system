import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { ConsultProject, ConsultProjectStatus } from './entities/consult-project.entity';
import { ConsultProjectItem } from './entities/consult-project-item.entity';
import { SupplierQuote } from './entities/supplier-quote.entity';
import { CreateConsultProjectDto } from './dto/create-consult-project.dto';
import { UpdateConsultProjectDto } from './dto/update-consult-project.dto';
import { User, UserRole } from '../user/entities/user.entity';
import { Item } from '../item/entities/item.entity';
import { BidProject } from '../bid-project/entities/bid-project.entity';
import { PaginationDto, PaginatedResponse, AdvancedSearchDto, SearchOperator, SearchLogic } from '../../common/dto';
import { NotificationService } from '../notification/notification.service';
import { NotificationGateway } from '../notification/notification.gateway';
import { NotificationType } from '../notification/entities/notification.entity';

@Injectable()
export class ConsultProjectService {
  constructor(
    @InjectRepository(ConsultProject)
    private consultProjectRepository: Repository<ConsultProject>,
    @InjectRepository(ConsultProjectItem)
    private projectItemRepository: Repository<ConsultProjectItem>,
    @InjectRepository(SupplierQuote)
    private supplierQuoteRepository: Repository<SupplierQuote>,
    @InjectRepository(Item)
    private itemRepository: Repository<Item>,
    private dataSource: DataSource,
    private notificationService: NotificationService,
    private notificationGateway: NotificationGateway,
  ) {}

  async create(createConsultProjectDto: CreateConsultProjectDto, userId: string): Promise<ConsultProject> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Create project
      const project = queryRunner.manager.create(ConsultProject, {
        ...createConsultProjectDto,
        userId,
        totalAmount: 0,
      });

      const savedProject = await queryRunner.manager.save(project);

      // Create project items and quotes
      // 总金额计算规则：总金额 = 物品的最低报价（单价*数量）之和（对每个物品，取各供应商报价中的最低价累加）
      let totalAmount = 0;

      if (createConsultProjectDto.items && createConsultProjectDto.items.length > 0) {
        for (const itemDto of createConsultProjectDto.items) {
          // Verify item exists
          const item = await this.itemRepository.findOne({
            where: { id: itemDto.itemId },
          });

          if (!item) {
            throw new NotFoundException(`Item with ID ${itemDto.itemId} not found`);
          }

          // Create project item
          const projectItem = queryRunner.manager.create(ConsultProjectItem, {
            projectId: savedProject.id,
            itemId: itemDto.itemId,
            quantity: itemDto.quantity,
            remarks: itemDto.remarks,
          });

          const savedProjectItem = await queryRunner.manager.save(projectItem);

          // Create supplier quotes and track lowest price for this item
          let lowestQuoteAmount = Infinity;

          if (itemDto.quotes && itemDto.quotes.length > 0) {
            for (const quoteDto of itemDto.quotes) {
              const quoteAmount = parseFloat(String(quoteDto.price)) * parseFloat(String(quoteDto.quantity));
              const quote = queryRunner.manager.create(SupplierQuote, {
                projectItemId: savedProjectItem.id,
                supplierId: quoteDto.supplierId,
                price: quoteDto.price,
                quantity: quoteDto.quantity,
                brand: quoteDto.brand,
                contact: quoteDto.contact,
                phone: quoteDto.phone,
                totalAmount: quoteAmount,
                remarks: quoteDto.remarks,
              });

              await queryRunner.manager.save(quote);

              // Track lowest quote for this item
              if (quoteAmount < lowestQuoteAmount) {
                lowestQuoteAmount = quoteAmount;
              }
            }

            // Add lowest quote amount to project total
            if (lowestQuoteAmount !== Infinity) {
              totalAmount += lowestQuoteAmount;
            }
          }
        }
      }

      // Update project total
      savedProject.totalAmount = totalAmount;
      await queryRunner.manager.save(savedProject);

      await queryRunner.commitTransaction();

      // 创建通知
      const result = await this.findOne(savedProject.id, { id: userId, role: UserRole.ADMIN } as any);

      // 检查用户是否接收项目通知
      const shouldNotify = await this.notificationService.shouldNotify(userId, NotificationType.PROJECT);
      if (shouldNotify) {
        const notification = await this.notificationService.create({
          userId,
          type: NotificationType.PROJECT,
          title: '新咨询项目创建',
          content: `咨询项目 "${savedProject.name}" 已创建，项目编号：${savedProject.projectCode}`,
          relatedId: savedProject.id,
          relatedType: 'ConsultProject',
          metadata: {
            projectCode: savedProject.projectCode,
            customer: savedProject.customer,
            totalAmount: savedProject.totalAmount,
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

  async findAll(currentUser: User, paginationDto: PaginationDto): Promise<PaginatedResponse<ConsultProject>> {
    const { page = 1, limit = 10, sortBy, sortOrder = 'DESC' } = paginationDto;
    const skip = (page - 1) * limit;

    const where: any = { deletedAt: null as any };
    if (currentUser.role !== UserRole.ADMIN) {
      where.userId = currentUser.id;
    }

    // Build order object
    let order: any = { createdAt: 'DESC' };
    if (sortBy) {
      const validFields = ['name', 'projectCode', 'customer', 'status', 'consultDate', 'createdAt', 'updatedAt'];
      if (validFields.includes(sortBy)) {
        order = { [sortBy]: sortOrder };
      }
    }

    const [data, total] = await this.consultProjectRepository.findAndCount({
      where,
      relations: ['projectItems', 'projectItems.item', 'projectItems.quotes', 'projectItems.quotes.supplier'],
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

  async findOne(id: string, currentUser: User): Promise<ConsultProject> {
    const project = await this.consultProjectRepository.findOne({
      where: { id, deletedAt: null as any },
      relations: [
        'projectItems',
        'projectItems.item',
        'projectItems.quotes',
        'projectItems.quotes.supplier',
        'user',
      ],
    });

    if (!project) {
      throw new NotFoundException('Consult project not found');
    }

    if (currentUser.role !== UserRole.ADMIN && project.userId !== currentUser.id) {
      throw new NotFoundException('Consult project not found');
    }

    // 重新计算总金额（修复旧数据）
    // 总金额计算规则：总金额 = 物品的最低报价（单价*数量）之和（对每个物品，取各供应商报价中的最低价累加）
    let recalculatedTotal = 0;
    if (project.projectItems && project.projectItems.length > 0) {
      for (const item of project.projectItems) {
        if (item.quotes && item.quotes.length > 0) {
          // 找出该物品的最低报价
          const lowestQuote = item.quotes.reduce((min, quote) => {
            const quoteAmount = parseFloat(String(quote.totalAmount));
            const minAmount = parseFloat(String(min.totalAmount));
            return quoteAmount < minAmount ? quote : min;
          }, item.quotes[0]);
          recalculatedTotal += parseFloat(String(lowestQuote.totalAmount));
        }
      }
    }

    // 如果计算结果与存储值不同，更新数据库
    const currentTotal = parseFloat(String(project.totalAmount));
    if (recalculatedTotal !== currentTotal) {
      project.totalAmount = recalculatedTotal;
      await this.consultProjectRepository.save(project);
    }

    return project;
  }

  async update(id: string, updateConsultProjectDto: UpdateConsultProjectDto, currentUser: User): Promise<ConsultProject> {
    const project = await this.findOne(id, currentUser);

    // Only allow updating basic fields, not items through this method
    // Items should be managed through dedicated endpoints
    const { items, ...updateData } = updateConsultProjectDto as any;

    Object.assign(project, updateData);
    return this.consultProjectRepository.save(project);
  }

  async remove(id: string, currentUser: User): Promise<void> {
    const project = await this.findOne(id, currentUser);
    await this.consultProjectRepository.softRemove(project);
  }

  async addItem(projectId: string, itemDto: any, currentUser: User): Promise<ConsultProjectItem> {
    const project = await this.findOne(projectId, currentUser);

    // Verify item exists
    const item = await this.itemRepository.findOne({
      where: { id: itemDto.itemId },
    });

    if (!item) {
      throw new NotFoundException(`Item with ID ${itemDto.itemId} not found`);
    }

    const projectItem = this.projectItemRepository.create({
      projectId,
      itemId: itemDto.itemId,
      quantity: itemDto.quantity,
      remarks: itemDto.remarks,
    });

    return this.projectItemRepository.save(projectItem);
  }

  async addQuote(projectItemId: string, quoteDto: any, currentUser: User): Promise<SupplierQuote> {
    const projectItem = await this.projectItemRepository.findOne({
      where: { id: projectItemId },
      relations: ['project'],
    });

    if (!projectItem) {
      throw new NotFoundException('Project item not found');
    }

    // Check permission
    if (currentUser.role !== UserRole.ADMIN && projectItem.project.userId !== currentUser.id) {
      throw new NotFoundException('Project item not found');
    }

    const quote = this.supplierQuoteRepository.create({
      projectItemId,
      supplierId: quoteDto.supplierId,
      price: quoteDto.price,
      quantity: quoteDto.quantity,
      brand: quoteDto.brand,
      contact: quoteDto.contact,
      phone: quoteDto.phone,
      totalAmount: quoteDto.price * quoteDto.quantity,
      remarks: quoteDto.remarks,
      isSelected: quoteDto.isSelected ?? false,
    });

    return this.supplierQuoteRepository.save(quote);
  }

  async updateQuote(quoteId: string, updateDto: any, currentUser: User): Promise<SupplierQuote> {
    const quote = await this.supplierQuoteRepository.findOne({
      where: { id: quoteId },
      relations: ['projectItem', 'projectItem.project'],
    });

    if (!quote) {
      throw new NotFoundException('Quote not found');
    }

    if (currentUser.role !== UserRole.ADMIN && quote.projectItem.project.userId !== currentUser.id) {
      throw new NotFoundException('Quote not found');
    }

    if (updateDto.price || updateDto.quantity) {
      const price = updateDto.price ?? quote.price;
      const quantity = updateDto.quantity ?? quote.quantity;
      quote.totalAmount = price * quantity;
    }

    Object.assign(quote, updateDto);
    return this.supplierQuoteRepository.save(quote);
  }

  async removeQuote(quoteId: string, currentUser: User): Promise<void> {
    const quote = await this.supplierQuoteRepository.findOne({
      where: { id: quoteId },
      relations: ['projectItem', 'projectItem.project'],
    });

    if (!quote) {
      throw new NotFoundException('Quote not found');
    }

    if (currentUser.role !== UserRole.ADMIN && quote.projectItem.project.userId !== currentUser.id) {
      throw new NotFoundException('Quote not found');
    }

    await this.supplierQuoteRepository.remove(quote);
  }

  async toggleQuoteSelection(quoteId: string, currentUser: User): Promise<SupplierQuote> {
    const quote = await this.supplierQuoteRepository.findOne({
      where: { id: quoteId },
      relations: ['projectItem', 'projectItem.project'],
    });

    if (!quote) {
      throw new NotFoundException('Quote not found');
    }

    if (currentUser.role !== UserRole.ADMIN && quote.projectItem.project.userId !== currentUser.id) {
      throw new NotFoundException('Quote not found');
    }

    quote.isSelected = !quote.isSelected;
    return this.supplierQuoteRepository.save(quote);
  }

  async removeItem(projectId: string, itemId: string, currentUser: User): Promise<void> {
    // 1. 验证项目存在且用户有权限
    const project = await this.findOne(projectId, currentUser);

    // 2. 查找项目项
    const item = await this.projectItemRepository.findOne({
      where: { id: itemId, projectId },
      relations: ['quotes'],
    });

    if (!item) {
      throw new NotFoundException('Project item not found');
    }

    // 3. 删除项目项（CASCADE会自动删除关联的报价）
    await this.projectItemRepository.remove(item);
  }

  async updateItem(itemId: string, updateDto: any, currentUser: User): Promise<ConsultProjectItem> {
    // 1. 查找项目项
    const item = await this.projectItemRepository.findOne({
      where: { id: itemId },
      relations: ['project'],
    });

    if (!item) {
      throw new NotFoundException('Project item not found');
    }

    // 2. 验证权限
    if (currentUser.role !== UserRole.ADMIN && item.project.userId !== currentUser.id) {
      throw new NotFoundException('Project item not found');
    }

    // 3. 更新字段（只允许更新 quantity 和 remarks）
    const { quantity, remarks } = updateDto;

    if (quantity !== undefined) {
      if (quantity <= 0) {
        throw new BadRequestException('Quantity must be greater than 0');
      }
      item.quantity = quantity;
    }

    if (remarks !== undefined) {
      item.remarks = remarks;
    }

    return this.projectItemRepository.save(item);
  }

  async advancedSearch(
    currentUser: User,
    searchDto: AdvancedSearchDto,
    paginationDto: PaginationDto,
  ): Promise<PaginatedResponse<ConsultProject>> {
    const { page = 1, limit = 10, sortBy, sortOrder = 'DESC' } = paginationDto;
    const skip = (page - 1) * limit;

    const queryBuilder = this.consultProjectRepository.createQueryBuilder('project');
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
      const validFields = ['name', 'projectCode', 'customer', 'status', 'consultDate', 'totalAmount', 'createdAt', 'updatedAt'];
      if (validFields.includes(sortBy)) {
        order = { [sortBy]: sortOrder };
      }
    }

    queryBuilder.orderBy(order);

    const [data, total] = await queryBuilder
      .leftJoinAndSelect('project.projectItems', 'projectItems')
      .leftJoinAndSelect('projectItems.item', 'item')
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
