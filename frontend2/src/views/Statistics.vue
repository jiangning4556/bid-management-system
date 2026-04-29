<template>
  <div class="statistics-container page-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>统计分析</span>
          <el-radio-group v-model="timeRange" @change="loadStatistics">
            <el-radio-button value="all">全部</el-radio-button>
            <el-radio-button value="month">本月</el-radio-button>
            <el-radio-button value="quarter">本季度</el-radio-button>
            <el-radio-button value="year">本年度</el-radio-button>
          </el-radio-group>
        </div>
      </template>

      <!-- 第一行：应收概览KPI -->
      <el-row :gutter="20" class="mb-20 kpi-section">
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-icon receivable-icon">
                <el-icon :size="32"><Download /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-label">应收总额</div>
                <div class="stat-value text-primary">¥{{ formatAmount(overviewData.totalReceivable) }}</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-icon received-icon">
                <el-icon :size="32"><SuccessFilled /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-label">已收金额</div>
                <div class="stat-value text-success">¥{{ formatAmount(overviewData.totalReceived) }}</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-icon unreceived-icon">
                <el-icon :size="32"><WarningFilled /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-label">未收金额</div>
                <div class="stat-value text-warning">¥{{ formatAmount(overviewData.totalUnreceived) }}</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-icon collection-icon">
                <el-icon :size="32"><TrendCharts /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-label">收款率</div>
                <div class="stat-value" :class="collectionRateClass">
                  {{ overviewData.collectionRate?.toFixed(2) || 0 }}%
                </div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>

      <!-- 第二行：应付概览KPI -->
      <el-row :gutter="20" class="mb-20 kpi-section">
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-icon payable-icon">
                <el-icon :size="32"><Upload /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-label">应付总额</div>
                <div class="stat-value text-primary">¥{{ formatAmount(overviewData.totalPayable) }}</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-icon paid-icon">
                <el-icon :size="32"><SuccessFilled /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-label">已付金额</div>
                <div class="stat-value text-success">¥{{ formatAmount(overviewData.totalPaid) }}</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-icon unpaid-icon">
                <el-icon :size="32"><WarningFilled /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-label">未付金额</div>
                <div class="stat-value text-warning">¥{{ formatAmount(overviewData.totalUnpaid) }}</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-icon payment-icon">
                <el-icon :size="32"><TrendCharts /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-label">付款率</div>
                <div class="stat-value" :class="paymentRateClass">
                  {{ overviewData.paymentRate?.toFixed(2) || 0 }}%
                </div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>

      <!-- 第三行：盈利概览KPI -->
      <el-row :gutter="20" class="mb-20 kpi-section">
        <el-col :span="8">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-icon gross-profit-icon">
                <el-icon :size="32"><Wallet /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-label">毛利润</div>
                <div class="stat-value text-primary">¥{{ formatAmount(overviewData.grossProfit) }}</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="8">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-icon net-profit-icon">
                <el-icon :size="32"><Coin /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-label">已实现利润</div>
                <div class="stat-value" :class="overviewData.realizedProfit >= 0 ? 'text-success' : 'text-danger'">
                  ¥{{ formatAmount(overviewData.realizedProfit) }}
                </div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="8">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-icon margin-icon">
                <el-icon :size="32"><PieChart /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-label">利润率</div>
                <div class="stat-value" :class="overviewData.profitMargin >= 0 ? 'text-success' : 'text-danger'">
                  {{ overviewData.profitMargin?.toFixed(2) || 0 }}%
                </div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>

      <!-- Charts -->
      <el-row :gutter="20" class="mt-20">
        <el-col :span="12">
          <el-card>
            <template #header>
              <span>项目金额趋势</span>
            </template>
            <div ref="trendChartRef" style="height: 300px"></div>
          </el-card>
        </el-col>
        <el-col :span="12">
          <el-card>
            <template #header>
              <span>付款状态统计</span>
            </template>
            <div ref="paymentChartRef" style="height: 300px"></div>
          </el-card>
        </el-col>
      </el-row>

      <!-- Supplier Rankings -->
      <el-row :gutter="20" class="mt-20">
        <el-col :span="24">
          <el-card>
            <template #header>
              <span>供应商合作排行</span>
            </template>
            <el-table :data="supplierRankings" style="width: 100%">
              <el-table-column type="index" label="排名" width="60" align="center" />
              <el-table-column prop="name" label="供应商" min-width="120" />
              <el-table-column prop="projectCount" label="项目数" width="80" align="right" />
              <el-table-column prop="totalAmount" label="合作金额" width="120" align="right">
                <template #default="{ row }">
                  ¥{{ formatAmount(row.totalAmount) }}
                </template>
              </el-table-column>
            </el-table>
          </el-card>
        </el-col>
      </el-row>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue'
import * as echarts from 'echarts'
import type { EChartsOption } from 'echarts'
import { statisticsApi, type OverviewWithPeriodStats } from '@/api/statistics'
import { paymentApi } from '@/api/payment'
import { ElMessage } from 'element-plus'

const timeRange = ref('all')
const loading = ref(false)

const overviewData = ref<Partial<OverviewWithPeriodStats>>({
  // Project counts
  consultProjectCount: 0,
  bidProjectCount: 0,

  // Receivable
  totalReceivable: 0,
  totalReceived: 0,
  totalUnreceived: 0,
  collectionRate: 0,

  // Payable
  totalPayable: 0,
  totalPaid: 0,
  totalUnpaid: 0,
  paymentRate: 0,

  // Profit
  grossProfit: 0,
  realizedProfit: 0,
  profitMargin: 0,
})

const supplierRankings = ref<any[]>([])
const monthlyStats = ref<any[]>([])

const trendChartRef = ref<HTMLElement>()
const paymentChartRef = ref<HTMLElement>()

let trendChart: echarts.ECharts | null = null
let paymentChart: echarts.ECharts | null = null

// Computed properties for KPI card styling
const collectionRateClass = computed(() => {
  const rate = overviewData.value.collectionRate || 0
  if (rate >= 80) return 'text-success'
  if (rate >= 50) return 'text-warning'
  return 'text-danger'
})

const paymentRateClass = computed(() => {
  const rate = overviewData.value.paymentRate || 0
  if (rate >= 80) return 'text-success'
  if (rate >= 50) return 'text-warning'
  return 'text-danger'
})

async function loadStatistics() {
  loading.value = true
  try {
    // Load receivable/payable statistics from payment API (same as payment management page)
    const paymentStats = await paymentApi.getOverviewStatistics()

    // Calculate derived values
    const totalReceivable = paymentStats.totalReceivable || 0
    const totalReceived = paymentStats.totalReceived || 0
    const totalPayable = paymentStats.totalPayable || 0
    const totalPaid = paymentStats.totalPaid || 0

    overviewData.value = {
      // Receivable (from payment API)
      totalReceivable,
      totalReceived,
      totalUnreceived: Math.max(0, totalReceivable - totalReceived),
      collectionRate: totalReceivable > 0 ? (totalReceived / totalReceivable) * 100 : 0,

      // Payable (from payment API)
      totalPayable,
      totalPaid,
      totalUnpaid: Math.max(0, totalPayable - totalPaid),
      paymentRate: totalPayable > 0 ? (totalPaid / totalPayable) * 100 : 0,

      // Profit calculations
      grossProfit: totalReceivable - totalPayable,
      realizedProfit: totalReceived - totalPaid,
      profitMargin: totalReceivable > 0 ? ((totalReceivable - totalPayable) / totalReceivable) * 100 : 0,

      // Project counts (still use statistics API)
      consultProjectCount: 0,
      bidProjectCount: 0,
    }

    // Load other statistics (use all-time data for now)
    const [suppliersData, monthlyData] = await Promise.all([
      statisticsApi.getSupplierStats().catch(() => []),
      statisticsApi.getMonthlyStats().catch(() => []),
    ])

    if (suppliersData) {
      supplierRankings.value = suppliersData.slice(0, 10).map(s => {
        // Handle special number format like "011700.009900.00"
        let totalAmount = s.totalQuoteAmount || 0
        if (typeof totalAmount === 'string' && totalAmount.includes('.') && totalAmount.match(/\d+\.\d+/g)) {
          // Extract all decimal numbers and sum them
          const matches = totalAmount.match(/\d+\.\d+/g)
          if (matches && matches.length > 1) {
            totalAmount = matches.reduce((sum, m) => sum + parseFloat(m), 0)
          } else {
            totalAmount = parseFloat(totalAmount) || 0
          }
        }
        return {
          name: s.supplierName,
          projectCount: s.quoteCount,
          totalAmount: totalAmount,
        }
      })
    }

    if (monthlyData) {
      monthlyStats.value = monthlyData
      updateCharts()
    }
  } catch (error) {
    console.error('Failed to load statistics:', error)
    ElMessage.error('加载统计数据失败')
  } finally {
    loading.value = false
  }
}

function updateCharts() {
  updateTrendChart()
  updatePaymentChart()
}

function initTrendChart() {
  if (!trendChartRef.value) return
  trendChart = echarts.init(trendChartRef.value)
  updateTrendChart()
}

function updateTrendChart() {
  if (!trendChart) return

  const months = monthlyStats.value.map(s => `${s.month}月`)
  const consultData = monthlyStats.value.map(s => s.consultAmount)
  const bidData = monthlyStats.value.map(s => s.bidAmount)

  const option: EChartsOption = {
    tooltip: {
      trigger: 'axis',
    },
    xAxis: {
      type: 'category',
      data: months,
    },
    yAxis: {
      type: 'value',
      axisLabel: {
        formatter: '¥{value}',
      },
    },
    series: [
      {
        name: '咨询金额',
        type: 'line',
        data: consultData,
        smooth: true,
      },
      {
        name: '中标金额',
        type: 'line',
        data: bidData,
        smooth: true,
      },
    ],
    legend: {
      data: ['咨询金额', '中标金额'],
    },
  }

  trendChart.setOption(option)
}

function initPaymentChart() {
  if (!paymentChartRef.value) return
  paymentChart = echarts.init(paymentChartRef.value)
  updatePaymentChart()
}

function updatePaymentChart() {
  if (!paymentChart) return

  const totalPaid = overviewData.value.totalPaid || 0
  const totalPayable = overviewData.value.totalPayable || 0
  const totalUnpaid = Math.max(0, totalPayable - totalPaid)

  const option: EChartsOption = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow',
      },
    },
    xAxis: {
      type: 'category',
      data: ['未付款', '已付款'],
    },
    yAxis: {
      type: 'value',
      axisLabel: {
        formatter: '¥{value}',
      },
    },
    series: [
      {
        name: '付款金额',
        type: 'bar',
        data: [
          { value: totalUnpaid, itemStyle: { color: '#e6a23c' } },
          { value: totalPaid, itemStyle: { color: '#67c23a' } },
        ],
      },
    ],
  }

  paymentChart.setOption(option)
}

function formatAmount(amount: number): string {
  if (!amount || isNaN(amount)) return '0.00'
  return amount.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

onMounted(async () => {
  await loadStatistics()

  nextTick(() => {
    initTrendChart()
    initPaymentChart()
  })
})
</script>

<style scoped>
.statistics-container {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.kpi-section {
  margin-bottom: 20px;
}

.stat-card {
  margin-bottom: 0;
}

.stat-content {
  display: flex;
  align-items: center;
  gap: 12px;
}

.stat-icon {
  width: 50px;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
}

.receivable-icon,
.payable-icon {
  background-color: #e3f2fd;
  color: #1976d2;
}

.received-icon,
.paid-icon {
  background-color: #e8f5e9;
  color: #388e3c;
}

.unreceived-icon,
.unpaid-icon {
  background-color: #fff3e0;
  color: #f57c00;
}

.collection-icon,
.payment-icon {
  background-color: #fce4ec;
  color: #c2185b;
}

.gross-profit-icon {
  background-color: #e1f5fe;
  color: #0277bd;
}

.net-profit-icon {
  background-color: #e8f5e9;
  color: #2e7d32;
}

.margin-icon {
  background-color: #f3e5f5;
  color: #7b1fa2;
}

.stat-info {
  flex: 1;
}

.stat-label {
  font-size: 14px;
  color: #666;
}

.stat-value {
  font-size: 18px;
  font-weight: bold;
  color: #333;
}

.text-primary {
  color: #409eff;
}

.text-success {
  color: #67c23a;
}

.text-warning {
  color: #e6a23c;
}

.text-danger {
  color: #f56c6c;
}

.text-info {
  color: #909399;
}
</style>
