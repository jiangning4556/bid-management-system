import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query, ParseUUIDPipe, Res, HttpStatus } from '@nestjs/common';
import type { Response } from 'express';
import { SupplierService } from './supplier.service';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { User } from '../../common/decorators/user.decorator';
import { PaginationDto, AdvancedSearchDto, ExportDto } from '../../common/dto';
import { ExportService, ExportField } from '../../common/export/export.service';
import type { UserInfo } from '../user/entities/user.entity';
import { UserRole } from '../user/entities/user.entity';

@Controller('suppliers')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SupplierController {
  constructor(
    private readonly supplierService: SupplierService,
    private readonly exportService: ExportService,
  ) {}

  @Post()
  create(@Body() createSupplierDto: CreateSupplierDto, @User() user: UserInfo) {
    return this.supplierService.create(createSupplierDto, user.id);
  }

  @Get()
  findAll(@User() user: UserInfo, @Query() paginationDto: PaginationDto) {
    return this.supplierService.findAll(user as any, paginationDto);
  }

  @Get('search')
  search(@Query('q') query: string, @User() user: UserInfo) {
    return this.supplierService.search(query, user as any);
  }

  @Post('search')
  advancedSearch(@Body() searchDto: AdvancedSearchDto, @User() user: UserInfo, @Query() paginationDto: PaginationDto) {
    return this.supplierService.advancedSearch(user as any, searchDto, paginationDto);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string, @User() user: UserInfo) {
    return this.supplierService.findOne(id, user as any);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateSupplierDto: UpdateSupplierDto,
    @User() user: UserInfo,
  ) {
    return this.supplierService.update(id, updateSupplierDto, user as any);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string, @User() user: UserInfo) {
    return this.supplierService.remove(id, user as any);
  }

  @Post('export')
  @Roles(UserRole.ADMIN)
  async export(
    @Body() exportDto: ExportDto,
    @User() user: UserInfo,
    @Res() res: Response,
  ) {
    const fields: ExportField[] = exportDto.fields?.length
      ? exportDto.fields as ExportField[]
      : [
          { key: 'name', label: '供应商名称', width: 25 },
          { key: 'contact', label: '联系人', width: 15 },
          { key: 'phone', label: '联系电话', width: 15 },
          { key: 'email', label: '邮箱', width: 20 },
          { key: 'address', label: '地址', width: 30 },
          { key: 'rating', label: '评分', width: 10 },
          { key: 'deliveryRating', label: '交货评分', width: 12 },
          { key: 'bankName', label: '开户银行', width: 15 },
          { key: 'bankAccount', label: '银行账号', width: 20 },
          { key: 'taxNumber', label: '税号', width: 20 },
          { key: 'invoiceInfo', label: '发票信息', width: 20 },
          { key: 'projectCount', label: '咨询项目数', width: 15 },
          { key: 'bidProjectCount', label: '中标项目数', width: 15 },
          { key: 'bidRate', label: '中标率(%)', width: 12 },
          { key: 'remarks', label: '备注', width: 25 },
        ];

    // Get all data without pagination limit
    const result = await this.supplierService.findAll(user as any, { page: 1, limit: 10000 });
    const filteredData = exportDto.ids?.length
      ? result.data.filter((item: any) => exportDto.ids!.includes(item.id))
      : result.data;

    const buffer = await this.exportService.exportToExcel(filteredData, fields, {
      filename: 'suppliers',
      sheetName: '供应商列表',
    });

    const filename = this.exportService.generateFilename('供应商列表');

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
    res.status(HttpStatus.OK).send(buffer);
  }
}
