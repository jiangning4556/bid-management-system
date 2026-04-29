<template>
  <el-card class="financial-summary">
    <template #header>
      <span>财务汇总</span>
    </template>
    <el-row :gutter="20">
      <el-col :span="6">
        <div class="summary-item">
          <div class="label">应付总额</div>
          <div class="value amount-payable">¥{{ formatAmount(stats.payable) }}</div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="summary-item">
          <div class="label">已付金额</div>
          <div class="value amount-paid">¥{{ formatAmount(stats.paid) }}</div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="summary-item">
          <div class="label">未付金额</div>
          <div class="value amount-unpaid">¥{{ formatAmount(stats.unpaid) }}</div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="summary-item">
          <div class="label">付款进度</div>
          <div class="value">
            <el-progress :percentage="stats.paymentProgress" :color="getProgressColor(stats.paymentProgress)" />
          </div>
        </div>
      </el-col>
    </el-row>
  </el-card>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  stats: {
    payable: number
    paid: number
    unpaid: number
    paymentProgress: number
  }
}

const props = defineProps<Props>()

function formatAmount(amount: number): string {
  return amount.toLocaleString()
}

function getProgressColor(progress: number): string {
  if (progress < 30) return '#f56c6c'
  if (progress < 70) return '#e6a23c'
  return '#67c23a'
}
</script>

<style scoped lang="scss">
.financial-summary {
  margin-top: 20px;
}

.summary-item {
  text-align: center;
  padding: 10px;

  .label {
    font-size: 14px;
    color: #909399;
    margin-bottom: 8px;
  }

  .value {
    font-size: 20px;
    font-weight: 600;

    &.amount-payable { color: #409eff; }
    &.amount-paid { color: #67c23a; }
    &.amount-unpaid { color: #f56c6c; }
  }
}
</style>
