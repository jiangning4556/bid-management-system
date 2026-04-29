import request from '@/utils/request'
import type { Supplier } from '@/types'

export interface SearchCondition {
  field: string
  operator: 'equals' | 'contains' | 'startsWith' | 'endsWith' | 'greaterThan' | 'lessThan' | 'greaterEqual' | 'lessEqual' | 'between' | 'in'
  value?: string
  value2?: string
  values?: string[]
}

export interface AdvancedSearchDto {
  logic?: 'AND' | 'OR'
  conditions?: SearchCondition[]
  dateFrom?: string
  dateTo?: string
  dateField?: string
  statuses?: string[]
  statusField?: string
}

export const supplierApi = {
  // Get all suppliers
  getList(params?: { page?: number; limit?: number; sortBy?: string; sortOrder?: string }) {
    return request.get('/suppliers', { params })
  },

  // Search suppliers
  search(query: string) {
    return request.get<Supplier[]>(`/suppliers/search?q=${query}`)
  },

  // Advanced search
  advancedSearch(searchDto: AdvancedSearchDto, params?: { page?: number; limit?: number; sortBy?: string; sortOrder?: string }) {
    return request.post('/suppliers/search', searchDto, { params })
  },

  // Get supplier by id
  getById(id: string) {
    return request.get<Supplier>(`/suppliers/${id}`)
  },

  // Create supplier
  create(data: Partial<Supplier>) {
    return request.post<Supplier>('/suppliers', data)
  },

  // Update supplier
  update(id: string, data: Partial<Supplier>) {
    return request.patch<Supplier>(`/suppliers/${id}`, data)
  },

  // Delete supplier
  delete(id: string) {
    return request.delete(`/suppliers/${id}`)
  },

  // Export suppliers to Excel
  export(data?: { fields?: Array<{ key: string; label: string; width?: number }>; ids?: string[] }) {
    return request.post('/suppliers/export', data || {}, {
      responseType: 'blob',
    }).then((response) => {
      // Create download link
      const blob = new Blob([response], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `供应商列表_${new Date().toISOString().slice(0, 10)}.xlsx`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    })
  },
}
