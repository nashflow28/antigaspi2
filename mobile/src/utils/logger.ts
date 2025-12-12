/**
 * Logger Utility - Production-safe logging
 *
 * Centralizes all logging to prevent console.log in production builds.
 * Only errors are always logged, other levels are dev-only.
 */

const isDev = __DEV__

type LogLevel = 'debug' | 'log' | 'info' | 'warn' | 'error'

interface LoggerOptions {
  prefix?: string
  enabled?: boolean
}

class Logger {
  private prefix: string
  private enabled: boolean

  constructor(options: LoggerOptions = {}) {
    this.prefix = options.prefix || ''
    this.enabled = options.enabled ?? true
  }

  private formatMessage(level: LogLevel, ...args: any[]): string[] {
    const timestamp = new Date().toISOString().split('T')[1].split('.')[0]
    const prefix = this.prefix ? `[${this.prefix}]` : ''
    const levelTag = `[${level.toUpperCase()}]`

    if (typeof args[0] === 'string') {
      return [`${timestamp} ${levelTag}${prefix} ${args[0]}`, ...args.slice(1)]
    }
    return [`${timestamp} ${levelTag}${prefix}`, ...args]
  }

  /**
   * Debug level - Only in development, very verbose
   */
  debug(...args: any[]): void {
    if (isDev && this.enabled) {
      console.debug(...this.formatMessage('debug', ...args))
    }
  }

  /**
   * Log level - Only in development, general info
   */
  log(...args: any[]): void {
    if (isDev && this.enabled) {
      console.log(...this.formatMessage('log', ...args))
    }
  }

  /**
   * Info level - Only in development, important info
   */
  info(...args: any[]): void {
    if (isDev && this.enabled) {
      console.info(...this.formatMessage('info', ...args))
    }
  }

  /**
   * Warn level - Only in development, warnings
   */
  warn(...args: any[]): void {
    if (isDev && this.enabled) {
      console.warn(...this.formatMessage('warn', ...args))
    }
  }

  /**
   * Error level - ALWAYS logged (even in production)
   * Errors need to be visible for debugging production issues
   */
  error(...args: any[]): void {
    if (this.enabled) {
      console.error(...this.formatMessage('error', ...args))
    }
  }

  /**
   * Create a child logger with a specific prefix
   */
  child(prefix: string): Logger {
    const childPrefix = this.prefix ? `${this.prefix}:${prefix}` : prefix
    return new Logger({ prefix: childPrefix, enabled: this.enabled })
  }

  /**
   * Temporarily disable logging
   */
  disable(): void {
    this.enabled = false
  }

  /**
   * Re-enable logging
   */
  enable(): void {
    this.enabled = true
  }
}

// Default logger instance
export const logger = new Logger()

// Pre-configured loggers for different modules
export const apiLogger = new Logger({ prefix: 'API' })
export const authLogger = new Logger({ prefix: 'Auth' })
export const navLogger = new Logger({ prefix: 'Nav' })
export const storeLogger = new Logger({ prefix: 'Store' })
export const locationLogger = new Logger({ prefix: 'Location' })

// Factory function for custom loggers
export const createLogger = (prefix: string): Logger => new Logger({ prefix })

export default logger
