import { describe, it, expect } from 'vitest'
import {
  convertEurToXOF,
  formatPrice,
  formatPriceFromEur,
  formatSavings,
  calculateDiscountPercentage,
  EUR_TO_XOF_RATE,
  SAMPLE_PRICES,
  CURRENCY_INFO
} from '@/utils/currency'

describe('Currency Utilities', () => {
  describe('convertEurToXOF', () => {
    it('converts euros to XOF correctly', () => {
      expect(convertEurToXOF(1)).toBe(656)
      expect(convertEurToXOF(5)).toBe(3280)
      expect(convertEurToXOF(10.5)).toBe(6888)
    })

    it('rounds to nearest integer', () => {
      expect(convertEurToXOF(1.5)).toBe(984) // 1.5 * 656 = 984
      expect(convertEurToXOF(0.001)).toBe(1) // 0.001 * 656 = 0.656, rounds to 1
    })

    it('handles zero and negative values', () => {
      expect(convertEurToXOF(0)).toBe(0)
      expect(convertEurToXOF(-5)).toBe(-3280)
    })
  })

  describe('formatPrice', () => {
    it('formats price with XOF currency suffix', () => {
      expect(formatPrice(1000)).toBe('1\u202f000 F CFA')
      expect(formatPrice(656)).toBe('656 F CFA')
      expect(formatPrice(10432)).toBe('10\u202f432 F CFA')
    })

    it('handles different locales', () => {
      expect(formatPrice(1000, 'en-US')).toBe('1,000 F CFA')
      expect(formatPrice(1000, 'fr-FR')).toBe('1\u202f000 F CFA')
    })

    it('rounds decimals to integers', () => {
      expect(formatPrice(1000.99)).toBe('1\u202f001 F CFA')
      expect(formatPrice(999.01)).toBe('999 F CFA')
    })

    it('handles zero and negative values', () => {
      expect(formatPrice(0)).toBe('0 F CFA')
      expect(formatPrice(-1000)).toBe('-1\u202f000 F CFA')
    })

    it('handles large numbers', () => {
      expect(formatPrice(1000000)).toBe('1\u202f000\u202f000 F CFA')
      expect(formatPrice(999999999)).toBe('999\u202f999\u202f999 F CFA')
    })
  })

  describe('formatPriceFromEur', () => {
    it('converts and formats euro prices to XOF', () => {
      expect(formatPriceFromEur(1)).toBe('656 F CFA')
      expect(formatPriceFromEur(5)).toBe('3\u202f280 F CFA')
      expect(formatPriceFromEur(10)).toBe('6\u202f560 F CFA')
    })

    it('handles decimals correctly', () => {
      expect(formatPriceFromEur(1.5)).toBe('984 F CFA')
      expect(formatPriceFromEur(2.5)).toBe('1\u202f640 F CFA')
    })

    it('handles different locales', () => {
      expect(formatPriceFromEur(1, 'en-US')).toBe('656 F CFA')
      expect(formatPriceFromEur(1, 'fr-FR')).toBe('656 F CFA')
    })
  })

  describe('formatSavings', () => {
    it('calculates and formats savings correctly', () => {
      expect(formatSavings(1000, 800)).toBe('200 F CFA')
      expect(formatSavings(5000, 3500)).toBe('1\u202f500 F CFA')
      expect(formatSavings(10432, 5216)).toBe('5\u202f216 F CFA')
    })

    it('handles cases where discounted price equals original', () => {
      expect(formatSavings(1000, 1000)).toBe('0 F CFA')
    })

    it('handles cases where discounted price is higher', () => {
      expect(formatSavings(800, 1000)).toBe('-200 F CFA')
    })

    it('handles zero values', () => {
      expect(formatSavings(0, 0)).toBe('0 F CFA')
      expect(formatSavings(1000, 0)).toBe('1\u202f000 F CFA')
    })
  })

  describe('calculateDiscountPercentage', () => {
    it('calculates discount percentage correctly', () => {
      expect(calculateDiscountPercentage(1000, 800)).toBe(20)
      expect(calculateDiscountPercentage(1000, 500)).toBe(50)
      expect(calculateDiscountPercentage(1000, 900)).toBe(10)
    })

    it('handles 100% discount', () => {
      expect(calculateDiscountPercentage(1000, 0)).toBe(100)
    })

    it('handles no discount', () => {
      expect(calculateDiscountPercentage(1000, 1000)).toBe(0)
    })

    it('handles zero original price', () => {
      expect(calculateDiscountPercentage(0, 0)).toBe(0)
      expect(calculateDiscountPercentage(0, 100)).toBe(0)
    })

    it('rounds to nearest percentage', () => {
      expect(calculateDiscountPercentage(1000, 667)).toBe(33) // 33.3% rounds to 33
      expect(calculateDiscountPercentage(1000, 666)).toBe(33) // 33.4% rounds to 33
      expect(calculateDiscountPercentage(1000, 665)).toBe(34) // 33.5% rounds to 34
    })

    it('handles negative discount (price increase)', () => {
      expect(calculateDiscountPercentage(800, 1000)).toBe(-25) // 25% increase
    })
  })

  describe('EUR_TO_XOF_RATE', () => {
    it('is defined and has expected value', () => {
      expect(EUR_TO_XOF_RATE).toBe(656)
      expect(typeof EUR_TO_XOF_RATE).toBe('number')
    })
  })

  describe('SAMPLE_PRICES', () => {
    it('contains all expected price categories', () => {
      expect(SAMPLE_PRICES.BREAD).toBeDefined()
      expect(SAMPLE_PRICES.CROISSANTS).toBeDefined()
      expect(SAMPLE_PRICES.CHEESE_PLATTER).toBeDefined()
      expect(SAMPLE_PRICES.YOGURT).toBeDefined()
      expect(SAMPLE_PRICES.BANANAS).toBeDefined()
      expect(SAMPLE_PRICES.VEGETABLES).toBeDefined()
    })

    it('has valid price structures', () => {
      Object.values(SAMPLE_PRICES).forEach(priceObj => {
        expect(priceObj).toHaveProperty('original')
        expect(priceObj).toHaveProperty('discounted')
        expect(typeof priceObj.original).toBe('number')
        expect(typeof priceObj.discounted).toBe('number')
        expect(priceObj.original).toBeGreaterThan(0)
        expect(priceObj.discounted).toBeGreaterThan(0)
        expect(priceObj.discounted).toBeLessThanOrEqual(priceObj.original)
      })
    })

    it('has reasonable discount percentages', () => {
      Object.values(SAMPLE_PRICES).forEach(priceObj => {
        const discountPercentage = calculateDiscountPercentage(priceObj.original, priceObj.discounted)
        expect(discountPercentage).toBeGreaterThan(0)
        expect(discountPercentage).toBeLessThan(100)
      })
    })
  })

  describe('CURRENCY_INFO', () => {
    it('contains all required currency information', () => {
      expect(CURRENCY_INFO.code).toBe('XOF')
      expect(CURRENCY_INFO.symbol).toBe('F CFA')
      expect(CURRENCY_INFO.name).toBe('Franc CFA')
      expect(CURRENCY_INFO.countries).toBeInstanceOf(Array)
      expect(CURRENCY_INFO.centralBank).toBeDefined()
    })

    it('includes expected West African countries', () => {
      const expectedCountries = [
        'Côte d\'Ivoire',
        'Sénégal',
        'Mali',
        'Burkina Faso',
        'Niger',
        'Guinée-Bissau',
        'Togo',
        'Bénin'
      ]

      expectedCountries.forEach(country => {
        expect(CURRENCY_INFO.countries).toContain(country)
      })

      expect(CURRENCY_INFO.countries).toHaveLength(8)
    })

    it('has correct central bank information', () => {
      expect(CURRENCY_INFO.centralBank).toBe('BCEAO - Banque Centrale des États de l\'Afrique de l\'Ouest')
    })
  })

  describe('Integration tests', () => {
    it('formatPrice and convertEurToXOF work together correctly', () => {
      const euroPrice = 5
      const xofPrice = convertEurToXOF(euroPrice)
      const formattedPrice = formatPrice(xofPrice)

      expect(formattedPrice).toBe('3\u202f280 F CFA')
    })

    it('formatSavings works with sample prices', () => {
      const breadSavings = formatSavings(SAMPLE_PRICES.BREAD.original, SAMPLE_PRICES.BREAD.discounted)
      expect(breadSavings).toBe('1\u202f475 F CFA')

      const bananaSavings = formatSavings(SAMPLE_PRICES.BANANAS.original, SAMPLE_PRICES.BANANAS.discounted)
      expect(bananaSavings).toBe('394 F CFA')
    })

    it('calculateDiscountPercentage works with sample prices', () => {
      const breadDiscount = calculateDiscountPercentage(
        SAMPLE_PRICES.BREAD.original,
        SAMPLE_PRICES.BREAD.discounted
      )
      expect(breadDiscount).toBe(50)

      const cheeseDiscount = calculateDiscountPercentage(
        SAMPLE_PRICES.CHEESE_PLATTER.original,
        SAMPLE_PRICES.CHEESE_PLATTER.discounted
      )
      expect(cheeseDiscount).toBe(50)
    })
  })
})
