<template>
  <div class="suppliers-container page-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>供应商管理</span>
          <div class="header-actions">
            <el-button v-if="isAdmin" type="success" :icon="Download" @click="handleExport" :loading="exporting">
              导出Excel
            </el-button>
            <el-button type="primary" :icon="Plus" @click="handleAdd">
              添加供应商
            </el-button>
          </div>
        </div>
      </template>

      <!-- Search -->
      <el-row :gutter="20" class="mb-16">
        <el-col :span="12">
          <el-input
            v-model="searchQuery"
            placeholder="搜索供应商名称、联系人、手机号"
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
        :data="suppliers"
        style="width: 100%"
        @sort-change="handleSortChange"
      >
        <el-table-column prop="displayId" label="ID" width="80" align="center" sortable="custom" />
        <el-table-column prop="name" label="供应商名称" min-width="150" sortable="custom" />
        <el-table-column prop="contact" label="联系人" width="100" sortable="custom" />
        <el-table-column prop="phone" label="联系电话" width="120" sortable="custom" />
        <el-table-column prop="email" label="邮箱" width="180" />
        <el-table-column prop="rating" label="评级" width="100" align="center" sortable="custom">
          <template #default="{ row }">
            <el-rate v-model="row.rating" disabled show-score text-color="#ff9900" score-template="{value}" />
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="80" align="center">
          <template #default="{ row }">
            <el-tag :type="row.status === 'active' ? 'success' : 'info'" size="small">
              {{ row.status === 'active' ? '启用' : '停用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="240" fixed="right">
          <template #default="{ row }">
            <el-button type="info" link size="small" @click="handleView(row)">
              查看
            </el-button>
            <el-button type="primary" link size="small" @click="handleEdit(row)">
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

    <!-- Add/Edit Dialog -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="600px"
      @close="handleDialogClose"
    >
      <el-form
        ref="formRef"
        :model="formData"
        :rules="rules"
        label-width="100px"
      >
        <el-form-item label="供应商名称" prop="name">
          <el-input v-model="formData.name" placeholder="请输入供应商名称" />
        </el-form-item>
        <el-form-item label="联系人">
          <el-input v-model="formData.contact" placeholder="请输入联系人" />
        </el-form-item>
        <el-form-item label="联系电话">
          <el-input v-model="formData.phone" placeholder="请输入联系电话" />
        </el-form-item>
        <el-form-item label="邮箱">
          <el-input v-model="formData.email" placeholder="请输入邮箱" />
        </el-form-item>
        <el-form-item label="地址">
          <el-input v-model="formData.address" type="textarea" :rows="2" placeholder="请输入地址" />
        </el-form-item>
        <el-form-item label="开户行">
          <el-input v-model="formData.bankName" placeholder="请输入开户行" />
        </el-form-item>
        <el-form-item label="银行账号">
          <el-input v-model="formData.bankAccount" placeholder="请输入银行账号" />
        </el-form-item>
        <el-form-item label="税号">
          <el-input v-model="formData.taxNumber" placeholder="请输入税号" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="formData.remarks" type="textarea" :rows="2" placeholder="请输入备注" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="submitting">
          确定
        </el-button>
      </template>
    </el-dialog>

    <!-- View Detail Dialog -->
    <el-dialog
      v-model="detailDialogVisible"
      title="供应商详情"
      width="700px"
    >
      <el-descriptions
        v-if="currentSupplier"
        :column="2"
        border
        direction="vertical"
      >
        <el-descriptions-item label="供应商名称" :span="2">
          {{ currentSupplier.name }}
        </el-descriptions-item>
        <el-descriptions-item label="联系人">
          {{ currentSupplier.contact || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="联系电话">
          {{ currentSupplier.phone || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="邮箱" :span="2">
          {{ currentSupplier.email || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="地址" :span="2">
          {{ currentSupplier.address || '-' }}
        </el-descriptions-item>

        <el-descriptions-item label="开户行">
          {{ currentSupplier.bankName || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="银行账号">
          {{ currentSupplier.bankAccount || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="税号" :span="2">
          {{ currentSupplier.taxNumber || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="发票信息" :span="2">
          {{ currentSupplier.invoiceInfo || '-' }}
        </el-descriptions-item>

        <el-descriptions-item label="综合评分">
          <el-rate v-model="currentSupplier.rating" disabled show-score />
        </el-descriptions-item>
        <el-descriptions-item label="交货评分">
          <el-rate v-model="currentSupplier.deliveryRating" disabled show-score />
        </el-descriptions-item>
        <el-descriptions-item label="咨询项目数">
          {{ currentSupplier.projectCount || 0 }}
        </el-descriptions-item>
        <el-descriptions-item label="中标项目数">
          {{ currentSupplier.bidProjectCount || 0 }}
        </el-descriptions-item>
        <el-descriptions-item label="中标率">
          {{ (currentSupplier.bidRate || 0) }}%
        </el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="currentSupplier.status === 'active' ? 'success' : 'info'" size="small">
            {{ currentSupplier.status === 'active' ? '启用' : '停用' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="备注" :span="2">
          {{ currentSupplier.remarks || '-' }}
        </el-descriptions-item>

        <el-descriptions-item label="创建时间">
          {{ formatDate(currentSupplier.createdAt) }}
        </el-descriptions-item>
        <el-descriptions-item label="更新时间">
          {{ formatDate(currentSupplier.updatedAt) }}
        </el-descriptions-item>
      </el-descriptions>
      <template #footer>
        <el-button type="primary" @click="detailDialogVisible = false">
          关闭
        </el-button>
      </template>
    </el-dialog>

    <!-- Advanced Search Dialog -->
    <AdvancedSearchDialog
      v-model="showAdvancedSearch"
      :search-fields="[
        { label: '供应商名称', value: 'name', type: 'string' },
        { label: '联系人', value: 'contact', type: 'string' },
        { label: '联系电话', value: 'phone', type: 'string' },
        { label: '邮箱', value: 'email', type: 'string' },
      ]"
      @search="handleAdvancedSearch"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onActivated, computed } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import { Plus, Search, Filter, Download } from '@element-plus/icons-vue'
import { supplierApi, type AdvancedSearchDto } from '@/api/supplier'
import type { Supplier } from '@/types'
import AdvancedSearchDialog from '@/components/AdvancedSearchDialog.vue'

// Check if current user is admin
const isAdmin = computed(() => {
  const userStr = localStorage.getItem('user')
  if (!userStr) return false
  try {
    const user = JSON.parse(userStr)
    return user.role === 'admin'
  } catch {
    return false
  }
})

const loading = ref(false)
const suppliers = ref<Supplier[]>([])
const searchQuery = ref('')
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
const dialogTitle = ref('添加供应商')
const submitting = ref(false)
const formRef = ref<FormInstance>()
const editId = ref<string | null>(null)
const showAdvancedSearch = ref(false)
const exporting = ref(false)
const detailDialogVisible = ref(false)
const currentSupplier = ref<Supplier | null>(null)

const formData = reactive({
  name: '',
  contact: '',
  phone: '',
  email: '',
  address: '',
  bankName: '',
  bankAccount: '',
  taxNumber: '',
  remarks: '',
})

const rules: FormRules = {
  name: [
    { required: true, message: '请输入供应商名称', trigger: 'blur' },
  ],
}

async function loadSuppliers() {
  loading.value = true
  try {
    const result = await supplierApi.getList({
      page: pagination.value.page,
      limit: pagination.value.limit,
      sortBy: sortState.value.sortBy || undefined,
      sortOrder: sortState.value.sortOrder || undefined,
    })

    // Handle both array and wrapped response formats
    if (Array.isArray(result)) {
      suppliers.value = result
      pagination.value.total = result.length
    } else {
      suppliers.value = result.data || []
      pagination.value.total = result.pagination?.total || result.total || 0
    }
  } catch (error) {
    console.error('Failed to load suppliers:', error)
    // Error handled by interceptor
  } finally {
    loading.value = false
  }
}

function handlePageChange() {
  loadSuppliers()
}

function handleSortChange({ prop, order }: { prop?: string; order?: string | null }) {
  if (!prop || !order) {
    sortState.value.sortBy = ''
    sortState.value.sortOrder = ''
  } else {
    sortState.value.sortBy = prop
    sortState.value.sortOrder = order === 'ascending' ? 'asc' : 'desc'
  }
  loadSuppliers()
}

function handleSearch() {
  if (!searchQuery.value) {
    loadSuppliers()
    return
  }

  loading.value = true
  supplierApi.search(searchQuery.value)
    .then((data) => {
      suppliers.value = data
    })
    .finally(() => {
      loading.value = false
    })
}

function handleAdvancedSearch(searchDto: AdvancedSearchDto) {
  loading.value = true
  supplierApi.advancedSearch(searchDto, {
    page: pagination.value.page,
    limit: pagination.value.limit,
    sortBy: sortState.value.sortBy || undefined,
    sortOrder: sortState.value.sortOrder || undefined,
  })
    .then((result) => {
      suppliers.value = result.data || []
      pagination.value.total = result.pagination?.total || result.total || 0
    })
    .catch(() => {
      // Error handled by interceptor
    })
    .finally(() => {
      loading.value = false
    })
}

async function handleView(row: Supplier) {
  loading.value = true
  try {
    const data = await supplierApi.getById(row.id)
    currentSupplier.value = data
    detailDialogVisible.value = true
  } catch (error) {
    // Error handled by interceptor
  } finally {
    loading.value = false
  }
}

function handleAdd() {
  dialogTitle.value = '添加供应商'
  editId.value = null
  Object.assign(formData, {
    name: '',
    contact: '',
    phone: '',
    email: '',
    address: '',
    bankName: '',
    bankAccount: '',
    taxNumber: '',
    remarks: '',
  })
  dialogVisible.value = true
}

async function handleExport() {
  try {
    exporting.value = true
    await supplierApi.export()
    ElMessage.success('导出成功')
  } catch (error) {
    // Error handled by interceptor
  } finally {
    exporting.value = false
  }
}

function handleEdit(row: Supplier) {
  dialogTitle.value = '编辑供应商'
  editId.value = row.id
  Object.assign(formData, {
    name: row.name,
    contact: row.contact || '',
    phone: row.phone || '',
    email: row.email || '',
    address: row.address || '',
    bankName: row.bankName || '',
    bankAccount: row.bankAccount || '',
    taxNumber: row.taxNumber || '',
    remarks: row.remarks || '',
  })
  dialogVisible.value = true
}

async function handleDelete(row: Supplier) {
  try {
    await ElMessageBox.confirm(`确定要删除供应商"${row.name}"吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    })

    await supplierApi.delete(row.id)
    ElMessage.success('删除成功')
    loadSuppliers()
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
        await supplierApi.update(editId.value, formData)
        ElMessage.success('更新成功')
      } else {
        await supplierApi.create(formData)
        ElMessage.success('添加成功')
        // Reset to first page to show newly added supplier
        pagination.value.page = 1
      }
      dialogVisible.value = false
      loadSuppliers()
    } catch (error) {
      // Error handled by interceptor
    } finally {
      submitting.value = false
    }
  })
}

function handleDialogClose() {
  formRef.value?.resetFields()
}

function formatDate(date: string | Date | null | undefined): string {
  if (!date) return '-'
  const d = new Date(date)
  return d.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

onMounted(() => {
  loadSuppliers()
})

// Also load data when component is activated (handles route navigation back to this page)
onActivated(() => {
  loadSuppliers()
})
</script>

<style scoped>
.suppliers-container {
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
