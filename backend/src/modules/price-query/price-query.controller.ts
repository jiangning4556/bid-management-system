import { Controller, Get, UseGuards, Query, Param } from '@nestjs/common';
import { PriceQueryService } from './price-query.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { User } from '../../common/decorators/user.decorator';
import type { UserInfo } from '../user/entities/user.entity';

@Controller('price-query')
@UseGuards(JwtAuthGuard)
export class PriceQueryController {
  constructor(private readonly priceQueryService: PriceQueryService) {}

  @Get('search')
  searchByItem(@Query('q') query: string, @User() user: UserInfo) {
    return this.priceQueryService.searchByItemName(query, user as any);
  }

  @Get('supplier/:supplierId')
  searchBySupplier(@Param('supplierId') supplierId: string, @User() user: UserInfo) {
    return this.priceQueryService.searchBySupplier(supplierId, user as any);
  }

  @Get('trends/:itemId')
  getPriceTrends(@Param('itemId') itemId: string, @User() user: UserInfo) {
    return this.priceQueryService.getPriceTrends(itemId, user as any);
  }
}
