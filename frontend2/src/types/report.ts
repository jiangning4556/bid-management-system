export type ReportDataSource = 'projects' | 'suppliers' | 'payments' | 'receipts' | 'items'
export type ReportFormat = 'excel' | 'pdf'

export interface ReportTemplate {
  id: string
  name: string
  description: string
  dataSource: ReportDataSource
  fields: string[]
  filters: Record<string, any>
  defaultFormat: ReportFormat
  userId: string
  createdAt: string
  updatedAt: string
}

export interface ReportSubscription {
  id: string
  name: string
  templateId: string
  userId: string
  recipients: string[]
  schedule: 'daily' | 'weekly' | 'monthly'
  scheduleTime: string
  scheduleConfig: {
    dayOfWeek?: number
    dayOfMonth?: number
  }
  isActive: boolean
  lastRunAt: string
  nextRunAt: string
  createdAt: string
  updatedAt: string
  template: ReportTemplate
}

export interface GenerateReportDto {
  dataSource: ReportDataSource
  format: ReportFormat
  reportName: string
  fields: string[]
  startDate?: string
  endDate?: string
  filters?: Record<string, any>
}

export interface CreateReportTemplateDto {
  name: string
  description?: string
  dataSource: ReportDataSource
  fields: string[]
  filters?: Record<string, any>
  defaultFormat?: ReportFormat
}

export interface UpdateReportTemplateDto {
  name?: string
  description?: string
  fields?: string[]
  filters?: Record<string, any>
  defaultFormat?: ReportFormat
}

export interface CreateReportSubscriptionDto {
  name: string
  templateId: string
  recipients: string[]
  schedule: 'daily' | 'weekly' | 'monthly'
  scheduleTime: string
  scheduleConfig?: {
    dayOfWeek?: number
    dayOfMonth?: number
  }
}

export interface UpdateReportSubscriptionDto {
  name?: string
  recipients?: string[]
  schedule?: 'daily' | 'weekly' | 'monthly'
  scheduleTime?: string
  scheduleConfig?: {
    dayOfWeek?: number
    dayOfMonth?: number
  }
  isActive?: boolean
}
