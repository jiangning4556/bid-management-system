<template>
  <el-dialog
    :model-value="visible"
    :title="`${itemName || ''} - 供应商报价`"
    width="1200px"
    @update:model-value="$emit('update:visible', $event)"
  >
    <div class="quote-management">
      <el-row :gutter="20">
        <!-- Left Column: Quotes List and Form -->
        <el-col :span="14">
          <!-- Quotes List -->
          <div class="quotes-list">
            <div class="list-header">
              <span>已有报价 ({{ quotes.length }})</span>
            </div>
            <el-table :data="quotes" style="width: 100%">
              <el-table-column prop="supplier.name" label="供应商" width="120" />
              <el-table-column prop="price" label="单价" width="80" align="right">
                <template #default="{ row }">
                  ¥{{ row.price }}
                </template>
              </el-table-column>
              <el-table-column prop="quantity" label="数量" width="60" align="right" />
              <el-table-column prop="totalAmount" label="总价" width="80" align="right">
                <template #default="{ row }">
                  ¥{{ row.totalAmount?.toLocaleString() || (row.price * row.quantity).toLocaleString() }}
                </template>
              </el-table-column>
              <el-table-column prop="brand" label="品牌" width="80" />
              <el-table-column label="状态" width="60" align="center">
                <template #default="{ row }">
                  <el-tag :type="row.isSelected ? 'success' : 'info'" size="small">
                    {{ row.isSelected ? '已选' : '未选' }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column label="操作" width="150" fixed="right">
                <template #default="{ row }">
                  <el-button type="primary" link size="small" @click="$emit('edit-quote', row)">
                    编辑
                  </el-button>
                  <el-button type="danger" link size="small" @click="$emit('delete-quote', row)">
                    删除
                  </el-button>
                </template>
              </el-table-column>
            </el-table>
          </div>

          <!-- Add Quote Form -->
          <el-divider />
          <div class="add-quote">
            <div class="form-header">
              <span>{{ editingQuoteId ? '编辑报价' : '添加报价' }}</span>
              <el-button v-if="editingQuoteId" link @click="cancelEdit">取消编辑</el-button>
            </div>
            <el-alert
              :title="`物品数量：${itemQuantity}`"
              type="info"
              :closable="false"
              style="margin-bottom: 15px"
            />
            <el-form
              ref="formRef"
              :model="formData"
              :rules="rules"
              label-width="80px"
              @submit.prevent="$emit('submit-quote', formData)"
            >
              <el-row :gutter="10">
                <el-col :span="12">
                  <el-form-item label="供应商" prop="supplierId">
                    <el-select
                      v-model="formData.supplierId"
                      placeholder="请选择供应商"
                      filterable
                      style="width: 100%"
                    >
                      <el-option
                        v-for="supplier in suppliers"
                        :key="supplier.id"
                        :label="supplier.name"
                        :value="supplier.id"
                      />
                    </el-select>
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="单价" prop="price">
                    <el-input-number
                      v-model="formData.price"
                      :min="0"
                      :precision="2"
                      :step="1"
                      style="width: 100%"
                    />
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="品牌">
                    <el-input v-model="formData.brand" placeholder="请输入品牌" />
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="联系人">
                    <el-input v-model="formData.contact" placeholder="请输入联系人" />
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="联系电话">
                    <el-input v-model="formData.phone" placeholder="请输入联系电话" />
                  </el-form-item>
                </el-col>
              </el-row>
              <el-form-item label="备注">
                <el-input
                  v-model="formData.remarks"
                  type="textarea"
                  :rows="2"
                  placeholder="请输入备注"
                />
              </el-form-item>
              <el-form-item>
                <el-checkbox v-model="formData.isSelected">设为选中报价</el-checkbox>
              </el-form-item>
              <el-form-item>
                <el-button type="primary" native-type="submit" :loading="submitting">
                  {{ editingQuoteId ? '保存修改' : '添加报价' }}
                </el-button>
                <el-button @click="resetForm">重置</el-button>
              </el-form-item>
            </el-form>
          </div>
        </el-col>

        <!-- Right Column: Price History -->
        <el-col :span="10">
          <PriceHistoryPanel
            v-if="itemId"
            :item-id="itemId"
            :project-id="projectId"
            mode="consult"
          />
          <el-empty v-else description="请先选择物品" :image-size="80" />
        </el-col>
      </el-row>
    </div>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import type { FormInstance, FormRules } from 'element-plus'
import type { Supplier, SupplierQuote } from '@/types'
import PriceHistoryPanel from '@/components/PriceHistoryPanel.vue'

interface Props {
  visible: boolean
  itemName: string
  itemId?: string  // 添加 itemId prop
  projectId?: string  // 添加 projectId prop
  quotes: SupplierQuote[]
  suppliers: Supplier[]
  submitting: boolean
  itemQuantity: number // 物品数量，报价时自动使用
}

const props = withDefaults(defineProps<Props>(), {
  itemId: '',
  projectId: ''
})

interface Emits {
  (e: 'update:visible', value: boolean): void
  (e: 'edit-quote', quote: SupplierQuote): void
  (e: 'toggle-quote', quote: SupplierQuote): void
  (e: 'delete-quote', quote: SupplierQuote): void
  (e: 'submit-quote', data: any): void
}

const emit = defineEmits<Emits>()

const formRef = ref<FormInstance>()
const editingQuoteId = ref<string | null>(null)

const formData = reactive({
  supplierId: '',
  price: 0,
  brand: '',
  contact: '',
  phone: '',
  remarks: '',
  isSelected: false,
})

const rules: FormRules = {
  supplierId: [
    { required: true, message: '请选择供应商', trigger: 'change' },
  ],
  price: [
    { required: true, message: '请输入单价', trigger: 'blur' },
  ],
}

function resetForm() {
  formRef.value?.resetFields()
  editingQuoteId.value = null
}

function cancelEdit() {
  resetForm()
}

defineExpose({
  resetForm,
  editingQuoteId,
  setEditQuote: (quote: SupplierQuote) => {
    editingQuoteId.value = quote.id
    Object.assign(formData, {
      supplierId: quote.supplierId,
      price: quote.price,
      brand: quote.brand || '',
      contact: quote.contact || '',
      phone: quote.phone || '',
      remarks: quote.remarks || '',
      isSelected: quote.isSelected,
    })
  },
})
</script>

<style scoped lang="scss">
.quote-management {
  .quotes-list {
    margin-bottom: 16px;

    .list-header {
      font-weight: 500;
      margin-bottom: 10px;
    }
  }

  .add-quote {
    .form-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 15px;
      font-weight: 500;
    }
  }
}
</style>
