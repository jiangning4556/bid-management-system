<template>
  <div class="dashboard-container" v-loading="loading">
    <el-row :gutter="20">
      <el-col :span="6">
        <el-card class="stat-card consult-card">
          <div class="stat-content">
            <div class="stat-icon">
              <el-icon :size="40"><Document /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.consultProjectCount }}</div>
              <div class="stat-label">咨询项目</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card bid-card">
          <div class="stat-content">
            <div class="stat-icon">
              <el-icon :size="40"><Select /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.bidProjectCount }}</div>
              <div class="stat-label">中标项目</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card supplier-card">
          <div class="stat-content">
            <div class="stat-icon">
              <el-icon :size="40"><OfficeBuilding /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.supplierCount }}</div>
              <div class="stat-label">供应商</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card item-card">
          <div class="stat-content">
            <div class="stat-icon">
              <el-icon :size="40"><Goods /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.itemCount || 0 }}</div>
              <div class="stat-label">物品数量</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="mt-20">
      <el-col :span="12">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>最近项目</span>
              <el-button type="primary" link @click="goToProjects">查看全部</el-button>
            </div>
          </template>
          <el-empty v-if="recentProjects.length === 0" description="暂无项目" />
          <el-table v-else :data="recentProjects" style="width: 100%">
            <el-table-column prop="name" label="项目名称" />
            <el-table-column prop="customer" label="客户" width="120" />
            <el-table-column prop="type" label="类型" width="80">
              <template #default="{ row }">
                <el-tag :type="row.type === 'bid' ? 'success' : 'primary'" size="small">
                  {{ row.type === 'bid' ? '中标' : '咨询' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="amount" label="金额" width="120">
              <template #default="{ row }">
                ¥{{ formatAmount(row.amount) }}
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>

      <el-col :span="12">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>快捷入口</span>
            </div>
          </template>
          <div class="quick-links">
            <el-button type="primary" :icon="Plus" @click="createConsultProject">
              新建咨询项目
            </el-button>
            <el-button type="success" :icon="Plus" @click="createBidProject">
              新建中标项目
            </el-button>
            <el-button type="warning" :icon="Plus" @click="addSupplier">
              添加供应商
            </el-button>
            <el-button :icon="Plus" @click="addItem">
              添加物品
            </el-button>
          </div>

          <el-divider />

          <div class="tips">
            <h4>使用提示</h4>
            <ul>
              <li>在"咨询项目"中创建询价项目，添加多个供应商报价</li>
              <li>中标后可从咨询项目创建中标项目</li>
              <li>在"付款管理"中跟踪供应商付款和甲方收款</li>
              <li>使用"价格查询"快速查询历史报价信息</li>
            </ul>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Plus } from '@element-plus/icons-vue'
import { statisticsApi, type OverviewStats, type RecentProject } from '@/api/statistics'
import { itemApi } from '@/api/item'
import { supplierApi } from '@/api/supplier'

const router = useRouter()

const stats = ref<OverviewStats & { itemCount?: number; supplierCount?: number }>({
  consultProjectCount: 0,
  bidProjectCount: 0,
  supplierCount: 0,
  totalConsultAmount: 0,
  totalBidAmount: 0,
  totalPayable: 0,
  totalPaid: 0,
  totalReceived: 0,
  estimatedProfit: 0,
  itemCount: 0,
})

const recentProjects = ref<RecentProject[]>([])
const loading = ref(false)

onMounted(async () => {
  loading.value = true
  try {
    // Get items count and supplier count
    let itemCount = 0
    let supplierCount = 0

    try {
      const itemsResponse = await itemApi.getList()
      // Handle paginated response: { data: [...], total, page, limit }
      if (itemsResponse && typeof itemsResponse === 'object' && 'total' in itemsResponse) {
        itemCount = itemsResponse.total
      } else if (Array.isArray(itemsResponse)) {
        itemCount = itemsResponse.length
      }
    } catch (err) {
      console.error('Failed to load item count:', err)
    }

    try {
      const suppliersResponse = await supplierApi.getList()
      // Handle paginated response: { data: [...], total, page, limit }
      if (suppliersResponse && typeof suppliersResponse === 'object' && 'total' in suppliersResponse) {
        supplierCount = suppliersResponse.total
      } else if (Array.isArray(suppliersResponse)) {
        supplierCount = suppliersResponse.length
      }
    } catch (err) {
      console.error('Failed to load supplier count:', err)
    }

    const [overviewData, recentProjectsData] = await Promise.all([
      statisticsApi.getOverview(),
      statisticsApi.getRecentProjects(5)
    ])
    stats.value = {
      ...overviewData,
      itemCount,
      supplierCount,
    }
    recentProjects.value = recentProjectsData || []
  } catch (error) {
    console.error('Failed to load dashboard data:', error)
    recentProjects.value = []
  } finally {
    loading.value = false
  }
})

function formatAmount(amount: number | string | undefined | null): string {
  // Handle undefined, null, or empty string
  if (amount === undefined || amount === null || amount === '') {
    return '0'
  }
  // Convert string to number if needed
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount
  // Check if valid number
  if (isNaN(numAmount)) {
    return '0'
  }
  if (numAmount >= 10000) {
    return (numAmount / 10000).toFixed(1) + '万'
  }
  return numAmount.toLocaleString()
}

function goToProjects() {
  router.push('/consult-projects')
}

function createConsultProject() {
  router.push('/consult-projects')
}

function createBidProject() {
  router.push('/bid-projects')
}

function addSupplier() {
  router.push('/suppliers')
}

function addItem() {
  router.push('/items')
}
</script>

<style scoped>
.dashboard-container {
  padding: 20px;
}

.stat-card {
  cursor: pointer;
  transition: transform 0.3s, box-shadow 0.3s;
}

.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.stat-content {
  display: flex;
  align-items: center;
  gap: 16px;
}

.stat-icon {
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
}

.consult-card .stat-icon {
  background-color: #e3f2fd;
  color: #1976d2;
}

.bid-card .stat-icon {
  background-color: #e8f5e9;
  color: #388e3c;
}

.supplier-card .stat-icon {
  background-color: #fff3e0;
  color: #f57c00;
}

.item-card .stat-icon {
  background-color: #f3e5f5;
  color: #7b1fa2;
}

.stat-info {
  flex: 1;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  color: #333;
}

.stat-label {
  font-size: 14px;
  color: #999;
  margin-top: 4px;
}

.quick-links {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.tips {
  margin-top: 20px;
}

.tips h4 {
  margin: 0 0 12px 0;
  color: #333;
}

.tips ul {
  margin: 0;
  padding-left: 20px;
  color: #666;
  font-size: 14px;
}

.tips li {
  margin-bottom: 8px;
}
</style>
