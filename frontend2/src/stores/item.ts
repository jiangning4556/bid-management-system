import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Item } from '@/types'
import { itemApi } from '@/api/item'

/**
 * 物品管理 Store
 * 缓存物品列表数据，支持按分类过滤
 */
export const useItemStore = defineStore('item', () => {
  // State
  const items = ref<Item[]>([])
  const loading = ref(false)
  const lastFetchTime = ref<number>(0)
  const CACHE_DURATION = 5 * 60 * 1000 // 5分钟缓存

  // Getters
  const itemsByCategory = computed(() => {
    const map = new Map<string | null, Item[]>()
    items.value.forEach(item => {
      const categoryId = item.categoryId || null
      if (!map.has(categoryId)) {
        map.set(categoryId, [])
      }
      map.get(categoryId)!.push(item)
    })
    return map
  })

  const itemsById = computed(() => {
    const map = new Map<string, Item>()
    items.value.forEach(item => {
      map.set(item.id, item)
    })
    return map
  })

  // Actions
  async function fetchItems(forceRefresh = false) {
    const now = Date.now()
    if (!forceRefresh && items.value.length > 0 && now - lastFetchTime.value < CACHE_DURATION) {
      return items.value
    }

    loading.value = true
    try {
      items.value = await itemApi.getList()
      lastFetchTime.value = now
      return items.value
    } finally {
      loading.value = false
    }
  }

  function getItemById(id: string): Item | undefined {
    return itemsById.value.get(id)
  }

  function getItemsByCategory(categoryId: string | null): Item[] {
    return itemsByCategory.value.get(categoryId) || []
  }

  function searchItems(keyword: string): Item[] {
    if (!keyword) return items.value
    const lowerKeyword = keyword.toLowerCase()
    return items.value.filter(item =>
      item.name?.toLowerCase().includes(lowerKeyword) ||
      item.code?.toLowerCase().includes(lowerKeyword) ||
      item.spec?.toLowerCase().includes(lowerKeyword)
    )
  }

  function clearCache() {
    items.value = []
    lastFetchTime.value = 0
  }

  return {
    // State
    items,
    loading,
    lastFetchTime,

    // Getters
    itemsByCategory,
    itemsById,

    // Actions
    fetchItems,
    getItemById,
    getItemsByCategory,
    searchItems,
    clearCache,
  }
})
