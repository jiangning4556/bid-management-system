<template>
  <div class="price-history-panel">
    <div class="panel-header" @click="collapsed = !collapsed">
      <span class="panel-title">
        <el-icon><Clock /></el-icon>
        历史价格参考
      </span>
      <el-icon :class="['collapse-icon', { collapsed }]">
        <ArrowDown />
      </el-icon>
    </div>

    <el-collapse-transition>
      <div v-show="!collapsed" class="panel-content">
        <!-- Loading State -->
        <div v-if="loading" class="loading-container">
          <el-skeleton :rows="3" animated />
        </div>

        <!-- Error State -->
        <el-empty v-else-if="error" :description="error" :image-size="60" />

        <!-- Price Statistics -->
        <div v-else-if="priceData" class="price-content">
          <!-- Statistics Cards -->
          <div class="statistics-grid">
            <div class="stat-card">
              <div class="stat-label">报价次数</div>
              <div class="stat-value">{{ priceData.statistics?.quoteCount || 0 }}次</div>
            </div>
            <div class="stat-card highlight">
              <div class="stat-label">最低价</div>
              <div class="stat-value">¥{{ priceData.statistics?.minPrice || '-' }}</div>
              <div v-if="priceData.statistics?.minSupplier" class="stat-sub">
                {{ priceData.statistics.minSupplier }}
              </div>
            </div>
            <div class="stat-card">
              <div class="stat-label">平均价</div>
              <div class="stat-value">¥{{ priceData.statistics?.avgPrice || '-' }}</div>
            </div>
            <div class="stat-card">
              <div class="stat-label">最高价</div>
              <div class="stat-value">¥{{ priceData.statistics?.maxPrice || '-' }}</div>
            </div>
          </div>

          <!-- Recent Quotes -->
          <div v-if="priceData.recentQuotes && priceData.recentQuotes.length > 0" class="recent-quotes">
            <div class="section-title">最近报价</div>
            <div class="quote-list">
              <div
                v-for="(quote, idx) in priceData.recentQuotes.slice(0, 5)"
                :key="idx"
                class="quote-item"
              >
                <div class="quote-main">
                  <span class="quote-supplier">{{ quote.supplier }}</span>
                  <span class="quote-price" :class="{ 'is-lowest': quote.isLowest }">
                    ¥{{ quote.price }}
                  </span>
                </div>
                <div class="quote-meta">
                  <span class="quote-date">{{ formatDate(quote.date) }}</span>
                  <span v-if="quote.project" class="quote-project">{{ quote.project }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Supplier Ranking -->
          <div v-if="priceData.supplierRanking && priceData.supplierRanking.length > 0" class="supplier-ranking">
            <div class="section-title">供应商排名</div>
            <div class="ranking-list">
              <div
                v-for="(item, idx) in priceData.supplierRanking.slice(0, 3)"
                :key="idx"
                class="ranking-item"
              >
                <span class="ranking-rank">{{ idx + 1 }}</span>
                <span class="ranking-name">{{ item.supplier }}</span>
                <span class="ranking-price">¥{{ item.avgPrice }}</span>
                <span class="ranking-count">{{ item.count }}次</span>
              </div>
            </div>
          </div>

          <!-- View More Link -->
          <div class="panel-footer">
            <el-button type="primary" link size="small" @click="goToPriceQuery">
              查看全部价格
            </el-button>
          </div>
        </div>

        <!-- No Data State -->
        <el-empty v-else description="暂无历史价格数据" :image-size="60" />
      </div>
    </el-collapse-transition>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Clock, ArrowDown } from '@element-plus/icons-vue'
import { priceQueryApi } from '@/api/price-query'

interface PriceStatistics {
  quoteCount: number
  minPrice: number
  maxPrice: number
  avgPrice: number
  minSupplier?: string
}

interface RecentQuote {
  supplier: string
  price: number
  date: string
  project?: string
  isLowest?: boolean
}

interface SupplierRanking {
  supplier: string
  avgPrice: number
  count: number
}

interface PriceData {
  statistics: PriceStatistics
  recentQuotes: RecentQuote[]
  supplierRanking: SupplierRanking[]
}

interface Props {
  itemId: string
  projectId?: string
  mode?: 'consult' | 'bid'
}

const props = withDefaults(defineProps<Props>(), {
  mode: 'consult'
})

const router = useRouter()
const collapsed = ref(false)
const loading = ref(false)
const error = ref('')
const priceData = ref<PriceData | null>(null)

async function fetchPriceHistory() {
  if (!props.itemId) return

  loading.value = true
  error.value = ''

  try {
    // Use existing price trends API
    const result = await priceQueryApi.getPriceTrends(props.itemId)

    // Process the data
    const quotes = result.trends || []
    const prices = quotes.map((q: any) => q.price)
    const minPrice = prices.length > 0 ? Math.min(...prices) : 0
    const maxPrice = prices.length > 0 ? Math.max(...prices) : 0
    const avgPrice = prices.length > 0
      ? Math.round((prices.reduce((a: number, b: number) => a + b, 0) / prices.length) * 100) / 100
      : 0

    // Group by supplier
    const supplierMap = new Map<string, { prices: number[]; count: number }>()
    quotes.forEach((q: any) => {
      const supplier = q.supplier || '未知供应商'
      if (!supplierMap.has(supplier)) {
        supplierMap.set(supplier, { prices: [], count: 0 })
      }
      const data = supplierMap.get(supplier)!
      data.prices.push(q.price)
      data.count++
    })

    // Calculate supplier ranking
    const supplierRanking: SupplierRanking[] = Array.from(supplierMap.entries())
      .map(([supplier, data]) => ({
        supplier,
        avgPrice: Math.round((data.prices.reduce((a, b) => a + b, 0) / data.prices.length) * 100) / 100,
        count: data.count
      }))
      .sort((a, b) => a.avgPrice - b.avgPrice)

    // Build recent quotes with isLowest flag
    const recentQuotes: RecentQuote[] = quotes
      .slice(0, 10)
      .map((q: any) => ({
        supplier: q.supplier || '未知供应商',
        price: q.price,
        date: q.date,
        project: q.project,
        isLowest: q.price === minPrice
      }))

    priceData.value = {
      statistics: {
        quoteCount: quotes.length,
        minPrice,
        maxPrice,
        avgPrice,
        minSupplier: quotes.find((q: any) => q.price === minPrice)?.supplier
      },
      recentQuotes,
      supplierRanking
    }
  } catch (err: any) {
    error.value = err.message || '加载失败'
  } finally {
    loading.value = false
  }
}

function formatDate(dateStr: string) {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' })
}

function goToPriceQuery() {
  router.push({ name: 'PriceQuery' })
}

watch(() => props.itemId, () => {
  fetchPriceHistory()
}, { immediate: true })

onMounted(() => {
  if (props.itemId) {
    fetchPriceHistory()
  }
})
</script>

<style scoped>
.price-history-panel {
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  overflow: hidden;
  background: #fff;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: #f5f7fa;
  cursor: pointer;
  user-select: none;
}

.panel-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 500;
  color: #303133;
}

.collapse-icon {
  transition: transform 0.3s;
}

.collapse-icon.collapsed {
  transform: rotate(-90deg);
}

.panel-content {
  padding: 16px;
}

.loading-container {
  padding: 16px 0;
}

.price-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* Statistics Grid */
.statistics-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
}

.stat-card {
  padding: 12px;
  background: #f5f7fa;
  border-radius: 4px;
  text-align: center;
}

.stat-card.highlight {
  background: #ecf5ff;
  border: 1px solid #b3d8ff;
}

.stat-label {
  font-size: 12px;
  color: #909399;
  margin-bottom: 4px;
}

.stat-value {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.stat-sub {
  font-size: 11px;
  color: #409eff;
  margin-top: 2px;
}

/* Section Title */
.section-title {
  font-size: 13px;
  font-weight: 500;
  color: #606266;
  margin-bottom: 8px;
}

/* Recent Quotes */
.recent-quotes {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.quote-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.quote-item {
  padding: 8px 12px;
  background: #fafafa;
  border-radius: 4px;
  border-left: 3px solid transparent;
}

.quote-item:hover {
  background: #f0f0f0;
}

.quote-main {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.quote-supplier {
  font-size: 13px;
  color: #303133;
}

.quote-price {
  font-size: 14px;
  font-weight: 600;
  color: #606266;
}

.quote-price.is-lowest {
  color: #67c23a;
}

.quote-meta {
  display: flex;
  gap: 12px;
  font-size: 12px;
  color: #909399;
}

/* Supplier Ranking */
.supplier-ranking {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.ranking-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.ranking-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 0;
}

.ranking-rank {
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #e4e7ed;
  border-radius: 50%;
  font-size: 11px;
  font-weight: 600;
  color: #606266;
}

.ranking-item:nth-child(1) .ranking-rank {
  background: #fff7e6;
  color: #e6a23c;
}

.ranking-item:nth-child(2) .ranking-rank {
  background: #f4f4f4;
  color: #909399;
}

.ranking-item:nth-child(3) .ranking-rank {
  background: #fafafa;
  color: #c0c4cc;
}

.ranking-name {
  flex: 1;
  font-size: 13px;
  color: #303133;
}

.ranking-price {
  font-size: 13px;
  font-weight: 600;
  color: #409eff;
}

.ranking-count {
  font-size: 12px;
  color: #909399;
}

/* Panel Footer */
.panel-footer {
  display: flex;
  justify-content: center;
  padding-top: 8px;
  border-top: 1px solid #e4e7ed;
}
</style>
