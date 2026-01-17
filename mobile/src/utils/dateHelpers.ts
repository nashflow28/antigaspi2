/**
 * Date Helpers
 *
 * Centralized date manipulation utilities using date-fns.
 * Handles timezone-safe date operations for the Antigaspi app.
 *
 * BUG FIX #M-005: Proper date parsing with timezone awareness
 */

import {
  parseISO,
  differenceInDays,
  differenceInHours,
  startOfDay,
  format,
  isValid,
  isBefore,
} from 'date-fns'
import { fr } from 'date-fns/locale'
import { EXPIRATION_THRESHOLDS } from '../constants/business'

/**
 * Parse an ISO date string safely
 * Returns null if the date is invalid
 */
export const safeParseDate = (dateString: string | null | undefined): Date | null => {
  if (!dateString) return null

  try {
    const parsed = parseISO(dateString)
    return isValid(parsed) ? parsed : null
  } catch {
    return null
  }
}

/**
 * Get the number of days until a date expires
 * Returns negative numbers for already expired dates
 */
export const getDaysUntilExpiration = (expirationDate: string | null | undefined): number => {
  const expiry = safeParseDate(expirationDate)
  if (!expiry) return 0

  const today = startOfDay(new Date())
  const expiryDay = startOfDay(expiry)

  return differenceInDays(expiryDay, today)
}

/**
 * Check if a date has expired (before today)
 */
export const isExpired = (expirationDate: string | null | undefined): boolean => {
  return getDaysUntilExpiration(expirationDate) < 0
}

/**
 * Check if a product is expiring soon (within threshold days)
 * Uses EXPIRATION_THRESHOLDS.SOON_DAYS by default (3 days)
 */
export const isExpiringSoon = (
  expirationDate: string | null | undefined,
  thresholdDays: number = EXPIRATION_THRESHOLDS.SOON_DAYS
): boolean => {
  const remaining = getDaysUntilExpiration(expirationDate)
  return remaining >= 0 && remaining <= thresholdDays
}

/**
 * Check if a product is expiring urgently (within urgent threshold)
 * Uses EXPIRATION_THRESHOLDS.URGENT_DAYS by default (1 day)
 */
export const isExpiringUrgently = (
  expirationDate: string | null | undefined
): boolean => {
  const remaining = getDaysUntilExpiration(expirationDate)
  return remaining >= 0 && remaining <= EXPIRATION_THRESHOLDS.URGENT_DAYS
}

/**
 * Get hours until a pickup deadline
 */
export const getHoursUntilDeadline = (deadlineDate: string | null | undefined): number => {
  const deadline = safeParseDate(deadlineDate)
  if (!deadline) return 0

  const now = new Date()
  return differenceInHours(deadline, now)
}

/**
 * Check if pickup deadline is approaching
 */
export const isPickupDeadlineApproaching = (
  deadlineDate: string | null | undefined,
  thresholdHours: number = EXPIRATION_THRESHOLDS.PICKUP_WARNING_HOURS
): boolean => {
  const hoursRemaining = getHoursUntilDeadline(deadlineDate)
  return hoursRemaining >= 0 && hoursRemaining <= thresholdHours
}

/**
 * Format a date for display in French locale
 */
export const formatDate = (
  dateString: string | null | undefined,
  formatString: string = 'dd/MM/yyyy'
): string => {
  const date = safeParseDate(dateString)
  if (!date) return 'Date invalide'

  return format(date, formatString, { locale: fr })
}

/**
 * Format a date with time for display
 */
export const formatDateTime = (dateString: string | null | undefined): string => {
  return formatDate(dateString, 'dd/MM/yyyy HH:mm')
}

/**
 * Format a date as relative time (e.g., "Dans 2 jours", "Demain")
 */
export const formatRelativeExpiration = (
  expirationDate: string | null | undefined
): string => {
  const days = getDaysUntilExpiration(expirationDate)

  if (days < 0) {
    return 'Expiré'
  }

  if (days === 0) {
    return 'Aujourd\'hui'
  }

  if (days === 1) {
    return 'Demain'
  }

  if (days <= 7) {
    return `Dans ${days} jours`
  }

  // For longer periods, show the actual date
  return formatDate(expirationDate, 'd MMMM')
}

/**
 * Get expiration status with color indicator
 */
export type ExpirationStatus = 'expired' | 'urgent' | 'soon' | 'normal'

export const getExpirationStatus = (
  expirationDate: string | null | undefined
): ExpirationStatus => {
  const days = getDaysUntilExpiration(expirationDate)

  if (days < 0) return 'expired'
  if (days <= EXPIRATION_THRESHOLDS.URGENT_DAYS) return 'urgent'
  if (days <= EXPIRATION_THRESHOLDS.SOON_DAYS) return 'soon'
  return 'normal'
}

/**
 * Get a color for the expiration status
 */
export const getExpirationColor = (
  expirationDate: string | null | undefined
): string => {
  const status = getExpirationStatus(expirationDate)

  switch (status) {
    case 'expired':
      return '#EF4444' // red-500
    case 'urgent':
      return '#F97316' // orange-500
    case 'soon':
      return '#F59E0B' // amber-500
    case 'normal':
    default:
      return '#10B981' // green-500
  }
}

/**
 * Calculate pickup window dates
 * Returns the recommended pickup date range
 */
export const getPickupWindow = (
  expirationDate: string | null | undefined,
  _offsetDays: number = 1
): { start: Date; end: Date } | null => {
  const expiry = safeParseDate(expirationDate)
  if (!expiry) return null

  const now = new Date()
  const start = isBefore(now, expiry) ? now : expiry
  const end = expiry

  return { start, end }
}

/**
 * Format a time slot for display (e.g., "14h00 - 18h00")
 */
export const formatTimeSlot = (
  startTime: string | null | undefined,
  endTime: string | null | undefined
): string => {
  if (!startTime || !endTime) return 'Horaire non défini'

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':')
    return `${hours}h${minutes !== '00' ? minutes : ''}`
  }

  return `${formatTime(startTime)} - ${formatTime(endTime)}`
}

/**
 * Check if current time is within opening hours
 */
export const isWithinOpeningHours = (
  openingTime: string | null | undefined,
  closingTime: string | null | undefined
): boolean => {
  if (!openingTime || !closingTime) return true // Assume open if no hours defined

  const now = new Date()
  const currentHours = now.getHours()
  const currentMinutes = now.getMinutes()
  const currentTime = currentHours * 60 + currentMinutes

  const [openH, openM] = openingTime.split(':').map(Number)
  const [closeH, closeM] = closingTime.split(':').map(Number)

  const openTime = openH * 60 + openM
  const closeTime = closeH * 60 + closeM

  return currentTime >= openTime && currentTime <= closeTime
}

export default {
  safeParseDate,
  getDaysUntilExpiration,
  isExpired,
  isExpiringSoon,
  isExpiringUrgently,
  getHoursUntilDeadline,
  isPickupDeadlineApproaching,
  formatDate,
  formatDateTime,
  formatRelativeExpiration,
  getExpirationStatus,
  getExpirationColor,
  getPickupWindow,
  formatTimeSlot,
  isWithinOpeningHours,
}
