import { formatCurrency, parseCurrency, formatDiscount } from './currencyHelpers'

describe('currencyHelpers', () => {
  describe('formatCurrency', () => {
    it('should format basic numbers correctly', () => {
      expect(formatCurrency(500)).toBe('500 F CFA')
      expect(formatCurrency(1000)).toBe('1 000 F CFA')
      expect(formatCurrency(1500)).toBe('1 500 F CFA')
    })

    it('should format large numbers with thousand separators', () => {
      expect(formatCurrency(10000)).toBe('10 000 F CFA')
      expect(formatCurrency(100000)).toBe('100 000 F CFA')
      expect(formatCurrency(1000000)).toBe('1 000 000 F CFA')
    })

    it('should handle string inputs', () => {
      expect(formatCurrency('500')).toBe('500 F CFA')
      expect(formatCurrency('1500')).toBe('1 500 F CFA')
      expect(formatCurrency('2500.75')).toBe('2 501 F CFA') // Rounded
    })

    it('should round decimal values', () => {
      expect(formatCurrency(1500.25)).toBe('1 500 F CFA')
      expect(formatCurrency(1500.75)).toBe('1 501 F CFA')
      expect(formatCurrency(999.99)).toBe('1 000 F CFA')
    })

    it('should handle null/undefined values', () => {
      expect(formatCurrency(null)).toBe('0 F CFA')
      expect(formatCurrency(undefined)).toBe('0 F CFA')
    })

    it('should handle invalid string inputs', () => {
      expect(formatCurrency('invalid')).toBe('0 F CFA')
      expect(formatCurrency('')).toBe('0 F CFA')
    })

    it('should support showSymbol option', () => {
      expect(formatCurrency(1500, { showSymbol: false })).toBe('1 500')
      expect(formatCurrency(10000, { showSymbol: false })).toBe('10 000')
    })

    it('should support decimals option', () => {
      expect(formatCurrency(1500.75, { decimals: 2 })).toBe('1 500.75 F CFA')
      expect(formatCurrency(1500, { decimals: 2 })).toBe('1 500.00 F CFA')
    })

    it('should support custom thousand separator', () => {
      expect(formatCurrency(1500, { thousandSeparator: ',' })).toBe('1,500 F CFA')
      expect(formatCurrency(1000000, { thousandSeparator: '.' })).toBe('1.000.000 F CFA')
    })

    it('should handle zero values', () => {
      expect(formatCurrency(0)).toBe('0 F CFA')
      expect(formatCurrency('0')).toBe('0 F CFA')
    })

    it('should handle negative numbers (convert to 0)', () => {
      expect(formatCurrency(-1500)).toBe('0 F CFA')
      expect(formatCurrency(-100)).toBe('0 F CFA')
    })

    it('should handle very large numbers', () => {
      expect(formatCurrency(999999999999)).toBe('999 999 999 999 F CFA')
      expect(formatCurrency(1000000000)).toBe('1 000 000 000 F CFA')
    })

    it('should handle scientific notation', () => {
      expect(formatCurrency(1e6)).toBe('1 000 000 F CFA')
      expect(formatCurrency(1.5e6)).toBe('1 500 000 F CFA')
    })

    it('should handle Infinity', () => {
      expect(formatCurrency(Infinity)).toBe('0 F CFA')
      expect(formatCurrency(-Infinity)).toBe('0 F CFA')
      expect(formatCurrency(1/0)).toBe('0 F CFA')
    })

    it('should handle NaN', () => {
      expect(formatCurrency(NaN)).toBe('0 F CFA')
      expect(formatCurrency(0/0)).toBe('0 F CFA')
      expect(formatCurrency(Math.sqrt(-1))).toBe('0 F CFA')
    })
  })

  describe('parseCurrency', () => {
    it('should parse formatted currency strings', () => {
      expect(parseCurrency('1 500 F CFA')).toBe(1500)
      expect(parseCurrency('10 000 F CFA')).toBe(10000)
      expect(parseCurrency('1 000 000 F CFA')).toBe(1000000)
    })

    it('should parse numbers without currency symbol', () => {
      expect(parseCurrency('1 500')).toBe(1500)
      expect(parseCurrency('10 000')).toBe(10000)
    })

    it('should handle null/undefined/empty values', () => {
      expect(parseCurrency(null)).toBe(0)
      expect(parseCurrency(undefined)).toBe(0)
      expect(parseCurrency('')).toBe(0)
    })

    it('should handle invalid inputs', () => {
      expect(parseCurrency('invalid')).toBe(0)
      expect(parseCurrency('abc F CFA')).toBe(0)
    })

    it('should parse plain numbers', () => {
      expect(parseCurrency('1500')).toBe(1500)
      expect(parseCurrency('10000')).toBe(10000)
    })
  })

  describe('formatDiscount', () => {
    it('should calculate discount percentages correctly', () => {
      expect(formatDiscount(1000, 750)).toBe('-25%')
      expect(formatDiscount(500, 400)).toBe('-20%')
      expect(formatDiscount(1000, 500)).toBe('-50%')
    })

    it('should handle string inputs', () => {
      expect(formatDiscount('1000', '750')).toBe('-25%')
      expect(formatDiscount('500', '400')).toBe('-20%')
    })

    it('should round percentages', () => {
      expect(formatDiscount(1000, 667)).toBe('-33%')
      expect(formatDiscount(1000, 666)).toBe('-33%')
    })

    it('should return 0% for invalid inputs', () => {
      expect(formatDiscount(0, 100)).toBe('0%')
      expect(formatDiscount(100, 0)).toBe('0%')
      expect(formatDiscount(500, 600)).toBe('0%') // Discounted > original
      expect(formatDiscount(500, 500)).toBe('0%') // No discount
    })

    it('should handle small discounts', () => {
      expect(formatDiscount(1000, 990)).toBe('-1%')
      expect(formatDiscount(1000, 950)).toBe('-5%')
    })

    it('should handle large discounts', () => {
      expect(formatDiscount(1000, 100)).toBe('-90%')
      expect(formatDiscount(1000, 10)).toBe('-99%')
    })
  })
})
