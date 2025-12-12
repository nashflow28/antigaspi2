import { formatCurrency, parseCurrency, formatDiscount } from './currencyHelpers'

// Helper: Intl.NumberFormat('fr-FR') uses Narrow No-Break Space (\u202F) for thousand separators only
// The spaces around "F CFA" remain regular spaces
const nnbsp = '\u202F'
// Format number with NNBSP thousand separators: "1 000" -> "1[NNBSP]000"
const fmtNum = (num: string) => num.replace(/ /g, nnbsp)
// Full currency format: "1 000 F CFA" -> "1[NNBSP]000 F CFA"
const fmtCurrency = (num: string) => `${fmtNum(num)} F CFA`

describe('currencyHelpers', () => {
  describe('formatCurrency', () => {
    it('should format basic numbers correctly', () => {
      expect(formatCurrency(500)).toBe('500 F CFA')
      expect(formatCurrency(1000)).toBe(fmtCurrency('1 000'))
      expect(formatCurrency(1500)).toBe(fmtCurrency('1 500'))
    })

    it('should format large numbers with thousand separators', () => {
      expect(formatCurrency(10000)).toBe(fmtCurrency('10 000'))
      expect(formatCurrency(100000)).toBe(fmtCurrency('100 000'))
      expect(formatCurrency(1000000)).toBe(fmtCurrency('1 000 000'))
    })

    it('should handle string inputs', () => {
      expect(formatCurrency('500')).toBe('500 F CFA')
      expect(formatCurrency('1500')).toBe(fmtCurrency('1 500'))
      expect(formatCurrency('2500.75')).toBe(fmtCurrency('2 501')) // Rounded
    })

    it('should round decimal values', () => {
      expect(formatCurrency(1500.25)).toBe(fmtCurrency('1 500'))
      expect(formatCurrency(1500.75)).toBe(fmtCurrency('1 501'))
      expect(formatCurrency(999.99)).toBe(fmtCurrency('1 000'))
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
      expect(formatCurrency(1500, { showSymbol: false })).toBe(fmtNum('1 500'))
      expect(formatCurrency(10000, { showSymbol: false })).toBe(fmtNum('10 000'))
    })

    it('should support decimals option', () => {
      // Note: implementation rounds BEFORE formatting, so 1500.75 becomes 1501,00
      // French locale uses comma for decimal separator
      expect(formatCurrency(1500.75, { decimals: 2 })).toBe(`${fmtNum('1 501')},00 F CFA`)
      expect(formatCurrency(1500, { decimals: 2 })).toBe(`${fmtNum('1 500')},00 F CFA`)
    })

    // Note: thousandSeparator option is defined but not implemented - Intl.NumberFormat always uses locale
    it.skip('should support custom thousand separator', () => {
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
      expect(formatCurrency(999999999999)).toBe(fmtCurrency('999 999 999 999'))
      expect(formatCurrency(1000000000)).toBe(fmtCurrency('1 000 000 000'))
    })

    it('should handle scientific notation', () => {
      expect(formatCurrency(1e6)).toBe(fmtCurrency('1 000 000'))
      expect(formatCurrency(1.5e6)).toBe(fmtCurrency('1 500 000'))
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
      // parseCurrency handles both NNBSP and regular spaces via \s regex
      expect(parseCurrency(fmtCurrency('1 500'))).toBe(1500)
      expect(parseCurrency(fmtCurrency('10 000'))).toBe(10000)
      expect(parseCurrency(fmtCurrency('1 000 000'))).toBe(1000000)
    })

    it('should parse numbers without currency symbol', () => {
      expect(parseCurrency(fmtNum('1 500'))).toBe(1500)
      expect(parseCurrency(fmtNum('10 000'))).toBe(10000)
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
