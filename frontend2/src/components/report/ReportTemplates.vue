<template>
  <div class="report-templates">
    <div class="toolbar">
      <el-button type="primary" @click="showTemplateDialog = true">
        新建模板
      </el-button>
    </div>

    <el-table :data="templates" v-loading="loading">
      <el-table-column prop="name" label="模板名称" width="200" />
      <el-table-column prop="description" label="描述" />
      <el-table-column prop="dataSource" label="数据源" width="120">
        <template #default="{ row }">
          <el-tag size="small">{{ dataSourceLabel[row.dataSource] }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="defaultFormat" label="默认格式" width="100">
        <template #default="{ row }">
          <el-tag :type="row.defaultFormat === 'excel' ? 'success' : 'warning'" size="small">
            {{ row.defaultFormat.toUpperCase() }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="createdAt" label="创建时间" width="180" />
      <el-table-column label="操作" width="180" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" size="small" @click="handleGenerate(row)">
            生成
          </el-button>
          <el-button link type="primary" size="small" @click="handleEdit(row)">
            编辑
          </el-button>
          <el-popconfirm title="确定删除此模板吗？" @confirm="handleDelete(row.id)">
            <template #reference>
              <el-button link type="danger" size="small">删除</el-button>
            </template>
          </el-popconfirm>
        </template>
      </el-table-column>
    </el-table>

    <!-- 模板对话框 -->
    <TemplateDialog v-model="showTemplateDialog" :template="editingTemplate" @success="loadTemplates" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { reportApi, exportReport } from '@/api/report'
import type { ReportTemplate } from '@/types/report'
import TemplateDialog from './TemplateDialog.vue'

const loading = ref(false)
const templates = ref<ReportTemplate[]>([])
const showTemplateDialog = ref(false)
const editingTemplate = ref<ReportTemplate | null>(null)

const dataSourceLabel: Record<string, string> = {
  projects: '项目报表',
  suppliers: '供应商报表',
  payments: '付款报表',
  receipts: '收款报表',
  items: '物品报表',
}

onMounted(() => {
  loadTemplates()
})

async function loadTemplates() {
  loading.value = true
  try {
    templates.value = await reportApi.getTemplates()
  } catch (error) {
    ElMessage.error('加载模板失败')
  } finally {
    loading.value = false
  }
}

function handleGenerate(template: ReportTemplate) {
  // 使用模板生成报表
  const dto = {
    dataSource: template.dataSource,
    format: template.defaultFormat,
    reportName: template.name,
    fields: template.fields,
    filters: template.filters,
  }
  exportReport(dto)
}

function handleEdit(template: ReportTemplate) {
  editingTemplate.value = template
  showTemplateDialog.value = true
}

async function handleDelete(id: string) {
  try {
    await reportApi.deleteTemplate(id)
    ElMessage.success('删除成功')
    loadTemplates()
  } catch (error) {
    ElMessage.error('删除失败')
  }
}
</script>

<style scoped lang="scss">
.report-templates {
  .toolbar {
    margin-bottom: 16px;
  }
}
</style>
