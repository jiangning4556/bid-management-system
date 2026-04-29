<template>
  <div class="categories-container page-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>物品分类管理</span>
          <el-button type="primary" :icon="Plus" @click="handleAdd">
            添加分类
          </el-button>
        </div>
      </template>

      <el-table
        v-loading="loading"
        :data="categories"
        style="width: 100%"
        row-key="id"
        :tree-props="{ children: 'children', hasChildren: 'hasChildren' }"
      >
        <el-table-column prop="name" label="分类名称" min-width="200" />
        <el-table-column prop="code" label="编码" width="120" />
        <el-table-column prop="level" label="层级" width="80" align="center" />
        <el-table-column prop="sort" label="排序" width="80" align="center" />
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="handleEdit(row)">
              编辑
            </el-button>
            <el-button type="success" link size="small" @click="handleAddChild(row)">
              添加子分类
            </el-button>
            <el-button type="danger" link size="small" @click="handleDelete(row)">
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- Add/Edit Dialog -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="500px"
    >
      <el-form
        ref="formRef"
        :model="formData"
        :rules="rules"
        label-width="100px"
      >
        <el-form-item label="分类名称" prop="name">
          <el-input v-model="formData.name" placeholder="请输入分类名称" />
        </el-form-item>
        <el-form-item label="编码">
          <el-input v-model="formData.code" placeholder="请输入分类编码" />
        </el-form-item>
        <el-form-item label="上级分类">
          <el-tree-select
            v-model="formData.parentId"
            :data="categorySelectData"
            :props="{ value: 'id', label: 'name', children: 'children' }"
            :render-after-expand="false"
            placeholder="请选择上级分类"
            clearable
            check-strictly
          />
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="formData.sort" :min="0" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="formData.description" type="textarea" :rows="2" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="submitting">
          确定
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { categoryApi } from '@/api/category'
import type { Category } from '@/types'

const loading = ref(false)
const categories = ref<Category[]>([])
const dialogVisible = ref(false)
const dialogTitle = ref('添加分类')
const submitting = ref(false)
const formRef = ref<FormInstance>()
const editId = ref<string | null>(null)

const formData = reactive({
  name: '',
  code: '',
  parentId: null as string | null,
  sort: 0,
  description: '',
})

const rules: FormRules = {
  name: [
    { required: true, message: '请输入分类名称', trigger: 'blur' },
  ],
}

// Collect all descendant IDs for a given category
function getDescendantIds(category: Category): string[] {
  const ids: string[] = [category.id]
  if (category.children && category.children.length > 0) {
    for (const child of category.children) {
      ids.push(...getDescendantIds(child))
    }
  }
  return ids
}

// IDs that should be disabled as parent options
const disabledParentIds = computed<string[]>(() => {
  if (!editId.value) return []

  // Find current category and all its descendants
  const findDisabledIds = (categories: Category[]): string[] => {
    for (const cat of categories) {
      if (cat.id === editId.value) {
        return getDescendantIds(cat)
      }
      if (cat.children && cat.children.length > 0) {
        const found = findDisabledIds(cat.children)
        if (found.length > 0) return found
      }
    }
    return []
  }

  return findDisabledIds(categories.value)
})

// Category data for tree select with disabled nodes
interface CategoryWithDisabled extends Category {
  disabled?: boolean
  children?: CategoryWithDisabled[]
}

const categorySelectData = computed<CategoryWithDisabled[]>(() => {
  const markDisabled = (categories: Category[], disabledIds: string[]): CategoryWithDisabled[] => {
    return categories.map(cat => {
      const node: CategoryWithDisabled = { ...cat }
      node.disabled = disabledIds.includes(cat.id)
      if (cat.children && cat.children.length > 0) {
        node.children = markDisabled(cat.children, disabledIds)
      }
      return node
    })
  }

  return markDisabled(categories.value, disabledParentIds.value)
})

async function loadCategories() {
  loading.value = true
  try {
    categories.value = await categoryApi.getTree()
  } catch (error) {
    // Error handled by interceptor
  } finally {
    loading.value = false
  }
}

function handleAdd() {
  dialogTitle.value = '添加分类'
  editId.value = null
  Object.assign(formData, {
    name: '',
    code: '',
    parentId: null,
    sort: 0,
    description: '',
  })
  dialogVisible.value = true
}

function handleAddChild(row: Category) {
  dialogTitle.value = '添加子分类'
  editId.value = null
  Object.assign(formData, {
    name: '',
    code: '',
    parentId: row.id,
    sort: 0,
    description: '',
  })
  dialogVisible.value = true
}

function handleEdit(row: Category) {
  dialogTitle.value = '编辑分类'
  editId.value = row.id
  Object.assign(formData, {
    name: row.name,
    code: row.code || '',
    parentId: row.parentId || null,
    sort: row.sort,
    description: row.description || '',
  })
  dialogVisible.value = true
}

async function handleDelete(row: Category) {
  try {
    await ElMessageBox.confirm(`确定要删除分类"${row.name}"吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    })
    await categoryApi.delete(row.id)
    ElMessage.success('删除成功')
    loadCategories()
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
        await categoryApi.update(editId.value, formData)
        ElMessage.success('更新成功')
      } else {
        await categoryApi.create(formData)
        ElMessage.success('添加成功')
      }
      dialogVisible.value = false
      loadCategories()
    } catch (error) {
      // Error handled by interceptor
    } finally {
      submitting.value = false
    }
  })
}

onMounted(() => {
  loadCategories()
})
</script>

<style scoped>
.categories-container {
  padding: 20px;
}
</style>
