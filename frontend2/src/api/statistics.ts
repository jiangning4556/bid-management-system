import request from '@/utils/request'

export interface OverviewStats {
  consultProjectCount: number
  bidProjectCount: number
  supplierCount: number
  totalConsultAmount: number
  totalBidAmount: number
  totalPayable: number
  totalPaid: number
  totalReceived: number
  estimatedProfit: number
}

export interface ReceivableStats {
  totalReceivable: number
  totalReceived: number
  totalUnreceived: number
  collectionRate: number
}

export interface PayableStats {
  totalPayable: number
  totalPaid: number
  totalUnpaid: number
  paymentRate: number
}

export interface OverviewWithPeriodStats extends OverviewStats {
  period: string
  startDate?: Date
  endDate?: Date
  totalReceivable: number
  totalUnreceived: number
  collectionRate: number
  totalUnpaid: number
  paymentRate: number
  grossProfit: number
  realizedProfit: number
  profitMargin: number
}

export interface SupplierStats {
  supplierId: string
  supplierName: string
  quoteCount: number
  totalQuoteAmount: number
  avgPrice: number
  minPrice: number
  maxPrice: number
}

export interface MonthlyStats {
  month: number
  year: number
  consultProjectCount: number
  bidProjectCount: number
  consultAmount: number
  bidAmount: number
}

export interface RecentProject {
  id: string
  name: string
  customer: string
  type: 'consult' | 'bid'
  amount: number
  createdAt: string
}

export const statisticsApi = {
  // Get overview statistics
  getOverview(period?: 'month' | 'quarter' | 'year') {
    return request.get<OverviewStats | OverviewWithPeriodStats>('/statistics/overview', {
      params: period ? { period } : {}
    })
  },

  // Get receivable statistics
  getReceivableStats(period?: 'month' | 'quarter' | 'year', startDate?: string, endDate?: string) {
    return request.get<ReceivableStats>('/statistics/receivable', {
      params: {
        ...(period && { period }),
        ...(startDate && { startDate }),
        ...(endDate && { endDate })
      }
    })
  },

  // Get payable statistics
  getPayableStats(period?: 'month' | 'quarter' | 'year', startDate?: string, endDate?: string) {
    return request.get<PayableStats>('/statistics/payable', {
      params: {
        ...(period && { period }),
        ...(startDate && { startDate }),
        ...(endDate && { endDate })
      }
    })
  },

  // Get recent projects
  getRecentProjects(limit?: number) {
    return request.get<RecentProject[]>('/statistics/recent-projects', {
      params: limit ? { limit } : {}
    })
  },

  // Get supplier statistics
  getSupplierStats() {
    return request.get<SupplierStats[]>('/statistics/suppliers')
  },

  // Get monthly statistics
  getMonthlyStats(year?: number) {
    return request.get<MonthlyStats[]>('/statistics/monthly', {
      params: year ? { year } : {}
    })
  },

  // Get project statistics
  getProjectStats(projectId: string) {
    return request.get(`/statistics/project/${projectId}`)
  },
}
