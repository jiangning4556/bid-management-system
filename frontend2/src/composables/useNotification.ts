import { io, Socket } from 'socket.io-client'
import { useUserStore } from '@/stores/user'
import { useNotificationStore } from '@/stores/notification'
import { ElNotification } from 'element-plus'
import type { Notification } from '@/types/notification'

export function useWebSocket() {
  let socket: Socket | null = null
  const userStore = useUserStore()
  const notificationStore = useNotificationStore()

  function connect() {
    if (socket?.connected) {
      console.log('Socket already connected')
      return
    }

    if (!userStore.user?.id) {
      console.warn('Cannot connect: User not logged in')
      return
    }

    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000'
    const wsUrl = apiUrl.replace(/^http/, 'ws')

    socket = io(`${wsUrl}/notifications`, {
      auth: { userId: userStore.user.id },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
      timeout: 10000,
    })

    socket.on('connect', () => {
      console.log('WebSocket connected:', socket?.id)
      notificationStore.setConnected(true)
    })

    socket.on('disconnect', (reason) => {
      console.log('WebSocket disconnected:', reason)
      notificationStore.setConnected(false)
    })

    socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error)
      notificationStore.setConnected(false)
    })

    socket.on('notification', (notification: Notification) => {
      console.log('Received notification:', notification)
      notificationStore.addNotification(notification)

      // 显示Element Plus通知
      const typeMap: Record<string, 'success' | 'warning' | 'info' | 'error'> = {
        PROJECT: 'info',
        PAYMENT: 'warning',
        RECEIPT: 'success',
        SUPPLIER: 'info',
        SYSTEM: 'info',
      }

      ElNotification({
        title: notification.title,
        message: notification.content,
        type: typeMap[notification.type] || 'info',
        duration: 5000,
        onClick: () => {
          // 可以在这里处理点击通知后的跳转逻辑
          handleNotificationClick(notification)
        },
      })

      // 播放提示音（如果启用）
      if (notificationStore.preference?.enableSound) {
        playNotificationSound()
      }
    })

    socket.on('unread_count', (count: number) => {
      console.log('Unread count updated:', count)
      notificationStore.setUnreadCount(count)
    })

    socket.io.on('reconnect', (attemptNumber) => {
      console.log('WebSocket reconnected after', attemptNumber, 'attempts')
    })

    socket.io.on('reconnect_attempt', (attemptNumber) => {
      console.log('WebSocket reconnect attempt:', attemptNumber)
    })

    socket.io.on('reconnect_error', (error) => {
      console.error('WebSocket reconnect error:', error)
    })

    socket.io.on('reconnect_failed', () => {
      console.error('WebSocket reconnect failed')
    })
  }

  function disconnect() {
    if (socket) {
      socket.disconnect()
      socket = null
      notificationStore.setConnected(false)
      console.log('WebSocket disconnected')
    }
  }

  function handleNotificationClick(notification: Notification) {
    // 标记为已读
    notificationStore.markAsRead(notification.id)

    // 根据通知类型跳转到相应页面
    const router = useRouter()
    if (notification.relatedId && notification.relatedType) {
      switch (notification.relatedType) {
        case 'consult-project':
          router.push(`/consult-projects/${notification.relatedId}`)
          break
        case 'bid-project':
          router.push(`/bid-projects/${notification.relatedId}`)
          break
        case 'supplier':
          router.push(`/suppliers`)
          break
        default:
          break
      }
    }
  }

  function playNotificationSound() {
    try {
      const audio = new Audio('/sounds/notification.mp3')
      audio.volume = 0.5
      audio.play().catch(err => {
        console.warn('Failed to play notification sound:', err)
      })
    } catch (error) {
      console.warn('Notification sound not available:', error)
    }
  }

  function send(event: string, data?: any) {
    if (socket?.connected) {
      socket.emit(event, data)
    } else {
      console.warn('Cannot send message: Socket not connected')
    }
  }

  function getSocket() {
    return socket
  }

  return {
    connect,
    disconnect,
    send,
    getSocket,
  }
}

// 为了在handleNotificationClick中使用router
function useRouter() {
  // 这里应该从vue-router导入，但为了避免循环依赖，
  // 在实际使用时应该从vue-router导入
  // 这是一个简化的示例
  return {
    push: (path: string) => {
      window.location.href = path
    },
  }
}
