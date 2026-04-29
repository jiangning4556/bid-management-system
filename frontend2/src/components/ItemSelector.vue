<template>
  <el-dialog
    v-model="visible"
    title="选择物品"
    width="900px"
    @close="handleClose"
  >
    <div class="item-selector">
      <!-- Category Selection -->
      <div class="category-section">
        <div class="section-label">选择分类：</div>
        <el-tree-select
          v-model="selectedCategoryId"
          :data="categories"
          :props="{ value: 'id', label: 'name', children: 'children' }"
          placeholder="请先选择分类"
          :render-after-expand="false"
          clearable
          @change="handleCategoryChange"
          style="width: 300px"
        />
        <el-button
          v-if="selectedCategoryId"
          type="primary"
          link
          @click="handleShowAllItems"
        >
          显示此分类及子分类的物品
        </el-button>
      </div>

      <!-- Items List -->
      <div class="items-section">
        <el-table
          ref="tableRef"
          v-loading="loading"
          :data="filteredItems"
          style="width: 100%"
          max-height="400"
          @selection-change="handleSelectionChange"
        >
          <el-table-column type="selection" width="55" />
          <el-table-column prop="name" label="物品名称" min-width="150" />
          <el-table-column prop="code" label="编码" width="120" />
          <el-table-column prop="category.name" label="分类" width="120" />
          <el-table-column prop="model" label="型号" width="100" />
          <el-table-column prop="spec" label="规格" width="100" />
          <el-table-column prop="unit" label="单位" width="60" />
          <el-table-column prop="brand" label="品牌" width="100" />
        </el-table>
      </div>

      <!-- Selected Items Summary -->
      <div v-if="selectedItems.length > 0" class="selected-summary">
        <div class="summary-label">已选择 {{ selectedItems.length }} 个物品</div>
        <div class="selected-tags">
          <el-tag
            v-for="item in selectedItems"
            :key="item.id"
            closable
            @close="handleRemoveItem(item)"
            class="item-tag"
          >
            {{ item.name }}
          </el-tag>
        </div>
      </div>
    </div>

    <template #footer>
      <el-button @click="handleClose">取消</el-button>
      <el-button type="primary" @click="handleConfirm" :disabled="selectedItems.length === 0">
        确定 ({{ selectedItems.length }})
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import type { Item, Category } from '@/types'

interface Props {
  modelValue: boolean
  categories: Category[]
  items: Item[]
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'confirm', items: Item[]): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const tableRef = ref()
const loading = ref(false)
const selectedCategoryId = ref<string | null>(null)
const selectedItems = ref<Item[]>([])
const includedCategoryIds = ref<Set<string>>(new Set())

// Filter items by selected categories
const filteredItems = computed(() => {
  if (includedCategoryIds.value.size === 0) {
    return []
  }
  return props.items.filter(item =>
    includedCategoryIds.value.has(item.categoryId)
  )
})

// Get all descendant category IDs
function getCategoryAndDescendantIds(category: Category): string[] {
  const ids: string[] = [category.id]
  if (category.children && category.children.length > 0) {
    for (const child of category.children) {
      ids.push(...getCategoryAndDescendantIds(child))
    }
  }
  return ids
}

// Find category by ID
function findCategoryById(categories: Category[], id: string): Category | null {
  for (const cat of categories) {
    if (cat.id === id) return cat
    if (cat.children && cat.children.length > 0) {
      const found = findCategoryById(cat.children, id)
      if (found) return found
    }
  }
  return null
}

function handleCategoryChange(categoryId: string | null) {
  if (!categoryId) {
    includedCategoryIds.value.clear()
    selectedItems.value = []
    return
  }

  // Get selected category and all its descendants
  const category = findCategoryById(props.categories, categoryId)
  if (category) {
    includedCategoryIds.value = new Set(getCategoryAndDescendantIds(category))
  }

  // Clear previous selections
  selectedItems.value = []
  tableRef.value?.clearSelection()
}

function handleShowAllItems() {
  // Items are already filtered by the category change handler
  // This is just to provide feedback
  const count = filteredItems.value.length
  if (count === 0) {
    ElMessage.warning('该分类下暂无物品')
  } else {
    ElMessage.success(`显示 ${count} 个物品`)
  }
}

function handleSelectionChange(selection: Item[]) {
  selectedItems.value = selection
}

function handleRemoveItem(item: Item) {
  const index = selectedItems.value.findIndex(i => i.id === item.id)
  if (index > -1) {
    selectedItems.value.splice(index, 1)
    // Update table selection
    tableRef.value?.toggleRowSelection(item, false)
  }
}

function handleConfirm() {
  if (selectedItems.value.length === 0) {
    ElMessage.warning('请至少选择一个物品')
    return
  }
  emit('confirm', [...selectedItems.value])
  handleClose()
}

function handleClose() {
  visible.value = false
  // Reset state
  selectedCategoryId.value = null
  selectedItems.value = []
  includedCategoryIds.value.clear()
}

// Reset when dialog opens
watch(() => props.modelValue, (newVal) => {
  if (newVal) {
    selectedCategoryId.value = null
    selectedItems.value = []
    includedCategoryIds.value.clear()
  }
})
</script>

<style scoped>
.item-selector {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.category-section {
  display: flex;
  align-items: center;
  gap: 12px;
  padding-bottom: 16px;
  border-bottom: 1px solid #eee;
}

.section-label {
  font-weight: 500;
  color: #333;
  white-space: nowrap;
}

.items-section {
  min-height: 200px;
}

.selected-summary {
  padding: 12px;
  background-color: #f5f7fa;
  border-radius: 4px;
}

.summary-label {
  font-size: 14px;
  color: #666;
  margin-bottom: 8px;
}

.selected-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.item-tag {
  max-width: 200px;
}
</style>
