<template>
  <div
    class="notification-item"
    :class="{ 'is-unread': !notification.isRead }"
    @click="handleClick"
  >
    <div class="notification-icon">
      <el-icon :size="20" :color="typeColor">
        <component :is="typeIcon" />
      </el-icon>
    </div>
    <div class="notification-content">
      <div class="notification-title">
        <span class="title-text">{{ notification.title }}</span>
        <el-tag v-if="!notification.isRead" size="small" type="danger" effect="plain">
          新
        </el-tag>
      </div>
      <div class="notification-message">{{ notification.content }}</div>
      <div class="notification-time">{{ formatTime(notification.createdAt) }}</div>
    </div>
    <div class="notification-actions">
      <el-button
        v-if="!notification.isRead"
        link
        size="small"
        @click.stop="handleMarkRead"
      >
        标为已读
      </el-button>
      <el-popconfirm
        title="确定删除此通知吗？"
        confirm-button-text="确定"
        cancel-button-text="取消"
        @confirm="handleDelete"
      >
        <template #reference>
          <el-button link size="small" @click.stop>
            <el-icon><Delete /></el-icon>
          </el-button>
        </template>
      </el-popconfirm>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import {
  Document,
  Money,
  Wallet,
  ShoppingCart,
  Bell as BellIcon,
  Delete,
} from '@element-plus/icons-vue'
import type { Notification, NotificationType } from '@/types/notification'
import { useNotificationStore } from '@/stores/notification'
import { ElMessage } from 'element-plus'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/zh-cn'

dayjs.extend(relativeTime)
dayjs.locale('zh-cn')

interface Props {
  notification: Notification
}

interface Emits {
  (e: 'read', id: string): void
  (e: 'delete', id: string): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const router = useRouter()
const notificationStore = useNotificationStore()

const typeConfig = computed<Record<NotificationType, { icon: any; color: string }>>(() => ({
  PROJECT: { icon: Document, color: '#409EFF' },
  PAYMENT: { icon: Money, color: '#F56C6C' },
  RECEIPT: { icon: Wallet, color: '#67C23A' },
  SUPPLIER: { icon: ShoppingCart, color: '#E6A23C' },
  SYSTEM: { icon: BellIcon, color: '#909399' },
}))

const typeIcon = computed(() => typeConfig.value[props.notification.type]?.icon || BellIcon)
const typeColor = computed(() => typeConfig.value[props.notification.type]?.color || '#909399')

function formatTime(time: string): string {
  return dayjs(time).fromNow()
}

async function handleClick() {
  // 标记为已读
  if (!props.notification.isRead) {
    await handleMarkRead()
  }

  // 跳转到相关页面
  if (props.notification.relatedId && props.notification.relatedType) {
    switch (props.notification.relatedType) {
      case 'consult-project':
        router.push(`/consult-projects/${props.notification.relatedId}`)
        break
      case 'bid-project':
        router.push(`/bid-projects/${props.notification.relatedId}`)
        break
      case 'supplier':
        router.push('/suppliers')
        break
      case 'item':
        router.push('/items')
        break
      default:
        break
    }
  }
}

async function handleMarkRead() {
  try {
    await notificationStore.markAsRead(props.notification.id)
    emit('read', props.notification.id)
  } catch (error) {
    ElMessage.error('标记已读失败')
  }
}

async function handleDelete() {
  try {
    await notificationStore.deleteNotification(props.notification.id)
    emit('delete', props.notification.id)
  } catch (error) {
    ElMessage.error('删除失败')
  }
}
</script>

<style scoped lang="scss">
.notification-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background-color: #f5f7fa;
  }

  &.is-unread {
    background-color: #ecf5ff;

    &:hover {
      background-color: #d9ecff;
    }
  }

  .notification-icon {
    flex-shrink: 0;
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: #f5f7fa;
    border-radius: 50%;
  }

  .notification-content {
    flex: 1;
    min-width: 0;

    .notification-title {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 4px;

      .title-text {
        font-weight: 500;
        font-size: 14px;
        color: #303133;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
    }

    .notification-message {
      font-size: 13px;
      color: #606266;
      line-height: 1.5;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
      margin-bottom: 4px;
    }

    .notification-time {
      font-size: 12px;
      color: #909399;
    }
  }

  .notification-actions {
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
}
</style>
