<template>
  <div class="bid-project-detail-container page-container">
    <el-page-header @back="goBack">
      <template #content>
        <div class="page-title">
          <h2>{{ project?.name || '项目详情' }}</h2>
          <el-tag :type="getStatusType(project?.status)" class="status-tag">
            {{ getStatusLabel(project?.status) }}
          </el-tag>
        </div>
      </template>
      <template #extra>
        <el-button type="primary" @click="handleEditProject">编辑项目</el-button>
      </template>
    </el-page-header>

    <!-- Project Info Card -->
    <el-card class="mt-20">
      <template #header>
        <span>项目信息</span>
      </template>
      <el-descriptions :column="2" border>
        <el-descriptions-item label="项目编号">{{ project?.projectCode || '-' }}</el-descriptions-item>
        <el-descriptions-item label="客户">{{ project?.customer || '-' }}</el-descriptions-item>
        <el-descriptions-item label="合同日期">{{ project?.contractDate || '-' }}</el-descriptions-item>
        <el-descriptions-item label="项目状态">
          <el-tag :type="getStatusType(project?.status)" size="small">
            {{ getStatusLabel(project?.status) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="合同金额">¥{{ formatAmount(project?.contractAmount) }}</el-descriptions-item>
        <el-descriptions-item label="项目金额">¥{{ formatAmount(project?.totalAmount) }}</el-descriptions-item>
        <el-descriptions-item label="项目地址" :span="2">{{ project?.address || '-' }}</el-descriptions-item>
        <el-descriptions-item label="备注" :span="2">{{ project?.remarks || '-' }}</el-descriptions-item>
      </el-descriptions>
    </el-card>

    <el-row :gutter="20" class="mt-20">
      <el-col :span="16">
        <!-- Items -->
        <el-card>
          <template #header>
            <div class="card-header">
              <span>物品清单</span>
              <el-button type="primary" :icon="Plus" @click="itemSelectorVisible = true">
                添加物品
              </el-button>
            </div>
          </template>
          <el-table
            :data="projectItems"
            style="width: 100%"
            row-key="id"
            :expand-row-keys="expandedRowKeys"
            @expand-change="handleExpandChange"
          >
            <el-table-column type="expand">
              <template #default="{ row }">
                <div v-if="row.suppliers && row.suppliers.length > 0" class="suppliers-detail-container">
                  <div class="suppliers-detail-header">供应商详情 ({{ row.suppliers.length }})</div>
                  <el-table :data="row.suppliers" class="nested-table">
                    <el-table-column prop="supplier.name" label="供应商" width="150" />
                    <el-table-column label="金额" width="120" align="right">
                      <template #default="{ row: supplier }">
                        ¥{{ supplier.amount?.toLocaleString() }}
                      </template>
                    </el-table-column>
                    <el-table-column label="进度" width="100" align="center">
                      <template #default="{ row: supplier }">
                        <el-tag :type="getProgressType(supplier.progress)" size="small">
                          {{ getProgressLabel(supplier.progress) }}
                        </el-tag>
                      </template>
                    </el-table-column>
                    <el-table-column label="付款状态" width="100" align="center">
                      <template #default="{ row: supplier }">
                        <el-tag :type="getPaymentStatusType(supplier.paymentStatus)" size="small">
                          {{ getPaymentStatusLabel(supplier.paymentStatus) }}
                        </el-tag>
                      </template>
                    </el-table-column>
                    <el-table-column prop="remarks" label="备注" min-width="150" show-overflow-tooltip />
                    <el-table-column label="状态" width="80" align="center">
                      <template #default="{ row: supplier }">
                        <el-tag :type="supplier.isSelected ? 'success' : 'info'" size="small">
                          {{ supplier.isSelected ? '已选' : '未选' }}
                        </el-tag>
                      </template>
                    </el-table-column>
                    <el-table-column label="操作" width="150" fixed="right">
                      <template #default="{ row: supplier }">
                        <el-button
                          :type="supplier.isSelected ? 'warning' : 'success'"
                          link
                          size="small"
                          @click="handleToggleSupplier(supplier)"
                        >
                          {{ supplier.isSelected ? '取消选择' : '选择' }}
                        </el-button>
                      </template>
                    </el-table-column>
                  </el-table>
                </div>
                <div v-else class="no-suppliers-hint">
                  <el-empty description="暂无供应商" :image-size="60" />
                </div>
              </template>
            </el-table-column>
            <el-table-column prop="item.name" label="物品名称" min-width="150" />
            <el-table-column prop="quantity" label="数量" width="80" align="right" />
            <el-table-column prop="item.unit" label="单位" width="60" />
            <el-table-column label="供应商概况" min-width="200">
              <template #default="{ row }">
                <div v-if="row.suppliers && row.suppliers.length > 0" class="suppliers-summary">
                  <div v-for="supplier in row.suppliers" :key="supplier.id" class="supplier-summary-item">
                    <el-tag v-if="supplier.isSelected" type="success" size="small">已选</el-tag>
                    <span class="supplier-name">{{ supplier.supplier?.name }}</span>
                    <span class="supplier-amount">¥{{ supplier.amount }}</span>
                  </div>
                </div>
                <span v-else class="text-info">暂无供应商</span>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="210" fixed="right">
              <template #default="{ row }">
                <el-button type="primary" link size="small" @click="handleManageSuppliers(row)">
                  管理供应商
                </el-button>
                <el-button type="info" link size="small" @click="handleEditItem(row)">
                  编辑
                </el-button>
                <el-button type="danger" link size="small" @click="handleDeleteItem(row)">
                  删除
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>

      <el-col :span="8">
        <!-- Statistics -->
        <el-card>
          <template #header>
            <span>付款统计</span>
          </template>
          <div class="payment-stats">
            <el-row :gutter="20">
              <el-col :span="12">
                <div class="stat-item">
                  <span class="stat-label">应付总额：</span>
                  <span class="stat-value text-primary">¥{{ formatAmount(stats.totalPayable) }}</span>
                </div>
              </el-col>
              <el-col :span="12">
                <div class="stat-item">
                  <span class="stat-label">已付金额：</span>
                  <span class="stat-value text-success">¥{{ formatAmount(stats.totalPaid) }}</span>
                </div>
              </el-col>
            </el-row>

            <el-divider />

            <el-row :gutter="20">
              <el-col :span="12">
                <div class="stat-item">
                  <span class="stat-label">未付金额：</span>
                  <span class="stat-value" :class="stats.agingAnalysis.over90days > 0 ? 'text-danger' : 'text-warning'">
                    ¥{{ formatAmount(stats.totalUnpaid) }}
                  </span>
                </div>
              </el-col>
              <el-col :span="12">
                <div class="stat-item">
                  <span class="stat-label">付款进度：</span>
                  <span class="stat-value">{{ stats.paymentProgress.toFixed(1) }}%</span>
                </div>
              </el-col>
            </el-row>

            <div class="progress-container">
              <el-progress
                :percentage="stats.paymentProgress"
                :color="getProgressColor(stats.paymentProgress)"
                :stroke-width="20"
              />
            </div>

            <!-- Aging Analysis -->
            <el-divider content-position="left">账龄分析</el-divider>
            <div class="aging-analysis">
              <div class="aging-item">
                <span class="aging-label">30天内：</span>
                <span class="aging-value aging-safe">¥{{ formatAmount(stats.agingAnalysis.within30days) }}</span>
              </div>
              <div class="aging-item">
                <span class="aging-label">30-60天：</span>
                <span class="aging-value aging-normal">¥{{ formatAmount(stats.agingAnalysis.within60days) }}</span>
              </div>
              <div class="aging-item">
                <span class="aging-label">60-90天：</span>
                <span class="aging-value aging-warning">¥{{ formatAmount(stats.agingAnalysis.within90days) }}</span>
              </div>
              <div class="aging-item">
                <span class="aging-label">90天以上：</span>
                <span class="aging-value aging-danger">¥{{ formatAmount(stats.agingAnalysis.over90days) }}</span>
              </div>
            </div>
          </div>
        </el-card>

        <!-- Payment Records -->
        <el-card class="mt-20">
          <template #header>
            <div class="card-header">
              <span>付款记录</span>
              <el-button type="primary" link @click="handleAddPayment">
                添加记录
              </el-button>
            </div>
          </template>
          <el-empty v-if="paymentRecords.length === 0" description="暂无付款记录" :image-size="80" />
          <el-table v-else :data="paymentRecords" style="width: 100%">
            <el-table-column prop="supplier.name" label="供应商" width="120" />
            <el-table-column label="金额" width="100" align="right">
              <template #default="{ row }">
                ¥{{ row.amount?.toLocaleString() }}
              </template>
            </el-table-column>
            <el-table-column prop="paymentTime" label="付款日期" width="110" />
            <el-table-column prop="paymentMethod" label="付款方式" width="90" />
            <el-table-column label="凭证" width="80" align="center">
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
            <el-table-column prop="remarks" label="备注" min-width="100" show-overflow-tooltip />
            <el-table-column label="操作" width="80" fixed="right">
              <template #default="{ row }">
                <el-button type="danger" link size="small" @click="handleDeletePayment(row)">
                  删除
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>

        <!-- Receipt Records -->
        <el-card class="mt-20">
          <template #header>
            <div class="card-header">
              <span>收款记录</span>
              <el-button type="primary" link @click="handleAddReceipt">
                添加记录
              </el-button>
            </div>
          </template>
          <el-empty v-if="receiptRecords.length === 0" description="暂无收款记录" :image-size="80" />
          <el-table v-else :data="receiptRecords" style="width: 100%">
            <el-table-column label="金额" width="100" align="right">
              <template #default="{ row }">
                ¥{{ row.amount?.toLocaleString() }}
              </template>
            </el-table-column>
            <el-table-column prop="receiptTime" label="收款时间" width="110" />
            <el-table-column prop="receiptMethod" label="收款方式" width="90" />
            <el-table-column label="发票状态" width="90">
              <template #default="{ row }">
                <el-tag :type="row.invoiceStatus === 'invoiced' ? 'success' : 'info'" size="small">
                  {{ row.invoiceStatus === 'invoiced' ? '已开票' : '未开票' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="凭证" width="80" align="center">
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
            <el-table-column prop="estimatedPaymentTime" label="预计付款时间" width="110" />
            <el-table-column prop="remarks" label="备注" min-width="100" show-overflow-tooltip />
            <el-table-column label="操作" width="120" fixed="right">
              <template #default="{ row }">
                <el-button type="primary" link size="small" @click="handleEditReceipt(row)">
                  编辑
                </el-button>
                <el-button type="danger" link size="small" @click="handleDeleteReceipt(row)">
                  删除
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>

    <!-- Item Selector -->
    <ItemSelector
      v-model="itemSelectorVisible"
      :categories="categories"
      :items="allItems"
      @confirm="handleItemsSelected"
    />

    <!-- Edit Project Dialog -->
    <el-dialog
      v-model="editDialogVisible"
      title="编辑项目信息"
      width="600px"
    >
      <el-form
        ref="editFormRef"
        :model="editForm"
        :rules="editRules"
        label-width="100px"
      >
        <el-form-item label="项目名称" prop="name">
          <el-input v-model="editForm.name" placeholder="请输入项目名称" />
        </el-form-item>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="项目编号" prop="projectCode">
              <el-input v-model="editForm.projectCode" placeholder="请输入项目编号" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="客户" prop="customer">
              <el-input v-model="editForm.customer" placeholder="请输入客户" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="项目地址" prop="address">
          <el-input v-model="editForm.address" placeholder="请输入项目地址" />
        </el-form-item>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="合同日期" prop="contractDate">
              <el-date-picker
                v-model="editForm.contractDate"
                type="date"
                placeholder="选择日期"
                style="width: 100%"
                value-format="YYYY-MM-DD"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="合同金额" prop="contractAmount">
              <el-input-number
                v-model="editForm.contractAmount"
                :min="0"
                :precision="2"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="项目状态" prop="status">
              <el-select v-model="editForm.status" placeholder="选择状态" style="width: 100%">
                <el-option label="准备中" value="preparing" />
                <el-option label="进行中" value="in_progress" />
                <el-option label="已验收" value="accepted" />
                <el-option label="已结案" value="completed" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="备注" prop="remarks">
          <el-input v-model="editForm.remarks" type="textarea" :rows="3" placeholder="请输入备注" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitProjectEdit" :loading="editSubmitting">
          保存
        </el-button>
      </template>
    </el-dialog>

    <!-- Supplier Management Dialog -->
    <el-dialog
      v-model="supplierDialogVisible"
      :title="`${currentProjectItem?.item?.name || ''} - 供应商管理`"
      width="1200px"
    >
      <div class="supplier-management">
        <el-row :gutter="20">
          <!-- Left Column: Suppliers List and Form -->
          <el-col :span="14">
            <!-- Existing Suppliers List -->
            <div class="suppliers-list" v-if="currentProjectItem?.suppliers && currentProjectItem.suppliers.length > 0">
              <div class="list-header">
                <span>已有供应商 ({{ currentProjectItem.suppliers.length }})</span>
              </div>
              <el-table :data="currentProjectItem.suppliers" style="width: 100%">
                <el-table-column prop="supplier.name" label="供应商" width="120" />
                <el-table-column label="单价" width="80" align="right">
                  <template #default="{ row }">
                    ¥{{ row.price }}
                  </template>
                </el-table-column>
                <el-table-column label="金额" width="80" align="right">
                  <template #default="{ row }">
                    ¥{{ row.amount?.toLocaleString() }}
                  </template>
                </el-table-column>
                <el-table-column label="进度" width="100">
                  <template #default="{ row }">
                    <el-select
                      :model-value="row.progress"
                      @change="handleProgressChange(row, $event)"
                      size="small"
                      style="width: 100%"
                    >
                      <el-option label="已下单" value="ordered" />
                      <el-option label="生产中" value="producing" />
                      <el-option label="已发货" value="shipped" />
                      <el-option label="已收货" value="delivered" />
                      <el-option label="已完成" value="completed" />
                    </el-select>
                  </template>
                </el-table-column>
                <el-table-column label="操作" width="80" fixed="right">
                  <template #default="{ row }">
                    <el-button type="primary" link size="small" @click="handleEditSupplier(row)">
                      编辑
                    </el-button>
                    <el-button type="danger" link size="small" @click="handleDeleteSupplier(row)">
                      删除
                    </el-button>
                  </template>
                </el-table-column>
              </el-table>
            </div>
            <div v-else class="no-suppliers-hint">
              <el-empty description="暂无供应商" :image-size="60" />
            </div>

            <!-- Add/Edit Supplier Form -->
            <div class="add-supplier-form">
              <div class="form-header">{{ editingSupplierId ? '编辑供应商' : '添加供应商' }}</div>
              <el-form
                ref="supplierFormRef"
                :model="supplierForm"
                :rules="supplierRules"
                label-width="80px"
              >
                <el-row :gutter="10">
                  <el-col :span="12">
                    <el-form-item label="供应商" prop="supplierId">
                      <!-- Show supplier name when editing (disabled) -->
                      <el-input
                        v-if="editingSupplierId"
                        :value="currentEditingSupplierName"
                        disabled
                        placeholder="供应商"
                      />
                      <!-- Show supplier select when adding new -->
                      <el-select
                        v-else
                        v-model="supplierForm.supplierId"
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
                  </el-col>
                  <el-col :span="12">
                    <el-form-item label="单价" prop="price">
                      <el-input-number
                        v-model="supplierForm.price"
                        :min="0"
                        :precision="2"
                        style="width: 100%"
                      />
                    </el-form-item>
                  </el-col>
                </el-row>
                <el-row :gutter="10">
                  <el-col :span="12">
                    <el-form-item label="总金额">
                      <span class="total-amount-display">
                        ¥{{ supplierTotalAmount.toLocaleString() }}
                        <span class="quantity-hint">（× {{ currentProjectItem?.quantity || 1 }}）</span>
                      </span>
                    </el-form-item>
                  </el-col>
                  <el-col :span="12">
                    <el-form-item label="进度">
                      <el-select v-model="supplierForm.progress" placeholder="选择进度" style="width: 100%">
                        <el-option label="已下单" value="ordered" />
                        <el-option label="生产中" value="producing" />
                        <el-option label="已发货" value="shipped" />
                        <el-option label="已收货" value="delivered" />
                        <el-option label="已完成" value="completed" />
                      </el-select>
                    </el-form-item>
                  </el-col>
                </el-row>
                <el-row :gutter="10">
                  <el-col :span="12">
                    <el-form-item label="付款状态">
                      <el-select v-model="supplierForm.paymentStatus" placeholder="选择付款状态" style="width: 100%">
                        <el-option label="未付款" value="unpaid" />
                        <el-option label="部分付款" value="partial" />
                        <el-option label="已付款" value="paid" />
                      </el-select>
                    </el-form-item>
                  </el-col>
                  <el-col :span="12">
                    <el-form-item label="付款时间">
                      <el-date-picker
                        v-model="supplierForm.paymentTime"
                        type="date"
                        placeholder="选择日期"
                        style="width: 100%"
                        value-format="YYYY-MM-DD"
                      />
                    </el-form-item>
                  </el-col>
                </el-row>
                <el-form-item label="备注">
                  <el-input v-model="supplierForm.remarks" type="textarea" :rows="2" />
                </el-form-item>
              </el-form>
            </div>
          </el-col>

          <!-- Right Column: Price History -->
          <el-col :span="10">
            <PriceHistoryPanel
              v-if="currentProjectItem?.item?.id"
              :item-id="currentProjectItem.item.id"
              :project-id="project?.id"
              mode="bid"
            />
            <el-empty v-else description="请先选择物品" :image-size="80" />
          </el-col>
        </el-row>
      </div>
      <template #footer>
        <el-button @click="supplierDialogVisible = false">关闭</el-button>
        <el-button type="primary" @click="submitSupplier" :loading="supplierSubmitting">
          {{ editingSupplierId ? '更新' : '添加' }}
        </el-button>
      </template>
    </el-dialog>

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
        <el-form-item label="供应商" prop="supplierId">
          <el-select
            v-model="paymentForm.supplierId"
            placeholder="选择供应商"
            style="width: 100%"
            filterable
          >
            <el-option
              v-for="supplier in getProjectSuppliers()"
              :key="supplier.id"
              :label="supplier.name"
              :value="supplier.id"
            />
            <el-option v-if="getProjectSuppliers().length === 0" disabled label="暂无供应商，请先添加供应商" value="" />
          </el-select>
          <div v-if="getProjectSuppliers().length === 0" class="text-warning" style="font-size: 12px; margin-top: 4px;">
            请先在项目管理中添加供应商
          </div>
        </el-form-item>
        <el-form-item label="金额" prop="amount">
          <el-input-number
            v-model="paymentForm.amount"
            :min="0"
            :precision="2"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="付款时间" prop="paymentTime">
          <el-date-picker
            v-model="paymentForm.paymentTime"
            type="date"
            placeholder="选择日期"
            style="width: 100%"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>
        <el-form-item label="付款方式">
          <el-select v-model="paymentForm.paymentMethod" placeholder="选择付款方式" style="width: 100%">
            <el-option
              v-for="method in paymentMethods"
              :key="method"
              :label="method"
              :value="method"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="paymentForm.remarks" type="textarea" :rows="2" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="paymentDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitPayment" :loading="paymentSubmitting">
          保存
        </el-button>
      </template>
    </el-dialog>

    <!-- Add/Edit Receipt Dialog -->
    <el-dialog
      v-model="receiptDialogVisible"
      :title="editingReceiptId ? '编辑收款记录' : '添加收款记录'"
      width="600px"
    >
      <el-form
        ref="receiptFormRef"
        :model="receiptForm"
        :rules="receiptRules"
        label-width="110px"
      >
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="金额" prop="amount">
              <el-input-number
                v-model="receiptForm.amount"
                :min="0"
                :precision="2"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="收款时间" prop="receiptTime">
              <el-date-picker
                v-model="receiptForm.receiptTime"
                type="date"
                placeholder="选择日期"
                style="width: 100%"
                value-format="YYYY-MM-DD"
              />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="收款方式">
              <el-select v-model="receiptForm.receiptMethod" placeholder="选择方式" style="width: 100%">
                <el-option
                  v-for="method in receiptMethods"
                  :key="method"
                  :label="method"
                  :value="method"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
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
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="发票状态" prop="invoiceStatus">
              <el-select v-model="receiptForm.invoiceStatus" placeholder="选择状态" style="width: 100%">
                <el-option label="未开票" value="not_invoiced" />
                <el-option label="已开票" value="invoiced" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="预计付款时间">
              <el-date-picker
                v-model="receiptForm.estimatedPaymentTime"
                type="date"
                placeholder="选择日期"
                style="width: 100%"
                value-format="YYYY-MM-DD"
              />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="备注">
          <el-input v-model="receiptForm.remarks" type="textarea" :rows="2" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="receiptDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitReceipt" :loading="receiptSubmitting">
          保存
        </el-button>
      </template>
    </el-dialog>

    <!-- Edit Item Dialog -->
    <el-dialog
      v-model="editItemDialogVisible"
      title="编辑物品"
      width="500px"
    >
      <el-form
        ref="editItemFormRef"
        :model="editItemForm"
        :rules="editItemRules"
        label-width="100px"
      >
        <el-form-item label="物品名称">
          <el-input :value="currentEditingItem?.item?.name" disabled />
        </el-form-item>
        <el-form-item label="数量" prop="quantity">
          <el-input-number
            v-model="editItemForm.quantity"
            :min="1"
            :precision="0"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="editItemForm.remarks" type="textarea" :rows="3" placeholder="请输入备注" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editItemDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitItemEdit" :loading="editItemSubmitting">
          保存
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onActivated, watch, computed, nextTick } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import ItemSelector from '@/components/ItemSelector.vue'
import PriceHistoryPanel from '@/components/PriceHistoryPanel.vue'
import type { BidProject, BidProjectItem, Item, Category } from '@/types'
import { bidProjectApi } from '@/api/project'
import { categoryApi } from '@/api/category'
import { itemApi } from '@/api/item'
import { paymentApi, type PaymentRecord, type ReceiptRecord } from '@/api/payment'

const router = useRouter()
const route = useRoute()

const project = ref<BidProject | null>(null)
const projectItems = ref<BidProjectItem[]>([])
const paymentRecords = ref<PaymentRecord[]>([])
const receiptRecords = ref<ReceiptRecord[]>([])
const categories = ref<Category[]>([])
const allItems = ref<Item[]>([])
const itemSelectorVisible = ref(false)
const expandedRowKeys = ref<string[]>([])

const stats = ref({
  totalPayable: 0,
  totalPaid: 0,
  totalUnpaid: 0,
  paymentProgress: 0,
  agingAnalysis: {
    within30days: 0,
    within60days: 0,
    within90days: 0,
    over90days: 0,
  },
})

// Edit project
const editDialogVisible = ref(false)
const editSubmitting = ref(false)
const editFormRef = ref<FormInstance>()

const editForm = reactive({
  name: '',
  projectCode: '',
  customer: '',
  address: '',
  contractDate: '',
  contractAmount: 0,
  status: '',
  remarks: '',
})

const editRules: FormRules = {
  name: [
    { required: true, message: '请输入项目名称', trigger: 'blur' },
  ],
}

// Supplier management
const supplierDialogVisible = ref(false)
const supplierSubmitting = ref(false)
const supplierFormRef = ref<FormInstance>()
const currentProjectItem = ref<BidProjectItem | null>(null)
const editingSupplierId = ref<string | null>(null)

const supplierForm = reactive({
  supplierId: '',
  price: 0,
  progress: '',
  paymentStatus: '',
  paymentTime: '',
  remarks: '',
})

const supplierRules: FormRules = {
  supplierId: [
    { required: true, message: '请选择供应商', trigger: 'change' },
  ],
  price: [
    { required: true, message: '请输入单价', trigger: 'blur' },
  ],
}

const allSuppliers = ref<any[]>([])

// Current editing supplier's name for display
const currentEditingSupplierName = computed(() => {
  if (!editingSupplierId.value) return ''
  const editingSupplierData = currentProjectItem.value?.suppliers?.find(s => s.id === editingSupplierId.value)
  return editingSupplierData?.supplier?.name || ''
})

// Available suppliers for current project item (filters out already added suppliers)
// When editing, include the current editing supplier in the list
const availableSuppliers = computed(() => {
  const existingIds = currentProjectItem.value?.suppliers?.map(s => s.supplierId) || []
  const editingSupplierData = currentProjectItem.value?.suppliers?.find(s => s.id === editingSupplierId.value)
  const editingSupplierRealId = editingSupplierData?.supplierId

  const filtered = allSuppliers.value.filter(s => {
    if (!s || !s.id || !s.name) return false
    const alreadyAdded = existingIds.includes(s.id)
    const isEditing = s.id === editingSupplierRealId
    return !alreadyAdded || isEditing
  })

  // Simple debug log
  console.log('[Supplier Dropdown]', {
    allCount: allSuppliers.value.length,
    existingIds,
    filteredCount: filtered.length,
  })

  return filtered
})

// Total amount for supplier form (price × quantity)
const supplierTotalAmount = computed(() => {
  const price = supplierForm.price || 0
  const quantity = currentProjectItem.value?.quantity || 1
  return price * quantity
})

// Payment records management
const paymentDialogVisible = ref(false)
const paymentSubmitting = ref(false)
const paymentFormRef = ref<FormInstance>()

const paymentForm = reactive({
  supplierId: '',
  amount: 0,
  paymentTime: new Date().toISOString().split('T')[0],
  paymentMethod: '',
  remarks: '',
})

const paymentRules: FormRules = {
  supplierId: [
    { required: true, message: '请选择供应商', trigger: 'change' },
  ],
  amount: [
    { required: true, message: '请输入金额', trigger: 'blur' },
  ],
  paymentTime: [
    { required: true, message: '请选择付款时间', trigger: 'change' },
  ],
}

const paymentMethods = ['银行转账', '现金', '支票', '其他']

// Receipt records management
const receiptDialogVisible = ref(false)
const receiptSubmitting = ref(false)
const receiptFormRef = ref<FormInstance>()

const receiptForm = reactive({
  amount: 0,
  receiptTime: new Date().toISOString().split('T')[0],
  receiptMethod: '',
  ratio: 0,
  invoiceStatus: 'not_invoiced',
  estimatedPaymentTime: '',
  remarks: '',
})

const receiptRules: FormRules = {
  amount: [{ required: true, message: '请输入金额', trigger: 'blur' }],
  receiptTime: [{ required: true, message: '请选择收款时间', trigger: 'change' }],
  invoiceStatus: [{ required: true, message: '请选择发票状态', trigger: 'change' }],
}

const receiptMethods = ['银行转账', '现金', '支票', '其他']

// Editing receipt state
const editingReceiptId = ref<string | null>(null)

// Edit item management
const editItemDialogVisible = ref(false)
const editItemSubmitting = ref(false)
const editItemFormRef = ref<FormInstance>()
const currentEditingItem = ref<BidProjectItem | null>(null)

const editItemForm = reactive({
  quantity: 1,
  remarks: '',
})

const editItemRules: FormRules = {
  quantity: [
    { required: true, message: '请输入数量', trigger: 'blur' },
    { type: 'number', min: 1, message: '数量必须大于0', trigger: 'blur' },
  ],
}

async function loadProject() {
  try {
    const id = route.params.id as string
    project.value = await bidProjectApi.getById(id)
    projectItems.value = project.value.projectItems || []
    // Load payment records, receipts, statistics and suppliers after project is loaded
    await loadPaymentRecords()
    await loadReceipts()
    await loadStatistics()
    await loadSuppliers()
  } catch (error) {
    // Error handled by interceptor
  }
}

function goBack() {
  router.push('/bid-projects')
}

function handleAddItem() {
  itemSelectorVisible.value = true
}

async function handleItemsSelected(items: Item[]) {
  if (!project.value) return

  try {
    // Add each selected item to the project
    for (const item of items) {
      await bidProjectApi.addItem(project.value.id, {
        itemId: item.id,
        quantity: 1,
      })
    }
    ElMessage.success(`已添加 ${items.length} 个物品`)
    // Reload project to get updated items
    await loadProject()
  } catch (error) {
    // Error handled by interceptor
  }
}

function handleExpandChange(row: BidProjectItem, expandedRows: BidProjectItem[]) {
  if (expandedRows.includes(row)) {
    expandedRowKeys.value.push(row.id)
  } else {
    const index = expandedRowKeys.value.indexOf(row.id)
    if (index > -1) {
      expandedRowKeys.value.splice(index, 1)
    }
  }
}

async function handleToggleSupplier(supplier: any) {
  try {
    await bidProjectApi.toggleSupplier(supplier.id)
    ElMessage.success('操作成功')
    await loadProject()
  } catch (error) {
    // Error handled by interceptor
  }
}

function getProgressType(progress?: string) {
  if (!progress) return ''
  const typeMap: Record<string, any> = {
    ordered: 'info',
    producing: 'primary',
    shipped: 'warning',
    delivered: 'success',
    completed: '',
  }
  return typeMap[progress] || ''
}

function getProgressLabel(progress?: string) {
  if (!progress) return ''
  const labelMap: Record<string, string> = {
    ordered: '已下单',
    producing: '生产中',
    shipped: '已发货',
    delivered: '已收货',
    completed: '已完成',
  }
  return labelMap[progress] || progress
}

function getPaymentStatusType(status?: string) {
  if (!status) return ''
  const typeMap: Record<string, any> = {
    unpaid: 'danger',
    partial: 'warning',
    paid: 'success',
  }
  return typeMap[status] || ''
}

function getPaymentStatusLabel(status?: string) {
  if (!status) return ''
  const labelMap: Record<string, string> = {
    unpaid: '未付款',
    partial: '部分付款',
    paid: '已付款',
  }
  return labelMap[status] || status
}

function handleAddPayment() {
  const suppliers = getProjectSuppliers()
  if (suppliers.length === 0) {
    ElMessage.warning('请先为项目添加供应商，然后再添加付款记录')
    return
  }
  resetPaymentForm()
  paymentDialogVisible.value = true
}

function resetPaymentForm() {
  paymentForm.supplierId = ''
  paymentForm.amount = 0
  paymentForm.paymentTime = new Date().toISOString().split('T')[0]
  paymentForm.paymentMethod = ''
  paymentForm.remarks = ''
}

function getProjectSuppliers() {
  // Get unique suppliers from project items (include all, not just selected)
  const suppliersSet = new Set<string>()
  const suppliers: Array<{ id: string; name: string }> = []

  projectItems.value.forEach(item => {
    item.suppliers?.forEach(supplier => {
      if (supplier.supplier?.id && supplier.supplier?.name) {
        const id = String(supplier.supplier.id)
        if (!suppliersSet.has(id)) {
          suppliersSet.add(id)
          suppliers.push({
            id,
            name: String(supplier.supplier.name),
          })
        }
      }
    })
  })
  return suppliers
}

async function loadPaymentRecords() {
  if (!project.value) return
  try {
    paymentRecords.value = await paymentApi.getPaymentsByProject(project.value.id)
  } catch (error) {
    // Error handled by interceptor
  }
}

async function submitPayment() {
  if (!paymentFormRef.value || !project.value) return

  try {
    await paymentFormRef.value.validate()
    paymentSubmitting.value = true

    // Ensure supplierId is a string
    const supplierId = Array.isArray(paymentForm.supplierId)
      ? paymentForm.supplierId[0]
      : paymentForm.supplierId

    await paymentApi.createPayment({
      projectId: project.value.id,
      supplierId: String(supplierId),
      amount: paymentForm.amount,
      paymentTime: paymentForm.paymentTime,
      paymentMethod: paymentForm.paymentMethod,
      remarks: paymentForm.remarks,
    })

    ElMessage.success('付款记录添加成功')
    paymentDialogVisible.value = false
    await loadPaymentRecords()
    await loadStatistics()
  } catch (error: any) {
    if (error !== false) {
      // Error handled by interceptor
    }
  } finally {
    paymentSubmitting.value = false
  }
}

async function handleDeletePayment(record: PaymentRecord) {
  try {
    await ElMessageBox.confirm('确定要删除这条付款记录吗？', '确认删除', {
      type: 'warning',
    })
    await paymentApi.deletePayment(record.id)
    ElMessage.success('删除成功')
    await loadPaymentRecords()
    await loadStatistics()
  } catch (error) {
    // User cancelled or error handled by interceptor
  }
}

async function loadReceipts() {
  if (!project.value) return
  try {
    const receipts = await paymentApi.getReceiptsByProject(project.value.id)
    console.log('Loaded receipts:', receipts)
    receiptRecords.value = receipts || []
  } catch (error) {
    console.error('Failed to load receipts:', error)
    receiptRecords.value = []
  }
}

function handleAddReceipt() {
  resetReceiptForm()
  receiptDialogVisible.value = true
}

function resetReceiptForm() {
  editingReceiptId.value = null
  receiptForm.amount = 0
  receiptForm.receiptTime = new Date().toISOString().split('T')[0]
  receiptForm.receiptMethod = ''
  receiptForm.ratio = 0
  receiptForm.invoiceStatus = 'not_invoiced'
  receiptForm.estimatedPaymentTime = ''
  receiptForm.remarks = ''
}

async function submitReceipt() {
  if (!receiptFormRef.value || !project.value) return

  try {
    await receiptFormRef.value.validate()
    receiptSubmitting.value = true

    const receiptData = {
      projectId: project.value.id,
      amount: receiptForm.amount,
      receiptTime: receiptForm.receiptTime,
      receiptMethod: receiptForm.receiptMethod,
      ratio: receiptForm.ratio,
      invoiceStatus: receiptForm.invoiceStatus,
      estimatedPaymentTime: receiptForm.estimatedPaymentTime,
      remarks: receiptForm.remarks,
    }

    if (editingReceiptId.value) {
      // Update existing receipt
      await paymentApi.updateReceipt(editingReceiptId.value, receiptData)
      ElMessage.success('收款记录更新成功')
    } else {
      // Create new receipt
      await paymentApi.createReceipt(receiptData)
      ElMessage.success('收款记录添加成功')
    }

    receiptDialogVisible.value = false
    await loadReceipts()
  } catch (error: any) {
    if (error !== false) {
      // Error handled by interceptor
    }
  } finally {
    receiptSubmitting.value = false
  }
}

function handleEditReceipt(record: ReceiptRecord) {
  editingReceiptId.value = record.id
  receiptForm.amount = record.amount
  receiptForm.receiptTime = record.receiptTime
  receiptForm.receiptMethod = record.receiptMethod || ''
  receiptForm.ratio = record.ratio || 0
  receiptForm.invoiceStatus = record.invoiceStatus
  receiptForm.estimatedPaymentTime = record.estimatedPaymentTime || ''
  receiptForm.remarks = record.remarks || ''
  receiptDialogVisible.value = true
}

async function handleDeleteReceipt(record: ReceiptRecord) {
  try {
    await ElMessageBox.confirm('确定要删除这条收款记录吗？', '确认删除', {
      type: 'warning',
    })
    await paymentApi.deleteReceipt(record.id)
    ElMessage.success('删除成功')
    await loadReceipts()
  } catch (error) {
    // User cancelled or error handled by interceptor
  }
}

async function loadStatistics() {
  if (!project.value) return
  try {
    stats.value = await bidProjectApi.getStatistics(project.value.id)
  } catch (error) {
    // Error handled by interceptor
  }
}

// Edit project functions
function handleEditProject() {
  if (!project.value) return
  // Populate form with current project data
  editForm.name = project.value.name || ''
  editForm.projectCode = project.value.projectCode || ''
  editForm.customer = project.value.customer || ''
  editForm.address = project.value.address || ''
  editForm.contractDate = project.value.contractDate || ''
  editForm.contractAmount = project.value.contractAmount || 0
  editForm.status = project.value.status || ''
  editForm.remarks = project.value.remarks || ''
  editDialogVisible.value = true
}

async function submitProjectEdit() {
  if (!editFormRef.value || !project.value) return

  try {
    await editFormRef.value.validate()
    editSubmitting.value = true

    await bidProjectApi.update(project.value.id, {
      name: editForm.name,
      projectCode: editForm.projectCode,
      customer: editForm.customer,
      address: editForm.address,
      contractDate: editForm.contractDate,
      contractAmount: editForm.contractAmount,
      status: editForm.status,
      remarks: editForm.remarks,
    })

    ElMessage.success('项目信息更新成功')
    editDialogVisible.value = false
    await loadProject()
  } catch (error: any) {
    if (error !== false) { // Validation error returns false
      // Error handled by interceptor
    }
  } finally {
    editSubmitting.value = false
  }
}

function getStatusType(status?: string) {
  if (!status) return 'info'
  const typeMap: Record<string, any> = {
    preparing: 'info',
    in_progress: 'primary',
    accepted: 'success',
    completed: 'info',
  }
  return typeMap[status] || 'info'
}

function getStatusLabel(status?: string) {
  if (!status) return ''
  const labelMap: Record<string, string> = {
    preparing: '准备中',
    in_progress: '进行中',
    accepted: '已验收',
    completed: '已结案',
  }
  return labelMap[status] || status
}

function formatAmount(amount?: number) {
  if (!amount) return '0'
  return amount.toLocaleString()
}

function getProgressColor(percentage: number) {
  if (percentage >= 80) return '#67c23a'
  if (percentage >= 50) return '#e6a23c'
  return '#f56c6c'
}

onMounted(() => {
  loadProject()
  loadCategories()
  loadItems()
  loadSuppliers()
})

// 当页面重新激活时（如从咨询项目详情页返回），刷新项目数据
onActivated(() => {
  loadProject()
})

// 监听路由变化，当路由参数变化时重新加载项目数据
watch(
  () => route.params.id,
  (newId, oldId) => {
    if (newId && newId !== oldId) {
      loadProject()
    }
  }
)

async function loadCategories() {
  try {
    categories.value = await categoryApi.getTree()
  } catch (error) {
    // Error handled by interceptor
  }
}

async function loadItems() {
  try {
    allItems.value = await itemApi.getList()
  } catch (error) {
    // Error handled by interceptor
  }
}

// Supplier management functions
async function loadSuppliers() {
  try {
    const { supplierApi } = await import('@/api/supplier')
    console.log('[loadSuppliers] Fetching suppliers with limit=100...')
    const result = await supplierApi.getList({ limit: 100 })
    console.log('[loadSuppliers] API result:', result)
    // Result is already unwrapped by response interceptor - it could be array or { data: [...] }
    allSuppliers.value = Array.isArray(result) ? result : (result?.data || [])
    console.log('[loadSuppliers] Loaded suppliers count:', allSuppliers.value.length)
  } catch (error) {
    console.error('[loadSuppliers] Failed to load suppliers:', error)
  }
}

function handleManageSuppliers(item: BidProjectItem) {
  currentProjectItem.value = item
  editingSupplierId.value = null
  resetSupplierForm()
  // Clear form validation state
  nextTick(() => {
    supplierFormRef.value?.clearValidate()
  })
  // Load suppliers if not already loaded
  if (allSuppliers.value.length === 0) {
    loadSuppliers()
  }
  supplierDialogVisible.value = true
}

function handleEditSupplier(supplier: any) {
  editingSupplierId.value = supplier.id
  supplierForm.supplierId = supplier.supplierId
  supplierForm.price = supplier.price || 0
  supplierForm.progress = supplier.progress || ''
  supplierForm.paymentStatus = supplier.paymentStatus || ''
  supplierForm.paymentTime = supplier.paymentTime || ''
  supplierForm.remarks = supplier.remarks || ''
}

function resetSupplierForm() {
  supplierForm.supplierId = ''
  supplierForm.price = 0
  supplierForm.progress = ''
  supplierForm.paymentStatus = ''
  supplierForm.paymentTime = ''
  supplierForm.remarks = ''
}

async function handleProgressChange(supplier: any, value: string) {
  try {
    await bidProjectApi.updateSupplierInfo(supplier.id, { progress: value })
    ElMessage.success('进度更新成功')
    await loadProject()
  } catch (error) {
    // Error handled by interceptor
  }
}

async function handlePaymentStatusChange(supplier: any, value: string) {
  try {
    await bidProjectApi.updateSupplierInfo(supplier.id, { paymentStatus: value })
    ElMessage.success('付款状态更新成功')
    await loadProject()
  } catch (error) {
    // Error handled by interceptor
  }
}

async function submitSupplier() {
  if (!supplierFormRef.value) return

  try {
    await supplierFormRef.value.validate()
    supplierSubmitting.value = true

    if (editingSupplierId.value) {
      // Update existing supplier - filter out empty values
      const updateData: any = {
        price: supplierForm.price,
      }
      // Only include non-empty values
      if (supplierForm.progress) updateData.progress = supplierForm.progress
      if (supplierForm.paymentStatus) updateData.paymentStatus = supplierForm.paymentStatus
      if (supplierForm.paymentTime) updateData.paymentTime = supplierForm.paymentTime
      if (supplierForm.remarks) updateData.remarks = supplierForm.remarks

      await bidProjectApi.updateSupplierInfo(editingSupplierId.value, updateData)
      ElMessage.success('供应商信息更新成功')
    } else {
      // Add new supplier to existing item
      await bidProjectApi.addSupplierToItem(currentProjectItem.value!.id, {
        supplierId: supplierForm.supplierId,
        price: supplierForm.price,
        progress: supplierForm.progress || 'ordered',
        paymentStatus: supplierForm.paymentStatus || 'unpaid',
        paymentTime: supplierForm.paymentTime,
        remarks: supplierForm.remarks,
        isSelected: true,
      })
      ElMessage.success('供应商添加成功')
    }

    await loadProject()
    if (currentProjectItem.value) {
      // Update currentProjectItem with refreshed data
      const updatedItem = project.value?.projectItems?.find(i => i.id === currentProjectItem.value?.id)
      if (updatedItem) {
        currentProjectItem.value = updatedItem
      }
    }
    // Clear form validation state and reset form
    supplierFormRef.value?.clearValidate()
    supplierFormRef.value?.resetFields()
    editingSupplierId.value = null
  } catch (error: any) {
    if (error !== false) {
      // Error handled by interceptor
    }
  } finally {
    supplierSubmitting.value = false
  }
}

function handleEditItem(item: BidProjectItem) {
  currentEditingItem.value = item
  editItemForm.quantity = item.quantity
  editItemForm.remarks = item.remarks || ''
  editItemDialogVisible.value = true
}

async function submitItemEdit() {
  if (!editItemFormRef.value || !project.value || !currentEditingItem.value) return

  try {
    await editItemFormRef.value.validate()
    editItemSubmitting.value = true

    await bidProjectApi.updateItem(
      project.value.id,
      currentEditingItem.value.id,
      {
        quantity: editItemForm.quantity,
        remarks: editItemForm.remarks,
      }
    )

    ElMessage.success('物品更新成功')
    editItemDialogVisible.value = false
    await loadProject()
  } catch (error: any) {
    if (error !== false) {
      // Error handled by interceptor
    }
  } finally {
    editItemSubmitting.value = false
  }
}

async function handleDeleteItem(item: BidProjectItem) {
  try {
    await ElMessageBox.confirm(
      `确定要删除物品"${item.item?.name}"吗？此操作将同时删除该物品下的所有供应商信息。`,
      '确认删除',
      {
        type: 'warning',
        confirmButtonText: '确定',
        cancelButtonText: '取消',
      }
    )

    await bidProjectApi.deleteItem(project.value!.id, item.id)
    ElMessage.success('删除成功')
    await loadProject()
  } catch (error) {
    // User cancelled or error handled by interceptor
  }
}

async function handleDeleteSupplier(supplier: any) {
  try {
    await ElMessageBox.confirm(
      `确定要删除供应商"${supplier.supplier?.name}"吗？`,
      '确认删除',
      {
        type: 'warning',
        confirmButtonText: '确定',
        cancelButtonText: '取消',
      }
    )

    await bidProjectApi.deleteSupplier(supplier.id)
    ElMessage.success('删除成功')
    await loadProject()
    // Update currentProjectItem if dialog is open
    if (currentProjectItem.value) {
      const updatedItem = project.value?.projectItems?.find(i => i.id === currentProjectItem.value?.id)
      if (updatedItem) {
        currentProjectItem.value = updatedItem
      }
    }
  } catch (error) {
    // User cancelled or error handled by interceptor
  }
}

// Voucher/Proof handling
async function handleUploadPaymentVoucher(record: PaymentRecord, file: any) {
  if (!file.raw) return

  // Validate file type
  const isImage = file.raw.type.startsWith('image/')
  if (!isImage) {
    ElMessage.error('只能上传图片文件')
    return
  }

  // Validate file size (max 5MB)
  const isLt5M = file.size / 1024 / 1024 < 5
  if (!isLt5M) {
    ElMessage.error('图片大小不能超过5MB')
    return
  }

  try {
    await paymentApi.uploadPaymentVoucher(record.id, file.raw)
    ElMessage.success('凭证上传成功')
    await loadPaymentRecords()
  } catch (error) {
    // Error handled by interceptor
  }
}

async function handleUploadReceiptVoucher(record: ReceiptRecord, file: any) {
  if (!file.raw) return

  // Validate file type
  const isImage = file.raw.type.startsWith('image/')
  if (!isImage) {
    ElMessage.error('只能上传图片文件')
    return
  }

  // Validate file size (max 5MB)
  const isLt5M = file.size / 1024 / 1024 < 5
  if (!isLt5M) {
    ElMessage.error('图片大小不能超过5MB')
    return
  }

  try {
    await paymentApi.uploadReceiptVoucher(record.id, file.raw)
    ElMessage.success('凭证上传成功')
    await loadReceipts()
  } catch (error) {
    // Error handled by interceptor
  }
}

function handleViewProof(url: string) {
  // Open image in new tab
  if (!url) return
  // Use backend URL for uploads
  const fullUrl = url.startsWith('http') ? url : `http://localhost:3000${url}`
  window.open(fullUrl, '_blank')
}
</script>

<style scoped>
.bid-project-detail-container {
  padding: 20px;
}

.page-title {
  display: flex;
  align-items: center;
  gap: 12px;
}

.page-title h2 {
  margin: 0;
  font-size: 20px;
}

.suppliers-summary {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.supplier-summary-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
}

.supplier-name {
  font-size: 14px;
}

.supplier-amount {
  font-weight: 500;
  color: #409eff;
}

.suppliers-detail-container {
  padding: 16px 20px;
  background: #fafafa;
}

.suppliers-detail-header {
  font-weight: 500;
  margin-bottom: 12px;
  color: #333;
  font-size: 14px;
}

.nested-table {
  background: #fff;
}

.no-suppliers-hint {
  padding: 20px;
  text-align: center;
}

.text-info {
  color: #999;
  font-size: 14px;
}

.stats {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.stat-label {
  color: #666;
  font-size: 14px;
}

.stat-value {
  font-weight: 500;
  font-size: 16px;
}

.text-primary { color: #409eff; }
.text-success { color: #67c23a; }
.text-warning { color: #e6a23c; }
.text-danger { color: #f56c6c; }

.payment-stats {
  padding: 10px 0;
}

.aging-analysis {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 10px 0;
}

.aging-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 14px;
}

.aging-label {
  color: #666;
}

.aging-value {
  font-weight: 500;
  font-size: 15px;
}

.aging-safe { color: #67c23a; }
.aging-normal { color: #409eff; }
.aging-warning { color: #e6a23c; }
.aging-danger { color: #f56c6c; }

.progress-container {
  margin-top: 20px;
  padding: 0 10px;
}

.supplier-management {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.suppliers-list {
  border: 1px solid #ebeef5;
  border-radius: 4px;
  padding: 16px;
}

.list-header {
  font-weight: 500;
  margin-bottom: 12px;
  color: #333;
  font-size: 14px;
}

.add-supplier-form {
  border-top: 1px solid #ebeef5;
  padding-top: 20px;
}

.form-header {
  font-weight: 500;
  margin-bottom: 16px;
  color: #333;
  font-size: 14px;
}

.no-suppliers-hint {
  padding: 20px;
  text-align: center;
  border: 1px solid #ebeef5;
  border-radius: 4px;
}

.total-amount-display {
  font-size: 16px;
  font-weight: 500;
  color: #409eff;
}

.quantity-hint {
  font-size: 12px;
  color: #999;
  font-weight: normal;
  margin-left: 8px;
}
</style>
