<template>
  <el-card class="fund-occupancy-analysis">
    <template #header>
      <span>资金占用分析</span>
    </template>

    <div class="fund-content">
      <el-table :data="fundData" style="width: 100%" :show-header="true">
        <el-table-column prop="label" label="指标" min-width="120" />
        <el-table-column prop="value" label="数值" width="120" align="right">
          <template #default="{ row }">
            <span :class="row.valueClass">¥{{ formatAmount(row.amount) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="description" label="说明" min-width="150" show-overflow-tooltip />
      </el-table>

      <el-divider />

      <div class="fund-summary">
        <div class="summary-item">
          <span class="summary-label">净资金占用</span>
          <span class="summary-value" :class="netOccupancyClass">
            {{ netOccupancy >= 0 ? '+' : '' }}¥{{ formatAmount(Math.abs(netOccupancy)) }}
          </span>
        </div>
        <div class="summary-item health">
          <span class="summary-label">资金健康度</span>
          <el-tag :type="healthType">{{ healthLabel }}</el-tag>
        </div>
      </div>
    </div>
  </el-card>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  receivable: {
    totalUnreceived: number
    totalReceived: number
  }
  payable: {
    totalUnpaid: number
    totalPaid: number
  }
}

const props = defineProps<Props>()

const fundData = computed(() => [
  {
    label: '客户占用资金',
    amount: props.receivable.totalUnreceived,
    description: '未收金额（客户欠款）',
    valueClass: 'text-warning',
  },
  {
    label: '供应商占用资金',
    amount: props.payable.totalUnpaid,
    description: '未付金额（占用供应商资金）',
    valueClass: 'text-info',
  },
])

const netOccupancy = computed(() => {
  return props.receivable.totalUnreceived - props.payable.totalUnpaid
})

const netOccupancyClass = computed(() => {
  if (netOccupancy.value > 0) return 'text-danger'
  if (netOccupancy.value < 0) return 'text-success'
  return 'text-info'
})

const healthLabel = computed(() => {
  const received = props.receivable.totalReceived
  const paid = props.payable.totalPaid

  if (received > paid) return '良好'
  if (received === paid) return '平衡'
  return '紧张'
})

const healthType = computed(() => {
  const received = props.receivable.totalReceived
  const paid = props.payable.totalPaid

  if (received > paid) return 'success'
  if (received === paid) return 'info'
  return 'warning'
})

function formatAmount(amount: number): string {
  if (!amount || isNaN(amount) || amount === 0) return '0'
  if (amount >= 10000) {
    return (amount / 10000).toFixed(2) + '万'
  }
  return amount.toLocaleString()
}
</script>

<style scoped>
.fund-occupancy-analysis {
  margin-bottom: 20px;
}

.fund-content {
  padding: 10px 0;
}

.text-warning {
  color: #e6a23c;
  font-weight: 500;
}

.text-info {
  color: #409eff;
  font-weight: 500;
}

.text-danger {
  color: #f56c6c;
  font-weight: bold;
}

.text-success {
  color: #67c23a;
  font-weight: bold;
}

.fund-summary {
  display: flex;
  justify-content: space-around;
  align-items: center;
  padding: 10px 0;
}

.summary-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;

  &.health {
    align-items: flex-start;
  }
}

.summary-label {
  font-size: 14px;
  color: #666;
}

.summary-value {
  font-size: 20px;
  font-weight: bold;
}
</style>
