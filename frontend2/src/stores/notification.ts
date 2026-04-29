import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { notificationApi } from '@/api/notification'
import type { Notification, NotificationPreference, NotificationFilter } from '@/types/notification'
import type { PaginatedResponse } from '@/types/index'

export const useNotificationStore = defineStore('notification', () => {
  // State
  const notifications = ref<Notification[]>([])
  const unreadCount = ref(0)
  const isConnected = ref(false)
  const preference = ref<NotificationPreference | null>(null)
  const total = ref(0)
  const currentPage = ref(1)
  const pageSize = ref(10)

  // Getters
  const unreadNotifications = computed(() =>
    notifications.value.filter(n => !n.isRead)
  )

  const readNotifications = computed(() =>
    notifications.value.filter(n => n.isRead)
  )

  const hasUnread = computed(() => unreadCount.value > 0)

  const totalPages = computed(() => Math.ceil(total.value / pageSize.value))

  // Actions
  async function fetchNotifications(page = 1, limit = 10, filters?: NotificationFilter) {
    try {
      const result = await notificationApi.getList({ page, limit, ...filters })
      notifications.value = result?.data || []
      total.value = result?.total || 0
      currentPage.value = page
      pageSize.value = limit
      return result
    } catch (error) {
      console.error('Failed to fetch notifications:', error)
      throw error
    }
  }

  async function refreshUnreadCount() {
    try {
      const result = await notificationApi.getUnreadCount()
      unreadCount.value = result || 0
      return result
    } catch (error) {
      console.error('Failed to fetch unread count:', error)
      throw error
    }
  }

  async function markAsRead(id: string) {
    try {
      const result = await notificationApi.markAsRead(id)
      // 更新本地状态
      const notification = notifications.value.find(n => n.id === id)
      if (notification && !notification.isRead) {
        notification.isRead = true
        unreadCount.value = Math.max(0, unreadCount.value - 1)
      }
      return result
    } catch (error) {
      console.error('Failed to mark notification as read:', error)
      throw error
    }
  }

  async function markAllAsRead() {
    try {
      await notificationApi.markAllAsRead()
      // 更新本地状态
      notifications.value.forEach(n => n.isRead = true)
      unreadCount.value = 0
    } catch (error) {
      console.error('Failed to mark all as read:', error)
      throw error
    }
  }

  async function deleteNotification(id: string) {
    try {
      await notificationApi.delete(id)
      // 更新本地状态
      const index = notifications.value.findIndex(n => n.id === id)
      if (index !== -1) {
        const wasUnread = !notifications.value[index].isRead
        notifications.value.splice(index, 1)
        if (wasUnread) {
          unreadCount.value = Math.max(0, unreadCount.value - 1)
        }
        total.value = Math.max(0, total.value - 1)
      }
    } catch (error) {
      console.error('Failed to delete notification:', error)
      throw error
    }
  }

  async function deleteAllNotifications() {
    try {
      await notificationApi.deleteAll()
      notifications.value = []
      unreadCount.value = 0
      total.value = 0
    } catch (error) {
      console.error('Failed to delete all notifications:', error)
      throw error
    }
  }

  async function deleteReadNotifications() {
    try {
      await notificationApi.deleteRead()
      // 更新本地状态
      const readCount = notifications.value.filter(n => n.isRead).length
      notifications.value = notifications.value.filter(n => !n.isRead)
      total.value = Math.max(0, total.value - readCount)
    } catch (error) {
      console.error('Failed to delete read notifications:', error)
      throw error
    }
  }

  async function fetchPreferences() {
    try {
      const result = await notificationApi.getPreferences()
      preference.value = result || null
      return result
    } catch (error) {
      console.error('Failed to fetch preferences:', error)
      throw error
    }
  }

  async function updatePreferences(data: Partial<NotificationPreference>) {
    try {
      const result = await notificationApi.updatePreferences(data)
      preference.value = result || null
      return result
    } catch (error) {
      console.error('Failed to update preferences:', error)
      throw error
    }
  }

  function setUnreadCount(count: number) {
    unreadCount.value = count
  }

  function addNotification(notification: Notification) {
    // 添加到列表开头
    notifications.value.unshift(notification)
    // 如果未读，增加未读数量
    if (!notification.isRead) {
      unreadCount.value++
      total.value++
    }
  }

  function setConnected(connected: boolean) {
    isConnected.value = connected
  }

  function reset() {
    notifications.value = []
    unreadCount.value = 0
    isConnected.value = false
    preference.value = null
    total.value = 0
    currentPage.value = 1
  }

  return {
    // State
    notifications,
    unreadCount,
    isConnected,
    preference,
    total,
    currentPage,
    pageSize,

    // Getters
    unreadNotifications,
    readNotifications,
    hasUnread,
    totalPages,

    // Actions
    fetchNotifications,
    refreshUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteAllNotifications,
    deleteReadNotifications,
    fetchPreferences,
    updatePreferences,
    setUnreadCount,
    addNotification,
    setConnected,
    reset,
  }
})
