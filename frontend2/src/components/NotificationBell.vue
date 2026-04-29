<template>
  <el-popover
    :width="380"
    trigger="click"
    placement="bottom"
    @show="handleShow"
    popper-class="notification-popover"
  >
    <template #reference>
      <el-badge :value="unreadCount" :hidden="unreadCount === 0" :max="99">
        <el-button
          :icon="Bell"
          circle
          size="large"
          class="notification-bell"
          :class="{ 'is-connected': notificationStore.isConnected }"
        />
      </el-badge>
    </template>

    <div class="notification-panel">
      <div class="notification-header">
        <span class="title">通知</span>
        <div class="actions">
          <el-button
            v-if="unreadCount > 0"
            link
            size="small"
            @click="handleMarkAllRead"
          >
            全部已读
          </el-button>
          <el-dropdown @command="handleMoreCommand">
            <el-button link size="small">
              <el-icon><MoreFilled /></el-icon>
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="viewAll">查看全部</el-dropdown-item>
                <el-dropdown-item command="deleteRead" :disabled="readNotifications.length === 0">
                  清除已读
                </el-dropdown-item>
                <el-dropdown-item command="settings">通知设置</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </div>

      <el-divider style="margin: 8px 0" />

      <el-scrollbar max-height="400px" class="notification-list">
        <div v-if="notifications.length === 0" class="empty-state">
          <el-empty description="暂无通知" :image-size="80" />
        </div>

        <template v-else>
          <NotificationItem
            v-for="notification in notifications"
            :key="notification.id"
            :notification="notification"
            @read="handleMarkRead"
            @delete="handleDelete"
          />
        </template>
      </el-scrollbar>
    </div>
  </el-popover>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { Bell, MoreFilled } from '@element-plus/icons-vue'
import { useNotificationStore } from '@/stores/notification'
import { ElMessage, ElMessageBox } from 'element-plus'
import NotificationItem from './NotificationItem.vue'
import type { Notification } from '@/types/notification'

const router = useRouter()
const notificationStore = useNotificationStore()

// Ensure unreadCount is a plain number, not a ref
const unreadCount = computed(() => notificationStore.unreadCount)
const notifications = computed(() => notificationStore.notifications)
const readNotifications = computed(() => notificationStore.readNotifications)

let pollingTimer: ReturnType<typeof setInterval> | null = null

onMounted(() => {
  // 初始加载未读数量
  notificationStore.refreshUnreadCount()
})

onUnmounted(() => {
  if (pollingTimer) {
    clearInterval(pollingTimer)
  }
})

async function handleShow() {
  // 显示面板时加载最新通知
  try {
    await notificationStore.fetchNotifications(1, 20)
  } catch (error) {
    console.error('Failed to load notifications:', error)
  }
}

async function handleMarkRead(id: string) {
  try {
    await notificationStore.markAsRead(id)
  } catch (error) {
    ElMessage.error('标记已读失败')
  }
}

async function handleMarkAllRead() {
  try {
    await notificationStore.markAllAsRead()
    ElMessage.success('已全部标记为已读')
  } catch (error) {
    ElMessage.error('操作失败')
  }
}

async function handleDelete(id: string) {
  try {
    await notificationStore.deleteNotification(id)
  } catch (error) {
    ElMessage.error('删除失败')
  }
}

async function handleMoreCommand(command: string) {
  switch (command) {
    case 'viewAll':
      router.push('/notifications')
      break
    case 'deleteRead':
      await handleDeleteRead()
      break
    case 'settings':
      router.push('/notifications/settings')
      break
  }
}

async function handleDeleteRead() {
  try {
    await ElMessageBox.confirm(
      '确定要清除所有已读通知吗？',
      '确认操作',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )
    await notificationStore.deleteReadNotifications()
    ElMessage.success('已清除所有已读通知')
  } catch (error) {
    // 用户取消
  }
}
</script>

<style scoped lang="scss">
.notification-bell {
  transition: all 0.3s;

  &.is-connected {
    color: #67c23a;
  }

  &:hover {
    transform: scale(1.1);
  }
}

.notification-panel {
  .notification-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0 4px;

    .title {
      font-size: 16px;
      font-weight: 500;
    }

    .actions {
      display: flex;
      gap: 8px;
    }
  }

  .notification-list {
    margin-top: 8px;
  }

  .empty-state {
    padding: 20px 0;
    text-align: center;
  }
}
</style>
