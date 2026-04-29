import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, ParseUUIDPipe, Query, Res, HttpStatus } from '@nestjs/common';
import type { Response } from 'express';
import { BidProjectService } from './bid-project.service';
import { CreateBidProjectDto } from './dto/create-bid-project.dto';
import { UpdateBidProjectDto } from './dto/update-bid-project.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { User } from '../../common/decorators/user.decorator';
import { PaginationDto, AdvancedSearchDto, ExportDto } from '../../common/dto';
import { ExportService, ExportField } from '../../common/export/export.service';
import type { UserInfo } from '../user/entities/user.entity';

@Controller('bid-projects')
@UseGuards(JwtAuthGuard)
export class BidProjectController {
  constructor(
    private readonly bidProjectService: BidProjectService,
    private readonly exportService: ExportService,
  ) {}

  @Post('from-consult/:consultId')
  createFromConsult(@Param('consultId', ParseUUIDPipe) consultId: string, @User() user: UserInfo) {
    return this.bidProjectService.createFromConsult(consultId, user.id);
  }

  @Post()
  create(@Body() createBidProjectDto: CreateBidProjectDto, @User() user: UserInfo) {
    return this.bidProjectService.create(createBidProjectDto, user.id);
  }

  @Get()
  findAll(@User() user: UserInfo, @Query() paginationDto: PaginationDto) {
    return this.bidProjectService.findAll(user as any, paginationDto);
  }

  @Post('search')
  advancedSearch(@Body() searchDto: AdvancedSearchDto, @User() user: UserInfo, @Query() paginationDto: PaginationDto) {
    return this.bidProjectService.advancedSearch(user as any, searchDto, paginationDto);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string, @User() user: UserInfo) {
    return this.bidProjectService.findOne(id, user as any);
  }

  @Get(':id/statistics')
  getStatistics(@Param('id', ParseUUIDPipe) id: string, @User() user: UserInfo) {
    return this.bidProjectService.getProjectStatistics(id, user as any);
  }

  // 供应商相关路由必须在 :id 之前，避免被 :id 通配符匹配
  @Patch('suppliers/:supplierId')
  updateSupplierInfo(
    @Param('supplierId', ParseUUIDPipe) supplierId: string,
    @Body() updateDto: any,
    @User() user: UserInfo,
  ) {
    return this.bidProjectService.updateSupplierInfo(supplierId, updateDto, user as any);
  }

  @Post('suppliers/:supplierId/toggle')
  toggleSupplierSelection(
    @Param('supplierId', ParseUUIDPipe) supplierId: string,
    @User() user: UserInfo,
  ) {
    return this.bidProjectService.toggleSupplierSelection(supplierId, user as any);
  }

  @Delete('suppliers/:supplierId')
  deleteSupplier(
    @Param('supplierId', ParseUUIDPipe) supplierId: string,
    @User() user: UserInfo,
  ) {
    return this.bidProjectService.deleteSupplier(supplierId, user as any);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateBidProjectDto: UpdateBidProjectDto,
    @User() user: UserInfo,
  ) {
    return this.bidProjectService.update(id, updateBidProjectDto, user as any);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string, @User() user: UserInfo) {
    return this.bidProjectService.remove(id, user as any);
  }

  @Post(':id/items')
  addItem(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() itemDto: any,
    @User() user: UserInfo,
  ) {
    return this.bidProjectService.addItem(id, itemDto, user as any);
  }

  @Patch(':projectId/items/:itemId')
  updateItem(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Param('itemId', ParseUUIDPipe) itemId: string,
    @Body() updateDto: { quantity?: number; remarks?: string },
    @User() user: UserInfo,
  ) {
    return this.bidProjectService.updateItem(projectId, itemId, updateDto, user as any);
  }

  @Delete(':projectId/items/:itemId')
  removeItem(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Param('itemId', ParseUUIDPipe) itemId: string,
    @User() user: UserInfo,
  ) {
    return this.bidProjectService.removeItem(projectId, itemId, user as any);
  }

  @Post('items/:itemId/suppliers')
  addSupplier(
    @Param('itemId', ParseUUIDPipe) itemId: string,
    @Body() supplierDto: any,
    @User() user: UserInfo,
  ) {
    return this.bidProjectService.addSupplierToItem(itemId, supplierDto, user as any);
  }

  @Post('export')
  async export(
    @Body() exportDto: ExportDto,
    @User() user: UserInfo,
    @Res() res: Response,
  ) {
    const fields: ExportField[] = exportDto.fields?.length
      ? exportDto.fields as ExportField[]
      : [
          { key: 'name', label: '项目名称', width: 25 },
          { key: 'projectCode', label: '项目编号', width: 15 },
          { key: 'customer', label: '客户', width: 15 },
          { key: 'address', label: '地址', width: 25 },
          { key: 'contractDate', label: '合同日期', width: 12 },
          { key: 'contractAmount', label: '合同金额', width: 12 },
          { key: 'totalAmount', label: '项目金额', width: 12 },
          { key: 'status', label: '状态', width: 10 },
          { key: 'remarks', label: '备注', width: 30 },
        ];

    const result = await this.bidProjectService.findAll(user as any, {});
    const filteredData = exportDto.ids?.length
      ? result.data.filter((item: any) => exportDto.ids!.includes(item.id))
      : result.data;

    const buffer = await this.exportService.exportToExcel(filteredData, fields, {
      filename: 'bid-projects',
      sheetName: '中标项目列表',
    });

    const filename = this.exportService.generateFilename('中标项目列表');

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
    res.status(HttpStatus.OK).send(buffer);
  }
}
