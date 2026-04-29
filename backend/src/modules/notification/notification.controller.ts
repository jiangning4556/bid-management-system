import { Controller, Get, Post, Patch, Delete, UseGuards, Query, Param, Body } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { User } from '../../common/decorators/user.decorator';
import type { UserInfo } from '../user/entities/user.entity';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationPreferenceDto } from './dto/notification-preference.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  // 获取当前用户的通知列表
  @Get()
  getNotifications(@User() user: UserInfo, @Query() query: PaginationDto) {
    return this.notificationService.getUserNotifications(user.id, query);
  }

  // 获取未读数量
  @Get('unread-count')
  getUnreadCount(@User() user: UserInfo) {
    return this.notificationService.getUnreadCount(user.id);
  }

  // 获取通知偏好设置
  @Get('preferences')
  getPreferences(@User() user: UserInfo) {
    return this.notificationService.getOrCreatePreference(user.id);
  }

  // 更新通知偏好设置
  @Patch('preferences')
  updatePreferences(@User() user: UserInfo, @Body() dto: UpdateNotificationPreferenceDto) {
    return this.notificationService.updatePreference(user.id, dto);
  }

  // 全部标记为已读
  @Post('mark-all-read')
  markAllAsRead(@User() user: UserInfo) {
    return this.notificationService.markAllAsRead(user.id);
  }

  // 删除所有通知
  @Delete('all')
  deleteAll(@User() user: UserInfo) {
    return this.notificationService.deleteAll(user.id);
  }

  // 删除已读通知
  @Delete('read')
  deleteRead(@User() user: UserInfo) {
    return this.notificationService.deleteRead(user.id);
  }

  // 标记为已读
  @Patch(':id/read')
  markAsRead(@Param('id') id: string, @User() user: UserInfo) {
    return this.notificationService.markAsRead(id, user.id);
  }

  // 删除通知
  @Delete(':id')
  delete(@Param('id') id: string, @User() user: UserInfo) {
    return this.notificationService.delete(id, user.id);
  }
}

// 管理员控制器 - 创建通知
@Controller('admin/notifications')
@UseGuards(JwtAuthGuard)
export class AdminNotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  // 创建通知（管理员）
  @Post()
  create(@Body() dto: CreateNotificationDto) {
    return this.notificationService.create(dto);
  }

  // 批量创建通知（管理员）
  @Post('bulk')
  createBulk(@Body() dto: { users: string[] } & Omit<CreateNotificationDto, 'userId'>) {
    const { users, ...rest } = dto;
    return this.notificationService.createBulk(users, rest);
  }
}
