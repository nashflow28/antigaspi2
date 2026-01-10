import { ref, readonly } from 'vue'

interface ErrorReport {
  errorId: string
  component?: string
  userAgent: string
  url: string
  timestamp: number
  retryCount: number
  userId?: string
  sessionId?: string
}

interface ErrorMetrics {
  totalErrors: number
  criticalErrors: number
  resolvedErrors: number
  averageResolutionTime: number
}

interface Breadcrumb {
  id: string
  type: 'navigation' | 'click' | 'input' | 'error'
  message: string
  timestamp: number
  data?: Record<string, unknown>
  level?: 'info' | 'warning' | 'error'
  category?: string
}

interface UserAction {
  id: string
  type: string
  target: string
  timestamp: number
  metadata?: Record<string, unknown>
  action?: string
  data?: Record<string, unknown>
}

// Extended error queue item for ErrorDashboard compatibility
interface ErrorQueueItem {
  error: Error
  context: ErrorReport
  metadata?: {
    severity?: 'low' | 'medium' | 'high' | 'critical'
    category?: string
  }
}

const errorReports = ref<ErrorReport[]>([])
const errorQueue = ref<ErrorQueueItem[]>([])
const breadcrumbs = ref<Breadcrumb[]>([])
const userActions = ref<UserAction[]>([])
const isReporting = ref(false)

export function useErrorReporting() {
  const reportError = async (error: Error, context: ErrorReport) => {
    const report: ErrorReport = {
      ...context,
      errorId: context.errorId || generateReportId()
    }
    errorReports.value.push(report)

    // Also add to error queue for ErrorDashboard
    errorQueue.value.push({
      error,
      context: report,
      metadata: {
        severity: 'low',
        category: 'runtime'
      }
    })

    if (import.meta.env.PROD) {
      try {
        isReporting.value = true
        console.log('Error reported:', { error, context })
      } catch (reportingError) {
        console.error('Failed to report error:', reportingError)
      } finally {
        isReporting.value = false
      }
    }
  }

  const getErrorMetrics = (): ErrorMetrics => {
    const total = errorReports.value.length
    const critical = errorReports.value.filter(r =>
      r.component && r.component.includes('critical')
    ).length

    return {
      totalErrors: total,
      criticalErrors: critical,
      resolvedErrors: 0,
      averageResolutionTime: 0
    }
  }

  const clearReports = () => {
    errorReports.value = []
  }

  const clearErrorQueue = () => {
    errorQueue.value = []
  }

  const clearBreadcrumbs = () => {
    breadcrumbs.value = []
  }

  const clearUserActions = () => {
    userActions.value = []
  }

  const clearAll = () => {
    errorReports.value = []
    errorQueue.value = []
    breadcrumbs.value = []
    userActions.value = []
  }

  return {
    errorReports: readonly(errorReports),
    errorQueue: readonly(errorQueue),
    breadcrumbs: readonly(breadcrumbs),
    userActions: readonly(userActions),
    isReporting: readonly(isReporting),
    reportError,
    getErrorMetrics,
    clearReports,
    clearErrorQueue,
    clearBreadcrumbs,
    clearUserActions,
    clearAll
  }
}

function generateReportId(): string {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substr(2, 9)
  return `report_${timestamp}_${random}`
}
