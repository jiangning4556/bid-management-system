<template>
  <div class="consult-projects-container page-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>咨询项目</span>
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
            <el-option label="咨询中" value="consulting" />
            <el-option label="已报价" value="quoted" />
            <el-option label="已暂停" value="paused" />
            <el-option label="已取消" value="cancelled" />
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
        <el-table-column prop="consultDate" label="咨询日期" width="110" sortable="custom" />
        <el-table-column prop="status" label="状态" width="90" align="center" sortable="custom">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)" size="small">
              {{ getStatusLabel(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="总金额" width="140" align="right" sortable="custom">
          <template #default="{ row }">
            <span>¥{{ formatAmount(row.totalAmount) }}</span>
            <el-tooltip effect="dark" placement="top">
              <template #content>
                <div>总金额 = 物品的最低报价（单价×数量）之和</div>
                <div>对每个物品，取各供应商报价中的最低价累加</div>
              </template>
              <el-icon class="ml-5" :size="14" style="vertical-align: middle; cursor: help;">
                <InfoFilled />
              </el-icon>
            </el-tooltip>
          </template>
        </el-table-column>
        <el-table-column label="中标状态" width="120" align="center">
          <template #default="{ row }">
            <el-tag :type="row.hasBidProject ? 'success' : 'info'" size="small">
              {{ row.hasBidProject ? '已中标' : '未中标' }}
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

    <!-- Create/Edit Dialog -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="700px"
    >
      <el-form
        ref="formRef"
        :model="formData"
        :rules="rules"
        label-width="100px"
      >
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="项目名称" prop="name">
              <el-input v-model="formData.name" placeholder="请输入项目名称" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="项目编号">
              <el-input v-model="formData.projectCode" placeholder="请输入项目编号" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="客户名称" prop="customer">
              <el-input v-model="formData.customer" placeholder="请输入客户名称" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="咨询日期">
              <el-date-picker
                v-model="formData.consultDate"
                type="date"
                placeholder="选择日期"
                style="width: 100%"
                value-format="YYYY-MM-DD"
              />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="项目地址">
          <el-input v-model="formData.address" placeholder="请输入项目地址" />
        </el-form-item>
        <el-form-item label="项目状态">
          <el-select v-model="formData.status" placeholder="请选择状态" style="width: 200px">
            <el-option label="咨询中" value="consulting" />
            <el-option label="已报价" value="quoted" />
            <el-option label="已暂停" value="paused" />
            <el-option label="已取消" value="cancelled" />
          </el-select>
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="formData.remarks" type="textarea" :rows="3" placeholder="请输入备注" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="submitting">
          确定
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
        { label: '总金额', value: 'totalAmount', type: 'number' },
      ]"
      :status-options="[
        { label: '咨询中', value: 'consulting' },
        { label: '已报价', value: 'quoted' },
        { label: '已暂停', value: 'paused' },
        { label: '已取消', value: 'cancelled' },
      ]"
      @search="handleAdvancedSearch"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onActivated } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import { Plus, Search, Filter, Download, InfoFilled } from '@element-plus/icons-vue'
import { consultProjectApi, type AdvancedSearchDto } from '@/api/project'
import type { ConsultProject } from '@/types'
import AdvancedSearchDialog from '@/components/AdvancedSearchDialog.vue'

const router = useRouter()
const loading = ref(false)
const projects = ref<ConsultProject[]>([])
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

const dialogVisible = ref(false)
const dialogTitle = ref('新建咨询项目')
const submitting = ref(false)
const formRef = ref<FormInstance>()
const editId = ref<string | null>(null)
const showAdvancedSearch = ref(false)
const exporting = ref(false)

const formData = reactive({
  name: '',
  projectCode: '',
  customer: '',
  address: '',
  consultDate: '',
  status: 'consulting',
  remarks: '',
})

const rules: FormRules = {
  name: [
    { required: true, message: '请输入项目名称', trigger: 'blur' },
  ],
}

async function loadProjects() {
  loading.value = true
  try {
    const result = await consultProjectApi.getList({
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

async function handleAdvancedSearch(searchDto: AdvancedSearchDto) {
  loading.value = true
  try {
    const result = await consultProjectApi.advancedSearch(searchDto, {
      page: pagination.value.page,
      limit: pagination.value.limit,
      sortBy: sortState.value.sortBy || undefined,
      sortOrder: sortState.value.sortOrder || undefined,
    })
    projects.value = result.data || []
    pagination.value.total = result.pagination?.total || result.total || 0
  } catch {
    // Error handled by interceptor
  } finally {
    loading.value = false
  }
}

function handleCreate() {
  dialogTitle.value = '新建咨询项目'
  editId.value = null
  Object.assign(formData, {
    name: '',
    projectCode: '',
    customer: '',
    address: '',
    consultDate: '',
    status: 'consulting',
    remarks: '',
  })
  dialogVisible.value = true
}

async function handleExport() {
  try {
    exporting.value = true
    await consultProjectApi.export()
    ElMessage.success('导出成功')
  } catch (error) {
    // Error handled by interceptor
  } finally {
    exporting.value = false
  }
}

function handleView(row: ConsultProject) {
  router.push(`/consult-projects/${row.id}`)
}

function handleEdit(row: ConsultProject) {
  dialogTitle.value = '编辑咨询项目'
  editId.value = row.id
  Object.assign(formData, {
    name: row.name,
    projectCode: row.projectCode || '',
    customer: row.customer || '',
    address: row.address || '',
    consultDate: row.consultDate || '',
    status: row.status,
    remarks: row.remarks || '',
  })
  dialogVisible.value = true
}

async function handleDelete(row: ConsultProject) {
  try {
    await ElMessageBox.confirm(`确定要删除项目"${row.name}"吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    })
    await consultProjectApi.delete(row.id)
    ElMessage.success('删除成功')
    loadProjects()
  } catch {
    // User cancelled
  }
}

async function handleSubmit() {
  if (!formRef.value) return

  await formRef.value.validate(async (valid) => {
    if (!valid) return

    submitting.value = true
    try {
      if (editId.value) {
        await consultProjectApi.update(editId.value, formData)
        ElMessage.success('更新成功')
      } else {
        await consultProjectApi.create(formData)
        ElMessage.success('创建成功')
      }
      dialogVisible.value = false
      loadProjects()
    } catch (error) {
      // Error handled by interceptor
    } finally {
      submitting.value = false
    }
  })
}

function getStatusType(status: string) {
  const typeMap: Record<string, any> = {
    consulting: 'primary',
    quoted: 'success',
    paused: 'warning',
    cancelled: 'info',
  }
  return typeMap[status] || ''
}

function getStatusLabel(status: string) {
  const labelMap: Record<string, string> = {
    consulting: '咨询中',
    quoted: '已报价',
    paused: '已暂停',
    cancelled: '已取消',
  }
  return labelMap[status] || status
}

function formatAmount(amount: number | undefined | null): string {
  if (amount === undefined || amount === null) return '0'
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
.consult-projects-container {
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
