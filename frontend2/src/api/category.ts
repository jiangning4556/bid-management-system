import request from '@/utils/request'
import type { Category } from '@/types'

export const categoryApi = {
  // Get all categories as tree
  getTree() {
    return request.get<Category[]>('/categories/tree')
  },

  // Get all categories
  getList() {
    return request.get<Category[]>('/categories')
  },

  // Get category by id
  getById(id: string) {
    return request.get<Category>(`/categories/${id}`)
  },

  // Create category
  create(data: Partial<Category>) {
    return request.post<Category>('/categories', data)
  },

  // Update category
  update(id: string, data: Partial<Category>) {
    return request.patch<Category>(`/categories/${id}`, data)
  },

  // Delete category
  delete(id: string) {
    return request.delete(`/categories/${id}`)
  },
}
