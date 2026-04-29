import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Item } from './entities/item.entity';
import { CreateItemDto } from './dto/create-item.dto';
import { UpdateItemDto } from './dto/update-item.dto';
import { User, UserRole } from '../user/entities/user.entity';
import { Supplier } from '../supplier/entities/supplier.entity';

@Injectable()
export class ItemService {
  constructor(
    @InjectRepository(Item)
    private itemRepository: Repository<Item>,
    @InjectRepository(Supplier)
    private supplierRepository: Repository<Supplier>,
  ) {}

  async create(createItemDto: CreateItemDto, userId: string): Promise<Item> {
    const item = this.itemRepository.create({
      ...createItemDto,
      userId,
    });

    // Handle associated suppliers
    if (createItemDto.supplierIds && createItemDto.supplierIds.length > 0) {
      const suppliers = await this.supplierRepository.find({
        where: { id: In(createItemDto.supplierIds) },
      });
      item.suppliers = suppliers;
    }

    return this.itemRepository.save(item);
  }

  async findAll(currentUser: User, categoryId?: string): Promise<Item[]> {
    const where: any = { deletedAt: null as any };

    if (currentUser.role !== UserRole.ADMIN) {
      where.userId = currentUser.id;
    }

    if (categoryId) {
      where.categoryId = categoryId;
    }

    return this.itemRepository.find({
      where,
      relations: ['category', 'suppliers'],
      order: { createdAt: 'DESC' },
    });
  }

  async search(query: string, currentUser: User): Promise<Item[]> {
    const qb = this.itemRepository.createQueryBuilder('item')
      .leftJoinAndSelect('item.category', 'category')
      .leftJoinAndSelect('item.suppliers', 'suppliers')
      .where('item.deletedAt IS NULL')
      .andWhere('(item.name LIKE :query OR item.code LIKE :query OR item.model LIKE :query)')
      .setParameter('query', `%${query}%`);

    if (currentUser.role !== UserRole.ADMIN) {
      qb.andWhere('item.userId = :userId', { userId: currentUser.id });
    }

    return qb.orderBy('item.createdAt', 'DESC').getMany();
  }

  async findOne(id: string, currentUser: User): Promise<Item> {
    const item = await this.itemRepository.findOne({
      where: { id, deletedAt: null as any },
      relations: ['category', 'suppliers'],
    });

    if (!item) {
      throw new NotFoundException('Item not found');
    }

    if (currentUser.role !== UserRole.ADMIN && item.userId !== currentUser.id) {
      throw new NotFoundException('Item not found');
    }

    return item;
  }

  async update(id: string, updateItemDto: UpdateItemDto, currentUser: User): Promise<Item> {
    const item = await this.findOne(id, currentUser);

    // Handle associated suppliers
    if (updateItemDto.supplierIds) {
      const suppliers = await this.supplierRepository.find({
        where: { id: In(updateItemDto.supplierIds) },
      });
      item.suppliers = suppliers;
      delete updateItemDto.supplierIds;
    }

    Object.assign(item, updateItemDto);
    return this.itemRepository.save(item);
  }

  async remove(id: string, currentUser: User): Promise<void> {
    const item = await this.findOne(id, currentUser);
    await this.itemRepository.softRemove(item);
  }

  async importFromExcel(file: Express.Multer.File, userId: string): Promise<{ success: number; failed: number }> {
    // TODO: Implement Excel import functionality
    // This would use a library like xlsx to parse the Excel file
    return { success: 0, failed: 0 };
  }

  async exportToExcel(currentUser: User): Promise<Buffer> {
    // TODO: Implement Excel export functionality
    return Buffer.from('');
  }
}
