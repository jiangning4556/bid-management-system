import request from '@/utils/request'

export interface PriceQueryResult {
  item: {
    id: string
    name: string
    code?: string
    model?: string
    spec?: string
    unit?: string
  }
  consultQuotes: Array<{
    supplier?: string
    price: number
    quantity: number
    totalAmount: number
    brand?: string
    contact?: string
    phone?: string
    project?: string
  }>
  bidSuppliers: Array<{
    supplier?: string
    amount: number
    progress: string
    paymentStatus: string
  }>
}

export const priceQueryApi = {
  // Search by item name
  search(query: string) {
    return request.get<PriceQueryResult[]>('/price-query/search', { params: { q: query } })
  },

  // Search by supplier
  searchBySupplier(supplierId: string) {
    return request.get(`/price-query/supplier/${supplierId}`)
  },

  // Get price trends for an item
  getPriceTrends(itemId: string) {
    return request.get(`/price-query/trends/${itemId}`)
  },
}
