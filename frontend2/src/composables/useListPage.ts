import { ref, computed } from 'vue'

/**
 * 列表页数据加载 Composable
 * 统一处理分页、排序、搜索、过滤等列表页通用逻辑
 */

export interface PaginationConfig {
  page?: number
  limit?: number
  total?: number
}

export interface SortConfig {
  sortBy?: string
  sortOrder?: 'asc' | 'desc' | ''
}

export interface ListPageOptions<T> {
  apiCall: (params: any) => Promise<{ data: T[]; total: number }>
  pageSize?: number
  filterFn?: (data: T[], filters: any) => T[]
}

export function useListPage<T>(options: ListPageOptions<T>) {
  const loading = ref(false)
  const data = ref<T[]>([])

  const pagination = ref({
    page: options.pageSize || 1,
    limit: options.pageSize || 10,
    total: 0,
  })

  const sortState = ref<SortConfig>({
    sortBy: '',
    sortOrder: '',
  })

  const searchQuery = ref('')
  const filters = ref<any>({})

  // 计算属性
  const hasData = computed(() => data.value.length > 0)
  const isEmpty = computed(() => !loading.value && data.value.length === 0)

  /**
   * 加载数据
   */
  async function loadData(extraParams?: any) {
    loading.value = true
    try {
      const params = {
        page: pagination.value.page,
        limit: pagination.value.limit,
        sortBy: sortState.value.sortBy,
        sortOrder: sortState.value.sortOrder,
        search: searchQuery.value || undefined,
        ...filters.value,
        ...extraParams,
      }

      const result = await options.apiCall(params)

      // 应用过滤函数
      data.value = options.filterFn
        ? options.filterFn(result.data, { ...filters.value, search: searchQuery.value })
        : result.data

      pagination.value.total = result.total
    } finally {
      loading.value = false
    }
  }

  /**
   * 分页变化
   */
  function handlePageChange(page: number) {
    pagination.value.page = page
    loadData()
  }

  /**
   * 每页数量变化
   */
  function handleSizeChange(size: number) {
    pagination.value.limit = size
    pagination.value.page = 1
    loadData()
  }

  /**
   * 排序变化
   */
  function handleSortChange({ prop, order }: { prop?: string; order?: string | null }) {
    if (!prop || !order) {
      sortState.value.sortBy = ''
      sortState.value.sortOrder = ''
    } else {
      sortState.value.sortBy = prop
      sortState.value.sortOrder = order === 'ascending' ? 'asc' : 'desc'
    }
    loadData()
  }

  /**
   * 搜索
   */
  function handleSearch(query: string) {
    searchQuery.value = query
    pagination.value.page = 1
    loadData()
  }

  /**
   * 设置过滤条件
   */
  function setFilters(newFilters: any) {
    filters.value = { ...filters.value, ...newFilters }
    pagination.value.page = 1
    loadData()
  }

  /**
   * 清除过滤条件
   */
  function clearFilters() {
    filters.value = {}
    searchQuery.value = ''
    pagination.value.page = 1
    loadData()
  }

  /**
   * 刷新数据
   */
  function refresh() {
    loadData()
  }

  return {
    // 状态
    loading,
    data,
    pagination,
    sortState,
    searchQuery,
    filters,

    // 计算属性
    hasData,
    isEmpty,

    // 方法
    loadData,
    handlePageChange,
    handleSizeChange,
    handleSortChange,
    handleSearch,
    setFilters,
    clearFilters,
    refresh,
  }
}
