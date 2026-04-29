import request from '@/utils/request'
import type {
  Notification,
  NotificationPreference,
  CreateNotificationDto,
  UpdateNotificationPreferenceDto,
  NotificationFilter,
} from '@/types/notification'
import type { PaginatedResponse } from '@/types/index'

export const notificationApi = {
  // 获取通知列表
  getList(params?: { page?: number; limit?: number; sortBy?: string; sortOrder?: string } & NotificationFilter) {
    return request.get<PaginatedResponse<Notification>>('/notifications', { params })
  },

  // 获取未读数量
  getUnreadCount() {
    return request.get<number>('/notifications/unread-count')
  },

  // 获取通知偏好设置
  getPreferences() {
    return request.get<NotificationPreference>('/notifications/preferences')
  },

  // 更新通知偏好设置
  updatePreferences(dto: UpdateNotificationPreferenceDto) {
    return request.patch<NotificationPreference>('/notifications/preferences', dto)
  },

  // 全部标记为已读
  markAllAsRead() {
    return request.post<void>('/notifications/mark-all-read')
  },

  // 删除所有通知
  deleteAll() {
    return request.delete<void>('/notifications/all')
  },

  // 删除已读通知
  deleteRead() {
    return request.delete<void>('/notifications/read')
  },

  // 标记为已读
  markAsRead(id: string) {
    return request.patch<Notification>(`/notifications/${id}/read`)
  },

  // 删除通知
  delete(id: string) {
    return request.delete<void>(`/notifications/${id}`)
  },

  // 管理员：创建通知
  create(dto: CreateNotificationDto) {
    return request.post<Notification>('/admin/notifications', dto)
  },

  // 管理员：批量创建通知
  createBulk(dto: { users: string[] } & Omit<CreateNotificationDto, 'userId'>) {
    return request.post<Notification[]>('/admin/notifications/bulk', dto)
  },
}
