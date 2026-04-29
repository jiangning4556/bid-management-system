import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SupplierQuote } from '../consult-project/entities/supplier-quote.entity';
import { ConsultProjectItem } from '../consult-project/entities/consult-project-item.entity';
import { ConsultProject } from '../consult-project/entities/consult-project.entity';
import { BidSupplier } from '../bid-project/entities/bid-supplier.entity';
import { BidProjectItem } from '../bid-project/entities/bid-project-item.entity';
import { Item } from '../item/entities/item.entity';
import { User, UserRole } from '../user/entities/user.entity';

@Injectable()
export class PriceQueryService {
  constructor(
    @InjectRepository(Item)
    private itemRepository: Repository<Item>,
    @InjectRepository(SupplierQuote)
    private supplierQuoteRepository: Repository<SupplierQuote>,
    @InjectRepository(ConsultProjectItem)
    private consultProjectItemRepository: Repository<ConsultProjectItem>,
    @InjectRepository(ConsultProject)
    private consultProjectRepository: Repository<ConsultProject>,
    @InjectRepository(BidSupplier)
    private bidSupplierRepository: Repository<BidSupplier>,
    @InjectRepository(BidProjectItem)
    private bidProjectItemRepository: Repository<BidProjectItem>,
  ) {}

  async searchByItemName(query: string, currentUser: User): Promise<any[]> {
    const items = await this.itemRepository
      .createQueryBuilder('item')
      .where('item.name LIKE :query', { query: `%${query}%` })
      .andWhere('(item.userId = :userId OR :isAdmin = true)', {
        userId: currentUser.id,
        isAdmin: currentUser.role === UserRole.ADMIN,
      })
      .andWhere('item.deletedAt IS NULL')
      .getMany();

    const results = [];

    for (const item of items) {
      const consultQuotes = await this.supplierQuoteRepository
        .createQueryBuilder('quote')
        .leftJoinAndSelect('quote.supplier', 'supplier')
        .leftJoin('quote.projectItem', 'projectItem')
        .leftJoin('projectItem.project', 'project')
        .where('projectItem.itemId = :itemId', { itemId: item.id })
        .andWhere('project.deletedAt IS NULL')
        .andWhere('project.userId = :userId OR :isAdmin = true', {
          userId: currentUser.id,
          isAdmin: currentUser.role === UserRole.ADMIN,
        })
        .orderBy('quote.price', 'ASC')
        .getMany();

      const bidSuppliers = await this.bidSupplierRepository
        .createQueryBuilder('bidSupplier')
        .leftJoinAndSelect('bidSupplier.supplier', 'supplier')
        .leftJoinAndSelect('bidSupplier.projectItem', 'projectItem')
        .leftJoin('projectItem.project', 'project')
        .where('projectItem.itemId = :itemId', { itemId: item.id })
        .andWhere('bidSupplier.isSelected = :isSelected', { isSelected: true })
        .andWhere('project.deletedAt IS NULL')
        .andWhere('project.userId = :userId OR :isAdmin = true', {
          userId: currentUser.id,
          isAdmin: currentUser.role === UserRole.ADMIN,
        })
        .getMany();

      results.push({
        item: {
          id: item.id,
          name: item.name,
          code: item.code,
          model: item.model,
          spec: item.spec,
          unit: item.unit,
          category: item.category,
        },
        consultQuotes: consultQuotes.map(q => ({
          supplier: q.supplier?.name,
          price: q.price,
          quantity: q.quantity,
          totalAmount: q.totalAmount,
          brand: q.brand,
          contact: q.contact,
          phone: q.phone,
          project: q.projectItem?.project?.name,
        })),
        bidSuppliers: bidSuppliers.map(b => ({
          supplier: b.supplier?.name,
          price: b.price,
          quantity: b.projectItem?.quantity,
          amount: b.amount,
          progress: b.progress,
          paymentStatus: b.paymentStatus,
        })),
      });
    }

    return results;
  }

  async searchBySupplier(supplierId: string, currentUser: User): Promise<any> {
    console.log('searchBySupplier called with supplierId:', supplierId, 'userRole:', currentUser.role);

    try {
      // Find consult quotes by supplier
      const consultQuotes = await this.supplierQuoteRepository
        .createQueryBuilder('q')
        .leftJoinAndSelect('q.projectItem', 'cpi')
        .leftJoinAndSelect('cpi.item', 'item')
        .leftJoinAndSelect('cpi.project', 'project')
        .where('q.supplierId = :supplierId', { supplierId })
        .andWhere('project.deletedAt IS NULL')
        .orderBy('q.createdAt', 'DESC')
        .getMany();

      // Filter by user if not admin
      const filteredConsultQuotes = currentUser.role === UserRole.ADMIN
        ? consultQuotes
        : consultQuotes.filter(q => q.projectItem?.project?.userId === currentUser.id);

      // Find bid suppliers by supplier
      const bidSuppliers = await this.bidSupplierRepository
        .createQueryBuilder('bs')
        .leftJoinAndSelect('bs.projectItem', 'bpi')
        .leftJoinAndSelect('bpi.item', 'item')
        .leftJoinAndSelect('bpi.project', 'project')
        .where('bs.supplierId = :supplierId', { supplierId })
        .andWhere('bs.isSelected = :isSelected', { isSelected: true })
        .andWhere('project.deletedAt IS NULL')
        .getMany();

      // Filter by user if not admin
      const filteredBidSuppliers = currentUser.role === UserRole.ADMIN
        ? bidSuppliers
        : bidSuppliers.filter(b => b.projectItem?.project?.userId === currentUser.id);

      console.log('consultQuotes count:', filteredConsultQuotes.length);
      console.log('bidSuppliers count:', filteredBidSuppliers.length);

      // Calculate statistics
      const allItems = new Set<string>();
      const allProjects = new Set<string>();

      // Map consult quotes
      const consultResult = filteredConsultQuotes.map(q => {
        if (q.projectItem?.item?.name) allItems.add(q.projectItem.item.name);
        if (q.projectItem?.project?.name) allProjects.add(q.projectItem.project.name);
        return {
          item: q.projectItem?.item?.name || '',
          price: q.price,
          quantity: q.quantity,
          totalAmount: q.totalAmount,
          project: q.projectItem?.project?.name || '',
          projectDate: q.projectItem?.project?.createdAt,
        };
      });

      // Map bid suppliers
      const bidResult = filteredBidSuppliers.map(b => {
        if (b.projectItem?.item?.name) allItems.add(b.projectItem.item.name);
        if (b.projectItem?.project?.name) allProjects.add(b.projectItem.project.name);
        return {
          item: b.projectItem?.item?.name || '',
          price: b.price,
          quantity: b.projectItem?.quantity,
          totalAmount: b.amount, // Rename to totalAmount for consistency
          project: b.projectItem?.project?.name || '',
          projectDate: b.projectItem?.project?.createdAt,
          progress: b.progress,
          paymentStatus: b.paymentStatus,
        };
      });

      // Merge all quotes
      const allQuotes = [...consultResult, ...bidResult];

      return {
        supplierId,
        statistics: {
          totalQuotes: allQuotes.length,
          itemCount: allItems.size,
          winCount: bidResult.length,
          projectCount: allProjects.size,
        },
        quotes: allQuotes,
      };
    } catch (error) {
      console.error('Error in searchBySupplier:', error);
      throw error;
    }
  }

  async getPriceTrends(itemId: string, currentUser: User): Promise<any> {
    interface QuoteRow {
      id: string;
      price: string;
      totalAmount: string;
      createdAt: Date;
      supplierName: string;
    }

    let quotes: QuoteRow[] = [];

    if (currentUser.role === UserRole.ADMIN) {
      // Admin: query all quotes for this item
      quotes = await this.supplierQuoteRepository.query(`
        SELECT q.id, q.price, q.totalAmount, q.createdAt,
               s.name as supplierName
        FROM supplier_quotes q
        LEFT JOIN suppliers s ON q.supplierId = s.id
        LEFT JOIN consult_project_items cpi ON q.projectItemId = cpi.id
        LEFT JOIN consult_projects project ON cpi.projectId = project.id
        WHERE cpi.itemId = ?
          AND project.deletedAt IS NULL
        ORDER BY q.createdAt ASC
      `, [itemId]);
    } else {
      // Regular user: query only their own projects
      quotes = await this.supplierQuoteRepository.query(`
        SELECT q.id, q.price, q.totalAmount, q.createdAt,
               s.name as supplierName
        FROM supplier_quotes q
        LEFT JOIN suppliers s ON q.supplierId = s.id
        LEFT JOIN consult_project_items cpi ON q.projectItemId = cpi.id
        LEFT JOIN consult_projects project ON cpi.projectId = project.id
        WHERE cpi.itemId = ?
          AND project.deletedAt IS NULL
          AND project.userId = ?
        ORDER BY q.createdAt ASC
      `, [itemId, currentUser.id]);
    }

    const trends = quotes.map((q: QuoteRow) => ({
      date: q.createdAt,
      supplier: q.supplierName,
      price: parseFloat(q.price),
      totalAmount: parseFloat(q.totalAmount),
    }));

    return {
      itemId,
      trends,
    };
  }
}

