import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Category } from '@/types'
import { categoryApi } from '@/api/category'

/**
 * 分类管理 Store
 * 缓存分类树数据，减少重复请求
 */
export const useCategoryStore = defineStore('category', () => {
  // State
  const categories = ref<Category[]>([])
  const loading = ref(false)
  const lastFetchTime = ref<number>(0)
  const CACHE_DURATION = 5 * 60 * 1000 // 5分钟缓存

  // Getters
  const categoryTree = computed(() => categories.value)

  const categoryMap = computed(() => {
    const map = new Map<string, Category>()
    function traverse(list: Category[]) {
      list.forEach(cat => {
        map.set(cat.id, cat)
        if (cat.children?.length) {
          traverse(cat.children)
        }
      })
    }
    traverse(categories.value)
    return map
  })

  // Actions
  async function fetchCategories(forceRefresh = false) {
    const now = Date.now()
    if (!forceRefresh && categories.value.length > 0 && now - lastFetchTime.value < CACHE_DURATION) {
      return categories.value
    }

    loading.value = true
    try {
      categories.value = await categoryApi.getTree()
      lastFetchTime.value = now
      return categories.value
    } finally {
      loading.value = false
    }
  }

  function getCategoryById(id: string): Category | undefined {
    return categoryMap.value.get(id)
  }

  function getChildren(parentId: string): Category[] {
    const parent = categoryMap.value.get(parentId)
    return parent?.children || []
  }

  function clearCache() {
    categories.value = []
    lastFetchTime.value = 0
  }

  return {
    // State
    categories,
    loading,
    lastFetchTime,

    // Getters
    categoryTree,
    categoryMap,

    // Actions
    fetchCategories,
    getCategoryById,
    getChildren,
    clearCache,
  }
})
