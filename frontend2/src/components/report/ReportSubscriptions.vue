<template>
  <div class="report-subscriptions">
    <div class="toolbar">
      <el-button type="primary" @click="showSubscriptionDialog = true">
        新建订阅
      </el-button>
    </div>

    <el-table :data="subscriptions" v-loading="loading">
      <el-table-column prop="name" label="订阅名称" width="200" />
      <el-table-column prop="template.name" label="报表模板" width="200" />
      <el-table-column label="执行计划" width="200">
        <template #default="{ row }">
          {{ scheduleLabel[row.schedule] }} {{ row.scheduleTime }}
        </template>
      </el-table-column>
      <el-table-column prop="recipients" label="接收人" width="200">
        <template #default="{ row }">
          {{ row.recipients.join(', ') }}
        </template>
      </el-table-column>
      <el-table-column label="状态" width="100">
        <template #default="{ row }">
          <el-switch
            :model-value="row.isActive"
            @change="handleToggleActive(row)"
            active-text="启用"
            inactive-text="禁用"
          />
        </template>
      </el-table-column>
      <el-table-column prop="nextRunAt" label="下次执行" width="180" />
      <el-table-column label="操作" width="150" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" size="small" @click="handleEdit(row)">
            编辑
          </el-button>
          <el-popconfirm title="确定删除此订阅吗？" @confirm="handleDelete(row.id)">
            <template #reference>
              <el-button link type="danger" size="small">删除</el-button>
            </template>
          </el-popconfirm>
        </template>
      </el-table-column>
    </el-table>

    <!-- 订阅对话框 -->
    <SubscriptionDialog v-model="showSubscriptionDialog" :subscription="editingSubscription" @success="loadSubscriptions" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { reportApi } from '@/api/report'
import type { ReportSubscription } from '@/types/report'
import SubscriptionDialog from './SubscriptionDialog.vue'

const loading = ref(false)
const subscriptions = ref<ReportSubscription[]>([])
const showSubscriptionDialog = ref(false)
const editingSubscription = ref<ReportSubscription | null>(null)

const scheduleLabel: Record<string, string> = {
  daily: '每天',
  weekly: '每周',
  monthly: '每月',
}

onMounted(() => {
  loadSubscriptions()
})

async function loadSubscriptions() {
  loading.value = true
  try {
    subscriptions.value = await reportApi.getSubscriptions()
  } catch (error) {
    ElMessage.error('加载订阅失败')
  } finally {
    loading.value = false
  }
}

async function handleToggleActive(subscription: ReportSubscription) {
  const action = subscription.isActive ? 'pause' : 'resume'
  try {
    if (action === 'pause') {
      await reportApi.pauseSubscription(subscription.id)
    } else {
      await reportApi.resumeSubscription(subscription.id)
    }
    ElMessage.success('状态更新成功')
    loadSubscriptions()
  } catch (error) {
    ElMessage.error('操作失败')
  }
}

function handleEdit(subscription: ReportSubscription) {
  editingSubscription.value = subscription
  showSubscriptionDialog.value = true
}

async function handleDelete(id: string) {
  try {
    await reportApi.deleteSubscription(id)
    ElMessage.success('删除成功')
    loadSubscriptions()
  } catch (error) {
    ElMessage.error('删除失败')
  }
}
</script>

<style scoped lang="scss">
.report-subscriptions {
  .toolbar {
    margin-bottom: 16px;
  }
}
</style>
