<template>
  <el-dialog
    v-model="visible"
    title="生成报表"
    width="600px"
    @close="handleClose"
  >
    <el-form :model="form" label-width="100px">
      <el-form-item label="报表类型">
        <el-select v-model="form.dataSource" placeholder="选择报表类型">
          <el-option label="项目报表" value="projects" />
          <el-option label="供应商报表" value="suppliers" />
          <el-option label="付款报表" value="payments" />
          <el-option label="收款报表" value="receipts" />
          <el-option label="物品报表" value="items" />
        </el-select>
      </el-form-item>

      <el-form-item label="导出格式">
        <el-radio-group v-model="form.format">
          <el-radio value="excel">Excel</el-radio>
          <el-radio value="pdf">PDF</el-radio>
        </el-radio-group>
      </el-form-item>

      <el-form-item label="报表名称">
        <el-input v-model="form.reportName" placeholder="请输入报表名称" />
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
import { exportReport } from '@/api/report'
import type { ReportDataSource, ReportFormat } from '@/types/report'

interface Props {
  modelValue: boolean
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const visible = ref(false)
const loading = ref(false)

const form = reactive<{
  dataSource: ReportDataSource
  format: ReportFormat
  reportName: string
}>({
  dataSource: 'projects',
  format: 'excel',
  reportName: '',
})

watch(() => props.modelValue, (val) => {
  visible.value = val
})

watch(visible, (val) => {
  emit('update:modelValue', val)
})

async function handleConfirm() {
  if (!form.reportName) {
    ElMessage.warning('请输入报表名称')
    return
  }

  loading.value = true
  try {
    await exportReport({
      ...form,
      fields: ['*'], // 使用默认字段
    })
    ElMessage.success('报表生成成功')
    visible.value = false
  } catch (error) {
    ElMessage.error('报表生成失败')
  } finally {
    loading.value = false
  }
}

function handleClose() {
  form.reportName = ''
  form.dataSource = 'projects'
  form.format = 'excel'
}
</script>
