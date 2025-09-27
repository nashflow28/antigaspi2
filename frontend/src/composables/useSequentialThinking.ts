import { ref, computed } from 'vue'

export interface ThinkingStep {
  id: string
  timestamp: number
  type: 'analysis' | 'decision' | 'implementation' | 'validation' | 'debug'
  title: string
  description: string
  data?: any
  status: 'pending' | 'in_progress' | 'completed' | 'failed'
  duration?: number
  children?: ThinkingStep[]
  tags?: string[]
}

export interface ThinkingSession {
  id: string
  name: string
  startTime: number
  endTime?: number
  steps: ThinkingStep[]
  context: Record<string, any>
  status: 'active' | 'completed' | 'failed'
}

export interface DebugContext {
  component?: string
  action?: string
  props?: Record<string, any>
  state?: Record<string, any>
  error?: Error
  userAction?: string
}

export const useSequentialThinking = () => {
  const currentSession = ref<ThinkingSession | null>(null)
  const sessions = ref<ThinkingSession[]>([])
  const isRecording = ref(false)
  const stepCounter = ref(0)

  // Auto-save to localStorage
  const saveToStorage = () => {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('sequential-thinking-sessions', JSON.stringify(sessions.value))
      if (currentSession.value) {
        localStorage.setItem('sequential-thinking-current', JSON.stringify(currentSession.value))
      }
    }
  }

  // Load from localStorage
  const loadFromStorage = () => {
    if (typeof localStorage !== 'undefined') {
      const savedSessions = localStorage.getItem('sequential-thinking-sessions')
      if (savedSessions) {
        sessions.value = JSON.parse(savedSessions)
      }

      const savedCurrent = localStorage.getItem('sequential-thinking-current')
      if (savedCurrent) {
        currentSession.value = JSON.parse(savedCurrent)
        isRecording.value = currentSession.value?.status === 'active'
      }
    }
  }

  // Generate unique ID
  const generateId = () => `thinking_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

  // Start a new thinking session
  const startSession = (name: string, context: Record<string, any> = {}) => {
    const session: ThinkingSession = {
      id: generateId(),
      name,
      startTime: Date.now(),
      steps: [],
      context,
      status: 'active'
    }

    currentSession.value = session
    isRecording.value = true
    stepCounter.value = 0

    console.group(`🧠 Sequential Thinking Session: ${name}`)
    console.log('Context:', context)

    saveToStorage()
    return session.id
  }

  // End the current session
  const endSession = (status: 'completed' | 'failed' = 'completed') => {
    if (!currentSession.value) return

    currentSession.value.endTime = Date.now()
    currentSession.value.status = status

    // Calculate total duration
    const duration = currentSession.value.endTime - currentSession.value.startTime

    console.log(`Session completed in ${duration}ms with status: ${status}`)
    console.groupEnd()

    sessions.value.push(currentSession.value)
    currentSession.value = null
    isRecording.value = false

    saveToStorage()
  }

  // Add a thinking step
  const addStep = (
    type: ThinkingStep['type'],
    title: string,
    description: string,
    data?: any,
    tags?: string[]
  ): string => {
    if (!currentSession.value || !isRecording.value) {
      console.warn('No active thinking session')
      return ''
    }

    const step: ThinkingStep = {
      id: generateId(),
      timestamp: Date.now(),
      type,
      title,
      description,
      data,
      status: 'pending',
      tags
    }

    currentSession.value.steps.push(step)
    stepCounter.value++

    const icon = getStepIcon(type)
    console.log(`${icon} Step ${stepCounter.value}: ${title}`)
    console.log(`   ${description}`)
    if (data) {
      console.log('   Data:', data)
    }

    saveToStorage()
    return step.id
  }

  // Update step status
  const updateStep = (stepId: string, status: ThinkingStep['status'], data?: any) => {
    if (!currentSession.value) return

    const step = findStep(currentSession.value.steps, stepId)
    if (step) {
      const startTime = step.timestamp
      step.status = status
      step.duration = Date.now() - startTime

      if (data) {
        step.data = { ...step.data, ...data }
      }

      const statusIcon = getStatusIcon(status)
      console.log(`${statusIcon} Step updated: ${step.title} (${step.duration}ms)`)

      saveToStorage()
    }
  }

  // Add child step
  const addChildStep = (
    parentStepId: string,
    type: ThinkingStep['type'],
    title: string,
    description: string,
    data?: any
  ): string => {
    if (!currentSession.value) return ''

    const parentStep = findStep(currentSession.value.steps, parentStepId)
    if (!parentStep) return ''

    if (!parentStep.children) {
      parentStep.children = []
    }

    const childStep: ThinkingStep = {
      id: generateId(),
      timestamp: Date.now(),
      type,
      title,
      description,
      data,
      status: 'pending'
    }

    parentStep.children.push(childStep)

    const icon = getStepIcon(type)
    console.log(`  ${icon} Child Step: ${title}`)
    console.log(`     ${description}`)

    saveToStorage()
    return childStep.id
  }

  // Helper function to find step by ID
  const findStep = (steps: ThinkingStep[], stepId: string): ThinkingStep | null => {
    for (const step of steps) {
      if (step.id === stepId) return step
      if (step.children) {
        const found = findStep(step.children, stepId)
        if (found) return found
      }
    }
    return null
  }

  // Get icon for step type
  const getStepIcon = (type: ThinkingStep['type']): string => {
    const icons = {
      analysis: '🔍',
      decision: '🤔',
      implementation: '⚡',
      validation: '✅',
      debug: '🐛'
    }
    return icons[type] || '📝'
  }

  // Get icon for status
  const getStatusIcon = (status: ThinkingStep['status']): string => {
    const icons = {
      pending: '⏳',
      in_progress: '🔄',
      completed: '✅',
      failed: '❌'
    }
    return icons[status] || '❓'
  }

  // Debug helpers for common patterns
  const debugComponentMount = (componentName: string, props?: any) => {
    const stepId = addStep('debug', 'Component Mount', `Debugging mount of ${componentName}`, { props })
    updateStep(stepId, 'in_progress')
    return stepId
  }

  const debugUserAction = (action: string, target: string, data?: any) => {
    return addStep('debug', 'User Action', `User performed: ${action} on ${target}`, { action, target, data })
  }

  const debugApiCall = (endpoint: string, method: string, payload?: any) => {
    return addStep('debug', 'API Call', `${method} ${endpoint}`, { endpoint, method, payload })
  }

  const debugStateChange = (component: string, before: any, after: any) => {
    return addStep('debug', 'State Change', `State updated in ${component}`, { before, after, component })
  }

  const debugError = (error: Error, context?: DebugContext) => {
    return addStep('debug', 'Error Occurred', error.message, {
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack
      },
      context
    })
  }

  // Analysis helpers
  const analyzePerformance = (operation: string, startTime: number) => {
    const duration = Date.now() - startTime
    return addStep('analysis', 'Performance Analysis', `${operation} took ${duration}ms`, {
      operation,
      duration,
      slow: duration > 1000,
      acceptable: duration < 500
    })
  }

  const analyzeUserFlow = (flow: string, steps: string[]) => {
    return addStep('analysis', 'User Flow Analysis', `Analyzing flow: ${flow}`, { flow, steps })
  }

  // Decision helpers
  const recordDecision = (decision: string, reasoning: string, alternatives?: string[]) => {
    return addStep('decision', decision, reasoning, { alternatives })
  }

  // Implementation helpers
  const recordImplementation = (feature: string, approach: string, details?: any) => {
    return addStep('implementation', feature, `Implementing using: ${approach}`, { approach, details })
  }

  // Validation helpers
  const recordValidation = (test: string, result: boolean, details?: any) => {
    const stepId = addStep('validation', test, `Validation ${result ? 'passed' : 'failed'}`, { result, details })
    updateStep(stepId, result ? 'completed' : 'failed')
    return stepId
  }

  // Get session summary
  const getSessionSummary = (sessionId?: string) => {
    const session = sessionId
      ? sessions.value.find(s => s.id === sessionId)
      : currentSession.value

    if (!session) return null

    const stepCounts = session.steps.reduce((acc, step) => {
      acc[step.type] = (acc[step.type] || 0) + 1
      acc[step.status] = (acc[step.status] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const duration = session.endTime
      ? session.endTime - session.startTime
      : Date.now() - session.startTime

    return {
      ...session,
      stepCounts,
      duration,
      completionRate: stepCounts.completed / session.steps.length
    }
  }

  // Export session data
  const exportSession = (sessionId: string) => {
    const session = sessions.value.find(s => s.id === sessionId)
    if (!session) return null

    const exportData = {
      ...session,
      exported: Date.now(),
      version: '1.0.0'
    }

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)

    const a = document.createElement('a')
    a.href = url
    a.download = `thinking-session-${session.name}-${new Date().toISOString().split('T')[0]}.json`
    a.click()

    URL.revokeObjectURL(url)
  }

  // Clear old sessions
  const clearOldSessions = (olderThanDays: number = 7) => {
    const cutoff = Date.now() - (olderThanDays * 24 * 60 * 60 * 1000)
    sessions.value = sessions.value.filter(session => session.startTime > cutoff)
    saveToStorage()
  }

  // Statistics
  const statistics = computed(() => {
    const allSessions = [...sessions.value]
    if (currentSession.value) {
      allSessions.push(currentSession.value)
    }

    return {
      totalSessions: allSessions.length,
      activeSessions: allSessions.filter(s => s.status === 'active').length,
      completedSessions: allSessions.filter(s => s.status === 'completed').length,
      failedSessions: allSessions.filter(s => s.status === 'failed').length,
      totalSteps: allSessions.reduce((sum, s) => sum + s.steps.length, 0),
      averageStepsPerSession: allSessions.length > 0
        ? allSessions.reduce((sum, s) => sum + s.steps.length, 0) / allSessions.length
        : 0
    }
  })

  // Initialize
  loadFromStorage()

  return {
    // State
    currentSession,
    sessions,
    isRecording,
    statistics,

    // Session management
    startSession,
    endSession,

    // Step management
    addStep,
    updateStep,
    addChildStep,

    // Debug helpers
    debugComponentMount,
    debugUserAction,
    debugApiCall,
    debugStateChange,
    debugError,

    // Analysis helpers
    analyzePerformance,
    analyzeUserFlow,

    // Decision helpers
    recordDecision,

    // Implementation helpers
    recordImplementation,

    // Validation helpers
    recordValidation,

    // Utilities
    getSessionSummary,
    exportSession,
    clearOldSessions,
    saveToStorage,
    loadFromStorage
  }
}

// Global instance for easy access across components
let globalThinking: ReturnType<typeof useSequentialThinking> | null = null

export const getGlobalThinking = () => {
  if (!globalThinking) {
    globalThinking = useSequentialThinking()
  }
  return globalThinking
}

// Convenience functions for quick debugging
export const think = getGlobalThinking()

// Auto-start session for debugging if in development
if (import.meta.env.DEV && typeof window !== 'undefined') {
  think.startSession('Development Debug Session', {
    mode: 'development',
    startTime: new Date().toISOString()
  })
}
