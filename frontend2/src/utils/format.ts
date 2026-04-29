/**
 * 统一格式化工具函数
 * 消除跨组件的重复格式化代码
 */

/**
 * 格式化金额
 * @param amount 金额数值
 */
export function formatAmount(amount: number | undefined | null): string {
  if (!amount) return '0'
  return amount.toLocaleString()
}

/**
 * 格式化百分比
 * @param value 小数值 (0.5 = 50%)
 * @param decimals 小数位数
 */
export function formatPercent(value: number, decimals: number = 1): string {
  return `${(value * 100).toFixed(decimals)}%`
}

/**
 * 格式化日期
 * @param date 日期字符串或 Date 对象
 * @param format 格式类型
 */
export function formatDate(
  date: string | Date | undefined | null,
  format: 'date' | 'datetime' | 'time' = 'date'
): string {
  if (!date) return '-'

  const d = typeof date === 'string' ? new Date(date) : date

  if (isNaN(d.getTime())) return '-'

  const year = d.getUTCFullYear()
  const month = String(d.getUTCMonth() + 1).padStart(2, '0')
  const day = String(d.getUTCDate()).padStart(2, '0')
  const hours = String(d.getUTCHours()).padStart(2, '0')
  const minutes = String(d.getUTCMinutes()).padStart(2, '0')
  const seconds = String(d.getUTCSeconds()).padStart(2, '0')

  switch (format) {
    case 'date':
      return `${year}-${month}-${day}`
    case 'datetime':
      return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
    case 'time':
      return `${hours}:${minutes}:${seconds}`
  }
}

/**
 * 格式化文件大小
 * @param bytes 字节数
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'

  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  const value = bytes / Math.pow(k, i)
  // Don't show decimal places for whole numbers in the base unit (B)
  if (i === 0 || Number.isInteger(value)) {
    return `${value} ${sizes[i]}`
  }
  return `${value.toFixed(2)} ${sizes[i]}`
}

/**
 * 格式化电话号码
 * @param phone 电话号码字符串
 */
export function formatPhone(phone: string): string {
  if (!phone) return '-'
  return phone.replace(/(\d{3})(\d{4})(\d{4})/, '$1 $2 $3')
}

/**
 * 截断文本
 * @param text 原文本
 * @param maxLength 最大长度
 */
export function truncateText(text: string, maxLength: number): string {
  if (!text || text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}
