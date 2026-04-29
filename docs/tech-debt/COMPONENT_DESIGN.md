# 投标管理系统 - 组件设计规范

> 版本: v1.0.0 | 更新日期: 2026-04-20

---

## 目录

- [组件设计原则](#组件设计原则)
- [组件分类与结构](#组件分类与结构)
- [组件通信规范](#组件通信规范)
- [大型组件拆分指南](#大型组件拆分指南)
- [组件复用模式](#组件复用模式)

---

## 组件设计原则

### SOLID 原则在 Vue 组件中的应用

1. **单一职责原则 (SRP)**
   - 每个组件只负责一个功能
   - 组件行数控制在 300 行以内
   - 一个组件不要处理太多业务逻辑

2. **开闭原则 (OCP)**
   - 通过 props 和 slots 扩展功能
   - 避免直接修改组件内部代码

3. **依赖倒置原则 (DIP)**
   - 依赖抽象（接口/类型）而非具体实现
   - 使用依赖注入模式

---

## 组件分类与结构

### 组件目录结构

```
src/
├── components/
│   ├── common/              # 通用组件
│   │   ├── ConfirmDialog.vue
│   │   ├── LoadingSpinner.vue
│   │   └── StatusTag.vue
│   ├── business/            # 业务组件
│   │   ├── consult-project/
│   │   │   ├── ProjectInfoCard.vue
│   │   │   ├── ProjectItemsTable.vue
│   │   │   └── QuoteManagementDialog.vue
│   │   └── bid-project/
│   │       ├── ProjectInfoCard.vue
│   │       ├── PaymentRecords.vue
│   │       └── ReceiptRecords.vue
│   └── layouts/             # 布局组件
│       ├── MainLayout.vue
│       └── PageLayout.vue
└── views/                   # 页面组件（容器组件）
```

### 组件模板结构

```vue
<script setup lang="ts">
// ============================================
// 1. 导入
// ============================================
import { ref, computed, watch } from 'vue'
import type { Foo, Bar } from '@/types/foo'

// ============================================
// 2. Props 定义
// ============================================
interface Props {
  modelValue: Foo
  disabled?: boolean
}
const props = withDefaults(defineProps<Props>(), {
  disabled: false,
})

// ============================================
// 3. Emits 定义
// ============================================
interface Emits {
  (e: 'update:modelValue', value: Foo): void
  (e: 'change', value: Bar): void
}
const emit = defineEmits<Emits>()

// ============================================
// 4. 响应式状态
// ============================================
const loading = ref(false)
const localData = ref<Bar[]>([])

// ============================================
// 5. 计算属性
// ============================================
const isEmpty = computed(() => localData.value.length === 0)

// ============================================
// 6. 方法
// ============================================
function handleClick() {
  // ...
}

async function loadData() {
  loading.value = true
  try {
    // ...
  } finally {
    loading.value = false
  }
}

// ============================================
// 7. 监听器
// ============================================
watch(() => props.modelValue, (newValue) => {
  // ...
}, { immediate: true })

// ============================================
// 8. 生命周期
// ============================================
onMounted(() => {
  loadData()
})

// ============================================
// 9. 暴露给父组件的方法
// ============================================
defineExpose({
  refresh: loadData,
})
</script>

<template>
  <div class="component-name">
    <!-- 模板内容 -->
  </div>
</template>

<style scoped lang="scss">
.component-name {
  // 样式
}
</style>
```

---

## 组件通信规范

### Props 向下传递

```typescript
// 父组件
<template>
  <ChildComponent
    :user-info="userInfo"
    :is-editable="canEdit"
    @update="handleUpdate"
  />
</template>

// 子组件
interface Props {
  userInfo: User
  isEditable?: boolean
}
const props = withDefaults(defineProps<Props>(), {
  isEditable: false,
})
```

### Events 向上传递

```typescript
// 子组件定义事件
interface Emits {
  (e: 'update', user: User): void
  (e: 'delete', id: number): void
}
const emit = defineEmits<Emits>()

// 触发事件
function handleSave() {
  emit('update', formData.value)
}

// 父组件监听
<template>
  <ChildComponent @update="handleUpdate" />
</template>
```

### v-model 双向绑定

```typescript
// 子组件
interface Props {
  modelValue: string
}
interface Emits {
  (e: 'update:modelValue', value: string): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const inputValue = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
})

// 父组件使用
<ChildComponent v-model="username" />
```

### Provide / Inject 跨层级通信

```typescript
// 祖先组件提供
import { provide } from 'vue'

provide('theme', {
  primary: '#409EFF',
  // ...
})

// 后代组件注入
import { inject } from 'vue'

const theme = inject('theme')
```

### 暴露方法给父组件

```typescript
// 子组件
defineExpose({
  refresh: () => loadData(),
  validate: () => formRef.value?.validate(),
})

// 父组件调用
<template>
  <ChildComponent ref="childRef" />
</template>

<script setup lang="ts">
const childRef = ref()

function handleRefresh() {
  childRef.value?.refresh()
}
</script>
```

---

## 大型组件拆分指南

### 何时拆分组件

出现以下情况时应该考虑拆分：

1. **组件行数超过 300 行**
2. **有多个独立的业务模块**
3. **有重复的 UI 结构**
4. **模板有超过 3 层嵌套**
5. **状态管理过于复杂**

### 拆分步骤

#### 步骤 1: 识别独立模块

分析组件，识别可以独立的部分：

```typescript
// 原组件 ConsultProjectDetail.vue (924 行)
// 模块识别：
// 1. 项目信息卡片 (41-53 行)
// 2. 物品列表表格 (55-152 行)
// 3. 报价管理对话框 (163-298 行)
// 4. 项目编辑对话框 (300-353 行)
// 5. 物品编辑对话框 (355-393 行)
```

#### 步骤 2: 创建子组件

```vue
<!-- components/consult-project/ProjectInfoCard.vue -->
<script setup lang="ts">
import type { ConsultProject } from '@/types/consult-project'

interface Props {
  project: ConsultProject
  editable?: boolean
}

interface Emits {
  (e: 'edit'): void
}

defineProps<Props>()
defineEmits<Emits>()
</script>

<template>
  <el-card class="project-info-card">
    <template #header>
      <div class="card-header">
        <span>项目信息</span>
        <el-button v-if="editable" @click="$emit('edit')">
          编辑
        </el-button>
      </div>
    </template>
    <el-descriptions :column="2" border>
      <el-descriptions-item label="项目名称">
        {{ project.name }}
      </el-descriptions-item>
      <el-descriptions-item label="项目编号">
        {{ project.code }}
      </el-descriptions-item>
      <!-- ... -->
    </el-descriptions>
  </el-card>
</template>
```

#### 步骤 3: 重构父组件

```vue
<!-- views/ConsultProjectDetail.vue -->
<script setup lang="ts">
import ProjectInfoCard from '@/components/consult-project/ProjectInfoCard.vue'
import ProjectItemsTable from '@/components/consult-project/ProjectItemsTable.vue'
// ...

const project = ref<ConsultProject | null>(null)
const items = ref<ConsultProjectItem[]>([])

function handleProjectEdit() {
  editDialogVisible.value = true
}

function handleItemsUpdate() {
  loadProjectDetail()
}
</script>

<template>
  <div class="consult-project-detail">
    <ProjectInfoCard
      v-if="project"
      :project="project"
      :editable="canEdit"
      @edit="handleProjectEdit"
    />

    <ProjectItemsTable
      :items="items"
      @update="handleItemsUpdate"
    />
  </div>
</template>
```

### 组件拆分示例

#### 原始组件 (924 行)
```vue
<template>
  <div class="consult-project-detail">
    <!-- 41-53 行: 项目信息卡片 -->
    <el-card>...</el-card>

    <!-- 55-152 行: 物品列表表格 -->
    <el-card>
      <el-table>...</el-table>
    </el-card>

    <!-- 163-298 行: 报价管理对话框 -->
    <el-dialog>...</el-dialog>

    <!-- 300-353 行: 项目编辑对话框 -->
    <el-dialog>...</el-dialog>

    <!-- 355-393 行: 物品编辑对话框 -->
    <el-dialog>...</el-dialog>
  </div>
</template>

<script setup lang="ts">
// 398-823 行: 大量逻辑代码
</script>
```

#### 拆分后 (300 行以内)
```vue
<template>
  <div class="consult-project-detail">
    <ProjectInfoCard :project="project" @edit="handleEdit" />
    <ProjectItemsTable :items="items" @quote-add="handleAddQuote" />
    <QuoteManagementDialog v-model="quoteDialogVisible" />
    <ProjectEditDialog v-model="editDialogVisible" />
    <ItemEditDialog v-model="itemDialogVisible" />
  </div>
</template>

<script setup lang="ts">
// 只保留协调逻辑，具体实现移到子组件
</script>
```

---

## 组件复用模式

### 组合式函数 (Composables)

```typescript
// composables/useFormDialog.ts
export function useFormDialog<T>() {
  const visible = ref(false)
  const loading = ref(false)
  const formData = ref<Partial<T>>({})

  const open = (data?: Partial<T>) => {
    formData.value = data || {}
    visible.value = true
  }

  const close = () => {
    visible.value = false
    formData.value = {}
  }

  const submit = async (handler: (data: Partial<T>) => Promise<void>) => {
    loading.value = true
    try {
      await handler(formData.value)
      close()
    } finally {
      loading.value = false
    }
  }

  return { visible, loading, formData, open, close, submit }
}

// 使用
const dialog = useFormDialog<User>()

function handleEdit(user: User) {
  dialog.open(user)
}

async function handleSave() {
  await dialog.submit(async (data) => {
    await userApi.update(user.id, data)
    ElMessage.success('保存成功')
  })
}
```

### 可配置的通用组件

```vue
<!-- components/common/DataTable.vue -->
<script setup lang="ts">
interface Props<T> {
  data: T[]
  columns: Column<T>[]
  loading?: boolean
  pagination?: PaginationConfig
}

interface Column<T> {
  key: keyof T
  label: string
  width?: number
  formatter?: (value: any, row: T) => string
}

defineProps<Props>()
defineEmits<{
  (e: 'row-click', row: any): void
}>()
</script>

<template>
  <el-table :data="data" :loading="loading" @row-click="$emit('row-click', $event)">
    <el-table-column
      v-for="col in columns"
      :key="String(col.key)"
      :prop="String(col.key)"
      :label="col.label"
      :width="col.width"
    >
      <template #default="{ row }">
        <slot :name="String(col.key)" :row="row">
          {{ col.formatter ? col.formatter(row[col.key], row) : row[col.key] }}
        </slot>
      </template>
    </el-table-column>
  </el-table>
</template>

<!-- 使用 -->
<DataTable
  :data="users"
  :columns="[
    { key: 'name', label: '姓名' },
    { key: 'email', label: '邮箱' },
    { key: 'status', label: '状态', formatter: formatStatus },
  ]"
  @row-click="handleRowClick"
>
  <template #status="{ row }">
    <el-tag :type="getStatusType(row.status)">
      {{ getStatusLabel(row.status) }}
    </el-tag>
  </template>
</DataTable>
```

---

## 组件性能优化

### 1. 计算属性缓存

```typescript
// ✅ 好的做法：使用计算属性
const filteredList = computed(() => {
  return list.value.filter(item => item.active)
})

// ❌ 避免：在模板中直接调用方法
<template>
  <div v-for="item in getFilteredList()" :key="item.id">
    <!-- 每次渲染都会重新计算 -->
  </div>
</template>
```

### 2. 大列表虚拟滚动

```typescript
import { useVirtualList } from '@vueuse/core'

const { list, containerProps, wrapperProps } = useVirtualList(
  largeList,
  { itemHeight: 50 },
)
```

### 3. 防抖和节流

```typescript
import { useDebounceFn } from '@vueuse/core'

const handleSearch = useDebounceFn((keyword: string) => {
  loadResults(keyword)
}, 300)
```

### 4. 懒加载组件

```typescript
// 路由懒加载
const ConsultProjectDetail = () => import('@/views/ConsultProjectDetail.vue')

// 组件懒加载
<script setup>
const HeavyComponent = defineAsyncComponent(() =>
  import('./HeavyComponent.vue')
)
</script>
```

---

## 组件测试规范

### 单元测试示例

```typescript
// ProjectInfoCard.spec.ts
import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import ProjectInfoCard from '@/components/consult-project/ProjectInfoCard.vue'

describe('ProjectInfoCard', () => {
  const mockProject = {
    id: 1,
    name: '测试项目',
    code: 'PRJ001',
    customer: '测试客户',
  }

  it('should render project information', () => {
    const wrapper = mount(ProjectInfoCard, {
      props: { project: mockProject },
    })

    expect(wrapper.text()).toContain('测试项目')
    expect(wrapper.text()).toContain('PRJ001')
    expect(wrapper.text()).toContain('测试客户')
  })

  it('should emit edit event when edit button clicked', async () => {
    const wrapper = mount(ProjectInfoCard, {
      props: { project: mockProject, editable: true },
    })

    await wrapper.find('button').trigger('click')
    expect(wrapper.emitted('edit')).toBeTruthy()
  })

  it('should not show edit button when not editable', () => {
    const wrapper = mount(ProjectInfoCard, {
      props: { project: mockProject, editable: false },
    })

    expect(wrapper.find('button').exists()).toBe(false)
  })
})
```

---

## 组件文档规范

### 组件文档模板

```markdown
# ProjectInfoCard

咨询项目信息卡片组件

## Props

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| project | ConsultProject | - | 项目信息（必填） |
| editable | boolean | false | 是否可编辑 |

## Events

| 事件名 | 参数 | 说明 |
|--------|------|------|
| edit | - | 点击编辑按钮时触发 |

## Slots

| 插槽名 | 说明 |
|--------|------|
| header | 自定义卡片头部 |
| default | 自定义卡片内容 |

## 示例

```vue
<ProjectInfoCard
  :project="project"
  :editable="canEdit"
  @edit="handleEdit"
/>
```
```
