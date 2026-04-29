import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Supplier } from '@/types'
import { supplierApi } from '@/api/supplier'

/**
 * 供应商管理 Store
 * 缓存供应商列表数据，支持搜索和过滤
 */
export const useSupplierStore = defineStore('supplier', () => {
  // State
  const suppliers = ref<Supplier[]>([])
  const loading = ref(false)
  const lastFetchTime = ref<number>(0)
  const CACHE_DURATION = 5 * 60 * 1000 // 5分钟缓存

  // Getters
  const activeSuppliers = computed(() =>
    suppliers.value.filter(s => !s.deletedAt)
  )

  const suppliersById = computed(() => {
    const map = new Map<string, Supplier>()
    suppliers.value.forEach(supplier => {
      map.set(supplier.id, supplier)
    })
    return map
  })

  // Actions
  async function fetchSuppliers(forceRefresh = false) {
    const now = Date.now()
    if (!forceRefresh && suppliers.value.length > 0 && now - lastFetchTime.value < CACHE_DURATION) {
      return suppliers.value
    }

    loading.value = true
    try {
      suppliers.value = await supplierApi.getList()
      lastFetchTime.value = now
      return suppliers.value
    } finally {
      loading.value = false
    }
  }

  function getSupplierById(id: string): Supplier | undefined {
    return suppliersById.value.get(id)
  }

  function searchSuppliers(keyword: string): Supplier[] {
    if (!keyword) return activeSuppliers.value
    const lowerKeyword = keyword.toLowerCase()
    return activeSuppliers.value.filter(supplier =>
      supplier.name?.toLowerCase().includes(lowerKeyword) ||
      supplier.contact?.toLowerCase().includes(lowerKeyword) ||
      supplier.phone?.includes(keyword)
    )
  }

  function clearCache() {
    suppliers.value = []
    lastFetchTime.value = 0
  }

  return {
    // State
    suppliers,
    loading,
    lastFetchTime,

    // Getters
    activeSuppliers,
    suppliersById,

    // Actions
    fetchSuppliers,
    getSupplierById,
    searchSuppliers,
    clearCache,
  }
})
