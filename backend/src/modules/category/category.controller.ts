import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, ParseUUIDPipe } from '@nestjs/common';
import { CategoryService } from './category.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { User } from '../../common/decorators/user.decorator';
import type { UserInfo } from '../user/entities/user.entity';

@Controller('categories')
@UseGuards(JwtAuthGuard)
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Post()
  create(@Body() createCategoryDto: CreateCategoryDto, @User() user: UserInfo) {
    return this.categoryService.create(createCategoryDto, user.id);
  }

  @Get()
  findAll(@User() user: UserInfo) {
    return this.categoryService.findAll(user as any);
  }

  @Get('tree')
  findTree(@User() user: UserInfo) {
    return this.categoryService.findTree(user as any);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string, @User() user: UserInfo) {
    return this.categoryService.findOne(id, user as any);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateCategoryDto: UpdateCategoryDto,
    @User() user: UserInfo,
  ) {
    return this.categoryService.update(id, updateCategoryDto, user as any);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string, @User() user: UserInfo) {
    return this.categoryService.remove(id, user as any);
  }
}
