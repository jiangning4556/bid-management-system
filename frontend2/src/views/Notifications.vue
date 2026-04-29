<template>
  <div class="notifications-page">
    <el-card shadow="never">
      <template #header>
        <div class="page-header">
          <div class="header-left">
            <h2>通知中心</h2>
            <el-tag v-if="notificationStore.unreadCount > 0" type="danger" effect="dark">
              {{ notificationStore.unreadCount }} 条未读
            </el-tag>
          </div>
          <div class="header-actions">
            <el-button
              v-if="notificationStore.unreadCount > 0"
              type="primary"
              @click="handleMarkAllRead"
            >
              全部已读
            </el-button>
            <el-dropdown @command="handleMoreCommand">
              <el-button>
                更多<el-icon class="el-icon--right"><ArrowDown /></el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="deleteRead" :disabled="notificationStore.readNotifications.length === 0">
                    清除已读通知
                  </el-dropdown-item>
                  <el-dropdown-item command="deleteAll" :disabled="notificationStore.notifications.length === 0">
                    清空所有通知
                  </el-dropdown-item>
                  <el-dropdown-item divided command="settings">
                    通知设置
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </div>
      </template>

      <!-- 筛选条件 -->
      <div class="filter-bar">
        <el-radio-group v-model="filterType" @change="handleFilterChange">
          <el-radio-button value="all">全部</el-radio-button>
          <el-radio-button value="unread">未读</el-radio-button>
          <el-radio-button value="read">已读</el-radio-button>
        </el-radio-group>
        <el-divider direction="vertical" />
        <el-select v-model="filterNotificationType" placeholder="通知类型" clearable @change="handleFilterChange" style="width: 150px">
          <el-option label="项目通知" value="PROJECT" />
          <el-option label="付款通知" value="PAYMENT" />
          <el-option label="收款通知" value="RECEIPT" />
          <el-option label="供应商通知" value="SUPPLIER" />
          <el-option label="系统通知" value="SYSTEM" />
        </el-select>
      </div>

      <el-divider />

      <!-- 通知列表 -->
      <div v-loading="loading" class="notifications-container">
        <el-empty v-if="notificationStore.notifications.length === 0 && !loading" description="暂无通知" />

        <div v-else class="notification-list">
          <NotificationItem
            v-for="notification in notificationStore.notifications"
            :key="notification.id"
            :notification="notification"
            @read="handleMarkRead"
            @delete="handleDelete"
          />
        </div>

        <!-- 分页 -->
        <div v-if="notificationStore.totalPages > 1" class="pagination-wrapper">
          <el-pagination
            v-model:current-page="currentPage"
            v-model:page-size="pageSize"
            :total="notificationStore.total"
            :page-sizes="[10, 20, 50]"
            layout="total, sizes, prev, pager, next, jumper"
            @size-change="handleSizeChange"
            @current-change="handlePageChange"
          />
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowDown } from '@element-plus/icons-vue'
import { useNotificationStore } from '@/stores/notification'
import { ElMessage, ElMessageBox } from 'element-plus'
import NotificationItem from '@/components/NotificationItem.vue'

const router = useRouter()
const notificationStore = useNotificationStore()

const loading = ref(false)
const currentPage = ref(1)
const pageSize = ref(20)
const filterType = ref<'all' | 'unread' | 'read'>('all')
const filterNotificationType = ref<string>('')

onMounted(() => {
  loadNotifications()
})

async function loadNotifications() {
  loading.value = true
  try {
    const filters: any = {}
    if (filterType.value === 'unread') {
      filters.isRead = false
    } else if (filterType.value === 'read') {
      filters.isRead = true
    }
    if (filterNotificationType.value === 'PROJECT') {
      filters.projectNotify = true
    } else if (filterNotificationType.value === 'PAYMENT') {
      filters.paymentNotify = true
    } else if (filterNotificationType.value === 'RECEIPT') {
      filters.receiptNotify = true
    } else if (filterNotificationType.value === 'SUPPLIER') {
      filters.supplierNotify = true
    } else if (filterNotificationType.value === 'SYSTEM') {
      filters.systemNotify = true
    }

    await notificationStore.fetchNotifications(currentPage.value, pageSize.value, filters)
  } catch (error) {
    ElMessage.error('加载通知失败')
  } finally {
    loading.value = false
  }
}

function handleFilterChange() {
  currentPage.value = 1
  loadNotifications()
}

function handlePageChange(page: number) {
  currentPage.value = page
  loadNotifications()
}

function handleSizeChange(size: number) {
  pageSize.value = size
  currentPage.value = 1
  loadNotifications()
}

async function handleMarkRead(id: string) {
  try {
    await notificationStore.markAsRead(id)
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

async function handleMarkAllRead() {
  try {
    await notificationStore.markAllAsRead()
    ElMessage.success('已全部标记为已读')
    loadNotifications()
  } catch (error) {
    ElMessage.error('操作失败')
  }
}

async function handleMoreCommand(command: string) {
  switch (command) {
    case 'deleteRead':
      await handleDeleteRead()
      break
    case 'deleteAll':
      await handleDeleteAll()
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
    loadNotifications()
  } catch (error) {
    // 用户取消
  }
}

async function handleDeleteAll() {
  try {
    await ElMessageBox.confirm(
      '确定要清空所有通知吗？此操作不可恢复。',
      '确认操作',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )
    await notificationStore.deleteAllNotifications()
    ElMessage.success('已清空所有通知')
    loadNotifications()
  } catch (error) {
    // 用户取消
  }
}
</script>

<style scoped lang="scss">
.notifications-page {
  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;

    .header-left {
      display: flex;
      align-items: center;
      gap: 16px;

      h2 {
        margin: 0;
        font-size: 20px;
        font-weight: 500;
      }
    }

    .header-actions {
      display: flex;
      gap: 12px;
    }
  }

  .filter-bar {
    display: flex;
    align-items: center;
    gap: 16px;
  }

  .notifications-container {
    min-height: 400px;

    .notification-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .pagination-wrapper {
      margin-top: 24px;
      display: flex;
      justify-content: center;
    }
  }
}
</style>
