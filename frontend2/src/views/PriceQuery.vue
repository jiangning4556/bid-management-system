<template>
  <div class="price-query-page page-container">
    <el-card>
      <template #header>
        <div class="page-header">
          <span>价格查询与分析</span>
        </div>
      </template>

      <!-- Query Mode Tabs -->
      <el-radio-group v-model="queryMode" class="query-mode-tabs" @change="handleModeChange">
        <el-radio-button value="item">按物品查询</el-radio-button>
        <el-radio-button value="supplier">按供应商查询</el-radio-button>
        <el-radio-button value="project">按项目查询</el-radio-button>
      </el-radio-group>

      <!-- Query by Item -->
      <div v-if="queryMode === 'item'" class="query-section">
        <el-row :gutter="20" class="mb-16">
          <el-col :span="10">
            <el-select
              v-model="selectedItemId"
              placeholder="选择物品"
              filterable
              clearable
              style="width: 100%"
              @change="handleItemChange"
            >
              <el-option
                v-for="item in allItems"
                :key="item.id"
                :label="`${item.name} ${item.spec ? `(${item.spec})` : ''}`"
                :value="item.id"
              />
            </el-select>
          </el-col>
          <el-col :span="8">
            <el-select v-model="dateRange" placeholder="日期范围" style="width: 100%" @change="handleItemChange">
              <el-option label="全部" value="" />
              <el-option label="最近7天" value="7" />
              <el-option label="最近30天" value="30" />
              <el-option label="最近90天" value="90" />
              <el-option label="最近半年" value="180" />
              <el-option label="最近一年" value="365" />
            </el-select>
          </el-col>
        </el-row>

        <!-- Item Statistics -->
        <div v-if="itemData && itemData.statistics" class="statistics-section">
          <el-row :gutter="16">
            <el-col :span="4">
              <el-statistic title="报价次数" :value="itemData.statistics.quoteCount" />
            </el-col>
            <el-col :span="5">
              <el-statistic title="最低价格" :value="itemData.statistics.minPrice" :precision="2" prefix="¥">
                <template #suffix>
                  <el-text v-if="itemData.statistics.minSupplier" type="info" size="small">
                    {{ itemData.statistics.minSupplier }}
                  </el-text>
                </template>
              </el-statistic>
            </el-col>
            <el-col :span="5">
              <el-statistic title="平均价格" :value="itemData.statistics.avgPrice" :precision="2" prefix="¥" />
            </el-col>
            <el-col :span="5">
              <el-statistic title="最高价格" :value="itemData.statistics.maxPrice" :precision="2" prefix="¥" />
            </el-col>
            <el-col :span="5">
              <el-statistic title="价格趋势">
                <template #default>
                  <el-tag v-if="priceTrend === 'up'" type="success" size="large">
                    <el-icon><TrendCharts /></el-icon> 上涨
                  </el-tag>
                  <el-tag v-else-if="priceTrend === 'down'" type="danger" size="large">
                    <el-icon><TrendCharts /></el-icon> 下跌
                  </el-tag>
                  <el-tag v-else type="info" size="large">平稳</el-tag>
                </template>
              </el-statistic>
            </el-col>
          </el-row>
        </div>

        <!-- Supplier Ranking -->
        <div v-if="itemData && itemData.supplierRanking && itemData.supplierRanking.length > 0" class="mt-20">
          <h3 class="section-title">供应商报价排名</h3>
          <el-table :data="itemData.supplierRanking" style="width: 100%">
            <el-table-column type="index" label="排名" width="60" />
            <el-table-column prop="supplier" label="供应商" min-width="150" />
            <el-table-column label="平均价格" width="120" align="right">
              <template #default="{ row }">
                <span class="price-text">¥{{ row.avgPrice }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="count" label="报价次数" width="100" align="center" />
            <el-table-column label="价格趋势" width="150">
              <template #default="{ row }">
                <div class="mini-trend">
                  <span v-for="i in 5" :key="i" class="trend-dot" :class="{ active: i <= row.trendLevel }" />
                </div>
              </template>
            </el-table-column>
          </el-table>
        </div>

        <!-- Quote History -->
        <div v-if="itemData && itemData.recentQuotes && itemData.recentQuotes.length > 0" class="mt-20">
          <div class="section-header">
            <h3 class="section-title">历史报价明细</h3>
            <el-button type="primary" link @click="exportItemData">导出Excel</el-button>
          </div>
          <el-table :data="paginatedQuotes" style="width: 100%">
            <el-table-column prop="supplier" label="供应商" width="150" />
            <el-table-column label="单价" width="100" align="right">
              <template #default="{ row }">
                <span :class="{ 'lowest-price': row.isLowest }">¥{{ row.price }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="date" label="报价日期" width="120">
              <template #default="{ row }">
                {{ formatDate(row.date) }}
              </template>
            </el-table-column>
            <el-table-column prop="project" label="所属项目" min-width="150" show-overflow-tooltip />
          </el-table>
          <el-pagination
            v-if="itemData.recentQuotes.length > pageSize"
            v-model:current-page="currentPage"
            :page-size="pageSize"
            :total="itemData.recentQuotes.length"
            layout="total, prev, pager, next"
            class="mt-16"
          />
        </div>
      </div>

      <!-- Query by Supplier -->
      <div v-else-if="queryMode === 'supplier'" class="query-section">
        <el-row :gutter="20" class="mb-16">
          <el-col :span="12">
            <el-select
              v-model="selectedSupplierId"
              placeholder="选择供应商"
              filterable
              clearable
              style="width: 100%"
              @change="handleSupplierChange"
            >
              <el-option
                v-for="supplier in allSuppliers"
                :key="supplier.id"
                :label="supplier.name"
                :value="supplier.id"
              />
            </el-select>
          </el-col>
        </el-row>

        <!-- Supplier Statistics -->
        <div v-if="supplierData" class="statistics-section">
          <el-row :gutter="16">
            <el-col :span="6">
              <el-statistic title="报价总数" :value="supplierData.totalQuotes || 0" />
            </el-col>
            <el-col :span="6">
              <el-statistic title="涉及物品" :value="supplierData.itemCount || 0" />
            </el-col>
            <el-col :span="6">
              <el-statistic title="中标次数" :value="supplierData.winCount || 0" />
            </el-col>
            <el-col :span="6">
              <el-statistic title="合作项目" :value="supplierData.projectCount || 0" />
            </el-col>
          </el-row>
        </div>

        <!-- Supplier Quotes -->
        <div v-if="supplierData && supplierData.quotes && supplierData.quotes.length > 0" class="mt-20">
          <h3 class="section-title">报价明细</h3>
          <el-table :data="supplierData.quotes" style="width: 100%">
            <el-table-column prop="item" label="物品" min-width="150" />
            <el-table-column label="单价" width="100" align="right">
              <template #default="{ row }">
                ¥{{ row.price }}
              </template>
            </el-table-column>
            <el-table-column prop="quantity" label="数量" width="80" align="right" />
            <el-table-column label="总金额" width="120" align="right">
              <template #default="{ row }">
                ¥{{ row.totalAmount?.toLocaleString() }}
              </template>
            </el-table-column>
            <el-table-column prop="project" label="所属项目" min-width="150" show-overflow-tooltip />
            <el-table-column prop="date" label="日期" width="120">
              <template #default="{ row }">
                {{ formatDate(row.date) }}
              </template>
            </el-table-column>
          </el-table>
        </div>
      </div>

      <!-- Query by Project -->
      <div v-else-if="queryMode === 'project'" class="query-section">
        <el-row :gutter="20" class="mb-16">
          <el-col :span="6">
            <el-radio-group v-model="projectType" @change="handleProjectTypeChange">
              <el-radio-button value="consult">咨询项目</el-radio-button>
              <el-radio-button value="bid">中标项目</el-radio-button>
            </el-radio-group>
          </el-col>
          <el-col :span="10">
            <el-select
              v-model="selectedProjectId"
              placeholder="选择项目"
              filterable
              clearable
              style="width: 100%"
              @change="handleProjectChange"
            >
              <el-option
                v-for="project in projectList"
                :key="project.id"
                :label="`${project.name} (${project.customer})`"
                :value="project.id"
              />
            </el-select>
          </el-col>
        </el-row>

        <!-- Project Items -->
        <div v-if="projectData && projectData.items && projectData.items.length > 0" class="mt-20">
          <div class="section-header">
            <h3 class="section-title">项目物品价格</h3>
            <div class="summary">
              <span>共 {{ projectData.items.length }} 个物品，总金额 ¥{{ projectData.totalAmount?.toLocaleString() }}</span>
            </div>
          </div>
          <el-table :data="projectData.items" style="width: 100%">
            <el-table-column prop="itemName" label="物品名称" min-width="150" />
            <el-table-column prop="quantity" label="数量" width="80" align="right" />
            <el-table-column label="价格信息" min-width="200">
              <template #default="{ row }">
                <div v-if="projectType === 'consult'">
                  <div v-if="row.consultQuotes && row.consultQuotes.length > 0" class="quote-summary">
                    最低: ¥{{ row.minPrice }} / 平均: ¥{{ row.avgPrice }}
                  </div>
                  <span v-else class="text-muted">暂无报价</span>
                </div>
                <div v-else>
                  <div v-if="row.bidSuppliers && row.bidSuppliers.length > 0" class="quote-summary">
                    中标: ¥{{ row.avgPrice }}
                  </div>
                  <span v-else class="text-muted">暂无中标供应商</span>
                </div>
              </template>
            </el-table-column>
            <el-table-column label="供应商/报价" min-width="300">
              <template #default="{ row }">
                <div v-if="projectType === 'consult' && row.consultQuotes">
                  <el-tag
                    v-for="(quote, idx) in row.consultQuotes.slice(0, 3)"
                    :key="idx"
                    size="small"
                    class="mr-4"
                  >
                    {{ quote.supplier?.name || quote.supplier }} ¥{{ quote.price }}
                  </el-tag>
                  <el-text v-if="row.consultQuotes.length > 3" type="info" size="small">
                    等{{ row.consultQuotes.length }}个
                  </el-text>
                </div>
                <div v-else-if="projectType === 'bid' && row.bidSuppliers">
                  <el-tag
                    v-for="(sup, idx) in row.bidSuppliers.slice(0, 3)"
                    :key="idx"
                    size="small"
                    class="mr-4"
                  >
                    {{ sup.supplier?.name || sup.supplier }} ¥{{ sup.price }}
                  </el-tag>
                  <el-text v-if="row.bidSuppliers.length > 3" type="info" size="small">
                    等{{ row.bidSuppliers.length }}个
                  </el-text>
                </div>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </div>

      <!-- Empty State -->
      <el-empty
        v-if="!selectedItemId && !selectedSupplierId && !selectedProjectId"
        description="请选择查询条件"
        :image-size="120"
      />
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { TrendCharts } from '@element-plus/icons-vue'
import { priceQueryApi } from '@/api/price-query'
import { consultProjectApi, bidProjectApi } from '@/api/project'
import { itemApi } from '@/api/item'
import { supplierApi } from '@/api/supplier'

// Query modes
type QueryMode = 'item' | 'supplier' | 'project'
const queryMode = ref<QueryMode>('item')

// Item query
const selectedItemId = ref('')
const dateRange = ref('')
const itemData = ref<any>(null)
const allItems = ref<any[]>([])
const currentPage = ref(1)
const pageSize = ref(10)

const priceTrend = computed(() => {
  if (!itemData.value || !itemData.value.recentQuotes || itemData.value.recentQuotes.length < 2) {
    return 'stable'
  }
  const quotes = itemData.value.recentQuotes
  const recent = quotes[0]?.price || 0
  const older = quotes[quotes.length - 1]?.price || 0
  if (recent > older * 1.05) return 'up'
  if (recent < older * 0.95) return 'down'
  return 'stable'
})

const paginatedQuotes = computed(() => {
  if (!itemData.value || !itemData.value.recentQuotes) return []
  const start = (currentPage.value - 1) * pageSize.value
  return itemData.value.recentQuotes.slice(start, start + pageSize.value)
})

// Supplier query
const selectedSupplierId = ref('')
const supplierData = ref<any>(null)
const allSuppliers = ref<any[]>([])

// Project query
const projectType = ref<'consult' | 'bid'>('consult')
const selectedProjectId = ref('')
const projectData = ref<any>(null)
const projectList = ref<any[]>([])

async function loadItems() {
  try {
    const result = await itemApi.getList({ limit: 100 })
    // Items API returns direct array
    allItems.value = Array.isArray(result) ? result : []
  } catch (error) {
    console.error('Failed to load items:', error)
  }
}

async function loadSuppliers() {
  try {
    const result: any = await supplierApi.getList({ limit: 100 })
    console.log('Suppliers API result:', result)

    // Handle different response formats
    let suppliers: any[] = []
    if (Array.isArray(result)) {
      // Direct array response
      suppliers = result
    } else if (result && typeof result === 'object') {
      if (Array.isArray(result.data)) {
        // Paginated response { data: [...], ... }
        suppliers = result.data
      } else if (Array.isArray(result.results)) {
        // Alternative paginated format
        suppliers = result.results
      }
    }

    // Ensure each supplier has required fields
    allSuppliers.value = suppliers.filter((s: any) => s && s.id).map((s: any) => ({
      id: s.id,
      name: s.name || '未命名',
    }))

    console.log('Processed suppliers:', allSuppliers.value)
  } catch (error) {
    console.error('Failed to load suppliers:', error)
    allSuppliers.value = []
  }
}

async function loadProjects() {
  try {
    let projects: any[] = []

    if (projectType.value === 'consult') {
      const result: any = await consultProjectApi.getList({ limit: 100 })
      if (Array.isArray(result?.data)) {
        projects = result.data
      } else if (Array.isArray(result)) {
        projects = result
      }
    } else {
      const result: any = await bidProjectApi.getList({ limit: 100 })
      if (Array.isArray(result?.data)) {
        projects = result.data
      } else if (Array.isArray(result)) {
        projects = result
      }
    }

    // Ensure each project has required fields
    projectList.value = projects.filter((p: any) => p && p.id).map((p: any) => ({
      id: p.id,
      name: p.name || '未命名',
      customer: p.customer || '',
    }))
  } catch (error) {
    console.error('Failed to load projects:', error)
    projectList.value = []
  }
}

async function handleItemChange() {
  if (!selectedItemId.value) {
    itemData.value = null
    return
  }

  try {
    const result = await priceQueryApi.getPriceTrends(selectedItemId.value)
    const quotes = result.trends || []
    const prices = quotes.map((q: any) => q.price)

    // Group by supplier
    const supplierMap = new Map<string, { prices: number[]; dates: Date[] }>()
    quotes.forEach((q: any) => {
      const supplier = q.supplier || '未知供应商'
      if (!supplierMap.has(supplier)) {
        supplierMap.set(supplier, { prices: [], dates: [] })
      }
      const data = supplierMap.get(supplier)!
      data.prices.push(q.price)
      data.dates.push(new Date(q.date))
    })

    // Build supplier ranking
    const supplierRanking = Array.from(supplierMap.entries())
      .map(([supplier, data]) => {
        // Calculate trend level (1-5 stars based on recency and price)
        const avgPrice = data.prices.reduce((a, b) => a + b, 0) / data.prices.length
        const sortedPrices = data.prices.sort((a, b) => b - a)
        // More recent and lower prices get higher rating
        const recencyFactor = Math.min(data.dates.length / 10, 1)
        const priceFactor = sortedPrices.indexOf(Math.min(...data.prices)) === 0 ? 1 : 0.5
        return {
          supplier,
          avgPrice: Math.round(avgPrice * 100) / 100,
          count: data.prices.length,
          trendLevel: Math.ceil((recencyFactor + priceFactor) * 2.5)
        }
      })
      .sort((a, b) => a.avgPrice - b.avgPrice)

    // Build recent quotes
    const recentQuotes = quotes.map((q: any) => {
      const minPrice = Math.min(...prices)
      return {
        supplier: q.supplier || '未知供应商',
        price: q.price,
        date: q.createdAt || new Date(),
        project: q.project,
        isLowest: q.price === minPrice
      }
    })

    itemData.value = {
      statistics: {
        quoteCount: quotes.length,
        minPrice: prices.length > 0 ? Math.min(...prices) : 0,
        maxPrice: prices.length > 0 ? Math.max(...prices) : 0,
        avgPrice: prices.length > 0
          ? Math.round((prices.reduce((a, b) => a + b, 0) / prices.length) * 100) / 100
          : 0,
        minSupplier: quotes.find((q: any) => q.price === Math.min(...prices))?.supplier
      },
      supplierRanking,
      recentQuotes
    }
  } catch (error) {
    console.error('Failed to fetch item data:', error)
    ElMessage.error('加载物品数据失败')
  }
}

async function handleSupplierChange() {
  if (!selectedSupplierId.value) {
    supplierData.value = null
    return
  }

  try {
    const result: any = await priceQueryApi.searchBySupplier(selectedSupplierId.value)

    // Handle new backend response format with statistics and quotes
    if (result?.statistics && result?.quotes) {
      supplierData.value = {
        totalQuotes: result.statistics.totalQuotes || 0,
        itemCount: result.statistics.itemCount || 0,
        winCount: result.statistics.winCount || 0,
        projectCount: result.statistics.projectCount || 0,
        quotes: result.quotes || []
      }
      return
    }

    // Fallback for old response format or empty result
    if (!result || typeof result !== 'object') {
      console.warn('No data found for supplier')
      supplierData.value = { totalQuotes: 0, itemCount: 0, winCount: 0, projectCount: 0, quotes: [] }
      return
    }

    // Legacy format handling
    const consultQuotes: any[] = Array.isArray(result.consultQuotes)
      ? result.consultQuotes
          .filter((q: any) => q != null)
          .map((q: any) => ({
            item: q.item || '',
            price: Number(q.price) || 0,
            quantity: Number(q.quantity) || 0,
            totalAmount: Number(q.totalAmount) || 0,
            project: q.project || '',
            date: q.projectDate || null,
          }))
      : []

    const bidSuppliers: any[] = Array.isArray(result.bidSuppliers)
      ? result.bidSuppliers
          .filter((b: any) => b != null)
          .map((b: any) => ({
            item: b.item || '',
            price: Number(b.price) || 0,
            quantity: Number(b.quantity) || 0,
            totalAmount: Number(b.amount) || 0,
            project: b.project || '',
            date: b.projectDate || null,
          }))
      : []

    const allQuotes = [...consultQuotes, ...bidSuppliers]

    const items = new Set<string>()
    const projects = new Set<string>()

    allQuotes.forEach((q: any) => {
      if (q.item) items.add(q.item)
      if (q.project) projects.add(q.project)
    })

    supplierData.value = {
      totalQuotes: allQuotes.length,
      itemCount: items.size,
      winCount: bidSuppliers.length,
      projectCount: projects.size,
      quotes: allQuotes
    }
  } catch (error: any) {
    console.error('Failed to fetch supplier data:', error)
    supplierData.value = { totalQuotes: 0, itemCount: 0, winCount: 0, projectCount: 0, quotes: [] }
    ElMessage.error(error.message || '加载供应商数据失败')
  }
}

async function handleProjectTypeChange() {
  selectedProjectId.value = ''
  projectData.value = null
  await loadProjects()
}

async function handleProjectChange() {
  if (!selectedProjectId.value) {
    projectData.value = null
    return
  }

  try {
    if (projectType.value === 'consult') {
      const project = await consultProjectApi.getById(selectedProjectId.value)
      const items = (project.projectItems || []).map((item: any) => {
        const quotes = item.quotes || []
        const prices = quotes.map((q: any) => q.price)
        return {
          itemName: item.item?.name,
          quantity: item.quantity,
          consultQuotes: quotes,
          minPrice: prices.length > 0 ? Math.min(...prices) : 0,
          avgPrice: prices.length > 0 ? Math.round((prices.reduce((a, b) => a + b, 0) / prices.length) * 100) / 100 : 0
        }
      })

      // Calculate total amount (sum of lowest quotes)
      const totalAmount = items.reduce((sum: number, item: any) => {
        return sum + (item.minPrice * item.quantity || 0)
      }, 0)

      projectData.value = {
        items,
        totalAmount
      }
    } else {
      const project = await bidProjectApi.getById(selectedProjectId.value)
      const items = (project.projectItems || []).map((item: any) => {
        const suppliers = item.suppliers || []
        const prices = suppliers.map((s: any) => s.price)
        return {
          itemName: item.item?.name,
          quantity: item.quantity,
          bidSuppliers: suppliers,
          avgPrice: prices.length > 0 ? Math.round((prices.reduce((a, b) => a + b, 0) / prices.length) * 100) / 100 : 0
        }
      })

      // Calculate total amount (sum of selected suppliers)
      const totalAmount = items.reduce((sum: number, item: any) => {
        const selectedSuppliers = item.bidSuppliers.filter((s: any) => s.isSelected)
        return sum + selectedSuppliers.reduce((sSum: number, s: any) => sSum + (s.amount || 0), 0)
      }, 0)

      projectData.value = {
        items,
        totalAmount
      }
    }
  } catch (error) {
    console.error('Failed to fetch project data:', error)
    ElMessage.error('加载项目数据失败')
  }
}

async function handleModeChange() {
  selectedItemId.value = ''
  selectedSupplierId.value = ''
  selectedProjectId.value = ''
  itemData.value = null
  supplierData.value = null
  projectData.value = null
  currentPage.value = 1

  // Load projects when switching to project mode
  if (queryMode.value === 'project' && projectList.value.length === 0) {
    await loadProjects()
  }
}

function formatDate(dateStr: string) {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleDateString('zh-CN')
}

function exportItemData() {
  ElMessage.info('导出功能开发中...')
}

onMounted(async () => {
  await Promise.all([loadItems(), loadSuppliers()])
})
</script>

<style scoped>
.price-query-page {
  padding: 20px;
}

.page-header {
  font-size: 16px;
  font-weight: 500;
}

.query-mode-tabs {
  margin-bottom: 20px;
}

.query-section {
  min-height: 400px;
}

.mb-16 {
  margin-bottom: 16px;
}

.mt-20 {
  margin-top: 20px;
}

.section-title {
  font-size: 14px;
  font-weight: 500;
  color: #303133;
  margin-bottom: 12px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.summary {
  font-size: 13px;
  color: #606266;
}

/* Statistics */
.statistics-section {
  padding: 16px;
  background: #f5f7fa;
  border-radius: 4px;
  margin-bottom: 16px;
}

/* Price styling */
.price-text {
  color: #409eff;
  font-weight: 600;
}

.lowest-price {
  color: #67c23a;
  font-weight: 600;
}

.text-muted {
  color: #909399;
}

.mr-4 {
  margin-right: 4px;
}

/* Trend dots */
.mini-trend {
  display: flex;
  gap: 3px;
}

.trend-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #e4e7ed;
}

.trend-dot.active {
  background: #67c23a;
}
</style>
