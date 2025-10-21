export const COORDINATE_PRECISION = 6

export const formatCoordinate = (value: number | null): string => {
  if (value === null || Number.isNaN(value)) {
    return ''
  }

  return Number(value).toFixed(COORDINATE_PRECISION)
}

export const parseCoordinateInput = (value: string): number | null => {
  if (!value || !value.trim()) {
    return null
  }

  const normalized = value.trim().replace(',', '.')
  const numeric = Number(normalized)

  return Number.isFinite(numeric) ? numeric : null
}

export const parseCoordinateFromApi = (value: unknown): number | null => {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null
  }

  if (typeof value === 'string') {
    const numeric = Number(value)
    return Number.isFinite(numeric) ? numeric : null
  }

  return null
}

export const isLatitudeValid = (value: number): boolean => value >= -90 && value <= 90

export const isLongitudeValid = (value: number): boolean => value >= -180 && value <= 180
