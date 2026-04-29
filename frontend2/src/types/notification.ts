export type NotificationType = 'PROJECT' | 'PAYMENT' | 'RECEIPT' | 'SUPPLIER' | 'SYSTEM'

export interface Notification {
  id: string
  userId: string
  type: NotificationType
  title: string
  content: string
  relatedId?: string
  relatedType?: string
  isRead: boolean
  metadata?: Record<string, any>
  createdAt: string
}

export interface NotificationPreference {
  id: string
  userId: string
  projectNotify: boolean
  paymentNotify: boolean
  receiptNotify: boolean
  supplierNotify: boolean
  systemNotify: boolean
  enableSound: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateNotificationDto {
  userId: string
  type: NotificationType
  title: string
  content: string
  relatedId?: string
  relatedType?: string
  metadata?: Record<string, any>
}

export interface UpdateNotificationPreferenceDto {
  projectNotify?: boolean
  paymentNotify?: boolean
  receiptNotify?: boolean
  supplierNotify?: boolean
  systemNotify?: boolean
  enableSound?: boolean
}

export interface NotificationFilter {
  isRead?: boolean
  projectNotify?: boolean
  paymentNotify?: boolean
  receiptNotify?: boolean
  supplierNotify?: boolean
  systemNotify?: boolean
}
