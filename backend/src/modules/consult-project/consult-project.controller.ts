import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query, ParseUUIDPipe, Res, HttpStatus } from '@nestjs/common';
import type { Response } from 'express';
import { ConsultProjectService } from './consult-project.service';
import { CreateConsultProjectDto } from './dto/create-consult-project.dto';
import { UpdateConsultProjectDto } from './dto/update-consult-project.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { User } from '../../common/decorators/user.decorator';
import { PaginationDto, AdvancedSearchDto, ExportDto } from '../../common/dto';
import { ExportService, ExportField } from '../../common/export/export.service';
import type { UserInfo } from '../user/entities/user.entity';

@Controller('consult-projects')
@UseGuards(JwtAuthGuard)
export class ConsultProjectController {
  constructor(
    private readonly consultProjectService: ConsultProjectService,
    private readonly exportService: ExportService,
  ) {}

  @Post()
  create(@Body() createConsultProjectDto: CreateConsultProjectDto, @User() user: UserInfo) {
    return this.consultProjectService.create(createConsultProjectDto, user.id);
  }

  @Get()
  findAll(@User() user: UserInfo, @Query() paginationDto: PaginationDto) {
    return this.consultProjectService.findAll(user as any, paginationDto);
  }

  @Post('search')
  advancedSearch(@Body() searchDto: AdvancedSearchDto, @User() user: UserInfo, @Query() paginationDto: PaginationDto) {
    return this.consultProjectService.advancedSearch(user as any, searchDto, paginationDto);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string, @User() user: UserInfo) {
    return this.consultProjectService.findOne(id, user as any);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateConsultProjectDto: UpdateConsultProjectDto,
    @User() user: UserInfo,
  ) {
    return this.consultProjectService.update(id, updateConsultProjectDto, user as any);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string, @User() user: UserInfo) {
    return this.consultProjectService.remove(id, user as any);
  }

  @Post(':id/items')
  addItem(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() itemDto: any,
    @User() user: UserInfo,
  ) {
    return this.consultProjectService.addItem(id, itemDto, user as any);
  }

  @Delete(':projectId/items/:itemId')
  removeItem(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Param('itemId', ParseUUIDPipe) itemId: string,
    @User() user: UserInfo,
  ) {
    return this.consultProjectService.removeItem(projectId, itemId, user as any);
  }

  @Patch('items/:itemId')
  updateItem(
    @Param('itemId', ParseUUIDPipe) itemId: string,
    @Body() updateDto: any,
    @User() user: UserInfo,
  ) {
    return this.consultProjectService.updateItem(itemId, updateDto, user as any);
  }

  @Post('items/:itemId/quotes')
  addQuote(
    @Param('itemId', ParseUUIDPipe) itemId: string,
    @Body() quoteDto: any,
    @User() user: UserInfo,
  ) {
    return this.consultProjectService.addQuote(itemId, quoteDto, user as any);
  }

  @Patch('quotes/:quoteId')
  updateQuote(
    @Param('quoteId', ParseUUIDPipe) quoteId: string,
    @Body() updateDto: any,
    @User() user: UserInfo,
  ) {
    return this.consultProjectService.updateQuote(quoteId, updateDto, user as any);
  }

  @Delete('quotes/:quoteId')
  removeQuote(
    @Param('quoteId', ParseUUIDPipe) quoteId: string,
    @User() user: UserInfo,
  ) {
    return this.consultProjectService.removeQuote(quoteId, user as any);
  }

  @Post('quotes/:quoteId/toggle')
  toggleQuoteSelection(
    @Param('quoteId', ParseUUIDPipe) quoteId: string,
    @User() user: UserInfo,
  ) {
    return this.consultProjectService.toggleQuoteSelection(quoteId, user as any);
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
          { key: 'consultDate', label: '咨询日期', width: 12 },
          { key: 'totalAmount', label: '总金额', width: 12 },
          { key: 'status', label: '状态', width: 10 },
          { key: 'remarks', label: '备注', width: 30 },
        ];

    const result = await this.consultProjectService.findAll(user as any, {});
    const filteredData = exportDto.ids?.length
      ? result.data.filter((item: any) => exportDto.ids!.includes(item.id))
      : result.data;

    const buffer = await this.exportService.exportToExcel(filteredData, fields, {
      filename: 'consult-projects',
      sheetName: '咨询项目列表',
    });

    const filename = this.exportService.generateFilename('咨询项目列表');

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
    res.status(HttpStatus.OK).send(buffer);
  }
}
