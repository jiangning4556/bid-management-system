<template>
  <el-dialog
    v-model="dialogVisible"
    title="高级搜索"
    width="600px"
    @close="handleClose"
  >
    <el-form :model="formData" label-width="100px">
      <!-- Search Logic -->
      <el-form-item label="逻辑关系">
        <el-radio-group v-model="formData.logic">
          <el-radio label="AND">且 (AND)</el-radio>
          <el-radio label="OR">或 (OR)</el-radio>
        </el-radio-group>
      </el-form-item>

      <!-- Conditions -->
      <el-form-item label="搜索条件">
        <div class="conditions-container">
          <div v-for="(condition, index) in formData.conditions" :key="index" class="condition-row">
            <el-select v-model="condition.field" placeholder="字段" style="width: 140px">
              <el-option
                v-for="field in searchFields"
                :key="field.value"
                :label="field.label"
                :value="field.value"
              />
            </el-select>
            <el-select v-model="condition.operator" placeholder="操作符" style="width: 120px; margin: 0 8px">
              <el-option
                v-for="op in operators"
                :key="op.value"
                :label="op.label"
                :value="op.value"
              />
            </el-select>
            <template v-if="condition.operator === 'between'">
              <el-input v-model="condition.value" placeholder="最小值" style="width: 100px" />
              <span style="margin: 0 4px">-</span>
              <el-input v-model="condition.value2" placeholder="最大值" style="width: 100px" />
            </template>
            <template v-else-if="condition.operator === 'in'">
              <el-select
                v-model="condition.values"
                multiple
                filterable
                allow-create
                placeholder="输入值后按回车"
                style="flex: 1"
              />
            </template>
            <template v-else>
              <el-input v-model="condition.value" placeholder="值" style="flex: 1" />
            </template>
            <el-button
              type="danger"
              :icon="Delete"
              circle
              size="small"
              style="margin-left: 8px"
              @click="removeCondition(index)"
            />
          </div>
          <el-button type="primary" :icon="Plus" @click="addCondition" style="width: 100%; margin-top: 8px">
            添加条件
          </el-button>
        </div>
      </el-form-item>

      <!-- Date Range -->
      <el-form-item label="日期范围">
        <el-select v-model="formData.dateField" placeholder="日期字段" style="width: 150px; margin-right: 8px">
          <el-option label="创建时间" value="createdAt" />
          <el-option label="更新时间" value="updatedAt" />
        </el-select>
        <el-date-picker
          v-model="dateRange"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          value-format="YYYY-MM-DD"
          style="width: 300px"
        />
      </el-form-item>

      <!-- Status Filter (optional) -->
      <el-form-item v-if="statusOptions.length > 0" label="状态筛选">
        <el-select
          v-model="formData.statuses"
          multiple
          placeholder="选择状态"
          style="width: 100%"
        >
          <el-option
            v-for="status in statusOptions"
            :key="status.value"
            :label="status.label"
            :value="status.value"
          />
        </el-select>
      </el-form-item>

      <!-- Search History -->
      <el-form-item v-if="searchHistory.length > 0" label="搜索历史">
        <div class="search-history">
          <el-tag
            v-for="(history, index) in searchHistory"
            :key="index"
            closable
            @close="removeHistory(index)"
            @click="applyHistory(history)"
            style="cursor: pointer; margin: 4px"
          >
            {{ history.name }}
          </el-tag>
        </div>
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="dialogVisible = false">取消</el-button>
      <el-button type="info" @click="saveToHistory">保存到历史</el-button>
      <el-button type="primary" @click="handleSearch">搜索</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { Plus, Delete } from '@element-plus/icons-vue'
import type { SearchCondition, AdvancedSearchDto } from '@/api/supplier'

export interface SearchField {
  label: string
  value: string
  type: 'string' | 'number' | 'date'
}

interface Props {
  modelValue: boolean
  searchFields?: SearchField[]
  statusOptions?: Array<{ label: string; value: string }>
  dateFieldDefault?: string
}

const props = withDefaults(defineProps<Props>(), {
  searchFields: () => [
    { label: '名称', value: 'name', type: 'string' },
    { label: '联系人', value: 'contact', type: 'string' },
    { label: '电话', value: 'phone', type: 'string' },
  ],
  statusOptions: () => [],
  dateFieldDefault: 'createdAt',
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'search': [data: AdvancedSearchDto]
}>()

const dialogVisible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val),
})

const formData = reactive<AdvancedSearchDto>({
  logic: 'AND',
  conditions: [],
  dateFrom: '',
  dateTo: '',
  dateField: props.dateFieldDefault,
  statuses: [],
  statusField: 'status',
})

const dateRange = ref<[string, string] | null>(null)
const searchHistory = ref<Array<{ name: string; data: AdvancedSearchDto }>>([])

// Load search history from localStorage
const STORAGE_KEY = 'advanced_search_history'

function loadHistory() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      searchHistory.value = JSON.parse(stored)
    }
  } catch (error) {
    console.error('Failed to load search history:', error)
  }
}

function saveHistory() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(searchHistory.value))
  } catch (error) {
    console.error('Failed to save search history:', error)
  }
}

function addCondition() {
  formData.conditions?.push({
    field: props.searchFields[0].value,
    operator: 'contains',
    value: '',
  })
}

function removeCondition(index: number) {
  formData.conditions?.splice(index, 1)
}

function removeHistory(index: number) {
  searchHistory.value.splice(index, 1)
  saveHistory()
}

function applyHistory(history: { name: string; data: AdvancedSearchDto }) {
  Object.assign(formData, history.data)
  if (history.data.dateFrom && history.data.dateTo) {
    dateRange.value = [history.data.dateFrom, history.data.dateTo]
  }
}

function saveToHistory() {
  const name = prompt('请输入搜索名称:', `搜索 ${searchHistory.value.length + 1}`)
  if (!name) return

  searchHistory.value.push({
    name,
    data: JSON.parse(JSON.stringify(formData)),
  })
  saveHistory()
  ElMessage.success('已保存到搜索历史')
}

function handleSearch() {
  // Update date from date range picker
  if (dateRange.value) {
    formData.dateFrom = dateRange.value[0]
    formData.dateTo = dateRange.value[1]
  } else {
    formData.dateFrom = ''
    formData.dateTo = ''
  }

  emit('search', formData)
  dialogVisible.value = false
}

function handleClose() {
  // Reset form when closing
  formData.conditions = []
  formData.dateFrom = ''
  formData.dateTo = ''
  formData.statuses = []
  dateRange.value = null
}

// Watch date range changes
watch(dateRange, (newRange) => {
  if (newRange) {
    formData.dateFrom = newRange[0]
    formData.dateTo = newRange[1]
  } else {
    formData.dateFrom = ''
    formData.dateTo = ''
  }
})

// Load history on mount
loadHistory()

const operators = [
  { label: '等于', value: 'equals' },
  { label: '包含', value: 'contains' },
  { label: '开始于', value: 'startsWith' },
  { label: '结束于', value: 'endsWith' },
  { label: '大于', value: 'greaterThan' },
  { label: '小于', value: 'lessThan' },
  { label: '大于等于', value: 'greaterEqual' },
  { label: '小于等于', value: 'lessEqual' },
  { label: '区间', value: 'between' },
  { label: '属于', value: 'in' },
]
</script>

<style scoped>
.conditions-container {
  width: 100%;
}

.condition-row {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
}

.search-history {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}
</style>
