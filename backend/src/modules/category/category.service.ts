import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from './entities/category.entity';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { User, UserRole } from '../user/entities/user.entity';

@Injectable()
export class CategoryService {
  constructor(
    @InjectRepository(Category)
    private categoryRepository: Repository<Category>,
  ) {}

  async create(createCategoryDto: CreateCategoryDto, userId: string): Promise<Category> {
    const category = this.categoryRepository.create({
      ...createCategoryDto,
      userId,
    });

    // Set level based on parent
    if (createCategoryDto.parentId) {
      const parent = await this.categoryRepository.findOne({
        where: { id: createCategoryDto.parentId },
      });
      if (parent) {
        category.level = parent.level + 1;
      }
    } else {
      category.level = 1;
    }

    return this.categoryRepository.save(category);
  }

  async findAll(currentUser: User): Promise<Category[]> {
    if (currentUser.role === UserRole.ADMIN) {
      return this.categoryRepository.find({
        where: { deletedAt: null as any },
        order: { sort: 'ASC', createdAt: 'ASC' },
        relations: ['parent'],
      });
    }
    return this.categoryRepository.find({
      where: { userId: currentUser.id, deletedAt: null as any },
      order: { sort: 'ASC', createdAt: 'ASC' },
      relations: ['parent'],
    });
  }

  async findTree(currentUser: User): Promise<Category[]> {
    const categories = await this.findAll(currentUser);
    return this.buildTree(categories);
  }

  private buildTree(categories: Category[], parentId: string | null = null): Category[] {
    return categories
      .filter(cat => cat.parentId === parentId)
      .map(cat => ({
        ...cat,
        children: this.buildTree(categories, cat.id),
      }));
  }

  async findOne(id: string, currentUser: User): Promise<Category> {
    const category = await this.categoryRepository.findOne({
      where: { id, deletedAt: null as any },
      relations: ['parent', 'children', 'items'],
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    if (currentUser.role !== UserRole.ADMIN && category.userId !== currentUser.id) {
      throw new NotFoundException('Category not found');
    }

    return category;
  }

  async update(id: string, updateCategoryDto: UpdateCategoryDto, currentUser: User): Promise<Category> {
    const category = await this.findOne(id, currentUser);

    // Check for circular reference if parentId is being updated
    if (updateCategoryDto.parentId !== undefined) {
      await this.checkCircularReference(id, updateCategoryDto.parentId);
    }

    Object.assign(category, updateCategoryDto);

    // Update level based on parent
    if (updateCategoryDto.parentId !== undefined) {
      if (updateCategoryDto.parentId) {
        const parent = await this.categoryRepository.findOne({
          where: { id: updateCategoryDto.parentId },
        });
        if (parent) {
          category.level = parent.level + 1;
        }
      } else {
        category.level = 1;
      }

      // Cascade update level for all children
      await this.updateChildrenLevel(category);
    }

    return this.categoryRepository.save(category);
  }

  /**
   * Check if setting parentId would create a circular reference
   */
  private async checkCircularReference(categoryId: string, newParentId: string | null): Promise<void> {
    if (!newParentId) return;

    if (categoryId === newParentId) {
      throw new BadRequestException('Cannot set category as its own parent');
    }

    // Check if newParentId is a descendant of categoryId
    const isDescendant = await this.isDescendant(categoryId, newParentId);
    if (isDescendant) {
      throw new BadRequestException('Cannot set parent to a descendant category');
    }
  }

  /**
   * Check if targetId is a descendant of sourceId
   */
  private async isDescendant(sourceId: string, targetId: string): Promise<boolean> {
    const children = await this.categoryRepository.find({
      where: { parentId: sourceId, deletedAt: null as any },
    });

    for (const child of children) {
      if (child.id === targetId) {
        return true;
      }
      if (await this.isDescendant(child.id, targetId)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Recursively update level for all children
   */
  private async updateChildrenLevel(parent: Category): Promise<void> {
    const children = await this.categoryRepository.find({
      where: { parentId: parent.id, deletedAt: null as any },
    });

    for (const child of children) {
      child.level = parent.level + 1;
      await this.categoryRepository.save(child);
      await this.updateChildrenLevel(child);
    }
  }

  async remove(id: string, currentUser: User): Promise<void> {
    const category = await this.findOne(id, currentUser);

    // Check if category has children
    const childrenCount = await this.categoryRepository.count({
      where: { parentId: id, deletedAt: null as any },
    });

    if (childrenCount > 0) {
      throw new Error('Cannot delete category with children');
    }

    await this.categoryRepository.softRemove(category);
  }
}
