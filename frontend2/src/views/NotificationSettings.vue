<template>
  <div class="notification-settings-page">
    <el-card shadow="never">
      <template #header>
        <div class="page-header">
          <h2>通知设置</h2>
        </div>
      </template>

      <el-form :model="form" label-width="150px" class="settings-form">
        <el-divider content-position="left">
          <span class="divider-title">通知类型</span>
        </el-divider>

        <el-form-item label="项目通知">
          <el-switch
            v-model="form.projectNotify"
            active-text="开启"
            inactive-text="关闭"
            @change="handleSave"
          />
          <span class="form-tip">项目状态变更、项目创建等通知</span>
        </el-form-item>

        <el-form-item label="付款通知">
          <el-switch
            v-model="form.paymentNotify"
            active-text="开启"
            inactive-text="关闭"
            @change="handleSave"
          />
          <span class="form-tip">付款到期、付款记录等通知</span>
        </el-form-item>

        <el-form-item label="收款通知">
          <el-switch
            v-model="form.receiptNotify"
            active-text="开启"
            inactive-text="关闭"
            @change="handleSave"
          />
          <span class="form-tip">收款到账、发票状态等通知</span>
        </el-form-item>

        <el-form-item label="供应商通知">
          <el-switch
            v-model="form.supplierNotify"
            active-text="开启"
            inactive-text="关闭"
            @change="handleSave"
          />
          <span class="form-tip">供应商报价更新等通知</span>
        </el-form-item>

        <el-form-item label="系统通知">
          <el-switch
            v-model="form.systemNotify"
            active-text="开启"
            inactive-text="关闭"
            @change="handleSave"
          />
          <span class="form-tip">系统公告、更新提醒等通知</span>
        </el-form-item>

        <el-divider content-position="left">
          <span class="divider-title">通知方式</span>
        </el-divider>

        <el-form-item label="提示音">
          <el-switch
            v-model="form.enableSound"
            active-text="开启"
            inactive-text="关闭"
            @change="handleSave"
          />
          <span class="form-tip">收到通知时播放提示音</span>
        </el-form-item>

        <el-divider content-position="left">
          <span class="divider-title">通知状态</span>
        </el-divider>

        <el-form-item label="连接状态">
          <el-tag :type="notificationStore.isConnected ? 'success' : 'danger'">
            {{ notificationStore.isConnected ? '已连接' : '未连接' }}
          </el-tag>
          <span class="form-tip">
            {{ notificationStore.isConnected ? '实时通知功能正常' : '实时通知功能不可用' }}
          </span>
        </el-form-item>

        <el-form-item label="未读通知">
          <el-tag type="danger">{{ notificationStore.unreadCount }} 条</el-tag>
          <el-button v-if="notificationStore.unreadCount > 0" link type="primary" @click="goToNotifications">
            查看通知
          </el-button>
        </el-form-item>
      </el-form>

      <div class="actions">
        <el-button @click="goBack">返回</el-button>
        <el-button type="primary" @click="goToNotifications">
          查看通知中心
        </el-button>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useNotificationStore } from '@/stores/notification'
import { ElMessage } from 'element-plus'
import type { NotificationPreference } from '@/types/notification'

const router = useRouter()
const notificationStore = useNotificationStore()

const form = ref<NotificationPreference>({
  id: '',
  userId: '',
  projectNotify: true,
  paymentNotify: true,
  receiptNotify: true,
  supplierNotify: true,
  systemNotify: true,
  enableSound: true,
  createdAt: '',
  updatedAt: '',
})

onMounted(async () => {
  await loadPreferences()
})

async function loadPreferences() {
  try {
    const preference = await notificationStore.fetchPreferences()
    if (preference) {
      form.value = { ...form.value, ...preference }
    }
  } catch (error) {
    ElMessage.error('加载设置失败')
  }
}

async function handleSave() {
  try {
    await notificationStore.updatePreferences({
      projectNotify: form.value.projectNotify,
      paymentNotify: form.value.paymentNotify,
      receiptNotify: form.value.receiptNotify,
      supplierNotify: form.value.supplierNotify,
      systemNotify: form.value.systemNotify,
      enableSound: form.value.enableSound,
    })
    ElMessage.success('设置已保存')
  } catch (error) {
    ElMessage.error('保存失败')
    // 恢复原始值
    await loadPreferences()
  }
}

function goBack() {
  router.back()
}

function goToNotifications() {
  router.push('/notifications')
}
</script>

<style scoped lang="scss">
.notification-settings-page {
  max-width: 800px;
  margin: 0 auto;

  .page-header {
    h2 {
      margin: 0;
      font-size: 20px;
      font-weight: 500;
    }
  }

  .settings-form {
    max-width: 600px;

    .divider-title {
      font-size: 16px;
      font-weight: 500;
      color: #303133;
    }

    .form-tip {
      margin-left: 12px;
      font-size: 13px;
      color: #909399;
    }

    :deep(.el-form-item__label) {
      font-weight: 500;
    }
  }

  .actions {
    margin-top: 32px;
    display: flex;
    justify-content: center;
    gap: 16px;
  }
}
</style>
