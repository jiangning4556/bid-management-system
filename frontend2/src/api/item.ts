import request from '@/utils/request'
import type { Item } from '@/types'

export const itemApi = {
  // Get all items
  getList(params?: { page?: number; limit?: number; sortBy?: string; sortOrder?: string }) {
    return request.get<Item[]>('/items', { params })
  },

  // Get items by category
  getByCategory(categoryId: string) {
    return request.get<Item[]>(`/items/category/${categoryId}`)
  },

  // Get item by id
  getById(id: string) {
    return request.get<Item>(`/items/${id}`)
  },

  // Create item
  create(data: Partial<Item>) {
    return request.post<Item>('/items', data)
  },

  // Update item
  update(id: string, data: Partial<Item>) {
    return request.patch<Item>(`/items/${id}`, data)
  },

  // Delete item
  delete(id: string) {
    return request.delete(`/items/${id}`)
  },
}
