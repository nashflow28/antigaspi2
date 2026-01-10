/**
 * 🛡️ HTML Sanitization Utilities for XSS Protection
 *
 * Provides secure HTML sanitization to prevent Cross-Site Scripting (XSS) attacks
 * Uses DOMPurify for comprehensive HTML cleaning
 */

import DOMPurify from 'dompurify'

/**
 * Configuration for different sanitization levels
 */
const SANITIZATION_CONFIGS = {
  // Strictest - text only, no HTML
  TEXT_ONLY: {
    ALLOWED_TAGS: [] as string[],
    ALLOWED_ATTR: [] as string[],
    ALLOWED_CLASSES: undefined as Record<string, string[]> | undefined,
    KEEP_CONTENT: true
  },

  // Basic formatting only
  BASIC_FORMAT: {
    ALLOWED_TAGS: ['b', 'i', 'u', 'strong', 'em', 'span'],
    ALLOWED_ATTR: ['class'],
    ALLOWED_CLASSES: {
      'span': ['text-success', 'text-warning', 'text-info', 'text-error', 'inline-block', 'w-2', 'h-2', 'bg-blue-600', 'rounded-full', 'mr-2', 'mt-1.5', 'flex-shrink-0']
    } as Record<string, string[]> | undefined,
    KEEP_CONTENT: false
  },

  // For admin modal content (very restricted)
  ADMIN_MODAL: {
    ALLOWED_TAGS: ['span'],
    ALLOWED_ATTR: ['class'],
    ALLOWED_CLASSES: {
      'span': ['inline-block', 'w-2', 'h-2', 'bg-blue-600', 'rounded-full', 'mr-2', 'mt-1.5', 'flex-shrink-0', 'text-success', 'text-warning', 'text-info', 'text-error']
    } as Record<string, string[]> | undefined,
    KEEP_CONTENT: false
  }
}

/**
 * Sanitizes HTML content using DOMPurify with specified configuration
 * @param content - Raw HTML content to sanitize
 * @param level - Sanitization level to apply
 * @returns Sanitized HTML content
 */
export function sanitizeHtml(content: string, level: keyof typeof SANITIZATION_CONFIGS = 'TEXT_ONLY'): string {
  if (!content || typeof content !== 'string') {
    return ''
  }

  const config = SANITIZATION_CONFIGS[level]

  // Build config object, omitting ALLOWED_CLASSES if undefined (not a standard DOMPurify option)
  const sanitizeConfig: Record<string, unknown> = {
    ALLOWED_TAGS: config.ALLOWED_TAGS,
    ALLOWED_ATTR: config.ALLOWED_ATTR,
    KEEP_CONTENT: config.KEEP_CONTENT || false,
    // Security options
    FORBID_TAGS: ['script', 'object', 'embed', 'form', 'input', 'textarea', 'select', 'button'],
    FORBID_ATTR: ['onclick', 'onload', 'onerror', 'onmouseover', 'onfocus', 'onblur', 'onchange', 'onsubmit'],
    ALLOW_DATA_ATTR: false,
    ALLOW_UNKNOWN_PROTOCOLS: false,
    SANITIZE_DOM: true,
    WHOLE_DOCUMENT: false
  }

  return DOMPurify.sanitize(content, sanitizeConfig as Parameters<typeof DOMPurify.sanitize>[1])
}

/**
 * Sanitizes text content - strips all HTML tags
 * @param content - Content to sanitize
 * @returns Plain text content
 */
export function sanitizeText(content: string): string {
  return sanitizeHtml(content, 'TEXT_ONLY')
}

/**
 * Sanitizes content for error messages - text only
 * @param errorMessage - Error message to sanitize
 * @returns Sanitized error message
 */
export function sanitizeErrorMessage(errorMessage: string): string {
  if (!errorMessage || typeof errorMessage !== 'string') {
    return 'Une erreur inattendue s\'est produite'
  }

  // Strip all HTML and limit length
  const sanitized = sanitizeText(errorMessage)
  return sanitized.length > 500 ? sanitized.substring(0, 500) + '...' : sanitized
}

/**
 * Sanitizes URL parameters to prevent script injection
 * @param param - URL parameter value
 * @returns Sanitized parameter value
 */
export function sanitizeUrlParam(param: string | null): string {
  if (!param) return ''

  // Remove any HTML and script-like content
  return sanitizeText(param).replace(/[<>'"]/g, '')
}

/**
 * Validates and sanitizes route parameters (typically numeric IDs)
 * @param param - Route parameter
 * @returns Validated numeric ID or null
 */
export function sanitizeRouteId(param: string | undefined): number | null {
  if (!param) return null

  const sanitized = sanitizeText(param)
  const numericId = parseInt(sanitized, 10)

  return isNaN(numericId) || numericId < 1 ? null : numericId
}

/**
 * Creates safe formatted content for AdminModal
 * Replaces unsafe v-html usage with pre-sanitized content
 * @param line - Raw line content
 * @returns Sanitized formatted line
 */
export function createSafeFormattedLine(line: string): string {
  if (!line || typeof line !== 'string') {
    return ''
  }

  // First sanitize the input
  const sanitizedLine = sanitizeText(line)

  // Then apply safe formatting replacements
  const formatted = sanitizedLine
    .replace(/^• /, '<span class="inline-block w-2 h-2 bg-blue-600 rounded-full mr-2 mt-1.5 flex-shrink-0"></span>')
    .replace(/^✅ /, '<span class="text-success mr-2">✅</span>')
    .replace(/^⚠️ /, '<span class="text-warning mr-2">⚠️</span>')
    .replace(/^ℹ️ /, '<span class="text-info mr-2">ℹ️</span>')
    .replace(/^❌ /, '<span class="text-error mr-2">❌</span>')

  // Final sanitization pass with admin modal config
  return sanitizeHtml(formatted, 'ADMIN_MODAL')
}

/**
 * XSS Detection patterns for monitoring
 */
const XSS_PATTERNS = [
  /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
  /javascript:/gi,
  /vbscript:/gi,
  /onload\s*=/gi,
  /onclick\s*=/gi,
  /onerror\s*=/gi,
  /onmouseover\s*=/gi,
  /<iframe\b/gi,
  /<object\b/gi,
  /<embed\b/gi,
  /expression\s*\(/gi,
  /url\s*\(/gi,
  /@import/gi
]

/**
 * Detects potential XSS attempts in content
 * @param content - Content to check
 * @returns true if potential XSS detected
 */
export function detectXssAttempt(content: string): boolean {
  if (!content || typeof content !== 'string') {
    return false
  }

  return XSS_PATTERNS.some(pattern => pattern.test(content))
}

/**
 * Logs potential XSS attempts for security monitoring
 * @param content - Suspicious content
 * @param context - Context where the content was found
 */
export function logXssAttempt(content: string, context: string): void {
  if (detectXssAttempt(content)) {
    console.warn(`🚨 Potential XSS attempt detected in ${context}:`, content.substring(0, 100))

    // In production, this should send to security monitoring service
    if (import.meta.env.PROD) {
      // Future: Integrate with security monitoring service
      // securityService.reportXssAttempt({ content, context, timestamp: new Date() })
    }
  }
}

/**
 * Safe HTML setter that replaces dangerous innerHTML usage
 * @param element - DOM element
 * @param content - HTML content to set
 * @param level - Sanitization level
 */
export function setSafeInnerHTML(element: HTMLElement, content: string, level: keyof typeof SANITIZATION_CONFIGS = 'BASIC_FORMAT'): void {
  if (!element || !content) return

  const sanitizedContent = sanitizeHtml(content, level)
  element.innerHTML = sanitizedContent
}

export default {
  sanitizeHtml,
  sanitizeText,
  sanitizeErrorMessage,
  sanitizeUrlParam,
  sanitizeRouteId,
  createSafeFormattedLine,
  detectXssAttempt,
  logXssAttempt,
  setSafeInnerHTML
}
