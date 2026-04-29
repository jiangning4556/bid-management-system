<template>
  <el-card class="project-items-table">
    <template #header>
      <div class="card-header">
        <span>物品清单</span>
        <el-button type="primary" :icon="Plus" @click="$emit('add-item')">
          添加物品
        </el-button>
      </div>
    </template>

    <el-table
      :data="items"
      style="width: 100%"
      row-key="id"
      :expand-row-keys="expandedRowKeys"
      @expand-change="$emit('expand-change', $event)"
    >
      <el-table-column type="expand">
        <template #default="{ row }">
          <div v-if="row.quotes && row.quotes.length > 0" class="quotes-detail-container">
            <div class="quotes-detail-header">供应商报价详情 ({{ row.quotes.length }})</div>
            <el-table :data="row.quotes" class="nested-table">
              <el-table-column prop="supplier.name" label="供应商" width="150" />
              <el-table-column label="单价" width="100" align="right">
                <template #default="{ row: quote }">
                  ¥{{ quote.price }}
                </template>
              </el-table-column>
              <el-table-column prop="quantity" label="数量" width="80" align="right" />
              <el-table-column label="总价" width="120" align="right">
                <template #default="{ row: quote }">
                  ¥{{ (quote.price * quote.quantity).toLocaleString() }}
                </template>
              </el-table-column>
              <el-table-column prop="brand" label="品牌" width="100" />
              <el-table-column prop="contact" label="联系人" width="100" />
              <el-table-column prop="phone" label="联系电话" width="130" />
              <el-table-column prop="remarks" label="备注" min-width="150" show-overflow-tooltip />
              <el-table-column label="状态" width="80" align="center">
                <template #default="{ row: quote }">
                  <el-tag :type="quote.isSelected ? 'success' : 'info'" size="small">
                    {{ quote.isSelected ? '已选' : '未选' }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column label="操作" width="120" fixed="right">
                <template #default="{ row: quote }">
                  <el-button type="primary" link size="small" @click="$emit('edit-quote', { item: row, quote })">
                    编辑
                  </el-button>
                  <el-button
                    :type="quote.isSelected ? 'warning' : 'success'"
                    link
                    size="small"
                    @click="$emit('toggle-quote', { item: row, quote })"
                  >
                    {{ quote.isSelected ? '取消' : '选中' }}
                  </el-button>
                </template>
              </el-table-column>
            </el-table>
          </div>
          <div v-else class="no-quotes-hint">
            <el-empty description="暂无报价" :image-size="60" />
          </div>
        </template>
      </el-table-column>
      <el-table-column prop="item.name" label="物品名称" min-width="150" />
      <el-table-column prop="item.spec" label="规格" width="120" />
      <el-table-column prop="quantity" label="数量" width="80" align="right" />
      <el-table-column prop="item.unit" label="单位" width="60" />
      <el-table-column label="报价概况" min-width="250">
        <template #default="{ row }">
          <div v-if="row.quotes && row.quotes.length > 0" class="quotes-summary">
            <div v-for="quote in row.quotes" :key="quote.id" class="quote-summary-item">
              <span class="supplier-name">{{ quote.supplier?.name }}</span>
              <span class="quote-price">¥{{ quote.price }}/{{ row.item?.unit }}</span>
              <el-tag v-if="quote.isSelected" type="success" size="small">已选</el-tag>
            </div>
          </div>
          <span v-else class="text-info">暂无报价</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="220" fixed="right">
        <template #default="{ row }">
          <el-button type="primary" link size="small" @click="$emit('edit-item', row)">
            编辑
          </el-button>
          <el-button type="primary" link size="small" @click="$emit('manage-quotes', row)">
            管理报价
          </el-button>
          <el-button type="danger" link size="small" @click="$emit('delete-item', row)">
            删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>
  </el-card>
</template>

<script setup lang="ts">
import { Plus } from '@element-plus/icons-vue'
import type { ConsultProjectItem } from '@/types'

interface Props {
  items: ConsultProjectItem[]
  expandedRowKeys: string[]
}

defineProps<Props>()

interface Emits {
  (e: 'add-item'): void
  (e: 'expand-change', row: any): void
  (e: 'edit-quote', payload: { item: ConsultProjectItem; quote: any }): void
  (e: 'toggle-quote', payload: { item: ConsultProjectItem; quote: any }): void
  (e: 'edit-item', item: ConsultProjectItem): void
  (e: 'manage-quotes', item: ConsultProjectItem): void
  (e: 'delete-item', item: ConsultProjectItem): void
}

defineEmits<Emits>()
</script>

<style scoped lang="scss">
.project-items-table {
  margin-top: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.quotes-detail-container {
  padding: 10px 20px;
}

.quotes-detail-header {
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 10px;
}

.nested-table {
  :deep(.el-table__header) {
    background-color: #f5f7fa;
  }
}

.no-quotes-hint {
  padding: 20px;
  text-align: center;
}

.quotes-summary {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.quote-summary-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
}

.supplier-name {
  color: #409eff;
  font-weight: 500;
}

.quote-price {
  color: #f56c6c;
  font-weight: 500;
}

.text-info {
  color: #909399;
  font-size: 13px;
}
</style>
