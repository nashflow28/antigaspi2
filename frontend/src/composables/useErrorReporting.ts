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

const errorReports = ref<ErrorReport[]>([])
const isReporting = ref(false)

export function useErrorReporting() {
  const reportError = async (error: Error, context: ErrorReport) => {
    errorReports.value.push({
      ...context,
      errorId: context.errorId || generateReportId()
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

  return {
    errorReports: readonly(errorReports),
    isReporting: readonly(isReporting),
    reportError,
    getErrorMetrics,
    clearReports
  }
}

function generateReportId(): string {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substr(2, 9)
  return `report_${timestamp}_${random}`
}
