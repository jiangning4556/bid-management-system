import request from '@/utils/request'
import type { ConsultProject, BidProject, ConsultProjectItem, SupplierQuote, BidSupplier } from '@/types'
import type { AdvancedSearchDto } from '@/api/supplier'

// Re-export AdvancedSearchDto for convenience
export type { AdvancedSearchDto, SearchCondition } from '@/api/supplier'

export const consultProjectApi = {
  // Get all consult projects
  getList(params?: { page?: number; limit?: number; sortBy?: string; sortOrder?: string }) {
    return request.get('/consult-projects', { params })
  },

  // Advanced search
  advancedSearch(searchDto: AdvancedSearchDto, params?: { page?: number; limit?: number; sortBy?: string; sortOrder?: string }) {
    return request.post('/consult-projects/search', searchDto, { params })
  },

  // Get consult project by id
  getById(id: string) {
    return request.get<ConsultProject>(`/consult-projects/${id}`)
  },

  // Create consult project
  create(data: Partial<ConsultProject>) {
    return request.post<ConsultProject>('/consult-projects', data)
  },

  // Update consult project
  update(id: string, data: Partial<ConsultProject>) {
    return request.patch<ConsultProject>(`/consult-projects/${id}`, data)
  },

  // Delete consult project
  delete(id: string) {
    return request.delete(`/consult-projects/${id}`)
  },

  // Add item to project
  addItem(projectId: string, data: Partial<ConsultProjectItem>) {
    return request.post<ConsultProjectItem>(`/consult-projects/${projectId}/items`, data)
  },

  // Delete project item
  deleteItem(projectId: string, itemId: string) {
    return request.delete(`/consult-projects/${projectId}/items/${itemId}`)
  },

  // Update project item
  updateItem(itemId: string, data: { quantity?: number; remarks?: string }) {
    return request.patch(`/consult-projects/items/${itemId}`, data)
  },

  // Add supplier quote
  addQuote(projectItemId: string, data: Partial<SupplierQuote>) {
    return request.post<SupplierQuote>(`/consult-projects/items/${projectItemId}/quotes`, data)
  },

  // Update quote
  updateQuote(quoteId: string, data: Partial<SupplierQuote>) {
    return request.patch<SupplierQuote>(`/consult-projects/quotes/${quoteId}`, data)
  },

  // Delete quote
  deleteQuote(quoteId: string) {
    return request.delete(`/consult-projects/quotes/${quoteId}`)
  },

  // Toggle quote selection
  toggleQuote(quoteId: string) {
    return request.post<SupplierQuote>(`/consult-projects/quotes/${quoteId}/toggle`)
  },

  // Export consult projects to Excel
  export(data?: { fields?: Array<{ key: string; label: string; width?: number }>; ids?: string[] }) {
    return request.post('/consult-projects/export', data || {}, {
      responseType: 'blob',
    }).then((response) => {
      const blob = new Blob([response], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `咨询项目列表_${new Date().toISOString().slice(0, 10)}.xlsx`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    })
  },
}

export const bidProjectApi = {
  // Get all bid projects
  getList(params?: { page?: number; limit?: number; sortBy?: string; sortOrder?: string }) {
    return request.get('/bid-projects', { params })
  },

  // Advanced search
  advancedSearch(searchDto: AdvancedSearchDto, params?: { page?: number; limit?: number; sortBy?: string; sortOrder?: string }) {
    return request.post('/bid-projects/search', searchDto, { params })
  },

  // Get bid project by id
  getById(id: string) {
    return request.get<BidProject>(`/bid-projects/${id}`)
  },

  // Create from consult project
  createFromConsult(consultId: string) {
    return request.post<BidProject>(`/bid-projects/from-consult/${consultId}`)
  },

  // Create bid project
  create(data: Partial<BidProject>) {
    return request.post<BidProject>('/bid-projects', data)
  },

  // Update bid project
  update(id: string, data: Partial<BidProject>) {
    return request.patch<BidProject>(`/bid-projects/${id}`, data)
  },

  // Delete bid project
  delete(id: string) {
    return request.delete(`/bid-projects/${id}`)
  },

  // Add item to project
  addItem(projectId: string, data: any) {
    return request.post(`/bid-projects/${projectId}/items`, data)
  },

  // Update project item
  updateItem(projectId: string, itemId: string, data: { quantity?: number; remarks?: string }) {
    return request.patch(`/bid-projects/${projectId}/items/${itemId}`, data)
  },

  // Get project statistics
  getStatistics(id: string) {
    return request.get(`/bid-projects/${id}/statistics`)
  },

  // Update supplier info
  updateSupplierInfo(supplierId: string, data: Partial<BidSupplier>) {
    return request.patch<BidSupplier>(`/bid-projects/suppliers/${supplierId}`, data)
  },

  // Toggle supplier selection
  toggleSupplier(supplierId: string) {
    return request.post<BidSupplier>(`/bid-projects/suppliers/${supplierId}/toggle`)
  },

  // Delete supplier from project item
  deleteSupplier(supplierId: string) {
    return request.delete(`/bid-projects/suppliers/${supplierId}`)
  },

  // Delete project item
  deleteItem(projectId: string, itemId: string) {
    return request.delete(`/bid-projects/${projectId}/items/${itemId}`)
  },

  // Add supplier to existing project item
  addSupplierToItem(itemId: string, data: any) {
    return request.post(`/bid-projects/items/${itemId}/suppliers`, data)
  },

  // Export bid projects to Excel
  export(data?: { fields?: Array<{ key: string; label: string; width?: number }>; ids?: string[] }) {
    return request.post('/bid-projects/export', data || {}, {
      responseType: 'blob',
    }).then((response) => {
      const blob = new Blob([response], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `中标项目列表_${new Date().toISOString().slice(0, 10)}.xlsx`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    })
  },
}
