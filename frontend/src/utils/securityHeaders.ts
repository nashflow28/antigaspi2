/**
 * 🛡️ Security Headers Configuration
 *
 * Provides Content Security Policy (CSP) and other security headers
 * to prevent XSS, clickjacking, and other web security vulnerabilities
 */

/**
 * Content Security Policy configuration
 * This prevents XSS attacks by controlling which resources can be loaded
 */
export const CSP_DIRECTIVES = {
  // Default source - fallback for other directives
  'default-src': ["'self'"],

  // Script sources - only allow self and specific trusted domains
  'script-src': [
    "'self'",
    "'unsafe-inline'", // Required for Vue.js development mode
    'https://cdn.jsdelivr.net', // For external libraries
    'https://unpkg.com' // For CDN libraries
  ],

  // Style sources - allow self and inline styles for Tailwind
  'style-src': [
    "'self'",
    "'unsafe-inline'", // Required for Tailwind CSS
    'https://fonts.googleapis.com' // For Google Fonts
  ],

  // Image sources - allow self and common image CDNs
  'img-src': [
    "'self'",
    'data:', // For data URLs
    'blob:', // For blob URLs
    'https:', // HTTPS images
    'http://localhost:*' // Local development
  ],

  // Font sources
  'font-src': [
    "'self'",
    'https://fonts.gstatic.com',
    'data:' // For base64 fonts
  ],

  // Connect sources - API endpoints
  'connect-src': [
    "'self'",
    'http://localhost:*', // Local development
    'ws://localhost:*', // WebSocket for development
    'wss://localhost:*' // Secure WebSocket
  ],

  // Frame sources - prevent clickjacking
  'frame-src': ["'none'"],

  // Object sources - prevent plugin execution
  'object-src': ["'none'"],

  // Base URI - prevent injection of base tags
  'base-uri': ["'self'"],

  // Form action - restrict form submissions
  'form-action': ["'self'"]
}

/**
 * Generates CSP header value from directives
 */
export function generateCSPHeader(): string {
  return Object.entries(CSP_DIRECTIVES)
    .map(([directive, sources]) => directive + ' ' + sources.join(' '))
    .join('; ')
}

/**
 * Additional security headers for enhanced protection
 */
export const SECURITY_HEADERS = {
  // Prevent MIME type sniffing
  'X-Content-Type-Options': 'nosniff',

  // Enable XSS protection in browsers
  'X-XSS-Protection': '1; mode=block',

  // Prevent clickjacking
  'X-Frame-Options': 'DENY',

  // Control referrer information
  'Referrer-Policy': 'strict-origin-when-cross-origin',

  // Permissions policy (formerly Feature Policy)
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(self)',

  // Content Security Policy
  'Content-Security-Policy': generateCSPHeader(),

  // Strict Transport Security (HTTPS only)
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload'
}

/**
 * Development-specific CSP for more relaxed policies during development
 */
export const DEV_CSP_DIRECTIVES = {
  ...CSP_DIRECTIVES,
  'script-src': [
    "'self'",
    "'unsafe-inline'",
    "'unsafe-eval'", // Required for development tools
    'http://localhost:*',
    'ws://localhost:*',
    'https://cdn.jsdelivr.net',
    'https://unpkg.com'
  ],
  'connect-src': [
    "'self'",
    'http://localhost:*',
    'ws://localhost:*',
    'wss://localhost:*',
    'http://127.0.0.1:*'
  ]
}

/**
 * Generates development-friendly CSP header
 */
export function generateDevCSPHeader(): string {
  return Object.entries(DEV_CSP_DIRECTIVES)
    .map(([directive, sources]) => directive + ' ' + sources.join(' '))
    .join('; ')
}

/**
 * Security headers for development environment
 */
export const DEV_SECURITY_HEADERS = {
  ...SECURITY_HEADERS,
  'Content-Security-Policy': generateDevCSPHeader()
}

/**
 * Applies security headers to HTML meta tags
 * This is a fallback when server-side headers aren't available
 */
export function applySecurityMetaTags(): void {
  if (typeof document === 'undefined') return

  // Add CSP meta tag
  const cspMeta = document.createElement('meta')
  cspMeta.httpEquiv = 'Content-Security-Policy'
  cspMeta.content = import.meta.env.DEV ? generateDevCSPHeader() : generateCSPHeader()
  document.head.appendChild(cspMeta)

  // Add X-Content-Type-Options
  const noSniffMeta = document.createElement('meta')
  noSniffMeta.httpEquiv = 'X-Content-Type-Options'
  noSniffMeta.content = 'nosniff'
  document.head.appendChild(noSniffMeta)

  // Add referrer policy
  const referrerMeta = document.createElement('meta')
  referrerMeta.name = 'referrer'
  referrerMeta.content = 'strict-origin-when-cross-origin'
  document.head.appendChild(referrerMeta)
}

/**
 * Validates that current page complies with CSP
 * Useful for development debugging
 */
export function validateCSPCompliance(): void {
  if (import.meta.env.PROD) return

  // Check for inline scripts
  const inlineScripts = document.querySelectorAll('script:not([src])')
  if (inlineScripts.length > 0) {
    console.warn('🚨 CSP Warning: Inline scripts detected:', inlineScripts)
  }

  // Check for inline styles
  const inlineStyles = document.querySelectorAll('style:not([data-vite-dev-id])')
  if (inlineStyles.length > 0) {
    console.warn('🚨 CSP Warning: Inline styles detected:', inlineStyles)
  }
}

export default {
  CSP_DIRECTIVES,
  SECURITY_HEADERS,
  DEV_SECURITY_HEADERS,
  generateCSPHeader,
  generateDevCSPHeader,
  applySecurityMetaTags,
  validateCSPCompliance
}
