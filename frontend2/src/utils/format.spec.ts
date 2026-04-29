import { describe, it, expect } from 'vitest'
import { formatAmount, formatPercent, formatDate, formatFileSize, formatPhone, truncateText } from './format'

describe('formatAmount', () => {
  it('should format positive numbers with locale string', () => {
    expect(formatAmount(1234.56)).toBe('1,234.56')
    expect(formatAmount(1000000)).toBe('1,000,000')
  })

  it('should return 0 for null or undefined values', () => {
    expect(formatAmount(null)).toBe('0')
    expect(formatAmount(undefined)).toBe('0')
    expect(formatAmount(0)).toBe('0')
  })

  it('should handle decimal numbers', () => {
    expect(formatAmount(0.01)).toBe('0.01')
    expect(formatAmount(99.99)).toBe('99.99')
  })
})

describe('formatPercent', () => {
  it('should convert decimal to percentage string', () => {
    expect(formatPercent(0.5)).toBe('50.0%')
    expect(formatPercent(0.75)).toBe('75.0%')
    expect(formatPercent(1)).toBe('100.0%')
  })

  it('should use default 1 decimal place', () => {
    expect(formatPercent(0.333)).toBe('33.3%')
    expect(formatPercent(0.12345)).toBe('12.3%')
  })

  it('should allow custom decimal places', () => {
    expect(formatPercent(0.12345, 2)).toBe('12.35%')
    expect(formatPercent(0.5, 0)).toBe('50%')
    expect(formatPercent(0.12345, 3)).toBe('12.345%')
  })

  it('should handle edge cases', () => {
    expect(formatPercent(0)).toBe('0.0%')
    expect(formatPercent(0.0099, 2)).toBe('0.99%')
  })
})

describe('formatDate', () => {
  const testDate = new Date('2026-04-20T14:30:45Z')

  it('should format date as YYYY-MM-DD by default', () => {
    expect(formatDate(testDate, 'date')).toBe('2026-04-20')
  })

  it('should format datetime as YYYY-MM-DD HH:mm:ss', () => {
    expect(formatDate(testDate, 'datetime')).toBe('2026-04-20 14:30:45')
  })

  it('should format time as HH:mm:ss', () => {
    expect(formatDate(testDate, 'time')).toBe('14:30:45')
  })

  it('should handle string date input', () => {
    expect(formatDate('2026-04-20', 'date')).toBe('2026-04-20')
  })

  it('should return - for null or undefined values', () => {
    expect(formatDate(null)).toBe('-')
    expect(formatDate(undefined)).toBe('-')
    expect(formatDate('')).toBe('-')
  })

  it('should return - for invalid dates', () => {
    expect(formatDate('invalid-date', 'date')).toBe('-')
  })

  it('should handle dates with single digit month/day', () => {
    const singleDigitDate = new Date('2026-01-05T09:08:07Z')
    expect(formatDate(singleDigitDate, 'date')).toBe('2026-01-05')
    expect(formatDate(singleDigitDate, 'time')).toBe('09:08:07')
  })
})

describe('formatFileSize', () => {
  it('should format bytes in appropriate units', () => {
    expect(formatFileSize(0)).toBe('0 B')
    expect(formatFileSize(500)).toBe('500 B')
    expect(formatFileSize(1024)).toBe('1 KB')
    expect(formatFileSize(1536)).toBe('1.50 KB')
    expect(formatFileSize(1024 * 1024)).toBe('1 MB')
    expect(formatFileSize(1024 * 1024 * 1024)).toBe('1 GB')
    expect(formatFileSize(1024 * 1024 * 1024 * 1024)).toBe('1 TB')
  })

  it('should use 2 decimal places for file sizes', () => {
    expect(formatFileSize(1234567)).toBe('1.18 MB')
    expect(formatFileSize(999999)).toBe('976.56 KB')
  })
})

describe('formatPhone', () => {
  it('should format phone number with spaces', () => {
    expect(formatPhone('13812345678')).toBe('138 1234 5678')
  })

  it('should return - for empty or null values', () => {
    expect(formatPhone('')).toBe('-')
    expect(formatPhone(null as any)).toBe('-')
    expect(formatPhone(undefined as any)).toBe('-')
  })

  it('should handle phone numbers with different lengths', () => {
    expect(formatPhone('12345678901')).toBe('123 4567 8901')
  })
})

describe('truncateText', () => {
  it('should truncate text longer than max length', () => {
    expect(truncateText('Hello World', 5)).toBe('Hello...')
    expect(truncateText('This is a long text', 10)).toBe('This is a ...')
  })

  it('should return original text if shorter than max length', () => {
    expect(truncateText('Hi', 5)).toBe('Hi')
    expect(truncateText('Exact length', 12)).toBe('Exact length')
  })

  it('should handle empty or null values', () => {
    expect(truncateText('', 10)).toBe('')
    expect(truncateText(null as any, 10)).toBe(null as any)
  })

  it('should handle unicode characters correctly', () => {
    expect(truncateText('你好世界', 2)).toBe('你好...')
  })
})
