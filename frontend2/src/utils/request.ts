import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'
import { ElMessage } from 'element-plus'
import router from '@/router'

const BASE_URL = '/api'

class ApiService {
  private instance: AxiosInstance

  constructor() {
    this.instance = axios.create({
      baseURL: BASE_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    })

    this.setupInterceptors()
  }

  private setupInterceptors() {
    // Request interceptor
    this.instance.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('token')
        if (token) {
          config.headers.Authorization = `Bearer ${token}`
        }
        // For FormData, let browser set Content-Type automatically with boundary
        if (config.data instanceof FormData) {
          delete config.headers['Content-Type']
        }
        return config
      },
      (error) => {
        return Promise.reject(error)
      }
    )

    // Response interceptor
    this.instance.interceptors.response.use(
      (response: AxiosResponse) => {
        let data = response.data

        // Skip processing for blob responses (file downloads)
        if (response.config.responseType === 'blob') {
          return data
        }

        // Unwrap standard API response format {success: true, data: {...}}
        if (data && typeof data === 'object' && 'success' in data && 'data' in data) {
          data = data.data
        }

        // Helper function to convert decimal strings
        const convertDecimals = (obj: any): any => {
          if (!obj || typeof obj !== 'object') return obj
          if (Array.isArray(obj)) {
            return obj.map(convertDecimals)
          }
          const result: any = {}
          for (const [key, value] of Object.entries(obj)) {
            // All numeric fields (decimal, float, int types from entities)
            // Amount related: totalAmount, amount, contractAmount
            // Price related: price, avgPrice, minPrice, maxPrice
            // Rating related: rating, deliveryRating
            // Business: bidRate
            // Quantity/ratio: quantity, ratio
            // Statistics: totalPayable, totalPaid, totalUnpaid, totalReceivable, totalReceived
            // Quote/Project stats: totalQuoteAmount, quoteAmount, consultAmount, bidAmount
            if (['totalAmount', 'amount', 'contractAmount', 'price', 'avgPrice', 'minPrice', 'maxPrice', 'bidRate', 'rating', 'deliveryRating', 'quantity', 'ratio', 'totalPayable', 'totalPaid', 'totalUnpaid', 'totalReceivable', 'totalReceived', 'totalQuoteAmount', 'quoteAmount', 'consultAmount', 'bidAmount'].includes(key)) {
              // Only convert if it's a string (avoid converting already-number values)
              result[key] = (value === null || value === undefined || typeof value === 'number')
                ? value
                : Number(value)
            } else if (typeof value === 'object' && value !== null) {
              result[key] = convertDecimals(value)
            } else {
              result[key] = value
            }
          }
          return result
        }

        // Convert decimal strings to numbers for object responses
        if (data && typeof data === 'object') {
          data = convertDecimals(data)
        }

        return data
      },
      (error) => {
        if (error.response) {
          const { status, data } = error.response

          // Handle standard error response format from backend
          const errorMessage = data?.error?.message || data?.message || '请求失败'

          switch (status) {
            case 401:
              ElMessage.error('登录已过期，请重新登录')
              localStorage.removeItem('token')
              localStorage.removeItem('user')
              router.push('/login')
              break
            case 403:
              ElMessage.error('没有权限访问')
              break
            case 404:
              ElMessage.error('请求的资源不存在')
              break
            case 500:
              ElMessage.error('服务器错误，请稍后重试')
              break
            default:
              ElMessage.error(errorMessage)
          }
        } else {
          ElMessage.error('网络错误，请检查网络连接')
        }
        return Promise.reject(error)
      }
    )
  }

  public get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return this.instance.get(url, config)
  }

  public post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return this.instance.post(url, data, config)
  }

  public put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return this.instance.put(url, data, config)
  }

  public patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return this.instance.patch(url, data, config)
  }

  public delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return this.instance.delete(url, config)
  }
}

export default new ApiService()
