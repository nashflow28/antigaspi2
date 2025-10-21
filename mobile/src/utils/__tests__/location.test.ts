import {
  COORDINATE_PRECISION,
  formatCoordinate,
  isLatitudeValid,
  isLongitudeValid,
  parseCoordinateFromApi,
  parseCoordinateInput,
} from '../../utils/location'

describe('location utils', () => {
  describe('formatCoordinate', () => {
    it('returns an empty string for null values', () => {
      expect(formatCoordinate(null)).toBe('')
    })

    it('returns an empty string for NaN values', () => {
      expect(formatCoordinate(Number.NaN)).toBe('')
    })

    it('formats numeric values with a fixed precision', () => {
      expect(formatCoordinate(6.1318999)).toBe((6.1318999).toFixed(COORDINATE_PRECISION))
    })
  })

  describe('parseCoordinateInput', () => {
    it('returns null for empty or whitespace strings', () => {
      expect(parseCoordinateInput('')).toBeNull()
      expect(parseCoordinateInput('   ')).toBeNull()
    })

    it('parses decimal values and trims the input', () => {
      expect(parseCoordinateInput('  1.2345  ')).toBeCloseTo(1.2345)
    })

    it('parses decimal values using comma separator', () => {
      expect(parseCoordinateInput('6,789')).toBeCloseTo(6.789)
    })

    it('returns null for invalid numbers', () => {
      expect(parseCoordinateInput('abc')).toBeNull()
    })
  })

  describe('parseCoordinateFromApi', () => {
    it('returns the number when already a valid numeric value', () => {
      expect(parseCoordinateFromApi(12.345)).toBeCloseTo(12.345)
    })

    it('parses numeric strings', () => {
      expect(parseCoordinateFromApi('12.345')).toBeCloseTo(12.345)
    })

    it('returns null for invalid inputs', () => {
      expect(parseCoordinateFromApi('hello')).toBeNull()
      expect(parseCoordinateFromApi({})).toBeNull()
    })
  })

  describe('coordinate validation helpers', () => {
    it('validates latitude boundaries', () => {
      expect(isLatitudeValid(0)).toBe(true)
      expect(isLatitudeValid(-90)).toBe(true)
      expect(isLatitudeValid(90)).toBe(true)
      expect(isLatitudeValid(-91)).toBe(false)
      expect(isLatitudeValid(91)).toBe(false)
    })

    it('validates longitude boundaries', () => {
      expect(isLongitudeValid(0)).toBe(true)
      expect(isLongitudeValid(-180)).toBe(true)
      expect(isLongitudeValid(180)).toBe(true)
      expect(isLongitudeValid(-181)).toBe(false)
      expect(isLongitudeValid(181)).toBe(false)
    })
  })
})
