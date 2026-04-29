import request from '@/utils/request'

export interface PaymentRecordInput {
  projectId: string
  supplierId: string
  amount: number
  paymentTime: string
  paymentMethod?: string
  remarks?: string
}

export interface PaymentRecord {
  id: string
  projectId: string
  supplierId: string
  amount: number
  paymentTime: string
  paymentMethod?: string
  remarks?: string
  proofUrl?: string
  createdAt: string
  updatedAt: string
  project?: {
    id: string
    name: string
  }
  supplier?: {
    id: string
    name: string
  }
}

// 收款记录相关类型
export interface ReceiptRecordInput {
  projectId: string
  amount: number
  receiptTime: string
  receiptMethod?: string
  ratio?: number
  invoiceStatus?: 'not_invoiced' | 'invoiced'
  invoiceTime?: string
  invoiceType?: string
  invoiceNo?: string
  estimatedPaymentTime?: string
  isCompleted?: boolean
  remarks?: string
}

export interface ReceiptRecord {
  id: string
  projectId: string
  amount: number
  receiptTime: string
  receiptMethod?: string
  ratio?: number
  invoiceStatus: 'not_invoiced' | 'invoiced'
  invoiceTime?: string
  invoiceType?: string
  invoiceNo?: string
  estimatedPaymentTime?: string
  isCompleted?: boolean
  remarks?: string
  proofUrl?: string
  createdAt: string
  updatedAt: string
  project?: {
    id: string
    name: string
  }
}

// 综合统计相关类型
export interface OverviewStatistics {
  totalPayable: number      // 应付金额
  totalPaid: number         // 已付总额
  totalReceivable: number   // 应收金额
  totalReceived: number     // 已收金额
}

export const paymentApi = {
  // 获取所有付款记录
  getAllPayments(projectId?: string): Promise<PaymentRecord[]> {
    return request.get('/payments/payments', {
      params: projectId ? { projectId } : {}
    })
  },

  // 获取项目的付款记录
  getPaymentsByProject(projectId: string): Promise<PaymentRecord[]> {
    return request.get(`/payments/payments/project/${projectId}`)
  },

  // 创建付款记录
  createPayment(data: PaymentRecordInput): Promise<PaymentRecord> {
    return request.post('/payments/payments', data)
  },

  // 删除付款记录
  deletePayment(id: string): Promise<void> {
    return request.delete(`/payments/payments/${id}`)
  },

  // 获取所有收款记录
  getAllReceipts(projectId?: string): Promise<ReceiptRecord[]> {
    return request.get('/payments/receipts', {
      params: projectId ? { projectId } : {}
    })
  },

  // 获取项目的收款记录
  getReceiptsByProject(projectId: string): Promise<ReceiptRecord[]> {
    return request.get(`/payments/receipts/project/${projectId}`)
  },

  // 创建收款记录
  createReceipt(data: ReceiptRecordInput): Promise<ReceiptRecord> {
    return request.post('/payments/receipts', data)
  },

  // 更新收款记录
  updateReceipt(id: string, data: Partial<ReceiptRecordInput>): Promise<ReceiptRecord> {
    return request.patch(`/payments/receipts/${id}`, data)
  },

  // 删除收款记录
  deleteReceipt(id: string): Promise<void> {
    return request.delete(`/payments/receipts/${id}`)
  },

  // 上传付款凭证
  uploadPaymentVoucher(id: string, file: File): Promise<{ proofUrl: string }> {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('type', 'RECEIPT')
    formData.append('targetType', 'PAYMENT')
    formData.append('targetId', id)
    return request.post('/files/upload', formData).then((fileRecord: any) => {
      // Update payment record with proof URL
      return request.patch(`/payments/payments/${id}/voucher`, { proofUrl: fileRecord.fileUrl })
    })
  },

  // 上传收款凭证
  uploadReceiptVoucher(id: string, file: File): Promise<{ proofUrl: string }> {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('type', 'RECEIPT')
    formData.append('targetType', 'RECEIPT')
    formData.append('targetId', id)
    return request.post('/files/upload', formData).then((fileRecord: any) => {
      // Update receipt record with proof URL
      return request.patch(`/payments/receipts/${id}/voucher`, { proofUrl: fileRecord.fileUrl })
    })
  },

  // 删除付款凭证
  deletePaymentVoucher(id: string): Promise<PaymentRecord> {
    return request.patch(`/payments/payments/${id}/voucher`, { proofUrl: null })
  },

  // 删除收款凭证
  deleteReceiptVoucher(id: string): Promise<ReceiptRecord> {
    return request.patch(`/payments/receipts/${id}/voucher`, { proofUrl: null })
  },

  // 获取综合统计
  getOverviewStatistics(projectId?: string): Promise<OverviewStatistics> {
    return request.get('/payments/statistics/overview', {
      params: projectId ? { projectId } : {}
    })
  },
}
