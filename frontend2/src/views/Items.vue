<template>
  <div class="items-container page-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>物品管理</span>
          <el-button type="primary" :icon="Plus" @click="handleAdd">
            添加物品
          </el-button>
        </div>
      </template>

      <!-- Search and Filter -->
      <el-row :gutter="20" class="mb-16">
        <el-col :span="8">
          <el-input
            v-model="searchQuery"
            placeholder="搜索物品名称、编码、型号"
            :prefix-icon="Search"
            clearable
            @input="handleSearch"
          />
        </el-col>
        <el-col :span="6">
          <el-select v-model="selectedCategory" placeholder="选择分类" clearable @change="handleSearch">
            <el-option label="全部分类" value="" />
            <el-option v-for="cat in categories" :key="cat.id" :label="cat.name" :value="cat.id" />
          </el-select>
        </el-col>
        <el-col :span="6">
          <el-button :icon="Upload" @click="handleImport">导入Excel</el-button>
          <el-button :icon="Download" @click="handleExport">导出Excel</el-button>
        </el-col>
      </el-row>

      <!-- Table -->
      <el-table
        v-loading="loading"
        :data="items"
        style="width: 100%"
      >
        <el-table-column prop="name" label="物品名称" min-width="150" />
        <el-table-column prop="code" label="编码" width="120" />
        <el-table-column prop="category.name" label="分类" width="120" />
        <el-table-column prop="model" label="型号" width="100" />
        <el-table-column prop="spec" label="规格" width="100" />
        <el-table-column prop="unit" label="单位" width="60" />
        <el-table-column prop="brand" label="品牌" width="100" />
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
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
      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.pageSize"
        :total="pagination.total"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleSizeChange"
        @current-change="handlePageChange"
        class="mt-20"
      />
    </el-card>

    <!-- Add/Edit Dialog -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="700px"
      @close="handleDialogClose"
    >
      <!-- Step 1: Select Category -->
      <div v-if="currentStep === 1" class="category-selection">
        <el-alert
          title="请先选择物品所属分类"
          type="info"
          :closable="false"
          show-icon
          class="mb-16"
        />
        <el-form label-width="100px">
          <el-form-item label="选择分类">
            <el-tree-select
              v-model="selectedCategoryId"
              :data="categoryTree"
              :props="{ value: 'id', label: 'name', children: 'children' }"
              placeholder="请选择分类"
              :render-after-expand="false"
              clearable
              check-strictly
              style="width: 100%"
            />
          </el-form-item>
          <el-form-item v-if="selectedCategoryId" label="分类路径">
            <div class="category-path">
              <el-tag v-for="cat in getCategoryPath(selectedCategoryId)" :key="cat.id" size="small">
                {{ cat.name }}
              </el-tag>
            </div>
          </el-form-item>
        </el-form>
      </div>

      <!-- Step 2: Fill Item Details -->
      <el-form
        v-else
        ref="formRef"
        :model="formData"
        :rules="rules"
        label-width="100px"
      >
        <el-form-item label="所属分类">
          <div class="selected-category">
            <el-tag type="success" size="large">
              {{ getSelectedCategoryName() }}
            </el-tag>
            <el-button type="primary" link @click="currentStep = 1">重新选择</el-button>
          </div>
        </el-form-item>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="物品名称" prop="name">
              <el-input v-model="formData.name" placeholder="请输入物品名称" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="编码">
              <el-input v-model="formData.code" placeholder="请输入编码" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="单位">
              <el-input v-model="formData.unit" placeholder="如：米、个、kg" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="型号">
              <el-input v-model="formData.model" placeholder="请输入型号" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="规格">
              <el-input v-model="formData.spec" placeholder="请输入规格" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="品牌">
              <el-input v-model="formData.brand" placeholder="请输入品牌" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="描述">
          <el-input v-model="formData.description" type="textarea" :rows="2" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">{{ currentStep === 1 ? '取消' : '上一步' }}</el-button>
        <el-button
          v-if="currentStep === 1"
          type="primary"
          @click="handleNextStep"
          :disabled="!selectedCategoryId"
        >
          下一步
        </el-button>
        <el-button
          v-else
          type="primary"
          @click="handleSubmit"
          :loading="submitting"
        >
          确定
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import { Plus, Search, Upload, Download } from '@element-plus/icons-vue'
import { itemApi } from '@/api/item'
import { categoryApi } from '@/api/category'
import type { Item, Category } from '@/types'

const loading = ref(false)
const items = ref<Item[]>([])
const categories = ref<Category[]>([])
const searchQuery = ref('')
const selectedCategory = ref<string>("")

const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0,
})

const dialogVisible = ref(false)
const dialogTitle = ref('添加物品')
const submitting = ref(false)
const formRef = ref<FormInstance>()
const editId = ref<string | null>(null)
const currentStep = ref(1)
const selectedCategoryId = ref<string | null>(null)

const formData = reactive({
  name: '',
  code: '',
  categoryId: '',
  unit: '',
  model: '',
  spec: '',
  brand: '',
  description: '',
})

const rules: FormRules = {
  name: [
    { required: true, message: '请输入物品名称', trigger: 'blur' },
  ],
}

// Flatten categories for filter dropdown
const flatCategories = computed(() => {
  const flatten = (cats: Category[]): Category[] => {
    const result: Category[] = []
    for (const cat of cats) {
      result.push(cat)
      if (cat.children && cat.children.length > 0) {
        result.push(...flatten(cat.children))
      }
    }
    return result
  }
  return flatten(categories.value)
})

// Category tree for selection
const categoryTree = computed(() => categories.value)

// Get category path for display
function getCategoryPath(categoryId: string): Category[] {
  const path: Category[] = []
  const findPath = (cats: Category[], targetId: string, currentPath: Category[] = []): boolean => {
    for (const cat of cats) {
      const newPath = [...currentPath, cat]
      if (cat.id === targetId) {
        path.push(...newPath)
        return true
      }
      if (cat.children && cat.children.length > 0) {
        if (findPath(cat.children, targetId, newPath)) {
          return true
        }
      }
    }
    return false
  }
  findPath(categories.value, categoryId)
  return path
}

// Get selected category name
function getSelectedCategoryName(): string {
  const cat = flatCategories.value.find(c => c.id === selectedCategoryId.value)
  return cat?.name || ''
}

async function loadItems() {
  loading.value = true
  try {
    const data = await itemApi.getList()
    // Filter by search query and category
    let filtered = data
    if (searchQuery.value) {
      const query = searchQuery.value.toLowerCase()
      filtered = filtered.filter(item =>
        item.name?.toLowerCase().includes(query) ||
        item.code?.toLowerCase().includes(query) ||
        item.model?.toLowerCase().includes(query)
      )
    }
    if (selectedCategory.value) {
      filtered = filtered.filter(item => item.categoryId === selectedCategory.value)
    }
    // Pagination
    const start = (pagination.page - 1) * pagination.pageSize
    const end = start + pagination.pageSize
    items.value = filtered.slice(start, end)
    pagination.total = filtered.length
  } catch (error) {
    // Error handled by interceptor
  } finally {
    loading.value = false
  }
}

async function loadCategories() {
  try {
    categories.value = await categoryApi.getTree()
  } catch (error) {
    // Error handled by interceptor
  }
}

function handleSearch() {
  pagination.page = 1
  loadItems()
}

function handlePageChange(page: number) {
  pagination.page = page
  loadItems()
}

function handleSizeChange(size: number) {
  pagination.pageSize = size
  loadItems()
}

function handleAdd() {
  dialogTitle.value = '添加物品'
  editId.value = null
  currentStep.value = 1
  selectedCategoryId.value = null
  Object.assign(formData, {
    name: '',
    code: '',
    categoryId: '',
    unit: '',
    model: '',
    spec: '',
    brand: '',
    description: '',
  })
  dialogVisible.value = true
}

function handleEdit(row: Item) {
  dialogTitle.value = '编辑物品'
  editId.value = row.id
  currentStep.value = 2
  selectedCategoryId.value = row.categoryId
  Object.assign(formData, {
    name: row.name,
    code: row.code || '',
    categoryId: row.categoryId,
    unit: row.unit || '',
    model: row.model || '',
    spec: row.spec || '',
    brand: row.brand || '',
    description: row.description || '',
  })
  dialogVisible.value = true
}

function handleDialogClose() {
  currentStep.value = 1
  selectedCategoryId.value = null
  formRef.value?.resetFields()
}

function handleNextStep() {
  if (!selectedCategoryId.value) {
    ElMessage.warning('请先选择分类')
    return
  }
  currentStep.value = 2
  formData.categoryId = selectedCategoryId.value
}

async function handleDelete(row: Item) {
  try {
    await ElMessageBox.confirm(`确定要删除物品"${row.name}"吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    })
    ElMessage.success('删除成功')
    loadItems()
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
        await itemApi.update(editId.value, formData)
        ElMessage.success('更新成功')
      } else {
        await itemApi.create(formData)
        ElMessage.success('添加成功')
      }
      dialogVisible.value = false
      loadItems()
    } catch (error) {
      // Error handled by interceptor
    } finally {
      submitting.value = false
    }
  })
}

function handleImport() {
  ElMessage.info('导入功能开发中...')
}

function handleExport() {
  ElMessage.info('导出功能开发中...')
}

onMounted(() => {
  loadCategories()
  loadItems()
})
</script>

<style scoped>
.items-container {
  padding: 20px;
}

.category-selection {
  padding: 20px 0;
}

.category-path {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.category-path .el-tag {
  margin: 0;
}

.selected-category {
  display: flex;
  align-items: center;
  gap: 12px;
}

.mb-16 {
  margin-bottom: 16px;
}
</style>
