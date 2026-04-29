import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification, NotificationType } from './entities/notification.entity';
import { NotificationPreference } from './entities/notification-preference.entity';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationPreferenceDto, NotificationFilterDto } from './dto/notification-preference.dto';
import { PaginationDto, PaginatedResponse } from '../../common/dto/pagination.dto';

@Injectable()
export class NotificationService {
  constructor(
    @InjectRepository(Notification)
    private notificationRepository: Repository<Notification>,
    @InjectRepository(NotificationPreference)
    private preferenceRepository: Repository<NotificationPreference>,
  ) {}

  // 创建通知
  async create(dto: CreateNotificationDto): Promise<Notification> {
    const notification = this.notificationRepository.create(dto);
    return await this.notificationRepository.save(notification);
  }

  // 获取用户通知列表（分页）
  async getUserNotifications(
    userId: string,
    query: PaginationDto & NotificationFilterDto,
  ): Promise<PaginatedResponse<Notification>> {
    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'DESC', ...filters } = query;

    const queryBuilder = this.notificationRepository
      .createQueryBuilder('notification')
      .where('notification.userId = :userId', { userId });

    // 应用筛选条件
    if (filters.isRead !== undefined) {
      queryBuilder.andWhere('notification.isRead = :isRead', { isRead: filters.isRead });
    }
    if (filters.projectNotify !== undefined) {
      queryBuilder.andWhere('notification.type = :type', { type: NotificationType.PROJECT });
    }
    if (filters.paymentNotify !== undefined) {
      queryBuilder.andWhere('notification.type = :type', { type: NotificationType.PAYMENT });
    }
    if (filters.receiptNotify !== undefined) {
      queryBuilder.andWhere('notification.type = :type', { type: NotificationType.RECEIPT });
    }
    if (filters.supplierNotify !== undefined) {
      queryBuilder.andWhere('notification.type = :type', { type: NotificationType.SUPPLIER });
    }
    if (filters.systemNotify !== undefined) {
      queryBuilder.andWhere('notification.type = :type', { type: NotificationType.SYSTEM });
    }

    const [data, total] = await queryBuilder
      .orderBy(`notification.${sortBy}`, sortOrder.toUpperCase() as 'ASC' | 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // 获取未读数量
  async getUnreadCount(userId: string): Promise<number> {
    return await this.notificationRepository.count({
      where: { userId, isRead: false },
    });
  }

  // 标记为已读
  async markAsRead(id: string, userId: string): Promise<Notification> {
    const notification = await this.notificationRepository.findOne({
      where: { id, userId },
    });
    if (!notification) {
      throw new NotFoundException('Notification not found');
    }
    notification.isRead = true;
    return await this.notificationRepository.save(notification);
  }

  // 全部标记为已读
  async markAllAsRead(userId: string): Promise<void> {
    await this.notificationRepository.update(
      { userId, isRead: false },
      { isRead: true },
    );
  }

  // 删除通知
  async delete(id: string, userId: string): Promise<void> {
    const notification = await this.notificationRepository.findOne({
      where: { id, userId },
    });
    if (!notification) {
      throw new NotFoundException('Notification not found');
    }
    await this.notificationRepository.remove(notification);
  }

  // 获取或创建用户通知偏好
  async getOrCreatePreference(userId: string): Promise<NotificationPreference> {
    let preference = await this.preferenceRepository.findOne({
      where: { userId },
    });
    if (!preference) {
      preference = this.preferenceRepository.create({ userId });
      await this.preferenceRepository.save(preference);
    }
    return preference;
  }

  // 更新通知偏好
  async updatePreference(userId: string, dto: UpdateNotificationPreferenceDto): Promise<NotificationPreference> {
    const preference = await this.getOrCreatePreference(userId);
    Object.assign(preference, dto);
    return await this.preferenceRepository.save(preference);
  }

  // 检查用户是否接收某种类型的通知
  async shouldNotify(userId: string, type: NotificationType): Promise<boolean> {
    const preference = await this.getOrCreatePreference(userId);
    switch (type) {
      case NotificationType.PROJECT:
        return preference.projectNotify;
      case NotificationType.PAYMENT:
        return preference.paymentNotify;
      case NotificationType.RECEIPT:
        return preference.receiptNotify;
      case NotificationType.SUPPLIER:
        return preference.supplierNotify;
      case NotificationType.SYSTEM:
        return preference.systemNotify;
      default:
        return true;
    }
  }

  // 批量创建通知（给多个用户）
  async createBulk(users: string[], dto: Omit<CreateNotificationDto, 'userId'>): Promise<Notification[]> {
    const notifications = users.map(userId => ({
      ...dto,
      userId,
    }));
    return await this.notificationRepository.save(notifications);
  }

  // 删除用户的所有通知
  async deleteAll(userId: string): Promise<void> {
    await this.notificationRepository.delete({ userId });
  }

  // 删除已读通知
  async deleteRead(userId: string): Promise<void> {
    await this.notificationRepository.delete({
      userId,
      isRead: true,
    });
  }
}
