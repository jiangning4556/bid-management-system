<template>
  <el-dialog
    v-model="visible"
    :title="template ? '编辑模板' : '新建模板'"
    width="600px"
  >
    <el-form :model="form" label-width="100px">
      <el-form-item label="模板名称">
        <el-input v-model="form.name" placeholder="请输入模板名称" />
      </el-form-item>

      <el-form-item label="描述">
        <el-input v-model="form.description" type="textarea" placeholder="请输入描述" />
      </el-form-item>

      <el-form-item label="数据源">
        <el-select v-model="form.dataSource" placeholder="选择数据源" :disabled="!!template">
          <el-option label="项目报表" value="projects" />
          <el-option label="供应商报表" value="suppliers" />
          <el-option label="付款报表" value="payments" />
          <el-option label="收款报表" value="receipts" />
          <el-option label="物品报表" value="items" />
        </el-select>
      </el-form-item>

      <el-form-item label="默认格式">
        <el-radio-group v-model="form.defaultFormat">
          <el-radio value="excel">Excel</el-radio>
          <el-radio value="pdf">PDF</el-radio>
        </el-radio-group>
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" @click="handleConfirm" :loading="loading">
        确定
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { reportApi } from '@/api/report'
import type { ReportTemplate } from '@/types/report'

interface Props {
  modelValue: boolean
  template?: ReportTemplate | null
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'success'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const visible = ref(false)
const loading = ref(false)

const form = reactive({
  name: '',
  description: '',
  dataSource: 'projects' as any,
  defaultFormat: 'excel' as any,
})

watch(() => props.modelValue, (val) => {
  visible.value = val
  if (val && props.template) {
    Object.assign(form, {
      name: props.template.name,
      description: props.template.description,
      dataSource: props.template.dataSource,
      defaultFormat: props.template.defaultFormat,
    })
  }
})

watch(visible, (val) => {
  emit('update:modelValue', val)
  if (!val) {
    resetForm()
  }
})

async function handleConfirm() {
  if (!form.name) {
    ElMessage.warning('请输入模板名称')
    return
  }

  loading.value = true
  try {
    if (props.template) {
      await reportApi.updateTemplate(props.template.id, form)
      ElMessage.success('更新成功')
    } else {
      await reportApi.createTemplate({
        ...form,
        fields: ['*'], // 默认字段
        filters: {},
      })
      ElMessage.success('创建成功')
    }
    emit('success')
    visible.value = false
  } catch (error) {
    ElMessage.error('操作失败')
  } finally {
    loading.value = false
  }
}

function resetForm() {
  form.name = ''
  form.description = ''
  form.dataSource = 'projects'
  form.defaultFormat = 'excel'
}
</script>
