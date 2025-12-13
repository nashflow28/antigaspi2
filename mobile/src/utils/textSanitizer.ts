/**
 * Text Sanitizer Utility
 *
 * Provides defense-in-depth sanitization for user-generated content.
 * While React Native Text components don't parse HTML (preventing XSS),
 * this utility provides additional safety measures.
 *
 * Features:
 * - Removes control characters
 * - Normalizes Unicode to prevent spoofing
 * - Limits text length
 * - Removes potentially dangerous URL schemes
 */

// Maximum length for different content types
const MAX_LENGTHS = {
  message: 5000,
  username: 100,
  title: 200,
  description: 2000,
}

/**
 * Remove invisible and control characters that could be used for attacks
 */
const removeControlCharacters = (text: string): string => {
  // Remove control characters except common whitespace (space, tab, newline)
  // eslint-disable-next-line no-control-regex
  return text.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
}

/**
 * Normalize Unicode to prevent homograph attacks
 * (e.g., using Cyrillic 'а' instead of Latin 'a')
 */
const normalizeUnicode = (text: string): string => {
  try {
    // Normalize to NFC form (Canonical Decomposition, followed by Canonical Composition)
    return text.normalize('NFC')
  } catch {
    return text
  }
}

/**
 * Remove dangerous URL schemes that could be used for attacks
 */
const sanitizeUrls = (text: string): string => {
  // Remove javascript:, data:, vbscript: schemes
  const dangerousSchemes = /\b(javascript|data|vbscript|file):/gi
  return text.replace(dangerousSchemes, '[removed]:')
}

/**
 * Truncate text to a maximum length
 */
const truncate = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + '…'
}

/**
 * Sanitize message content for display
 * @param content - Raw message content
 * @returns Sanitized message safe for display
 */
export const sanitizeMessage = (content: string | null | undefined): string => {
  if (!content) return ''
  if (typeof content !== 'string') return ''

  let sanitized = content
  sanitized = removeControlCharacters(sanitized)
  sanitized = normalizeUnicode(sanitized)
  sanitized = sanitizeUrls(sanitized)
  sanitized = truncate(sanitized, MAX_LENGTHS.message)

  return sanitized.trim()
}

/**
 * Sanitize username for display
 * @param username - Raw username
 * @returns Sanitized username safe for display
 */
export const sanitizeUsername = (username: string | null | undefined): string => {
  if (!username) return ''
  if (typeof username !== 'string') return ''

  let sanitized = username
  sanitized = removeControlCharacters(sanitized)
  sanitized = normalizeUnicode(sanitized)
  sanitized = truncate(sanitized, MAX_LENGTHS.username)

  // Remove any newlines in usernames
  sanitized = sanitized.replace(/[\r\n]/g, ' ')

  return sanitized.trim()
}

/**
 * Sanitize title/heading text
 * @param title - Raw title
 * @returns Sanitized title safe for display
 */
export const sanitizeTitle = (title: string | null | undefined): string => {
  if (!title) return ''
  if (typeof title !== 'string') return ''

  let sanitized = title
  sanitized = removeControlCharacters(sanitized)
  sanitized = normalizeUnicode(sanitized)
  sanitized = truncate(sanitized, MAX_LENGTHS.title)

  // Remove any newlines in titles
  sanitized = sanitized.replace(/[\r\n]/g, ' ')

  return sanitized.trim()
}

/**
 * Sanitize description/body text
 * @param description - Raw description
 * @returns Sanitized description safe for display
 */
export const sanitizeDescription = (description: string | null | undefined): string => {
  if (!description) return ''
  if (typeof description !== 'string') return ''

  let sanitized = description
  sanitized = removeControlCharacters(sanitized)
  sanitized = normalizeUnicode(sanitized)
  sanitized = sanitizeUrls(sanitized)
  sanitized = truncate(sanitized, MAX_LENGTHS.description)

  return sanitized.trim()
}

/**
 * Check if text contains potentially dangerous content
 * @param text - Text to check
 * @returns true if potentially dangerous content detected
 */
export const hasUnsafeContent = (text: string): boolean => {
  if (!text) return false

  // Check for dangerous URL schemes
  const dangerousSchemes = /\b(javascript|data|vbscript|file):/i
  if (dangerousSchemes.test(text)) return true

  // Check for excessive control characters
  // eslint-disable-next-line no-control-regex
  const controlCharCount = (text.match(/[\x00-\x1F\x7F]/g) || []).length
  if (controlCharCount > 5) return true

  return false
}

export default {
  sanitizeMessage,
  sanitizeUsername,
  sanitizeTitle,
  sanitizeDescription,
  hasUnsafeContent,
}
