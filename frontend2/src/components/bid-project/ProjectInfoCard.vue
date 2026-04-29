<template>
  <el-card v-loading="loading" class="project-info-card">
    <template #header>
      <div class="card-header">
        <span>项目信息</span>
        <el-button type="primary" link @click="$emit('edit')">
          <el-icon><Edit /></el-icon>
        </el-button>
      </div>
    </template>
    <el-descriptions :column="2" border>
      <el-descriptions-item label="项目编号">{{ project?.projectCode || '-' }}</el-descriptions-item>
      <el-descriptions-item label="客户">{{ project?.customer || '-' }}</el-descriptions-item>
      <el-descriptions-item label="合同日期">{{ project?.contractDate || '-' }}</el-descriptions-item>
      <el-descriptions-item label="项目地址">{{ project?.address || '-' }}</el-descriptions-item>
      <el-descriptions-item label="合同金额">
        ¥{{ formatAmount(project?.contractAmount) }}
      </el-descriptions-item>
      <el-descriptions-item label="项目总金额">
        ¥{{ formatAmount(project?.totalAmount) }}
      </el-descriptions-item>
      <el-descriptions-item label="状态" :span="2">
        <el-tag :type="getStatusType(project?.status)">
          {{ getStatusLabel(project?.status) }}
        </el-tag>
      </el-descriptions-item>
      <el-descriptions-item label="备注" :span="2">
        {{ project?.remarks || '-' }}
      </el-descriptions-item>
    </el-descriptions>
  </el-card>
</template>

<script setup lang="ts">
import { Edit } from '@element-plus/icons-vue'
import type { BidProject } from '@/types'

interface Props {
  project: BidProject | null
  loading?: boolean
}

defineProps<Props>()

interface Emits {
  (e: 'edit'): void
}

defineEmits<Emits>()

function formatAmount(amount?: number): string {
  return amount ? amount.toLocaleString() : '0'
}

function getStatusType(status?: string) {
  if (!status) return 'info'
  const typeMap: Record<string, string> = {
    preparing: 'info',
    in_progress: 'primary',
    accepted: 'success',
    completed: 'success',
  }
  return typeMap[status] || 'info'
}

function getStatusLabel(status?: string) {
  if (!status) return ''
  const labelMap: Record<string, string> = {
    preparing: '准备中',
    in_progress: '进行中',
    accepted: '已验收',
    completed: '已结案',
  }
  return labelMap[status] || status
}
</script>

<style scoped lang="scss">
.project-info-card {
  margin-top: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
