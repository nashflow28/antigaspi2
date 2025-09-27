<template>
  <div v-if="isDev && showDashboard" class="error-dashboard">
    <div class="dashboard-header">
      <div class="dashboard-title">
        <Bug class="w-5 h-5" />
        <span>Error Dashboard</span>
        <span v-if="errorQueue.length > 0" class="error-count">{{ errorQueue.length }}</span>
      </div>
      <div class="dashboard-controls">
        <Button
          variant="ghost"
          size="sm"
          title="Clear all errors"
          @click="clearAllErrors"
        >
          <Trash2 class="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          title="Close dashboard"
          @click="showDashboard = false"
        >
          <X class="w-4 h-4" />
        </Button>
      </div>
    </div>

    <div class="dashboard-content">
      <!-- Stats -->
      <div class="stats-grid">
        <Card class="stat-item">
          <AlertTriangle class="w-5 h-5 text-red-500" />
          <div>
            <div class="stat-value">{{ errorQueue.length }}</div>
            <div class="stat-label">Erreurs en attente</div>
          </div>
        </Card>

        <Card class="stat-item">
          <Activity class="w-5 h-5 text-blue-500" />
          <div>
            <div class="stat-value">{{ breadcrumbs.length }}</div>
            <div class="stat-label">Breadcrumbs</div>
          </div>
        </Card>

        <Card class="stat-item">
          <MousePointer class="w-5 h-5 text-green-500" />
          <div>
            <div class="stat-value">{{ userActions.length }}</div>
            <div class="stat-label">Actions utilisateur</div>
          </div>
        </Card>

        <Card class="stat-item">
          <Wifi class="w-5 h-5" :class="isOnline ? 'text-green-500' : 'text-red-500'" />
          <div>
            <div class="stat-value">{{ isOnline ? 'En ligne' : 'Hors ligne' }}</div>
            <div class="stat-label">Statut réseau</div>
          </div>
        </Card>
      </div>

      <!-- Tabs -->
      <div class="tabs">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          :class="[
            'tab-button',
            { 'tab-active': activeTab === tab.id }
          ]"
          @click="activeTab = tab.id"
        >
          <component :is="tab.icon" class="w-4 h-4" />
          {{ tab.label }}
        </button>
      </div>

      <!-- Tab Content -->
      <div class="tab-content">
        <!-- Errors Tab -->
        <div v-if="activeTab === 'errors'" class="errors-list">
          <div v-if="errorQueue.length === 0" class="empty-state">
            <CheckCircle class="w-8 h-8 text-green-500" />
            <p>Aucune erreur en attente</p>
          </div>
          <div v-else>
            <div
              v-for="(report, index) in errorQueue"
              :key="`${report.context.errorId}-${index}`"
              class="error-item"
            >
              <div class="error-header">
                <div class="error-info">
                  <span class="error-id">{{ report.context.errorId }}</span>
                  <span
                    class="error-severity"
                    :class="`severity-${report.metadata?.severity || 'low'}`"
                  >
                    {{ report.metadata?.severity || 'low' }}
                  </span>
                  <span
                    class="error-category"
                    :class="`category-${report.metadata?.category || 'unknown'}`"
                  >
                    {{ report.metadata?.category || 'unknown' }}
                  </span>
                </div>
                <div class="error-time">
                  {{ formatTime(report.context.timestamp || Date.now()) }}
                </div>
              </div>
              <div class="error-message">{{ report.error.message }}</div>
              <div v-if="report.context.component" class="error-component">
                Component: {{ report.context.component }}
              </div>
              <details class="error-details">
                <summary>Stack trace</summary>
                <pre class="error-stack">{{ report.error.stack }}</pre>
              </details>
            </div>
          </div>
        </div>

        <!-- Breadcrumbs Tab -->
        <div v-if="activeTab === 'breadcrumbs'" class="breadcrumbs-list">
          <div v-if="breadcrumbs.length === 0" class="empty-state">
            <Navigation class="w-8 h-8 text-gray-400" />
            <p>Aucun breadcrumb enregistré</p>
          </div>
          <div v-else>
            <div
              v-for="(breadcrumb, index) in breadcrumbs.slice().reverse()"
              :key="`${breadcrumb.timestamp}-${index}`"
              class="breadcrumb-item"
              :class="`level-${breadcrumb.level}`"
            >
              <div class="breadcrumb-header">
                <span class="breadcrumb-category">{{ breadcrumb.category }}</span>
                <span class="breadcrumb-time">{{ formatTime(breadcrumb.timestamp) }}</span>
              </div>
              <div class="breadcrumb-message">{{ breadcrumb.message }}</div>
              <div v-if="breadcrumb.data" class="breadcrumb-data">
                <pre>{{ JSON.stringify(breadcrumb.data, null, 2) }}</pre>
              </div>
            </div>
          </div>
        </div>

        <!-- User Actions Tab -->
        <div v-if="activeTab === 'actions'" class="actions-list">
          <div v-if="userActions.length === 0" class="empty-state">
            <MousePointer class="w-8 h-8 text-gray-400" />
            <p>Aucune action utilisateur enregistrée</p>
          </div>
          <div v-else>
            <div
              v-for="(action, index) in userActions.slice().reverse()"
              :key="`${action.timestamp}-${index}`"
              class="action-item"
            >
              <div class="action-header">
                <span class="action-name">{{ action.action }}</span>
                <span class="action-time">{{ formatTime(action.timestamp) }}</span>
              </div>
              <div v-if="action.target" class="action-target">Target: {{ action.target }}</div>
              <div v-if="action.data" class="action-data">
                <pre>{{ JSON.stringify(action.data, null, 2) }}</pre>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Dashboard Toggle Button -->
  <button
    v-if="isDev && !showDashboard"
    class="dashboard-toggle"
    title="Open Error Dashboard"
    @click="showDashboard = true"
  >
    <Bug class="w-5 h-5" />
    <Badge v-if="errorQueue.length > 0" variant="warning" class="toggle-indicator">{{ errorQueue.length }}</Badge>
  </button>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  Bug,
  X,
  Trash2,
  AlertTriangle,
  Activity,
  MousePointer,
  Wifi,
  CheckCircle,
  Navigation
} from 'lucide-vue-next'
import { useErrorReporting } from '@/composables/useErrorReporting'
import Button from '@/components/ui/2025/Button.vue'
import Card from '@/components/ui/2025/Card.vue'
import Badge from '@/components/ui/2025/Badge.vue'

const { errorQueue, breadcrumbs, userActions } = useErrorReporting()

const showDashboard = ref(false)
const activeTab = ref('errors')

const isDev = computed(() => import.meta.env.DEV)
const isOnline = computed(() => navigator.onLine)

const tabs = [
  { id: 'errors', label: 'Erreurs', icon: AlertTriangle },
  { id: 'breadcrumbs', label: 'Breadcrumbs', icon: Navigation },
  { id: 'actions', label: 'Actions', icon: MousePointer }
]

const formatTime = (timestamp: number): string => {
  return new Date(timestamp).toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

const clearAllErrors = () => {
  errorQueue.value.splice(0, errorQueue.value.length)
  breadcrumbs.value.splice(0, breadcrumbs.value.length)
  userActions.value.splice(0, userActions.value.length)
}

// Keyboard shortcuts
const handleKeydown = (event: KeyboardEvent) => {
  if (event.ctrlKey && event.shiftKey && event.key === 'E') {
    event.preventDefault()
    showDashboard.value = !showDashboard.value
  }
}

if (typeof window !== 'undefined') {
  window.addEventListener('keydown', handleKeydown)
}
</script>

<style scoped>
.error-dashboard {
  position: fixed;
  top: 20px;
  right: 20px;
  width: 400px;
  height: 600px;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  z-index: 9999;
  display: flex;
  flex-direction: column;
  font-size: 14px;
}

.dashboard-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid #e5e7eb;
  background: #f9fafb;
  border-radius: 12px 12px 0 0;
}

.dashboard-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  color: #374151;
}

.error-count {
  background: #dc2626;
  color: white;
  font-size: 12px;
  padding: 2px 6px;
  border-radius: 9999px;
  min-width: 20px;
  text-align: center;
}

.dashboard-controls {
  display: flex;
  gap: 8px;
}


.dashboard-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.stats-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  padding: 16px 20px;
  border-bottom: 1px solid #e5e7eb;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  background: #f9fafb;
  border-radius: 6px;
}

.stat-value {
  font-weight: 600;
  color: #111827;
  font-size: 16px;
}

.stat-label {
  font-size: 11px;
  color: #6b7280;
}

.tabs {
  display: flex;
  border-bottom: 1px solid #e5e7eb;
}

.tab-button {
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
  font-size: 12px;
}

.tab-button:hover {
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

.error-item,
.breadcrumb-item,
.action-item {
  padding: 12px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  margin-bottom: 8px;
}

.error-header,
.breadcrumb-header,
.action-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.error-info {
  display: flex;
  gap: 8px;
  align-items: center;
}

.error-id {
  font-family: monospace;
  font-size: 11px;
  background: #f3f4f6;
  padding: 2px 6px;
  border-radius: 4px;
}

.error-severity,
.error-category {
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 4px;
  text-transform: uppercase;
  font-weight: 600;
}

.severity-low { background: #dbeafe; color: #1e40af; }
.severity-medium { background: #fef3c7; color: #92400e; }
.severity-high { background: #fecaca; color: #b91c1c; }
.severity-critical { background: #ddd6fe; color: #5b21b6; }

.category-ui { background: #ecfccb; color: #365314; }
.category-api { background: #cffafe; color: #155e75; }
.category-network { background: #fed7d7; color: #c53030; }
.category-auth { background: #e9d5ff; color: #6b21a8; }
.category-validation { background: #fef2c7; color: #92400e; }
.category-unknown { background: #f3f4f6; color: #374151; }

.error-time,
.breadcrumb-time,
.action-time {
  font-size: 11px;
  color: #6b7280;
  font-family: monospace;
}

.error-message {
  font-weight: 500;
  color: #dc2626;
  margin-bottom: 8px;
}

.error-component {
  font-size: 12px;
  color: #6b7280;
  margin-bottom: 8px;
}

.error-details {
  margin-top: 8px;
}

.error-details summary {
  cursor: pointer;
  font-size: 12px;
  color: #6b7280;
}

.error-stack {
  background: #1f2937;
  color: #f9fafb;
  padding: 8px;
  border-radius: 4px;
  overflow-x: auto;
  font-size: 11px;
  margin-top: 8px;
}

.breadcrumb-item.level-error {
  border-left: 3px solid #dc2626;
}

.breadcrumb-item.level-warning {
  border-left: 3px solid #f59e0b;
}

.breadcrumb-item.level-info {
  border-left: 3px solid #3b82f6;
}

.breadcrumb-category {
  font-size: 11px;
  padding: 2px 6px;
  background: #e5e7eb;
  border-radius: 4px;
  text-transform: uppercase;
  font-weight: 600;
}

.breadcrumb-message,
.action-name {
  font-weight: 500;
  color: #374151;
  margin: 8px 0;
}

.breadcrumb-data,
.action-data {
  background: #f9fafb;
  border-radius: 4px;
  padding: 8px;
  margin-top: 8px;
}

.breadcrumb-data pre,
.action-data pre {
  font-size: 11px;
  color: #374151;
  margin: 0;
  overflow-x: auto;
}

.action-target {
  font-size: 12px;
  color: #6b7280;
  margin-bottom: 8px;
}

.dashboard-toggle {
  position: fixed;
  bottom: 20px;
  right: 20px;
  width: 56px;
  height: 56px;
  background: #dc2626;
  color: white;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  box-shadow: 0 10px 25px -5px rgba(220, 38, 38, 0.4);
  z-index: 9998;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  position: relative;
}

.dashboard-toggle:hover {
  transform: scale(1.1);
  box-shadow: 0 15px 30px -5px rgba(220, 38, 38, 0.5);
}

.toggle-indicator {
  position: absolute;
  top: -8px;
  right: -8px;
  font-size: 12px;
  min-width: 20px;
  text-align: center;
}

/* Mobile adaptations */
@media (max-width: 640px) {
  .error-dashboard {
    top: 10px;
    right: 10px;
    left: 10px;
    width: auto;
    height: 70vh;
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }

  .dashboard-toggle {
    bottom: 10px;
    right: 10px;
  }
}
</style>
