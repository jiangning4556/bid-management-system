import { Controller, Get, UseGuards, Query, Param } from '@nestjs/common';
import { StatisticsService } from './statistics.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { User } from '../../common/decorators/user.decorator';
import type { UserInfo } from '../user/entities/user.entity';

@Controller('statistics')
@UseGuards(JwtAuthGuard)
export class StatisticsController {
  constructor(private readonly statisticsService: StatisticsService) {}

  @Get('overview')
  getOverview(@User() user: UserInfo, @Query('period') period?: string) {
    if (period && ['month', 'quarter', 'year', 'all'].includes(period)) {
      return this.statisticsService.getOverviewWithPeriod(user as any, period);
    }
    // Default to 'all' when no period specified
    return this.statisticsService.getOverviewWithPeriod(user as any, 'all');
  }

  @Get('receivable')
  getReceivableStats(
    @User() user: UserInfo,
    @Query('period') period?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    return this.statisticsService.getReceivableStats(user as any, start, end);
  }

  @Get('payable')
  getPayableStats(
    @User() user: UserInfo,
    @Query('period') period?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    return this.statisticsService.getPayableStats(user as any, start, end);
  }

  @Get('recent-projects')
  getRecentProjects(@User() user: UserInfo, @Query('limit') limit?: number) {
    return this.statisticsService.getRecentProjects(user as any, limit);
  }

  @Get('project/:projectId')
  getProjectStatistics(@Param('projectId') projectId: string, @User() user: UserInfo) {
    return this.statisticsService.getProjectStatistics(projectId, user as any);
  }

  @Get('suppliers')
  getSupplierStatistics(@User() user: UserInfo) {
    return this.statisticsService.getSupplierStatistics(user as any);
  }

  @Get('monthly')
  getMonthlyStatistics(@User() user: UserInfo, @Query('year') year?: number) {
    return this.statisticsService.getMonthlyStatistics(user as any, year);
  }
}
