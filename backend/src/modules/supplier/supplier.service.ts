import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Supplier, SupplierStatus } from './entities/supplier.entity';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';
import { User, UserRole } from '../user/entities/user.entity';
import { PaginationDto, PaginatedResponse, AdvancedSearchDto, SearchQuery, SearchOperator, SearchLogic } from '../../common/dto';
import { Between, MoreThan, LessThan, MoreThanOrEqual, LessThanOrEqual, In, Like } from 'typeorm';
import { SupplierQuote } from '../consult-project/entities/supplier-quote.entity';
import { BidSupplier } from '../bid-project/entities/bid-supplier.entity';
import { ConsultProjectItem } from '../consult-project/entities/consult-project-item.entity';
import { BidProjectItem } from '../bid-project/entities/bid-project-item.entity';
import { NotificationService } from '../notification/notification.service';
import { NotificationGateway } from '../notification/notification.gateway';
import { NotificationType } from '../notification/entities/notification.entity';

@Injectable()
export class SupplierService {
  constructor(
    @InjectRepository(Supplier)
    private supplierRepository: Repository<Supplier>,
    @InjectRepository(SupplierQuote)
    private supplierQuoteRepository: Repository<SupplierQuote>,
    @InjectRepository(BidSupplier)
    private bidSupplierRepository: Repository<BidSupplier>,
    @InjectRepository(ConsultProjectItem)
    private consultProjectItemRepository: Repository<ConsultProjectItem>,
    @InjectRepository(BidProjectItem)
    private bidProjectItemRepository: Repository<BidProjectItem>,
    private notificationService: NotificationService,
    private notificationGateway: NotificationGateway,
  ) {}

  async create(createSupplierDto: CreateSupplierDto, userId: string): Promise<Supplier> {
    // Generate displayId (auto-increment from 1)
    const maxDisplayId = await this.supplierRepository
      .createQueryBuilder('supplier')
      .select('MAX(supplier.displayId)', 'max')
      .where('supplier.deletedAt IS NULL')
      .getRawOne();
    const nextDisplayId = (maxDisplayId.max || 0) + 1;

    const supplier = this.supplierRepository.create({
      ...createSupplierDto,
      userId,
      displayId: nextDisplayId,
    });
    const savedSupplier = await this.supplierRepository.save(supplier);

    // 创建通知
    const shouldNotify = await this.notificationService.shouldNotify(userId, NotificationType.SUPPLIER);
    if (shouldNotify) {
      const notification = await this.notificationService.create({
        userId,
        type: NotificationType.SUPPLIER,
        title: '新供应商添加',
        content: `供应商 "${savedSupplier.name}" 已添加到系统中`,
        relatedId: savedSupplier.id,
        relatedType: 'Supplier',
        metadata: {
          supplierName: savedSupplier.name,
          contact: savedSupplier.contact,
          phone: savedSupplier.phone,
        },
      });
      await this.notificationGateway.sendNotificationToUser(userId, notification);
    }

    return savedSupplier;
  }

  async findAll(currentUser: User, paginationDto: PaginationDto): Promise<PaginatedResponse<Supplier>> {
    const { page = 1, limit = 10, sortBy, sortOrder = 'DESC' } = paginationDto;
    const skip = (page - 1) * limit;

    const where: any = { deletedAt: null as any };
    if (currentUser.role !== UserRole.ADMIN) {
      where.userId = currentUser.id;
    }

    // Build order object
    let order: any = { displayId: 'ASC' };
    if (sortBy) {
      // Valid fields that can be sorted
      const validFields = ['displayId', 'name', 'contact', 'phone', 'rating', 'deliveryRating', 'createdAt', 'updatedAt'];
      if (validFields.includes(sortBy)) {
        order = { [sortBy]: sortOrder };
      }
    }

    const [data, total] = await this.supplierRepository.findAndCount({
      where,
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

  async findOne(id: string, currentUser: User): Promise<Supplier> {
    const supplier = await this.supplierRepository.findOne({
      where: { id, deletedAt: null as any },
    });

    if (!supplier) {
      throw new NotFoundException('Supplier not found');
    }

    // Check permission
    if (currentUser.role !== UserRole.ADMIN && supplier.userId !== currentUser.id) {
      throw new NotFoundException('Supplier not found');
    }

    // Calculate statistics dynamically
    await this.calculateStatistics(supplier);

    return supplier;
  }

  private async calculateStatistics(supplier: Supplier): Promise<void> {
    // Get all quotes for this supplier
    const quotes = await this.supplierQuoteRepository.find({
      where: { supplierId: supplier.id },
    });

    // Get all bid suppliers for this supplier
    const bidSuppliers = await this.bidSupplierRepository.find({
      where: { supplierId: supplier.id },
    });

    // Calculate consult project count (unique projects)
    let consultProjectIds = new Set<string>();
    if (quotes.length > 0) {
      const projectItemIds = quotes.map(q => q.projectItemId);
      const projectItems = await this.consultProjectItemRepository.find({
        where: { id: In(projectItemIds) as any },
        select: ['projectId'],
      });
      projectItems.forEach(item => consultProjectIds.add(item.projectId));
    }
    supplier.projectCount = consultProjectIds.size;

    // Calculate bid project count (unique projects)
    let bidProjectIds = new Set<string>();
    if (bidSuppliers.length > 0) {
      const projectItemIds = bidSuppliers.map(bs => bs.projectItemId);
      const projectItems = await this.bidProjectItemRepository.find({
        where: { id: In(projectItemIds) as any },
        select: ['projectId'],
      });
      projectItems.forEach(item => bidProjectIds.add(item.projectId));
    }
    supplier.bidProjectCount = bidProjectIds.size;

    // Calculate bid rate
    if (supplier.projectCount > 0) {
      supplier.bidRate = (supplier.bidProjectCount / supplier.projectCount) * 100;
      // Round to 2 decimal places
      supplier.bidRate = Math.round(supplier.bidRate * 100) / 100;
    } else {
      supplier.bidRate = 0;
    }
  }

  async update(id: string, updateSupplierDto: UpdateSupplierDto, currentUser: User): Promise<Supplier> {
    const supplier = await this.findOne(id, currentUser);

    // Update statistics and ratings if provided
    if (updateSupplierDto.rating || updateSupplierDto.deliveryRating) {
      Object.assign(supplier, updateSupplierDto);
    } else {
      Object.assign(supplier, updateSupplierDto);
    }

    return this.supplierRepository.save(supplier);
  }

  async remove(id: string, currentUser: User): Promise<void> {
    const supplier = await this.findOne(id, currentUser);
    await this.supplierRepository.softRemove(supplier);
  }

  async updateStatistics(supplierId: string): Promise<void> {
    const supplier = await this.supplierRepository.findOne({
      where: { id: supplierId },
    });

    if (!supplier) {
      return;
    }

    // Update statistics based on related data
    // This would be called when projects are created/updated
    // For now, we'll implement a placeholder
  }

  async search(query: string, currentUser: User): Promise<Supplier[]> {
    const qb = this.supplierRepository.createQueryBuilder('supplier')
      .where('supplier.deletedAt IS NULL')
      .andWhere('(supplier.name LIKE :query OR supplier.contact LIKE :query OR supplier.phone LIKE :query)')
      .setParameter('query', `%${query}%`);

    if (currentUser.role !== UserRole.ADMIN) {
      qb.andWhere('supplier.userId = :userId', { userId: currentUser.id });
    }

    return qb.orderBy('supplier.displayId', 'ASC').getMany();
  }

  async advancedSearch(
    currentUser: User,
    searchDto: AdvancedSearchDto,
    paginationDto: PaginationDto,
  ): Promise<PaginatedResponse<Supplier>> {
    const { page = 1, limit = 10, sortBy, sortOrder = 'DESC' } = paginationDto;
    const skip = (page - 1) * limit;

    const queryBuilder = this.supplierRepository.createQueryBuilder('supplier');
    queryBuilder.where('supplier.deletedAt IS NULL');

    // Apply user permission filter
    if (currentUser.role !== UserRole.ADMIN) {
      queryBuilder.andWhere('supplier.userId = :userId', { userId: currentUser.id });
    }

    // Apply date range filter
    if (searchDto.dateFrom || searchDto.dateTo) {
      const dateField = searchDto.dateField || 'createdAt';
      if (searchDto.dateFrom && searchDto.dateTo) {
        queryBuilder.andWhere(`supplier.${dateField} BETWEEN :dateFrom AND :dateTo`, {
          dateFrom: new Date(searchDto.dateFrom),
          dateTo: new Date(searchDto.dateTo),
        });
      } else if (searchDto.dateFrom) {
        queryBuilder.andWhere(`supplier.${dateField} >= :dateFrom`, {
          dateFrom: new Date(searchDto.dateFrom),
        });
      } else if (searchDto.dateTo) {
        queryBuilder.andWhere(`supplier.${dateField} <= :dateTo`, {
          dateTo: new Date(searchDto.dateTo),
        });
      }
    }

    // Apply status filter
    if (searchDto.statuses && searchDto.statuses.length > 0) {
      const statusField = searchDto.statusField || 'status';
      queryBuilder.andWhere(`supplier.${statusField} IN (:...statuses)`, {
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
            queryBuilder[conditionMethod](`supplier.${field} = :${paramKey}`, { [paramKey]: value });
            break;
          case SearchOperator.CONTAINS:
            queryBuilder[conditionMethod](`supplier.${field} LIKE :${paramKey}`, { [paramKey]: `%${value}%` });
            break;
          case SearchOperator.STARTS_WITH:
            queryBuilder[conditionMethod](`supplier.${field} LIKE :${paramKey}`, { [paramKey]: `${value}%` });
            break;
          case SearchOperator.ENDS_WITH:
            queryBuilder[conditionMethod](`supplier.${field} LIKE :${paramKey}`, { [paramKey]: `%${value}` });
            break;
          case SearchOperator.GREATER_THAN:
            queryBuilder[conditionMethod](`supplier.${field} > :${paramKey}`, { [paramKey]: parseFloat(value!) });
            break;
          case SearchOperator.LESS_THAN:
            queryBuilder[conditionMethod](`supplier.${field} < :${paramKey}`, { [paramKey]: parseFloat(value!) });
            break;
          case SearchOperator.GREATER_EQUAL:
            queryBuilder[conditionMethod](`supplier.${field} >= :${paramKey}`, { [paramKey]: parseFloat(value!) });
            break;
          case SearchOperator.LESS_EQUAL:
            queryBuilder[conditionMethod](`supplier.${field} <= :${paramKey}`, { [paramKey]: parseFloat(value!) });
            break;
          case SearchOperator.BETWEEN:
            if (value && value2) {
              queryBuilder[conditionMethod](`supplier.${field} BETWEEN :${paramKey}1 AND :${paramKey}2`, {
                [`${paramKey}1`]: parseFloat(value),
                [`${paramKey}2`]: parseFloat(value2),
              });
            }
            break;
          case SearchOperator.IN:
            if (values && values.length > 0) {
              queryBuilder[conditionMethod](`supplier.${field} IN (:...${paramKey})`, { [paramKey]: values });
            }
            break;
        }
      });
    }

    // Build order object
    let order: any = { displayId: 'ASC' };
    if (sortBy) {
      const validFields = ['displayId', 'name', 'contact', 'phone', 'rating', 'deliveryRating', 'status', 'createdAt', 'updatedAt'];
      if (validFields.includes(sortBy)) {
        order = { [sortBy]: sortOrder };
      }
    }

    queryBuilder.orderBy(order);

    const [data, total] = await queryBuilder.skip(skip).take(limit).getManyAndCount();

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}
