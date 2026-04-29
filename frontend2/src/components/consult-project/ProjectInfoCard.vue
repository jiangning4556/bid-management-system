<template>
  <el-card v-loading="loading" class="project-info-card">
    <template #header>
      <span>项目信息</span>
    </template>
    <el-descriptions :column="2" border>
      <el-descriptions-item label="项目编号">{{ project?.projectCode || '-' }}</el-descriptions-item>
      <el-descriptions-item label="客户">{{ project?.customer || '-' }}</el-descriptions-item>
      <el-descriptions-item label="咨询日期">{{ project?.consultDate || '-' }}</el-descriptions-item>
      <el-descriptions-item label="项目地址">{{ project?.address || '-' }}</el-descriptions-item>
      <el-descriptions-item label="项目金额">
        <span>¥{{ formatAmount(project?.totalAmount) }}</span>
        <el-tooltip
          effect="dark"
          placement="top"
        >
          <template #content>
            <div>总金额 = 物品的最低报价（单价×数量）之和</div>
            <div>对每个物品，取各供应商报价中的最低价累加</div>
          </template>
          <el-icon class="ml-5" :size="16" style="vertical-align: middle; cursor: help;">
            <InfoFilled />
          </el-icon>
        </el-tooltip>
      </el-descriptions-item>
      <el-descriptions-item label="备注">{{ project?.remarks || '-' }}</el-descriptions-item>
    </el-descriptions>
  </el-card>
</template>

<script setup lang="ts">
import { InfoFilled } from '@element-plus/icons-vue'
import type { ConsultProject } from '@/types'

interface Props {
  project: ConsultProject | null
  loading?: boolean
}

defineProps<Props>()

function formatAmount(amount: number | undefined): string {
  return amount ? amount.toLocaleString() : '0'
}
</script>

<style scoped lang="scss">
.project-info-card {
  margin-top: 20px;
}
</style>
