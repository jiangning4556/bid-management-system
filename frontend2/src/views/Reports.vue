<template>
  <div class="reports-page">
    <el-card shadow="never">
      <template #header>
        <div class="page-header">
          <h2>报表管理</h2>
          <el-button type="primary" @click="showGenerateDialog = true">
            生成报表
          </el-button>
        </div>
      </template>

      <el-tabs v-model="activeTab">
        <el-tab-pane label="快速生成" name="generate">
          <QuickGenerate />
        </el-tab-pane>

        <el-tab-pane label="我的模板" name="templates">
          <ReportTemplates />
        </el-tab-pane>

        <el-tab-pane label="定时报表" name="subscriptions">
          <ReportSubscriptions />
        </el-tab-pane>
      </el-tabs>
    </el-card>

    <!-- 生成报表对话框 -->
    <GenerateReportDialog v-model="showGenerateDialog" />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import QuickGenerate from '@/components/report/QuickGenerate.vue'
import ReportTemplates from '@/components/report/ReportTemplates.vue'
import ReportSubscriptions from '@/components/report/ReportSubscriptions.vue'
import GenerateReportDialog from '@/components/report/GenerateReportDialog.vue'

const activeTab = ref('generate')
const showGenerateDialog = ref(false)
</script>

<style scoped lang="scss">
.reports-page {
  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;

    h2 {
      margin: 0;
      font-size: 20px;
      font-weight: 500;
    }
  }
}
</style>
