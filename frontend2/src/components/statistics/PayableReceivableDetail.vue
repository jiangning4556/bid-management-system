<template>
  <el-card class="payable-receivable-detail">
    <template #header>
      <div class="card-header">
        <span>{{ title }}</span>
        <el-tag :type="rateType">{{ rateLabel }}: {{ formattedRate }}%</el-tag>
      </div>
    </template>

    <div class="detail-content">
      <!-- Total Amount -->
      <div class="amount-row">
        <div class="amount-label">{{ totalLabel }}</div>
        <div class="amount-value primary">¥{{ formatAmount(data.total) }}</div>
      </div>
      <el-progress
        :percentage="100"
        :show-text="false"
        :stroke-width="8"
        class="total-progress"
      />

      <!-- Received/Paid -->
      <div class="amount-row">
        <div class="amount-label">{{ completedLabel }}</div>
        <div class="amount-value success">¥{{ formatAmount(data.completed) }}</div>
        <el-progress
          :percentage="Math.min(completedRate, 100)"
          :color="completedRate >= 80 ? '#67c23a' : completedRate >= 50 ? '#e6a23c' : '#f56c6c'"
          :stroke-width="16"
          class="completed-progress"
        />
      </div>

      <!-- Unreceived/Unpaid -->
      <div class="amount-row">
        <div class="amount-label">{{ pendingLabel }}</div>
        <div class="amount-value warning">¥{{ formatAmount(data.pending) }}</div>
        <el-progress
          :percentage="Math.min(pendingRate, 100)"
          :color="pendingRate > 50 ? '#e6a23c' : '#f56c6c'"
          :stroke-width="16"
          :show-text="false"
          class="pending-progress"
        />
        <span class="progress-text">{{ pendingRate.toFixed(1) }}%</span>
      </div>
    </div>
  </el-card>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  type: 'receivable' | 'payable'
  data: {
    total: number
    completed: number
    pending: number
    rate: number
  }
}

const props = defineProps<Props>()

const title = computed(() => props.type === 'receivable' ? '应收账款状态' : '应付账款状态')
const totalLabel = computed(() => props.type === 'receivable' ? '应收总额' : '应付总额')
const completedLabel = computed(() => props.type === 'receivable' ? '已收金额' : '已付金额')
const pendingLabel = computed(() => props.type === 'receivable' ? '未收金额' : '未付金额')
const rateLabel = computed(() => props.type === 'receivable' ? '收款率' : '付款率')

const rateType = computed(() => {
  const rate = props.data.rate
  if (rate >= 80) return 'success'
  if (rate >= 50) return 'warning'
  return 'danger'
})

const formattedRate = computed(() => props.data.rate.toFixed(2))

const completedRate = computed(() => props.data.rate)
const pendingRate = computed(() => {
  if (props.data.total === 0) return 0
  return (props.data.pending / props.data.total) * 100
})

function formatAmount(amount: number): string {
  if (!amount || isNaN(amount) || amount === 0) return '0'
  if (amount >= 10000) {
    return (amount / 10000).toFixed(1) + '万'
  }
  return amount.toLocaleString()
}
</script>

<style scoped>
.payable-receivable-detail {
  height: 100%;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.detail-content {
  padding: 10px 0;
}

.amount-row {
  margin-bottom: 16px;
}

.amount-label {
  font-size: 14px;
  color: #666;
  margin-bottom: 8px;
}

.amount-value {
  font-size: 24px;
  font-weight: bold;
  margin-bottom: 8px;

  &.primary {
    color: #409eff;
  }

  &.success {
    color: #67c23a;
  }

  &.warning {
    color: #e6a23c;
  }
}

.total-progress {
  margin-bottom: 16px;
}

.completed-progress,
.pending-progress {
  position: relative;
}

.progress-text {
  position: absolute;
  right: 0;
  top: 2px;
  font-size: 12px;
  color: #666;
  font-weight: 500;
}
</style>
