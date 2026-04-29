<template>
  <div class="quick-generate">
    <el-form :model="form" label-width="100px">
      <el-form-item label="报表类型">
        <el-select v-model="form.dataSource" placeholder="选择报表类型" @change="handleDataSourceChange">
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

      <el-form-item label="时间范围">
        <el-date-picker
          v-model="dateRange"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          value-format="YYYY-MM-DD"
        />
      </el-form-item>

      <el-form-item label="显示字段">
        <el-checkbox-group v-model="form.fields">
          <el-checkbox v-for="field in availableFields" :key="field.value" :value="field.value">
            {{ field.label }}
          </el-checkbox>
        </el-checkbox-group>
      </el-form-item>

      <el-form-item>
        <el-button type="primary" @click="handleGenerate" :loading="loading">
          生成报表
        </el-button>
        <el-button @click="handleReset">重置</el-button>
        <el-button @click="handleSaveTemplate">保存为模板</el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import { exportReport } from '@/api/report'
import type { ReportDataSource, ReportFormat } from '@/types/report'

const loading = ref(false)

const form = reactive<{
  dataSource: ReportDataSource
  format: ReportFormat
  reportName: string
  fields: string[]
  startDate?: string
  endDate?: string
  filters?: Record<string, any>
}>({
  dataSource: 'projects',
  format: 'excel',
  reportName: '',
  fields: [],
})

const dateRange = ref<[string, string]>([])

const fieldOptions: Record<ReportDataSource, { label: string; value: string }[]> = {
  projects: [
    { label: '项目名称', value: 'projectName' },
    { label: '项目编号', value: 'projectNo' },
    { label: '客户', value: 'customer' },
    { label: '总金额', value: 'totalAmount' },
    { label: '状态', value: 'status' },
    { label: '创建日期', value: 'createdAt' },
  ],
  suppliers: [
    { label: '供应商名称', value: 'supplierName' },
    { label: '联系人', value: 'contact' },
    { label: '联系电话', value: 'phone' },
    { label: '邮箱', value: 'email' },
    { label: '地址', value: 'address' },
  ],
  payments: [
    { label: '付款金额', value: 'paymentAmount' },
    { label: '付款时间', value: 'paymentTime' },
    { label: '付款方式', value: 'paymentMethod' },
    { label: '供应商', value: 'supplierName' },
  ],
  receipts: [
    { label: '收款金额', value: 'receiptAmount' },
    { label: '收款时间', value: 'receiptTime' },
    { label: '收款方式', value: 'receiptMethod' },
    { label: '发票状态', value: 'invoiceStatus' },
  ],
  items: [
    { label: '物品名称', value: 'itemName' },
    { label: '物品编码', value: 'itemCode' },
    { label: '分类', value: 'category' },
    { label: '单位', value: 'unit' },
    { label: '品牌', value: 'brand' },
  ],
}

const availableFields = ref<{ label: string; value: string }[]>([])

function handleDataSourceChange() {
  form.fields = []
  availableFields.value = fieldOptions[form.dataSource] || []
}

handleDataSourceChange()

async function handleGenerate() {
  if (!form.reportName) {
    ElMessage.warning('请输入报表名称')
    return
  }
  if (form.fields.length === 0) {
    ElMessage.warning('请选择至少一个显示字段')
    return
  }

  loading.value = true
  try {
    const dto = {
      ...form,
      startDate: dateRange.value?.[0],
      endDate: dateRange.value?.[1],
    }
    await exportReport(dto)
    ElMessage.success('报表生成成功')
  } catch (error) {
    ElMessage.error('报表生成失败')
  } finally {
    loading.value = false
  }
}

function handleReset() {
  form.dataSource = 'projects'
  form.format = 'excel'
  form.reportName = ''
  form.fields = []
  dateRange.value = []
  handleDataSourceChange()
}

function handleSaveTemplate() {
  // 打开保存模板对话框
  ElMessage.info('保存模板功能开发中')
}
</script>

<style scoped lang="scss">
.quick-generate {
  max-width: 800px;

  :deep(.el-checkbox-group) {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
  }
}
</style>
