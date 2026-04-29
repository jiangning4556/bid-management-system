<template>
  <div class="payments-container page-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>收款管理</span>
          <el-select
            v-model="selectedProject"
            placeholder="选择项目"
            clearable
            style="width: 250px"
            @change="handleProjectChange"
          >
            <el-option label="全部项目" value="" />
            <el-option v-for="p in projects" :key="p.id" :label="p.name" :value="p.id" />
          </el-select>
        </div>
      </template>

      <!-- Statistics Cards -->
      <div class="stats-cards">
        <div class="stat-card">
          <div class="stat-icon stat-icon-payable">
            <el-icon><Wallet /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-label">应付金额</div>
            <div class="stat-value">¥{{ formatAmount(stats.totalPayable) }}</div>
            <div class="stat-note">所有项目金额总和</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon stat-icon-paid">
            <el-icon><Check /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-label">已付总额</div>
            <div class="stat-value text-success">¥{{ formatAmount(stats.totalPaid) }}</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon stat-icon-receivable">
            <el-icon><Coin /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-label">应收金额</div>
            <div class="stat-value">¥{{ formatAmount(stats.totalReceivable) }}</div>
            <div class="stat-note">所有项目合同金额总和</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon stat-icon-received">
            <el-icon><SuccessFilled /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-label">已收金额</div>
            <div class="stat-value text-success">¥{{ formatAmount(stats.totalReceived) }}</div>
          </div>
        </div>
      </div>

      <!-- Two Column Layout -->
      <el-row :gutter="20" class="mt-20">
        <!-- Left: Supplier Payments -->
        <el-col :span="12">
          <el-card class="inner-card" shadow="never">
            <template #header>
              <div class="card-header">
                <span class="section-title">供应商付款</span>
                <el-button type="primary" size="small" @click="handleAddPayment">
                  <el-icon><Plus /></el-icon> 添加
                </el-button>
              </div>
            </template>
            <el-table
              :data="supplierPayments"
              style="width: 100%"
              v-loading="loading"
              height="400"
            >
              <el-table-column prop="supplier.name" label="供应商" min-width="100" show-overflow-tooltip>
                <template #default="{ row }">
                  {{ row.supplier?.name || '-' }}
                </template>
              </el-table-column>
              <el-table-column prop="amount" label="金额" width="90" align="right">
                <template #default="{ row }">
                  ¥{{ formatAmount(row.amount) }}
                </template>
              </el-table-column>
              <el-table-column prop="paymentTime" label="付款日期" width="100">
                <template #default="{ row }">
                  {{ formatDate(row.paymentTime) }}
                </template>
              </el-table-column>
              <el-table-column prop="paymentMethod" label="方式" width="80" show-overflow-tooltip>
                <template #default="{ row }">
                  {{ row.paymentMethod || '-' }}
                </template>
              </el-table-column>
              <el-table-column label="凭证" width="70" align="center">
                <template #default="{ row }">
                  <el-button
                    v-if="row.proofUrl"
                    type="success"
                    link
                    size="small"
                    @click="handleViewProof(row.proofUrl)"
                  >
                    查看
                  </el-button>
                  <el-upload
                    v-else
                    :auto-upload="false"
                    :show-file-list="false"
                    accept="image/*"
                    :on-change="(file: any) => handleUploadPaymentVoucher(row, file)"
                  >
                    <el-button type="primary" link size="small">上传</el-button>
                  </el-upload>
                </template>
              </el-table-column>
            </el-table>
            <div v-if="supplierPayments.length === 0 && !loading" class="empty-text">
              暂无付款记录
            </div>
          </el-card>
        </el-col>

        <!-- Right: Customer Receipts -->
        <el-col :span="12">
          <el-card class="inner-card" shadow="never">
            <template #header>
              <div class="card-header">
                <span class="section-title">甲方收款</span>
                <el-button type="primary" size="small" @click="handleAddReceipt">
                  <el-icon><Plus /></el-icon> 添加
                </el-button>
              </div>
            </template>
            <el-table
              :data="customerReceipts"
              style="width: 100%"
              v-loading="loading"
              height="400"
            >
              <el-table-column prop="amount" label="收款金额" width="90" align="right">
                <template #default="{ row }">
                  ¥{{ formatAmount(row.amount) }}
                </template>
              </el-table-column>
              <el-table-column prop="ratio" label="比例" width="60" align="center">
                <template #default="{ row }">
                  {{ row.ratio ? row.ratio + '%' : '-' }}
                </template>
              </el-table-column>
              <el-table-column prop="receiptTime" label="收款日期" width="100">
                <template #default="{ row }">
                  {{ formatDate(row.receiptTime) }}
                </template>
              </el-table-column>
              <el-table-column prop="receiptMethod" label="方式" width="80" show-overflow-tooltip>
                <template #default="{ row }">
                  {{ row.receiptMethod || '-' }}
                </template>
              </el-table-column>
              <el-table-column prop="estimatedPaymentTime" label="预计付款" width="100">
                <template #default="{ row }">
                  {{ formatDate(row.estimatedPaymentTime) || '-' }}
                </template>
              </el-table-column>
              <el-table-column label="凭证" width="70" align="center">
                <template #default="{ row }">
                  <el-button
                    v-if="row.proofUrl"
                    type="success"
                    link
                    size="small"
                    @click="handleViewProof(row.proofUrl)"
                  >
                    查看
                  </el-button>
                  <el-upload
                    v-else
                    :auto-upload="false"
                    :show-file-list="false"
                    accept="image/*"
                    :on-change="(file: any) => handleUploadReceiptVoucher(row, file)"
                  >
                    <el-button type="primary" link size="small">上传</el-button>
                  </el-upload>
                </template>
              </el-table-column>
            </el-table>
            <div v-if="customerReceipts.length === 0 && !loading" class="empty-text">
              暂无收款记录
            </div>
          </el-card>
        </el-col>
      </el-row>
    </el-card>

    <!-- Add Payment Dialog -->
    <el-dialog
      v-model="paymentDialogVisible"
      title="添加付款记录"
      width="500px"
    >
      <el-form
        ref="paymentFormRef"
        :model="paymentForm"
        :rules="paymentRules"
        label-width="100px"
      >
        <el-form-item label="项目" prop="projectId">
          <el-select
            v-model="paymentForm.projectId"
            placeholder="选择项目"
            style="width: 100%"
            @change="handlePaymentProjectChange"
          >
            <el-option v-for="p in projects" :key="p.id" :label="p.name" :value="p.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="供应商" prop="supplierId">
          <el-select
            v-model="paymentForm.supplierId"
            placeholder="选择供应商"
            style="width: 100%"
            filterable
          >
            <el-option
              v-for="supplier in availableSuppliers"
              :key="supplier.id"
              :label="supplier.name"
              :value="supplier.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="金额" prop="amount">
          <el-input-number
            v-model="paymentForm.amount"
            :min="0"
            :precision="2"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="付款日期" prop="paymentTime">
          <el-date-picker
            v-model="paymentForm.paymentTime"
            type="date"
            placeholder="选择日期"
            style="width: 100%"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>
        <el-form-item label="付款方式">
          <el-select v-model="paymentForm.paymentMethod" placeholder="选择方式" style="width: 100%">
            <el-option v-for="method in paymentMethods" :key="method" :label="method" :value="method" />
          </el-select>
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="paymentForm.remarks" type="textarea" :rows="2" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="paymentDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitPayment" :loading="paymentSubmitting">
          确定
        </el-button>
      </template>
    </el-dialog>

    <!-- Add Receipt Dialog -->
    <el-dialog
      v-model="receiptDialogVisible"
      title="添加收款记录"
      width="500px"
    >
      <el-form
        ref="receiptFormRef"
        :model="receiptForm"
        :rules="receiptRules"
        label-width="100px"
      >
        <el-form-item label="项目" prop="projectId">
          <el-select
            v-model="receiptForm.projectId"
            placeholder="选择项目"
            style="width: 100%"
          >
            <el-option v-for="p in projects" :key="p.id" :label="p.name" :value="p.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="收款金额" prop="amount">
          <el-input-number
            v-model="receiptForm.amount"
            :min="0"
            :precision="2"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="收款比例">
          <el-input-number
            v-model="receiptForm.ratio"
            :min="0"
            :max="100"
            :precision="2"
            style="width: 100%"
          />
          <span style="margin-left: 8px">%</span>
        </el-form-item>
        <el-form-item label="收款日期" prop="receiptTime">
          <el-date-picker
            v-model="receiptForm.receiptTime"
            type="date"
            placeholder="选择日期"
            style="width: 100%"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>
        <el-form-item label="收款方式">
          <el-select v-model="receiptForm.receiptMethod" placeholder="选择方式" style="width: 100%">
            <el-option v-for="method in receiptMethods" :key="method" :label="method" :value="method" />
          </el-select>
        </el-form-item>
        <el-form-item label="预计付款">
          <el-date-picker
            v-model="receiptForm.estimatedPaymentTime"
            type="date"
            placeholder="选择日期"
            style="width: 100%"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="receiptForm.remarks" type="textarea" :rows="2" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="receiptDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitReceipt" :loading="receiptSubmitting">
          确定
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { Plus, Wallet, Check, Coin, SuccessFilled } from '@element-plus/icons-vue'
import { paymentApi, type PaymentRecord, type ReceiptRecord, type OverviewStatistics } from '@/api/payment'
import { bidProjectApi } from '@/api/project'
import { formatDate } from '@/utils/format'

const selectedProject = ref<string>("")
const loading = ref(false)

const projects = ref<any[]>([])
const supplierPayments = ref<PaymentRecord[]>([])
const customerReceipts = ref<ReceiptRecord[]>([])

// Statistics
const stats = ref<OverviewStatistics>({
  totalPayable: 0,
  totalPaid: 0,
  totalReceivable: 0,
  totalReceived: 0,
})

// Payment form
const paymentDialogVisible = ref(false)
const paymentSubmitting = ref(false)
const paymentFormRef = ref<FormInstance>()
const paymentForm = reactive({
  projectId: '',
  supplierId: '',
  amount: 0,
  paymentTime: new Date().toISOString().split('T')[0],
  paymentMethod: '',
  remarks: '',
})

const paymentRules: FormRules = {
  projectId: [{ required: true, message: '请选择项目', trigger: 'change' }],
  supplierId: [{ required: true, message: '请选择供应商', trigger: 'change' }],
  amount: [{ required: true, message: '请输入金额', trigger: 'blur' }],
  paymentTime: [{ required: true, message: '请选择付款时间', trigger: 'change' }],
}

const paymentMethods = ['银行转账', '现金', '支票', '其他']
const availableSuppliers = ref<any[]>([])

// Receipt form
const receiptDialogVisible = ref(false)
const receiptSubmitting = ref(false)
const receiptFormRef = ref<FormInstance>()
const receiptForm = reactive({
  projectId: '',
  amount: 0,
  receiptTime: new Date().toISOString().split('T')[0],
  receiptMethod: '',
  ratio: 0,
  estimatedPaymentTime: '',
  remarks: '',
})

const receiptRules: FormRules = {
  projectId: [{ required: true, message: '请选择项目', trigger: 'change' }],
  amount: [{ required: true, message: '请输入金额', trigger: 'blur' }],
  receiptTime: [{ required: true, message: '请选择收款时间', trigger: 'change' }],
}

const receiptMethods = ['银行转账', '现金', '支票', '其他']

// Load data
async function loadProjects() {
  try {
    const response = await bidProjectApi.getList({ limit: 100 })
    projects.value = Array.isArray(response) ? response : (response.data || [])
  } catch (error) {
    console.error('Failed to load projects:', error)
    projects.value = []
  }
}

async function loadStatistics() {
  try {
    const data = await paymentApi.getOverviewStatistics(selectedProject.value || undefined)
    stats.value = data
  } catch (error) {
    console.error('Failed to load statistics:', error)
  }
}

async function loadSupplierPayments() {
  loading.value = true
  try {
    const data = await paymentApi.getAllPayments(selectedProject.value || undefined)
    supplierPayments.value = data || []
  } catch (error) {
    console.error('Failed to load supplier payments:', error)
    ElMessage.error('加载付款记录失败')
  } finally {
    loading.value = false
  }
}

async function loadCustomerReceipts() {
  loading.value = true
  try {
    const data = await paymentApi.getAllReceipts(selectedProject.value || undefined)
    customerReceipts.value = data || []
  } catch (error) {
    console.error('Failed to load customer receipts:', error)
    ElMessage.error('加载收款记录失败')
  } finally {
    loading.value = false
  }
}

async function loadAllData() {
  await Promise.all([
    loadStatistics(),
    loadSupplierPayments(),
    loadCustomerReceipts(),
  ])
}

async function handleProjectChange() {
  await loadAllData()
}

async function handlePaymentProjectChange() {
  // Load suppliers for the selected project
  if (!paymentForm.projectId) {
    availableSuppliers.value = []
    return
  }

  try {
    const project = await bidProjectApi.getById(paymentForm.projectId)
    // Extract suppliers from project items
    const suppliers: any[] = []
    if (project.projectItems) {
      for (const item of project.projectItems) {
        if (item.suppliers) {
          for (const bs of item.suppliers) {
            if (bs.isSelected && bs.supplier && !suppliers.find(s => s.id === bs.supplier.id)) {
              suppliers.push(bs.supplier)
            }
          }
        }
      }
    }
    availableSuppliers.value = suppliers
  } catch (error) {
    console.error('Failed to load suppliers:', error)
    availableSuppliers.value = []
  }
}

function handleAddPayment() {
  if (projects.value.length === 0) {
    ElMessage.warning('请先创建项目')
    return
  }
  // Pre-select project if filtered
  if (selectedProject.value) {
    paymentForm.projectId = selectedProject.value
    handlePaymentProjectChange()
  }
  paymentDialogVisible.value = true
}

function handleAddReceipt() {
  if (projects.value.length === 0) {
    ElMessage.warning('请先创建项目')
    return
  }
  // Pre-select project if filtered
  if (selectedProject.value) {
    receiptForm.projectId = selectedProject.value
  }
  receiptDialogVisible.value = true
}

async function submitPayment() {
  if (!paymentFormRef.value) return

  try {
    await paymentFormRef.value.validate()
    paymentSubmitting.value = true

    await paymentApi.createPayment({
      projectId: paymentForm.projectId,
      supplierId: paymentForm.supplierId,
      amount: paymentForm.amount,
      paymentTime: paymentForm.paymentTime,
      paymentMethod: paymentForm.paymentMethod,
      remarks: paymentForm.remarks,
    })

    ElMessage.success('付款记录添加成功')
    paymentDialogVisible.value = false
    resetPaymentForm()
    await loadAllData()
  } catch (error: any) {
    if (error !== false) {
      ElMessage.error('添加失败')
    }
  } finally {
    paymentSubmitting.value = false
  }
}

async function submitReceipt() {
  if (!receiptFormRef.value) return

  try {
    await receiptFormRef.value.validate()
    receiptSubmitting.value = true

    await paymentApi.createReceipt({
      projectId: receiptForm.projectId,
      amount: receiptForm.amount,
      receiptTime: receiptForm.receiptTime,
      receiptMethod: receiptForm.receiptMethod,
      ratio: receiptForm.ratio,
      estimatedPaymentTime: receiptForm.estimatedPaymentTime,
      remarks: receiptForm.remarks,
    })

    ElMessage.success('收款记录添加成功')
    receiptDialogVisible.value = false
    resetReceiptForm()
    await loadAllData()
  } catch (error: any) {
    if (error !== false) {
      ElMessage.error('添加失败')
    }
  } finally {
    receiptSubmitting.value = false
  }
}

function resetPaymentForm() {
  paymentForm.projectId = ''
  paymentForm.supplierId = ''
  paymentForm.amount = 0
  paymentForm.paymentTime = new Date().toISOString().split('T')[0]
  paymentForm.paymentMethod = ''
  paymentForm.remarks = ''
  availableSuppliers.value = []
}

function resetReceiptForm() {
  receiptForm.projectId = ''
  receiptForm.amount = 0
  receiptForm.receiptTime = new Date().toISOString().split('T')[0]
  receiptForm.receiptMethod = ''
  receiptForm.ratio = 0
  receiptForm.estimatedPaymentTime = ''
  receiptForm.remarks = ''
}

async function handleUploadPaymentVoucher(row: PaymentRecord, file: any) {
  try {
    await paymentApi.uploadPaymentVoucher(row.id, file.raw)
    ElMessage.success('凭证上传成功')
    await loadSupplierPayments()
  } catch (error) {
    ElMessage.error('上传失败')
  }
}

async function handleUploadReceiptVoucher(row: ReceiptRecord, file: any) {
  try {
    await paymentApi.uploadReceiptVoucher(row.id, file.raw)
    ElMessage.success('凭证上传成功')
    await loadCustomerReceipts()
  } catch (error) {
    ElMessage.error('上传失败')
  }
}

function handleViewProof(url: string) {
  if (!url) return
  const fullUrl = url.startsWith('http') ? url : `${import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || ''}${url}`
  window.open(fullUrl, '_blank')
}

function formatAmount(amount: number): string {
  if (!amount) return '0'
  return amount.toLocaleString()
}

onMounted(() => {
  loadProjects()
  loadAllData()
})
</script>

<style scoped>
.payments-container {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.section-title {
  font-size: 16px;
  font-weight: 500;
}

.stats-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.stat-card {
  display: flex;
  align-items: center;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e9ecef;
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  margin-right: 12px;
}

.stat-icon-payable {
  background: #fff3e0;
  color: #f57c00;
}

.stat-icon-paid {
  background: #e8f5e9;
  color: #43a047;
}

.stat-icon-receivable {
  background: #e3f2fd;
  color: #1e88e5;
}

.stat-icon-received {
  background: #f3e5f5;
  color: #8e24aa;
}

.stat-content {
  flex: 1;
}

.stat-label {
  font-size: 14px;
  color: #6c757d;
  margin-bottom: 4px;
}

.stat-value {
  font-size: 20px;
  font-weight: 600;
  color: #212529;
}

.stat-note {
  font-size: 11px;
  color: #909399;
  margin-top: 2px;
}

.text-success {
  color: #43a047 !important;
}

.mt-20 {
  margin-top: 20px;
}

.inner-card {
  height: 100%;
}

.inner-card :deep(.el-card__header) {
  padding: 12px 16px;
  background: #f8f9fa;
}

.inner-card :deep(.el-card__body) {
  padding: 12px 16px;
}

.empty-text {
  text-align: center;
  padding: 40px;
  color: #999;
}
</style>
