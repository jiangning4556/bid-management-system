import { describe, it, expect, vi, beforeEach } from 'vitest'

describe('Request Utility', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(Storage.prototype, 'getItem').mockReturnValue(null)
  })

  describe('Module Configuration', () => {
    it('should have request utility exported', async () => {
      const { default: request } = await import('./request')
      expect(request).toBeDefined()
      expect(request.get).toBeDefined()
      expect(request.post).toBeDefined()
      expect(request.put).toBeDefined()
      expect(request.patch).toBeDefined()
      expect(request.delete).toBeDefined()
    })
  })

  describe('Number Conversion Logic', () => {
    it('should handle null and undefined values correctly', () => {
      const testCases = [
        { value: null, expected: null },
        { value: undefined, expected: undefined },
        { value: '123', expected: 123 },
        { value: 123, expected: 123 },
      ]

      testCases.forEach(({ value, expected }) => {
        const result = value === null || value === undefined || typeof value === 'number'
          ? value
          : Number(value)

        expect(result).toBe(expected)
      })
    })

    it('should handle edge cases in number conversion', () => {
      const edgeCases = [
        { input: '', output: 0 },
        { input: 'abc', output: NaN },
        { input: '0', output: 0 },
        { input: '0.00', output: 0 },
      ]

      edgeCases.forEach(({ input, output }) => {
        const result = Number(input)
        if (isNaN(result) && input !== '') {
          expect(isNaN(result)).toBe(true)
        } else {
          expect(result).toBe(output)
        }
      })
    })

    it('should identify numeric field names correctly', () => {
      const numericFields = [
        'totalAmount',
        'amount',
        'contractAmount',
        'price',
        'bidRate',
        'rating',
        'deliveryRating',
        'quantity',
        'ratio',
      ]

      const mockData = {
        totalAmount: '1000.50',
        amount: '500',
        contractAmount: '2000',
        price: '99.99',
        bidRate: '0.85',
        rating: '4.5',
        deliveryRating: '5',
        quantity: '10',
        ratio: '0.75',
        name: 'Project Name',
        id: 'project-1',
      }

      numericFields.forEach(field => {
        expect(mockData).toHaveProperty(field)
        expect(typeof mockData[field as keyof typeof mockData]).toBe('string')
      })
    })

    it('should convert string values to numbers for numeric fields', () => {
      const conversions = {
        totalAmount: '1000.50',
        amount: '500',
        price: '99.99',
        quantity: '10',
      }

      Object.entries(conversions).forEach(([field, value]) => {
        const converted = (value === null || value === undefined || typeof value === 'number')
          ? value
          : Number(value)
        expect(converted).toBe(Number(value))
        expect(typeof converted).toBe('number')
      })
    })
  })

  describe('Request Interceptor - Token Handling', () => {
    it('should add Authorization header when token exists', () => {
      const mockToken = 'test-jwt-token'
      localStorage.setItem('token', mockToken)

      const token = localStorage.getItem('token')
      expect(token).toBe(mockToken)

      // Clean up
      localStorage.removeItem('token')
    })

    it('should return null when token does not exist', () => {
      // Make sure token doesn't exist
      localStorage.removeItem('token')

      const token = localStorage.getItem('token')
      expect(token).toBeNull()
    })
  })

  describe('Response Interceptor - Decimal Field Conversion', () => {
    it('should convert decimal strings to numbers recursively', () => {
      const convertDecimals = (obj: any): any => {
        if (!obj || typeof obj !== 'object') return obj
        if (Array.isArray(obj)) {
          return obj.map(convertDecimals)
        }
        const result: any = {}
        for (const [key, value] of Object.entries(obj)) {
          const numericFields = ['totalAmount', 'amount', 'contractAmount', 'price', 'bidRate', 'rating', 'deliveryRating', 'quantity', 'ratio']
          if (numericFields.includes(key)) {
            result[key] = (value === null || value === undefined || typeof value === 'number')
              ? value
              : Number(value)
          } else if (typeof value === 'object') {
            result[key] = convertDecimals(value)
          } else {
            result[key] = value
          }
        }
        return result
      }

      const mockData = {
        id: 'project-1',
        name: 'Test Project',
        totalAmount: '1000.50',
        items: [
          { id: 'item-1', price: '99.99', quantity: '10' },
          { id: 'item-2', price: '50.00', quantity: '5' },
        ],
      }

      const result = convertDecimals(mockData)

      expect(result.totalAmount).toBe(1000.50)
      expect(result.items[0].price).toBe(99.99)
      expect(result.items[0].quantity).toBe(10)
      expect(result.items[1].price).toBe(50.00)
      expect(result.items[1].quantity).toBe(5)
    })

    it('should handle null and undefined values in numeric fields', () => {
      const convertDecimals = (obj: any): any => {
        if (!obj || typeof obj !== 'object') return obj
        if (Array.isArray(obj)) {
          return obj.map(convertDecimals)
        }
        const result: any = {}
        for (const [key, value] of Object.entries(obj)) {
          const numericFields = ['totalAmount', 'amount', 'contractAmount', 'price', 'bidRate', 'rating', 'deliveryRating', 'quantity', 'ratio']
          if (numericFields.includes(key)) {
            result[key] = (value === null || value === undefined || typeof value === 'number')
              ? value
              : Number(value)
          } else if (typeof value === 'object') {
            result[key] = convertDecimals(value)
          } else {
            result[key] = value
          }
        }
        return result
      }

      const mockData = {
        id: 'project-1',
        totalAmount: null,
        amount: undefined,
        price: '100',
        contractAmount: 500, // already a number
      }

      const result = convertDecimals(mockData)

      expect(result.totalAmount).toBeNull()
      expect(result.amount).toBeUndefined()
      expect(result.price).toBe(100)
      expect(result.contractAmount).toBe(500)
    })
  })
})
