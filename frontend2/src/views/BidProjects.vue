<template>
  <div class="bid-projects-container page-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>中标项目</span>
          <div class="header-actions">
            <el-button type="success" :icon="Download" @click="handleExport" :loading="exporting">
              导出Excel
            </el-button>
            <el-button type="primary" :icon="Plus" @click="handleCreate">
              新建项目
            </el-button>
          </div>
        </div>
      </template>

      <!-- Filter -->
      <el-row :gutter="20" class="mb-16">
        <el-col :span="6">
          <el-select v-model="filterStatus" placeholder="项目状态" clearable @change="loadProjects">
            <el-option label="全部状态" :value="null" />
            <el-option label="准备中" value="preparing" />
            <el-option label="进行中" value="in_progress" />
            <el-option label="已验收" value="accepted" />
            <el-option label="已结案" value="completed" />
          </el-select>
        </el-col>
        <el-col :span="12">
          <el-input
            v-model="searchQuery"
            placeholder="搜索项目名称、客户名称"
            :prefix-icon="Search"
            clearable
            @input="handleSearch"
          >
            <template #append>
              <el-button :icon="Filter" @click="showAdvancedSearch = true">高级搜索</el-button>
            </template>
          </el-input>
        </el-col>
      </el-row>

      <!-- Table -->
      <el-table
        v-loading="loading"
        :data="projects"
        style="width: 100%"
        @sort-change="handleSortChange"
      >
        <el-table-column prop="name" label="项目名称" min-width="180" sortable="custom" />
        <el-table-column prop="projectCode" label="项目编号" width="140" sortable="custom" />
        <el-table-column prop="customer" label="客户" width="120" sortable="custom" />
        <el-table-column prop="contractDate" label="合同日期" width="110" sortable="custom" />
        <el-table-column prop="totalAmount" label="项目金额" width="120" align="right" sortable="custom">
          <template #default="{ row }">
            ¥{{ formatAmount(row.totalAmount) }}
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="90" align="center" sortable="custom">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)" size="small">
              {{ getStatusLabel(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="handleView(row)">
              查看
            </el-button>
            <el-button link size="small" @click="handleEdit(row)">
              编辑
            </el-button>
            <el-button type="danger" link size="small" @click="handleDelete(row)">
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- Pagination -->
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.limit"
          :page-sizes="[10, 20, 50, 100]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handlePageChange"
          @current-change="handlePageChange"
        />
      </div>
    </el-card>

    <!-- Create/Edit Project Dialog -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogMode === 'create' ? '新建中标项目' : '编辑中标项目'"
      width="600px"
    >
      <el-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        label-width="100px"
      >
        <el-form-item label="项目名称" prop="name">
          <el-input v-model="formData.name" placeholder="请输入项目名称" />
        </el-form-item>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="项目编号" prop="projectCode">
              <el-input v-model="formData.projectCode" placeholder="请输入项目编号" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="客户" prop="customer">
              <el-input v-model="formData.customer" placeholder="请输入客户" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="项目地址" prop="address">
          <el-input v-model="formData.address" placeholder="请输入项目地址" />
        </el-form-item>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="合同日期">
              <el-date-picker
                v-model="formData.contractDate"
                type="date"
                placeholder="选择日期"
                style="width: 100%"
                value-format="YYYY-MM-DD"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="合同金额">
              <el-input-number
                v-model="formData.contractAmount"
                :min="0"
                :precision="2"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="项目状态">
              <el-select v-model="formData.status" placeholder="选择状态" style="width: 100%">
                <el-option label="准备中" value="preparing" />
                <el-option label="进行中" value="in_progress" />
                <el-option label="已验收" value="accepted" />
                <el-option label="已结案" value="completed" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="备注">
          <el-input v-model="formData.remarks" type="textarea" :rows="3" placeholder="请输入备注" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="submitting">
          保存
        </el-button>
      </template>
    </el-dialog>

    <!-- Advanced Search Dialog -->
    <AdvancedSearchDialog
      v-model="showAdvancedSearch"
      :search-fields="[
        { label: '项目名称', value: 'name', type: 'string' },
        { label: '项目编号', value: 'projectCode', type: 'string' },
        { label: '客户', value: 'customer', type: 'string' },
        { label: '合同金额', value: 'contractAmount', type: 'number' },
        { label: '项目金额', value: 'totalAmount', type: 'number' },
      ]"
      :status-options="[
        { label: '准备中', value: 'preparing' },
        { label: '进行中', value: 'in_progress' },
        { label: '已验收', value: 'accepted' },
        { label: '已结案', value: 'completed' },
      ]"
      @search="handleAdvancedSearch"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onActivated } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import { Plus, Search, Filter, Download } from '@element-plus/icons-vue'
import { bidProjectApi, type AdvancedSearchDto } from '@/api/project'
import type { BidProject } from '@/types'
import AdvancedSearchDialog from '@/components/AdvancedSearchDialog.vue'

const router = useRouter()
const loading = ref(false)
const projects = ref<BidProject[]>([])
const searchQuery = ref('')
const filterStatus = ref<string | null>(null)
const pagination = ref({
  page: 1,
  limit: 10,
  total: 0,
})
const sortState = ref({
  sortBy: '',
  sortOrder: '' as 'asc' | 'desc' | '',
})

// Dialog state
const dialogVisible = ref(false)
const dialogMode = ref<'create' | 'edit'>('create')
const submitting = ref(false)
const formRef = ref<FormInstance>()
const currentProjectId = ref<string | null>(null)
const showAdvancedSearch = ref(false)
const exporting = ref(false)

// Form data
const formData = reactive({
  name: '',
  projectCode: '',
  customer: '',
  address: '',
  contractDate: '',
  contractAmount: 0,
  status: 'preparing',
  remarks: '',
})

// Form validation rules
const formRules: FormRules = {
  name: [
    { required: true, message: '请输入项目名称', trigger: 'blur' },
  ],
  projectCode: [
    { required: true, message: '请输入项目编号', trigger: 'blur' },
  ],
  customer: [
    { required: true, message: '请输入客户', trigger: 'blur' },
  ],
}

async function loadProjects() {
  loading.value = true
  try {
    const result = await bidProjectApi.getList({
      page: pagination.value.page,
      limit: pagination.value.limit,
      sortBy: sortState.value.sortBy || undefined,
      sortOrder: sortState.value.sortOrder || undefined,
    })

    // Handle both array and wrapped response formats
    let data = Array.isArray(result) ? result : (result.data || [])

    // Filter by status
    let filtered = data
    if (filterStatus.value) {
      filtered = filtered.filter(p => p.status === filterStatus.value)
    }
    // Filter by search query
    if (searchQuery.value) {
      const query = searchQuery.value.toLowerCase()
      filtered = filtered.filter(p =>
        p.name?.toLowerCase().includes(query) ||
        p.customer?.toLowerCase().includes(query)
      )
    }
    projects.value = filtered
    // Use filtered length when filters are active, otherwise use result total
    pagination.value.total = filterStatus.value || searchQuery.value
      ? filtered.length
      : (Array.isArray(result) ? result.length : (result.pagination?.total || result.total || 0))
  } catch (error) {
    // Error handled by interceptor
  } finally {
    loading.value = false
  }
}

function handlePageChange() {
  loadProjects()
}

function handleSearch() {
  loadProjects()
}

function handleSortChange({ prop, order }: { prop?: string; order?: string | null }) {
  if (!prop || !order) {
    sortState.value.sortBy = ''
    sortState.value.sortOrder = ''
  } else {
    sortState.value.sortBy = prop
    sortState.value.sortOrder = order === 'ascending' ? 'asc' : 'desc'
  }
  loadProjects()
}

function handleAdvancedSearch(searchDto: AdvancedSearchDto) {
  loading.value = true
  bidProjectApi.advancedSearch(searchDto, {
    page: pagination.value.page,
    limit: pagination.value.limit,
    sortBy: sortState.value.sortBy || undefined,
    sortOrder: sortState.value.sortOrder || undefined,
  })
    .then((result) => {
      projects.value = result.data || []
      pagination.value.total = result.pagination?.total || result.total || 0
    })
    .catch(() => {
      // Error handled by interceptor
    })
    .finally(() => {
      loading.value = false
    })
}

function handleCreate() {
  dialogMode.value = 'create'
  resetForm()
  dialogVisible.value = true
}

async function handleExport() {
  try {
    exporting.value = true
    await bidProjectApi.export()
    ElMessage.success('导出成功')
  } catch (error) {
    // Error handled by interceptor
  } finally {
    exporting.value = false
  }
}

function handleView(row: BidProject) {
  router.push(`/bid-projects/${row.id}`)
}

function handleEdit(row: BidProject) {
  dialogMode.value = 'edit'
  currentProjectId.value = row.id
  // Populate form with existing data
  formData.name = row.name || ''
  formData.projectCode = row.projectCode || ''
  formData.customer = row.customer || ''
  formData.address = row.address || ''
  formData.contractDate = row.contractDate || ''
  formData.contractAmount = row.contractAmount || 0
  formData.status = row.status || 'preparing'
  formData.remarks = row.remarks || ''
  dialogVisible.value = true
}

function resetForm() {
  currentProjectId.value = null
  formData.name = ''
  formData.projectCode = ''
  formData.customer = ''
  formData.address = ''
  formData.contractDate = ''
  formData.contractAmount = 0
  formData.status = 'preparing'
  formData.remarks = ''
}

async function handleSubmit() {
  if (!formRef.value) return

  try {
    await formRef.value.validate()
    submitting.value = true

    if (dialogMode.value === 'create') {
      await bidProjectApi.create({
        name: formData.name,
        projectCode: formData.projectCode,
        customer: formData.customer,
        address: formData.address,
        contractDate: formData.contractDate,
        contractAmount: formData.contractAmount,
        status: formData.status,
        remarks: formData.remarks,
      })
      ElMessage.success('项目创建成功')
    } else {
      await bidProjectApi.update(currentProjectId.value!, {
        name: formData.name,
        projectCode: formData.projectCode,
        customer: formData.customer,
        address: formData.address,
        contractDate: formData.contractDate,
        contractAmount: formData.contractAmount,
        status: formData.status,
        remarks: formData.remarks,
      })
      ElMessage.success('项目更新成功')
    }

    dialogVisible.value = false
    loadProjects()
  } catch (error: any) {
    if (error !== false) {
      // Error handled by interceptor
    }
  } finally {
    submitting.value = false
  }
}

async function handleDelete(row: BidProject) {
  try {
    await ElMessageBox.confirm(`确定要删除项目"${row.name}"吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    })
    await bidProjectApi.delete(row.id)
    ElMessage.success('删除成功')
    loadProjects()
  } catch {
    // User cancelled
  }
}

function getStatusType(status: string) {
  const typeMap: Record<string, any> = {
    preparing: 'info',
    in_progress: 'primary',
    accepted: 'success',
    completed: '',
  }
  return typeMap[status] || ''
}

function getStatusLabel(status: string) {
  const labelMap: Record<string, string> = {
    preparing: '准备中',
    in_progress: '进行中',
    accepted: '已验收',
    completed: '已结案',
  }
  return labelMap[status] || status
}

function formatAmount(amount: number): string {
  return amount.toLocaleString()
}

onMounted(() => {
  loadProjects()
})

// Also load data when component is activated (handles route navigation back to this page)
onActivated(() => {
  loadProjects()
})
</script>

<style scoped>
.bid-projects-container {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-actions {
  display: flex;
  gap: 8px;
}
</style>
