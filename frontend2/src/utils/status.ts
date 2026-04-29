/**
 * 统一状态映射工具函数
 * 消除跨组件的重复状态映射代码
 */

/**
 * 咨询项目状态
 */
export const CONSULT_PROJECT_STATUS = {
  consulting: '咨询中',
  quoted: '已报价',
  paused: '已暂停',
  cancelled: '已取消',
} as const

export const CONSULT_PROJECT_STATUS_TYPE = {
  consulting: 'primary',
  quoted: 'success',
  paused: 'warning',
  cancelled: 'info',
} as const

/**
 * 中标项目状态
 */
export const BID_PROJECT_STATUS = {
  preparing: '准备中',
  in_progress: '进行中',
  accepted: '已验收',
  completed: '已结案',
} as const

export const BID_PROJECT_STATUS_TYPE = {
  preparing: 'info',
  in_progress: 'primary',
  accepted: 'success',
  completed: '',
} as const

/**
 * 供应商进度状态
 */
export const SUPPLIER_PROGRESS_STATUS = {
  ordered: '已下单',
  producing: '生产中',
  shipped: '已发货',
  received: '已收货',
  completed: '已完成',
} as const

export const SUPPLIER_PROGRESS_STATUS_TYPE = {
  ordered: 'info',
  producing: 'primary',
  shipped: 'warning',
  received: 'success',
  completed: '',
} as const

/**
 * 付款状态
 */
export const PAYMENT_STATUS = {
  unpaid: '未付款',
  partial: '部分付款',
  paid: '已付款',
} as const

export const PAYMENT_STATUS_TYPE = {
  unpaid: 'danger',
  partial: 'warning',
  paid: 'success',
} as const

/**
 * 发票状态
 */
export const INVOICE_STATUS = {
  not_invoiced: '未开票',
  invoiced: '已开票',
} as const

/**
 * 通知类型
 */
export const NOTIFICATION_TYPE = {
  PROJECT: '项目',
  PAYMENT: '付款',
  RECEIPT: '收款',
  SUPPLIER: '供应商',
  SYSTEM: '系统',
} as const

/**
 * 获取咨询项目状态标签
 */
export function getConsultProjectStatusLabel(status?: string): string {
  return CONSULT_PROJECT_STATUS[status as keyof typeof CONSULT_PROJECT_STATUS] || status || '-'
}

/**
 * 获取咨询项目状态类型
 */
export function getConsultProjectStatusType(status?: string): string {
  return CONSULT_PROJECT_STATUS_TYPE[status as keyof typeof CONSULT_PROJECT_STATUS_TYPE] || 'info'
}

/**
 * 获取中标项目状态标签
 */
export function getBidProjectStatusLabel(status?: string): string {
  return BID_PROJECT_STATUS[status as keyof typeof BID_PROJECT_STATUS] || status || '-'
}

/**
 * 获取中标项目状态类型
 */
export function getBidProjectStatusType(status?: string): string {
  return BID_PROJECT_STATUS_TYPE[status as keyof typeof BID_PROJECT_STATUS_TYPE] || 'info'
}

/**
 * 获取供应商进度状态标签
 */
export function getSupplierProgressStatusLabel(status?: string): string {
  return SUPPLIER_PROGRESS_STATUS[status as keyof typeof SUPPLIER_PROGRESS_STATUS] || status || '-'
}

/**
 * 获取供应商进度状态类型
 */
export function getSupplierProgressStatusType(status?: string): string {
  return SUPPLIER_PROGRESS_STATUS_TYPE[status as keyof typeof SUPPLIER_PROGRESS_STATUS_TYPE] || 'info'
}

/**
 * 获取付款状态标签
 */
export function getPaymentStatusLabel(status?: string): string {
  return PAYMENT_STATUS[status as keyof typeof PAYMENT_STATUS] || status || '-'
}

/**
 * 获取付款状态类型
 */
export function getPaymentStatusType(status?: string): string {
  return PAYMENT_STATUS_TYPE[status as keyof typeof PAYMENT_STATUS_TYPE] || 'info'
}
