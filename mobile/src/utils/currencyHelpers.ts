/**
 * Currency formatting utilities for XOF (Franc CFA)
 */

export interface FormatCurrencyOptions {
  /** Whether to include the currency symbol (default: true) */
  showSymbol?: boolean
  /** Number of decimal places (default: 0 for XOF) */
  decimals?: number
  /** Thousand separator character (default: ' ' for West Africa) */
  thousandSeparator?: string
}

/**
 * Format a number as XOF currency (F CFA)
 * @param value - The amount to format (number or string). Negative values are converted to 0.
 * @param options - Formatting options
 * @returns Formatted currency string (e.g., "1 500 F CFA")
 *
 * @example
 * formatCurrency(1500) // "1 500 F CFA"
 * formatCurrency("2500.50") // "2 501 F CFA" (rounded)
 * formatCurrency(1000000) // "1 000 000 F CFA"
 * formatCurrency(500, { showSymbol: false }) // "500"
 * formatCurrency(-100) // "0 F CFA" (negatives converted to 0)
 */
export const formatCurrency = (
  value: number | string | null | undefined,
  options: FormatCurrencyOptions = {}
): string => {
  const {
    showSymbol = true,
    decimals = 0,
    thousandSeparator = ' ',
  } = options

  // Handle null/undefined
  if (value == null) {
    return showSymbol ? '0 F CFA' : '0'
  }

  // Parse value to number
  let numericValue: number
  if (typeof value === 'string') {
    numericValue = parseFloat(value)
    if (isNaN(numericValue)) {
      return showSymbol ? '0 F CFA' : '0'
    }
  } else {
    numericValue = value
  }

  // Handle NaN (from number inputs like 0/0)
  if (isNaN(numericValue)) {
    return showSymbol ? '0 F CFA' : '0'
  }

  // Handle Infinity and -Infinity
  if (!isFinite(numericValue)) {
    return showSymbol ? '0 F CFA' : '0'
  }

  // Handle negative numbers (convert to 0)
  if (numericValue < 0) {
    return showSymbol ? '0 F CFA' : '0'
  }

  // Round to specified decimal places
  const roundedValue = Math.round(numericValue * Math.pow(10, decimals)) / Math.pow(10, decimals)

  // Format with thousand separators
  const parts = roundedValue.toFixed(decimals).split('.')
  const integerPart = parts[0]
  const decimalPart = parts[1]

  // Add thousand separators
  const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, thousandSeparator)

  // Combine integer and decimal parts
  let formattedValue = formattedInteger
  if (decimals > 0 && decimalPart) {
    formattedValue += '.' + decimalPart
  }

  // Add currency symbol
  return showSymbol ? `${formattedValue} F CFA` : formattedValue
}

/**
 * Parse a currency string back to a number
 * @param currencyString - The currency string to parse (e.g., "1 500 F CFA")
 * @returns Numeric value
 *
 * @example
 * parseCurrency("1 500 F CFA") // 1500
 * parseCurrency("2 500") // 2500
 */
export const parseCurrency = (currencyString: string | null | undefined): number => {
  if (!currencyString) return 0

  // Remove currency symbol and thousand separators
  const cleanedString = currencyString
    .replace(/F CFA/gi, '')
    .replace(/\s/g, '')
    .trim()

  const parsed = parseFloat(cleanedString)
  return isNaN(parsed) ? 0 : parsed
}

/**
 * Format a discount percentage
 * @param originalPrice - Original price
 * @param discountedPrice - Discounted price
 * @returns Formatted discount percentage (e.g., "-25%")
 *
 * @example
 * formatDiscount(1000, 750) // "-25%"
 * formatDiscount(500, 400) // "-20%"
 */
export const formatDiscount = (
  originalPrice: number | string,
  discountedPrice: number | string
): string => {
  const original = typeof originalPrice === 'string' ? parseFloat(originalPrice) : originalPrice
  const discounted = typeof discountedPrice === 'string' ? parseFloat(discountedPrice) : discountedPrice

  if (original <= 0 || discounted <= 0 || discounted >= original) {
    return '0%'
  }

  const discountPercent = Math.round(((original - discounted) / original) * 100)
  return `-${discountPercent}%`
}
