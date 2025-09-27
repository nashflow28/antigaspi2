<template>
  <div v-if="isDev && showPanel" class="sequential-thinking-panel">
    <div class="panel-header">
      <div class="panel-title">
        <Brain class="w-5 h-5" />
        <span>Sequential Thinking</span>
        <span v-if="isRecording" class="recording-indicator">🔴 REC</span>
      </div>
      <div class="panel-controls">
        <button
          :disabled="!currentSession"
          class="button-export"
          title="Export session"
          @click="exportCurrentSession"
        >
          <Download class="w-4 h-4" />
        </button>
        <button class="button-clear" title="Clear old sessions" @click="clearOldSessions">
          <Trash2 class="w-4 h-4" />
        </button>
        <button class="button-close" title="Close panel" @click="togglePanel">
          <X class="w-4 h-4" />
        </button>
      </div>
    </div>

    <div class="panel-content">
      <!-- Session Stats -->
      <div class="stats-section">
        <div class="stat">
          <span class="stat-value">{{ statistics.totalSessions }}</span>
          <span class="stat-label">Sessions</span>
        </div>
        <div class="stat">
          <span class="stat-value">{{ statistics.totalSteps }}</span>
          <span class="stat-label">Steps</span>
        </div>
        <div class="stat">
          <span class="stat-value">{{ currentSessionSteps }}</span>
          <span class="stat-label">Current</span>
        </div>
      </div>

      <!-- Session Controls -->
      <div class="session-controls">
        <div v-if="currentSession" class="session-info">
          <span class="session-name">{{ currentSession.name }}</span>
          <span class="session-duration">{{ formatDuration(sessionDuration) }}</span>
        </div>

        <div class="session-buttons">
          <button
            v-if="!isRecording"
            class="button-start"
            @click="startNewSession"
          >
            <Play class="w-4 h-4 mr-1" />
            Start
          </button>
          <button
            v-else
            class="button-stop"
            @click="endCurrentSession"
          >
            <Square class="w-4 h-4 mr-1" />
            Stop
          </button>
        </div>
      </div>

      <!-- Tabs -->
      <div class="tabs">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          :class="['tab', { 'tab-active': activeTab === tab.id }]"
          @click="activeTab = tab.id"
        >
          <component :is="tab.icon" class="w-4 h-4" />
          {{ tab.label }}
        </button>
      </div>

      <!-- Tab Content -->
      <div class="tab-content">
        <!-- Current Session Steps -->
        <div v-if="activeTab === 'current'" class="steps-container">
          <div v-if="!currentSession || currentSession.steps.length === 0" class="empty-state">
            <Brain class="w-8 h-8 text-neutral-400" />
            <p class="text-sm text-neutral-600">No active thinking session</p>
            <button class="button-start-empty" @click="startNewSession">
              Start Thinking Session
            </button>
          </div>
          <div v-else class="steps-list">
            <div
              v-for="step in currentSession.steps"
              :key="step.id"
              class="step-item"
              :class="`step-${step.type} status-${step.status}`"
            >
              <div class="step-header">
                <div class="step-info">
                  <span class="step-icon">{{ getStepIcon(step.type) }}</span>
                  <span class="step-title">{{ step.title }}</span>
                  <span class="step-status" :class="`status-${step.status}`">
                    {{ getStatusIcon(step.status) }}
                  </span>
                </div>
                <div class="step-meta">
                  <span class="step-time">{{ formatTime(step.timestamp) }}</span>
                  <span v-if="step.duration" class="step-duration">{{ step.duration }}ms</span>
                </div>
              </div>

              <div class="step-description">{{ step.description }}</div>

              <div v-if="step.data" class="step-data">
                <details>
                  <summary>Data</summary>
                  <pre>{{ JSON.stringify(step.data, null, 2) }}</pre>
                </details>
              </div>

              <!-- Child Steps -->
              <div v-if="step.children && step.children.length > 0" class="child-steps">
                <div
                  v-for="child in step.children"
                  :key="child.id"
                  class="child-step"
                  :class="`step-${child.type} status-${child.status}`"
                >
                  <div class="step-header">
                    <div class="step-info">
                      <span class="step-icon">{{ getStepIcon(child.type) }}</span>
                      <span class="step-title">{{ child.title }}</span>
                      <span class="step-status">{{ getStatusIcon(child.status) }}</span>
                    </div>
                    <div class="step-meta">
                      <span class="step-time">{{ formatTime(child.timestamp) }}</span>
                    </div>
                  </div>
                  <div class="step-description">{{ child.description }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Sessions History -->
        <div v-if="activeTab === 'history'" class="history-container">
          <div v-if="sessions.length === 0" class="empty-state">
            <History class="w-8 h-8 text-neutral-400" />
            <p class="text-sm text-neutral-600">No completed sessions</p>
          </div>
          <div v-else class="sessions-list">
            <div
              v-for="session in sessions.slice().reverse()"
              :key="session.id"
              class="session-item"
              :class="`session-${session.status}`"
              @click="selectSession(session)"
            >
              <div class="session-header">
                <span class="session-name">{{ session.name }}</span>
                <span class="session-status" :class="`status-${session.status}`">
                  {{ session.status }}
                </span>
              </div>
              <div class="session-meta">
                <span class="session-date">{{ formatDate(session.startTime) }}</span>
                <span class="session-steps">{{ session.steps.length }} steps</span>
                <span v-if="session.endTime" class="session-duration">
                  {{ formatDuration(session.endTime - session.startTime) }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Analytics -->
        <div v-if="activeTab === 'analytics'" class="analytics-container">
          <div class="analytics-grid">
            <div class="analytics-component">
              <h4>Session Success Rate</h4>
              <div class="metric">
                {{ Math.round((statistics.completedSessions / Math.max(statistics.totalSessions, 1)) * 100) }}%
              </div>
            </div>

            <div class="analytics-component">
              <h4>Avg Steps/Session</h4>
              <div class="metric">
                {{ Math.round(statistics.averageStepsPerSession) }}
              </div>
            </div>

            <div class="analytics-component">
              <h4>Most Common Type</h4>
              <div class="metric">
                {{ getMostCommonStepType() }}
              </div>
            </div>

            <div class="analytics-component">
              <h4>Active Sessions</h4>
              <div class="metric">
                {{ statistics.activeSessions }}
              </div>
            </div>
          </div>

          <!-- Step Type Distribution -->
          <div class="chart-container">
            <h4>Step Type Distribution</h4>
            <div class="step-types">
              <div
                v-for="(count, type) in stepTypeDistribution"
                :key="type"
                class="step-type-bar"
              >
                <span class="type-label">{{ type }}</span>
                <div class="type-bar">
                  <div
                    class="type-fill"
                    :style="{ width: `${(count / maxStepTypeCount) * 100}%` }"
                  />
                </div>
                <span class="type-count">{{ count }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Floating Button -->
  <button
    v-if="isDev && !showPanel"
    class="thinking-toggle"
    title="Open Sequential Thinking Panel"
    @click="showPanel = true"
  >
    <Brain class="w-5 h-5" />
    <span v-if="currentSessionSteps > 0" class="step-indicator">{{ currentSessionSteps }}</span>
  </button>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import {
  Brain,
  Download,
  Trash2,
  X,
  Play,
  Square,
  History,
  BarChart3
} from 'lucide-vue-next'
import { useSequentialThinking } from '@/composables/useSequentialThinking'

const thinking = useSequentialThinking()

const showPanel = ref(false)
const activeTab = ref('current')
const selectedSessionId = ref<string | null>(null)

const isDev = computed(() => import.meta.env.MODE === 'development')

const tabs = [
  { id: 'current', label: 'Current', icon: Brain },
  { id: 'history', label: 'History', icon: History },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 }
]

// Computed properties
const {
  currentSession,
  sessions,
  isRecording,
  statistics
} = thinking

const currentSessionSteps = computed(() => currentSession.value?.steps.length || 0)

const sessionDuration = computed(() => {
  if (!currentSession.value) return 0
  return Date.now() - currentSession.value.startTime
})

const stepTypeDistribution = computed(() => {
  const allSteps = sessions.value.flatMap((s: any) => s.steps)
  if (currentSession.value) {
    allSteps.push(...currentSession.value.steps)
  }

  return allSteps.reduce((acc: any, step: any) => {
    acc[step.type] = (acc[step.type] || 0) + 1
    return acc
  }, {} as Record<string, number>)
})

const maxStepTypeCount = computed(() => {
  return Math.max(...Object.values(stepTypeDistribution.value) as number[], 1)
})

// Methods
const getStepIcon = (type: string): string => {
  const icons = {
    analysis: '🔍',
    decision: '🤔',
    implementation: '⚡',
    validation: '✅',
    debug: '🐛'
  }
  return icons[type as keyof typeof icons] || '📝'
}

const getStatusIcon = (status: string): string => {
  const icons = {
    pending: '⏳',
    in_progress: '🔄',
    completed: '✅',
    failed: '❌'
  }
  return icons[status as keyof typeof icons] || '❓'
}

const formatTime = (timestamp: number): string => {
  return new Date(timestamp).toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

const formatDate = (timestamp: number): string => {
  return new Date(timestamp).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const formatDuration = (ms: number): string => {
  if (ms < 1000) return `${ms}ms`
  const seconds = Math.floor(ms / 1000)
  if (seconds < 60) return `${seconds}s`
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${minutes}m ${remainingSeconds}s`
}

const startNewSession = () => {
  const sessionName = `Debug Session ${new Date().toLocaleTimeString('fr-FR')}`
  thinking.startSession(sessionName, {
    startedFrom: 'thinking-panel',
    userAgent: navigator.userAgent
  })
}

const endCurrentSession = () => {
  thinking.endSession('completed')
}

const exportCurrentSession = () => {
  if (currentSession.value) {
    thinking.exportSession(currentSession.value.id)
  }
}

const clearOldSessions = () => {
  if (confirm('Clear sessions older than 7 days?')) {
    thinking.clearOldSessions(7)
  }
}

const togglePanel = () => {
  showPanel.value = !showPanel.value
}

const selectSession = (session: any) => {
  selectedSessionId.value = session.id
  // Could implement session details view here
}

const getMostCommonStepType = (): string => {
  const types = stepTypeDistribution.value
  const maxType = Object.entries(types).reduce((a, b) => types[a[0]] > types[b[0]] ? a : b, ['none', 0])
  return maxType[0]
}

// Keyboard shortcuts
const handleKeydown = (event: KeyboardEvent) => {
  if (event.ctrlKey && event.shiftKey && event.key === 'T') {
    event.preventDefault()
    showPanel.value = !showPanel.value
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
})
</script>

<style scoped>
.sequential-thinking-panel {
  position: fixed;
  top: 20px;
  left: 20px;
  width: 420px;
  height: 70vh;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 16px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  z-index: 9999;
  display: flex;
  flex-direction: column;
  font-size: 13px;
  overflow: hidden;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid #e5e7eb;
  background: #f9fafb;
  border-radius: 16px 16px 0 0;
}

.panel-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  color: #374151;
}

.recording-indicator {
  background: #dc2626;
  color: white;
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 9999px;
  font-weight: 500;
  animation: pulse 2s infinite;
}

.panel-controls {
  display: flex;
  gap: 8px;
}

.button-export,
.button-clear,
.button-close {
  background: none;
  border: none;
  padding: 6px;
  border-radius: 6px;
  cursor: pointer;
  color: #6b7280;
  transition: all 0.2s;
}

.button-export:hover,
.button-clear:hover,
.button-close:hover {
  background: #e5e7eb;
  color: #374151;
}

.button-export:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.panel-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.stats-section {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 8px;
  padding: 16px 20px;
  border-bottom: 1px solid #e5e7eb;
}

.stat {
  text-align: center;
}

.stat-value {
  display: block;
  font-weight: 700;
  font-size: 18px;
  color: #111827;
}

.stat-label {
  display: block;
  font-size: 11px;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.session-controls {
  padding: 12px 20px;
  border-bottom: 1px solid #e5e7eb;
}

.session-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.session-name {
  font-weight: 500;
  color: #374151;
}

.session-duration {
  font-size: 11px;
  color: #6b7280;
  font-family: monospace;
}

.session-buttons {
  display: flex;
  gap: 8px;
}

.button-start,
.button-stop {
  display: flex;
  align-items: center;
  padding: 6px 12px;
  border: none;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.button-start {
  background: #10b981;
  color: white;
}

.button-start:hover {
  background: #059669;
}

.button-stop {
  background: #dc2626;
  color: white;
}

.button-stop:hover {
  background: #b91c1c;
}

.button-start-empty {
  background: #2563eb;
  color: white;
  padding: 8px 16px;
  border: none;
  border-radius: 8px;
  font-size: 12px;
  cursor: pointer;
  margin-top: 12px;
}

.tabs {
  display: flex;
  border-bottom: 1px solid #e5e7eb;
}

.tab {
  flex: 1;
  padding: 12px 16px;
  border: none;
  background: none;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 11px;
}

.tab:hover {
  background: #f3f4f6;
  color: #374151;
}

.tab-active {
  background: #f3f4f6;
  color: #2563eb;
  border-bottom: 2px solid #2563eb;
}

.tab-content {
  flex: 1;
  overflow-y: auto;
  padding: 16px 20px;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 200px;
  color: #6b7280;
  gap: 8px;
}

.steps-list,
.sessions-list {
  space-y: 8px;
}

.step-item {
  padding: 12px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  margin-bottom: 8px;
  transition: all 0.2s;
}

.step-item:hover {
  border-color: #d1d5db;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.step-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.step-info {
  display: flex;
  align-items: center;
  gap: 6px;
}

.step-icon {
  font-size: 14px;
}

.step-title {
  font-weight: 500;
  color: #374151;
}

.step-status {
  font-size: 12px;
}

.step-meta {
  display: flex;
  gap: 8px;
  font-size: 11px;
  color: #6b7280;
}

.step-description {
  color: #6b7280;
  font-size: 12px;
  margin-bottom: 8px;
}

.step-data details {
  margin-top: 8px;
}

.step-data summary {
  cursor: pointer;
  font-size: 11px;
  color: #6b7280;
  margin-bottom: 4px;
}

.step-data pre {
  background: #f3f4f6;
  padding: 8px;
  border-radius: 4px;
  font-size: 10px;
  overflow-x: auto;
  max-height: 120px;
  overflow-y: auto;
}

.child-steps {
  margin-top: 8px;
  padding-left: 16px;
  border-left: 2px solid #e5e7eb;
}

.child-step {
  padding: 8px;
  margin-bottom: 6px;
  background: #f9fafb;
  border-radius: 6px;
}

.session-item {
  padding: 12px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  margin-bottom: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.session-item:hover {
  border-color: #d1d5db;
  background: #f9fafb;
}

.session-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.session-name {
  font-weight: 500;
  color: #374151;
}

.session-status {
  font-size: 11px;
  padding: 2px 6px;
  border-radius: 4px;
  text-transform: uppercase;
  font-weight: 600;
}

.session-status.status-completed {
  background: #dcfce7;
  color: #166534;
}

.session-status.status-failed {
  background: #fee2e2;
  color: #b91c1c;
}

.session-status.status-active {
  background: #dbeafe;
  color: #1e40af;
}

.session-meta {
  display: flex;
  gap: 12px;
  font-size: 11px;
  color: #6b7280;
}

.analytics-container {
  space-y: 20px;
}

.analytics-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 20px;
}

.analytics-component {
  padding: 12px;
  background: #f9fafb;
  border-radius: 8px;
  text-align: center;
}

.analytics-component h4 {
  font-size: 11px;
  font-weight: 600;
  color: #6b7280;
  margin-bottom: 6px;
  text-transform: uppercase;
}

.analytics-component .metric {
  font-size: 20px;
  font-weight: 700;
  color: #111827;
}

.chart-container h4 {
  font-size: 13px;
  font-weight: 600;
  color: #374151;
  margin-bottom: 12px;
}

.step-types {
  space-y: 8px;
}

.step-type-bar {
  display: flex;
  align-items: center;
  gap: 8px;
}

.type-label {
  width: 80px;
  font-size: 11px;
  color: #6b7280;
  text-transform: capitalize;
}

.type-bar {
  flex: 1;
  height: 16px;
  background: #e5e7eb;
  border-radius: 8px;
  overflow: hidden;
}

.type-fill {
  height: 100%;
  background: linear-gradient(90deg, #3b82f6, #10b981);
  transition: width 0.3s ease;
}

.type-count {
  width: 30px;
  text-align: right;
  font-size: 11px;
  color: #6b7280;
  font-weight: 500;
}

.thinking-toggle {
  position: fixed;
  bottom: 80px;
  left: 20px;
  width: 56px;
  height: 56px;
  background: #8b5cf6;
  color: white;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  box-shadow: 0 10px 25px -5px rgba(139, 92, 246, 0.4);
  z-index: 9998;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  position: relative;
}

.thinking-toggle:hover {
  transform: scale(1.1);
  box-shadow: 0 15px 30px -5px rgba(139, 92, 246, 0.5);
}

.step-indicator {
  position: absolute;
  top: -8px;
  right: -8px;
  background: #f59e0b;
  color: #1f2937;
  font-size: 12px;
  font-weight: 600;
  padding: 2px 6px;
  border-radius: 9999px;
  min-width: 20px;
  text-align: center;
}

/* Status-specific styling */
.status-completed { opacity: 0.8; }
.status-failed { border-left: 3px solid #dc2626; }
.status-in_progress { border-left: 3px solid #f59e0b; }

/* Step type styling */
.step-debug { border-left: 3px solid #ef4444; }
.step-analysis { border-left: 3px solid #3b82f6; }
.step-decision { border-left: 3px solid #f59e0b; }
.step-implementation { border-left: 3px solid #10b981; }
.step-validation { border-left: 3px solid #8b5cf6; }

/* Mobile responsiveness */
@media (max-width: 640px) {
  .sequential-thinking-panel {
    top: 10px;
    left: 10px;
    right: 10px;
    width: auto;
  }

  .thinking-toggle {
    bottom: 70px;
    left: 15px;
  }
}
</style>
