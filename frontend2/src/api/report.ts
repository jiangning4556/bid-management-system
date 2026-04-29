import request from '@/utils/request'
import type {
  ReportTemplate,
  ReportSubscription,
  GenerateReportDto,
  CreateReportTemplateDto,
  UpdateReportTemplateDto,
  CreateReportSubscriptionDto,
  UpdateReportSubscriptionDto,
} from '@/types/report'

export const reportApi = {
  // 生成报表
  generate(dto: GenerateReportDto) {
    return request.post<Blob>('/reports/generate', dto, {
      responseType: 'blob',
    })
  },

  // 报表模板
  getTemplates() {
    return request.get<ReportTemplate[]>('/reports/templates')
  },

  getTemplate(id: string) {
    return request.get<ReportTemplate>(`/reports/templates/${id}`)
  },

  createTemplate(dto: CreateReportTemplateDto) {
    return request.post<ReportTemplate>('/reports/templates', dto)
  },

  updateTemplate(id: string, dto: UpdateReportTemplateDto) {
    return request.patch<ReportTemplate>(`/reports/templates/${id}`, dto)
  },

  deleteTemplate(id: string) {
    return request.delete<void>(`/reports/templates/${id}`)
  },

  // 报表订阅
  getSubscriptions() {
    return request.get<ReportSubscription[]>('/reports/subscriptions')
  },

  getSubscription(id: string) {
    return request.get<ReportSubscription>(`/reports/subscriptions/${id}`)
  },

  createSubscription(dto: CreateReportSubscriptionDto) {
    return request.post<ReportSubscription>('/reports/subscriptions', dto)
  },

  updateSubscription(id: string, dto: UpdateReportSubscriptionDto) {
    return request.patch<ReportSubscription>(`/reports/subscriptions/${id}`, dto)
  },

  deleteSubscription(id: string) {
    return request.delete<void>(`/reports/subscriptions/${id}`)
  },

  pauseSubscription(id: string) {
    return request.post<ReportSubscription>(`/reports/subscriptions/${id}/pause`)
  },

  resumeSubscription(id: string) {
    return request.post<ReportSubscription>(`/reports/subscriptions/${id}/resume`)
  },
}

// 导出报表辅助函数
export async function exportReport(dto: GenerateReportDto) {
  try {
    const blob = await reportApi.generate(dto)
    const url = window.URL.createObjectURL(new Blob([blob]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `${dto.reportName}.${dto.format}`)
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(url)
  } catch (error) {
    console.error('Export failed:', error)
    throw error
  }
}
