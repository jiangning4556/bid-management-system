import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query, ParseUUIDPipe, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ItemService } from './item.service';
import { CreateItemDto } from './dto/create-item.dto';
import { UpdateItemDto } from './dto/update-item.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { User } from '../../common/decorators/user.decorator';
import type { UserInfo } from '../user/entities/user.entity';

@Controller('items')
@UseGuards(JwtAuthGuard)
export class ItemController {
  constructor(private readonly itemService: ItemService) {}

  @Post()
  create(@Body() createItemDto: CreateItemDto, @User() user: UserInfo) {
    return this.itemService.create(createItemDto, user.id);
  }

  @Get()
  findAll(@User() user: UserInfo, @Query('categoryId') categoryId?: string) {
    return this.itemService.findAll(user as any, categoryId);
  }

  @Get('search')
  search(@Query('q') query: string, @User() user: UserInfo) {
    return this.itemService.search(query, user as any);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string, @User() user: UserInfo) {
    return this.itemService.findOne(id, user as any);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateItemDto: UpdateItemDto,
    @User() user: UserInfo,
  ) {
    return this.itemService.update(id, updateItemDto, user as any);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string, @User() user: UserInfo) {
    return this.itemService.remove(id, user as any);
  }

  @Post('import')
  @UseInterceptors(FileInterceptor('file'))
  import(@UploadedFile() file: Express.Multer.File, @User() user: UserInfo) {
    return this.itemService.importFromExcel(file, user.id);
  }

  @Get('export/excel')
  async export(@User() user: UserInfo) {
    const buffer = await this.itemService.exportToExcel(user as any);
    // Return file for download
    return buffer;
  }
}
