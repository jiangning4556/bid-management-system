<template>
  <div class="project-detail-container page-container">
    <!-- Error State -->
    <el-alert
      v-if="error"
      title="加载失败"
      type="error"
      :description="error"
      show-icon
      class="mb-20"
    >
      <template #default>
        <p>{{ error }}</p>
        <el-button type="primary" link @click="loadProject">重新加载</el-button>
        <el-button type="info" link @click="goBack">返回列表</el-button>
      </template>
    </el-alert>

    <!-- Loading State -->
    <div v-else-if="loading && !project" class="loading-container">
      <el-skeleton :rows="5" animated />
    </div>

    <!-- Content -->
    <template v-else>
      <el-page-header @back="goBack">
        <template #content>
          <div class="page-title">
            <h2>{{ project?.name || '项目详情' }}</h2>
            <el-tag :type="getStatusType(project?.status)" class="status-tag">
              {{ getStatusLabel(project?.status) }}
            </el-tag>
          </div>
        </template>
        <template #extra>
          <el-button type="primary" @click="openEditDialog">编辑项目</el-button>
          <el-button
            v-if="!project?.hasBidProject"
            type="success"
            @click="handleCreateBid"
            :loading="convertingToBid"
          >
            转为中标项目
          </el-button>
          <el-button
            v-else
            type="success"
            @click="handleViewBidProject"
          >
            查看中标项目
          </el-button>
        </template>
      </el-page-header>

      <!-- Project Info Card -->
      <ProjectInfoCard :project="project" :loading="loading" />

      <!-- Project Items Table -->
      <ProjectItemsTable
        :items="projectItems"
        :expanded-row-keys="expandedRowKeys"
        @add-item="itemSelectorVisible = true"
        @expand-change="handleExpandChange"
        @edit-quote="handleEditQuoteInline"
        @toggle-quote="handleToggleQuoteInline"
        @edit-item="handleEditItem"
        @manage-quotes="handleManageQuotes"
        @delete-item="handleDeleteItem"
      />

      <!-- Item Selector -->
      <ItemSelector
        v-model="itemSelectorVisible"
        :categories="categories"
        :items="allItems"
        @confirm="handleItemsSelected"
      />

      <!-- Quote Management Dialog -->
      <QuoteManagementDialog
        ref="quoteDialogRef"
        v-model:visible="quoteDialogVisible"
        :item-name="currentItem?.item?.name || ''"
        :item-id="currentItem?.item?.id || ''"
        :project-id="project?.id || ''"
        :quotes="currentQuotes"
        :suppliers="suppliers"
        :submitting="quoteSubmitting"
        :item-quantity="currentItem?.quantity || 1"
        @edit-quote="handleEditQuote"
        @toggle-quote="handleToggleQuote"
        @delete-quote="handleDeleteQuote"
        @submit-quote="handleSubmitQuote"
      />

      <!-- Edit Project Dialog -->
      <ProjectEditDialog
        v-model:visible="editDialogVisible"
        :project="project"
        :submitting="editSubmitting"
        @submit="submitProjectEdit"
      />

      <!-- Edit Item Dialog -->
      <ItemEditDialog
        v-model:visible="editItemDialogVisible"
        :item="currentEditItem"
        :submitting="editItemSubmitting"
        @submit="handleSubmitEditItem"
      />
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onActivated, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import ItemSelector from '@/components/ItemSelector.vue'
import ProjectInfoCard from '@/components/consult-project/ProjectInfoCard.vue'
import ProjectItemsTable from '@/components/consult-project/ProjectItemsTable.vue'
import QuoteManagementDialog from '@/components/consult-project/QuoteManagementDialog.vue'
import ProjectEditDialog from '@/components/consult-project/ProjectEditDialog.vue'
import ItemEditDialog from '@/components/consult-project/ItemEditDialog.vue'
import type { ConsultProject, ConsultProjectItem, Item, Category, Supplier, SupplierQuote } from '@/types'
import { consultProjectApi, bidProjectApi } from '@/api/project'
import { categoryApi } from '@/api/category'
import { itemApi } from '@/api/item'
import { supplierApi } from '@/api/supplier'

const router = useRouter()
const route = useRoute()

// State
const loading = ref(false)
const error = ref<string | null>(null)
const project = ref<ConsultProject | null>(null)
const projectItems = ref<ConsultProjectItem[]>([])
const categories = ref<Category[]>([])
const allItems = ref<Item[]>([])
const suppliers = ref<Supplier[]>([])
const itemSelectorVisible = ref(false)
const expandedRowKeys = ref<string[]>([])
const convertingToBid = ref(false)

// Dialog states
const editDialogVisible = ref(false)
const editSubmitting = ref(false)

const quoteDialogVisible = ref(false)
const quoteSubmitting = ref(false)
const quoteDialogRef = ref()
const currentItem = ref<ConsultProjectItem | null>(null)
const currentQuotes = ref<SupplierQuote[]>([])

const editItemDialogVisible = ref(false)
const editItemSubmitting = ref(false)
const currentEditItem = ref<ConsultProjectItem | null>(null)

// Methods
async function loadProject() {
  loading.value = true
  error.value = null
  try {
    const id = route.params.id as string
    if (!id) {
      error.value = '项目 ID 无效'
      return
    }
    project.value = await consultProjectApi.getById(id)
    projectItems.value = project.value.projectItems || []
  } catch (err: any) {
    error.value = err?.response?.data?.message || err?.message || '加载项目失败，请稍后重试'
  } finally {
    loading.value = false
  }
}

function goBack() {
  router.back()
}

function openEditDialog() {
  editDialogVisible.value = true
}

async function submitProjectEdit(data: any) {
  if (!project.value) return

  try {
    editSubmitting.value = true
    await consultProjectApi.update(project.value.id, data)
    ElMessage.success('项目信息更新成功')
    editDialogVisible.value = false
    await loadProject()
  } finally {
    editSubmitting.value = false
  }
}

async function handleCreateBid() {
  if (!project.value) return

  const hasSelectedQuotes = project.value.projectItems?.some(item =>
    item.quotes?.some(quote => quote.isSelected)
  )

  if (!hasSelectedQuotes) {
    ElMessage.warning('请先选中至少一个供应商报价')
    return
  }

  try {
    await ElMessageBox.confirm(
      '确定要将此咨询项目转为中标项目吗？转换后将会复制已选中的供应商报价。',
      '确认转换',
      {
        type: 'warning',
        confirmButtonText: '确定',
        cancelButtonText: '取消',
      }
    )

    convertingToBid.value = true
    const bidProject = await bidProjectApi.createFromConsult(project.value.id)
    ElMessage.success('已成功转为中标项目')
    router.push(`/bid-projects/${bidProject.id}`)
  } finally {
    convertingToBid.value = false
  }
}

function handleViewBidProject() {
  if (project.value?.bidProjectId) {
    router.push(`/bid-projects/${project.value.bidProjectId}`)
  } else {
    // 如果没有 bidProjectId，尝试查找关联的中标项目
    router.push('/bid-projects')
  }
}

async function handleItemsSelected(items: Item[]) {
  if (!project.value) return

  try {
    for (const item of items) {
      await consultProjectApi.addItem(project.value.id, {
        itemId: item.id,
        quantity: 1,
      })
    }
    ElMessage.success(`已添加 ${items.length} 个物品`)
    await loadProject()
  } catch (error) {
    // Error handled by interceptor
  }
}

function handleExpandChange(row: ConsultProjectItem, expandedRows: ConsultProjectItem[]) {
  if (expandedRows.includes(row)) {
    expandedRowKeys.value.push(row.id)
  } else {
    const index = expandedRowKeys.value.indexOf(row.id)
    if (index > -1) {
      expandedRowKeys.value.splice(index, 1)
    }
  }
}

function handleEditQuoteInline(payload: { item: ConsultProjectItem; quote: SupplierQuote }) {
  handleManageQuotes(payload.item)
  quoteDialogRef.value?.setEditQuote(payload.quote)
}

async function handleToggleQuoteInline(payload: { item: ConsultProjectItem; quote: SupplierQuote }) {
  await handleToggleQuote(payload.quote)
}

function handleManageQuotes(item: ConsultProjectItem) {
  currentItem.value = item
  currentQuotes.value = item.quotes || []
  quoteDialogVisible.value = true
}

function handleEditItem(item: ConsultProjectItem) {
  currentEditItem.value = item
  editItemDialogVisible.value = true
}

async function handleSubmitEditItem(data: any) {
  if (!currentEditItem.value) return

  try {
    editItemSubmitting.value = true
    await consultProjectApi.updateItem(currentEditItem.value.id, data)
    ElMessage.success('更新成功')
    editItemDialogVisible.value = false
    await loadProject()
  } finally {
    editItemSubmitting.value = false
  }
}

function handleEditQuote(quote: SupplierQuote) {
  quoteDialogRef.value?.setEditQuote(quote)
}

async function handleToggleQuote(quote: SupplierQuote) {
  try {
    await consultProjectApi.toggleQuote(quote.id)
    await loadProject()
    currentQuotes.value = currentItem.value?.quotes || []
  } catch (error) {
    // Error handled by interceptor
  }
}

async function handleDeleteQuote(quote: SupplierQuote) {
  try {
    await ElMessageBox.confirm('确定要删除此报价吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    })
    await consultProjectApi.deleteQuote(quote.id)
    ElMessage.success('删除成功')
    await loadProject()
    currentQuotes.value = currentItem.value?.quotes || []
  } catch {
    // User cancelled
  }
}

async function handleDeleteItem(item: ConsultProjectItem) {
  try {
    await ElMessageBox.confirm(
      `确定要删除物品"${item.item?.name}"吗？此操作将同时删除该物品下的所有报价信息。`,
      '确认删除',
      {
        type: 'warning',
        confirmButtonText: '确定',
        cancelButtonText: '取消',
      }
    )
    await consultProjectApi.deleteItem(project.value!.id, item.id)
    ElMessage.success('删除成功')
    await loadProject()
  } catch (error) {
    // User cancelled or error handled by interceptor
  }
}

async function handleSubmitQuote(data: any) {
  if (!currentItem.value) return

  try {
    quoteSubmitting.value = true
    const editingId = quoteDialogRef.value?.editingQuoteId

    // 自动添加物品数量
    const quoteData = {
      ...data,
      quantity: currentItem.value.quantity,
    }

    if (editingId) {
      // Update existing quote
      await consultProjectApi.updateQuote(editingId, quoteData)
      ElMessage.success('修改成功')
    } else {
      // Add new quote
      await consultProjectApi.addQuote(currentItem.value.id, quoteData)
      ElMessage.success('添加成功')
    }
    await loadProject()
    currentQuotes.value = currentItem.value?.quotes || []
    quoteDialogRef.value?.resetForm()
  } finally {
    quoteSubmitting.value = false
  }
}

// Status helpers
function getStatusType(status?: string) {
  if (!status) return 'info'
  const typeMap: Record<string, any> = {
    consulting: 'primary',
    quoted: 'success',
    paused: 'warning',
    cancelled: 'info',
  }
  return typeMap[status] || 'info'
}

function getStatusLabel(status?: string) {
  if (!status) return ''
  const labelMap: Record<string, string> = {
    consulting: '咨询中',
    quoted: '已报价',
    paused: '已暂停',
    cancelled: '已取消',
  }
  return labelMap[status] || status
}

// Load reference data
async function loadCategories() {
  try {
    categories.value = await categoryApi.getTree()
  } catch (error) {
    // Error handled by interceptor
  }
}

async function loadItems() {
  try {
    allItems.value = await itemApi.getList()
  } catch (error) {
    // Error handled by interceptor
  }
}

async function loadSuppliers() {
  try {
    const response = await supplierApi.getList()
    // Response format: { data: [...], total: N, page: 1, limit: 10, totalPages: 1 }
    suppliers.value = response.data || []
  } catch (error) {
    // Error handled by interceptor
  }
}

onMounted(() => {
  loadProject()
  loadCategories()
  loadItems()
  loadSuppliers()
})

// 当页面重新激活时（如从中标项目详情页返回），刷新项目数据
onActivated(() => {
  loadProject()
})

// 监听路由变化，当路由参数变化时重新加载项目数据
watch(
  () => route.params.id,
  (newId, oldId) => {
    if (newId && newId !== oldId) {
      loadProject()
    }
  }
)
</script>

<style scoped lang="scss">
.project-detail-container {
  padding: 20px;
}

.loading-container {
  padding: 40px;
}

.page-title {
  display: flex;
  align-items: center;
  gap: 12px;

  h2 {
    margin: 0;
    font-size: 20px;
  }
}

.status-tag {
  margin-left: 8px;
}
</style>
