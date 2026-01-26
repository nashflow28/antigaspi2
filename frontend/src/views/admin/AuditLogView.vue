<template>
  <DashboardLayout
    :sidebar="sidebar"
    :header="header"
    class="bg-gradient-to-br from-surface-light via-surface-light to-primary-50 dark:from-surface-dark dark:via-surface-darker dark:to-primary-950"
  >
    <div class="mx-auto w-full max-w-7xl space-y-8 px-3 py-6 sm:px-6 sm:py-8">
      <DashboardHeader
        data-testid="audit-header"
        eyebrow="Administration"
        title="Journal d'audit"
        subtitle="Historique de toutes les actions administratives sur la plateforme"
      >
        <template #actions>
          <Button
            data-testid="audit-refresh"
            variant="secondary"
            size="lg"
            class="gap-2"
            :loading="loading"
            @click="refreshData"
          >
            <ArrowPathIcon class="h-5 w-5" />
            Actualiser
          </Button>
        </template>
      </DashboardHeader>

      <!-- Statistics Cards -->
      <StatCardGrid
        data-testid="audit-stats-grid"
        :columns="'grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4'"
      >
        <StatCard
          title="Total Actions"
          :value="formatNumber(stats.total_actions)"
          description="Actions enregistrées"
          :icon="ClipboardDocumentListIcon"
          accent="primary"
        />
        <StatCard
          title="Aujourd'hui"
          :value="formatNumber(stats.today_actions)"
          description="Actions du jour"
          :icon="CalendarDaysIcon"
          accent="info"
        />
        <StatCard
          title="Cette semaine"
          :value="formatNumber(stats.week_actions)"
          description="7 derniers jours"
          :icon="ChartBarIcon"
          accent="success"
        />
        <StatCard
          title="Admins actifs"
          :value="formatNumber(stats.active_admins)"
          description="Cette semaine"
          :icon="UserGroupIcon"
          accent="warning"
        />
      </StatCardGrid>

      <!-- Audit Log Table -->
      <DataTableCard
        data-testid="audit-table"
        title="Historique des actions"
        description="Consultez toutes les actions effectuées par les administrateurs"
        :columns="auditTableColumns"
        :rows="auditLogs"
        :loading="loading"
        loading-text="Chargement du journal..."
        empty-title="Aucune action"
        empty-description="Aucune action administrative enregistrée."
        variant="glass"
      >
        <template #filters>
          <DashboardFilterBar
            v-model:search="filters.search"
            data-testid="audit-filters"
            :filters="dashboardFilters"
            placeholder="Rechercher par admin, action, entité..."
            @update:filters="handleFiltersUpdate"
            @search="applyFilters"
          >
            <template #actions>
              <Button
                variant="ghost"
                size="sm"
                class="whitespace-nowrap text-neutral-600 hover:text-primary-600 dark:text-neutral-300"
                @click="resetFilters"
              >
                Réinitialiser
              </Button>
              <Button
                variant="secondary"
                size="sm"
                class="gap-2 whitespace-nowrap"
                :loading="loading"
                @click="refreshData"
              >
                <ArrowPathIcon class="h-4 w-4" />
                Actualiser
              </Button>
            </template>
          </DashboardFilterBar>
        </template>

        <template #cell-action="{ value }">
          <Badge :variant="getActionVariant(value)" size="sm">
            {{ getActionLabel(value) }}
          </Badge>
        </template>

        <template #cell-admin="{ value }">
          <div v-if="value" class="flex items-center gap-2">
            <div class="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 text-primary-600 dark:bg-primary-900 dark:text-primary-300">
              <span class="text-xs font-medium">{{ getInitials(value.name) }}</span>
            </div>
            <div class="flex flex-col">
              <span class="text-sm font-medium text-neutral-900 dark:text-neutral-50">
                {{ value.name }}
              </span>
              <span class="text-xs text-neutral-500 dark:text-neutral-400">
                {{ value.email }}
              </span>
            </div>
          </div>
          <span v-else class="text-sm text-neutral-400">—</span>
        </template>

        <template #cell-entity="{ row }">
          <div class="flex flex-col">
            <span class="text-sm font-medium text-neutral-900 dark:text-neutral-50">
              {{ row.entity_type }}
            </span>
            <span class="text-xs text-neutral-500 dark:text-neutral-400">
              ID: {{ row.entity_id }}
            </span>
          </div>
        </template>

        <template #cell-reason="{ value }">
          <span v-if="value" class="text-sm text-neutral-600 dark:text-neutral-300">
            {{ value }}
          </span>
          <span v-else class="text-sm text-neutral-400">—</span>
        </template>

        <template #cell-ip_address="{ value }">
          <code class="rounded bg-neutral-100 px-2 py-1 text-xs text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300">
            {{ value || '—' }}
          </code>
        </template>

        <template #cell-created_at="{ value }">
          <div class="flex flex-col">
            <span class="text-sm text-neutral-900 dark:text-neutral-50">
              {{ formatDate(value) }}
            </span>
            <span class="text-xs text-neutral-500 dark:text-neutral-400">
              {{ formatTime(value) }}
            </span>
          </div>
        </template>

        <template #cell-actions="{ row }">
          <div class="flex items-center justify-end gap-2">
            <Button
              variant="ghost"
              size="sm"
              class="text-primary-600 hover:text-primary-700 dark:text-primary-300"
              :aria-label="`Voir détails action ${row.id}`"
              @click="viewDetails(row)"
            >
              <EyeIcon class="h-4 w-4" />
              <span class="sr-only">Détails</span>
            </Button>
          </div>
        </template>

        <template #footer>
          <Pagination
            data-testid="audit-pagination"
            :current-page="pagination.current_page"
            :total-pages="pagination.total_pages"
            :total="pagination.total"
            :page-size="pagination.per_page"
            @page-change="handlePageChange"
          />
        </template>
      </DataTableCard>
    </div>

    <!-- Details Modal -->
    <Teleport to="body">
      <div
        v-if="showDetailsModal"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
        @click.self="closeDetailsModal"
      >
        <div class="mx-4 w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl dark:bg-neutral-800">
          <div class="mb-6 flex items-center justify-between">
            <h3 class="text-xl font-semibold text-neutral-900 dark:text-neutral-50">
              Détails de l'action
            </h3>
            <button
              class="rounded-lg p-2 text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-700"
              @click="closeDetailsModal"
            >
              <XMarkIcon class="h-5 w-5" />
            </button>
          </div>

          <div v-if="selectedLog" class="space-y-4">
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="text-xs font-medium uppercase text-neutral-500">Action</label>
                <p class="mt-1">
                  <Badge :variant="getActionVariant(selectedLog.action)" size="sm">
                    {{ getActionLabel(selectedLog.action) }}
                  </Badge>
                </p>
              </div>
              <div>
                <label class="text-xs font-medium uppercase text-neutral-500">Date</label>
                <p class="mt-1 text-neutral-900 dark:text-neutral-50">
                  {{ formatDate(selectedLog.created_at) }} à {{ formatTime(selectedLog.created_at) }}
                </p>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="text-xs font-medium uppercase text-neutral-500">Administrateur</label>
                <p class="mt-1 text-neutral-900 dark:text-neutral-50">
                  {{ selectedLog.admin?.name || 'Inconnu' }}
                </p>
              </div>
              <div>
                <label class="text-xs font-medium uppercase text-neutral-500">Entité</label>
                <p class="mt-1 text-neutral-900 dark:text-neutral-50">
                  {{ selectedLog.entity_type }} #{{ selectedLog.entity_id }}
                </p>
              </div>
            </div>

            <div v-if="selectedLog.reason">
              <label class="text-xs font-medium uppercase text-neutral-500">Raison</label>
              <p class="mt-1 text-neutral-900 dark:text-neutral-50">
                {{ selectedLog.reason }}
              </p>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="text-xs font-medium uppercase text-neutral-500">Adresse IP</label>
                <code class="mt-1 block rounded bg-neutral-100 px-2 py-1 text-sm dark:bg-neutral-700">
                  {{ selectedLog.ip_address || 'Non enregistrée' }}
                </code>
              </div>
              <div>
                <label class="text-xs font-medium uppercase text-neutral-500">User Agent</label>
                <p class="mt-1 truncate text-sm text-neutral-600 dark:text-neutral-300" :title="selectedLog.user_agent ?? undefined">
                  {{ selectedLog.user_agent || 'Non enregistré' }}
                </p>
              </div>
            </div>

            <div v-if="selectedLog.old_values || selectedLog.new_values" class="space-y-3">
              <div v-if="selectedLog.old_values">
                <label class="text-xs font-medium uppercase text-neutral-500">Anciennes valeurs</label>
                <pre class="mt-1 overflow-x-auto rounded bg-red-50 p-3 text-xs text-red-800 dark:bg-red-900/20 dark:text-red-200">{{ JSON.stringify(selectedLog.old_values, null, 2) }}</pre>
              </div>
              <div v-if="selectedLog.new_values">
                <label class="text-xs font-medium uppercase text-neutral-500">Nouvelles valeurs</label>
                <pre class="mt-1 overflow-x-auto rounded bg-green-50 p-3 text-xs text-green-800 dark:bg-green-900/20 dark:text-green-200">{{ JSON.stringify(selectedLog.new_values, null, 2) }}</pre>
              </div>
            </div>
          </div>

          <div class="mt-6 flex justify-end">
            <Button variant="secondary" @click="closeDetailsModal">
              Fermer
            </Button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Notifications -->
    <Teleport to="body">
      <div class="fixed top-4 right-4 z-[110] space-y-3">
        <TransitionGroup name="toast">
          <Toast
            v-for="notification in notifications"
            :key="notification.id"
            :is-open="true"
            :tone="notification.type"
            :title="notification.title"
            :description="notification.message"
            position="stacked"
            @close="removeNotification(notification.id)"
          />
        </TransitionGroup>
      </div>
    </Teleport>
  </DashboardLayout>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, Teleport, TransitionGroup } from 'vue'
import {
  ArrowPathIcon,
  ClipboardDocumentListIcon,
  CalendarDaysIcon,
  ChartBarIcon,
  UserGroupIcon,
  EyeIcon,
  XMarkIcon
} from '@heroicons/vue/24/outline'
import apiService from '@/services/api'
import Toast from '@/components/ui/Toast.vue'
import DashboardLayout from '@/components/ui/DashboardLayout.vue'
import { Button, Badge, Pagination } from '@/components/ui/2025'
import {
  DashboardHeader,
  StatCard,
  StatCardGrid,
  DashboardFilterBar,
  DataTableCard
} from '@/components/dashboard/2025'
// Types
interface AuditTableColumn {
  key: string
  title: string
  sortable?: boolean
}

interface AuditLog {
  id: number
  admin_id: number
  action: string
  entity_type: string
  entity_id: number
  reason: string | null
  old_values: Record<string, any> | null
  new_values: Record<string, any> | null
  ip_address: string | null
  user_agent: string | null
  created_at: string
  admin: {
    id: number
    name: string
    email: string
  } | null
}

interface Stats {
  total_actions: number
  today_actions: number
  week_actions: number
  active_admins: number
}

interface PaginationData {
  current_page: number
  total_pages: number
  per_page: number
  total: number
}

interface Notification {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message: string
}

// Refs
const loading = ref(false)
const auditLogs = ref<AuditLog[]>([])
const stats = ref<Stats>({
  total_actions: 0,
  today_actions: 0,
  week_actions: 0,
  active_admins: 0
})
const pagination = ref<PaginationData>({
  current_page: 1,
  total_pages: 1,
  per_page: 20,
  total: 0
})
// Available actions could be used for dynamic filtering in future
const _availableActions = ref<string[]>([])
void _availableActions.value // Suppress unused warning
const showDetailsModal = ref(false)
const selectedLog = ref<AuditLog | null>(null)
const notifications = ref<Notification[]>([])

const filters = reactive({
  action: '',
  admin_id: '',
  entity_type: '',
  start_date: '',
  end_date: '',
  search: '',
  page: 1,
  per_page: 20
})

// Config - Use 'as any' to bypass strict DashboardLayout typing since we only need minimal props
const sidebar = { brand: { name: 'GÊLADAL Admin' }, navigation: [] } as any
const header = { user: { name: 'Admin', email: 'admin@geladal.com' } } as any

// Dashboard Filters - Cast as any to allow additional properties like 'type'
const dashboardFilters = [
  {
    id: 'action',
    label: 'Action',
    options: [
      { value: '', label: 'Toutes les actions' },
      { value: 'merchant_approved', label: 'Approbation commerçant' },
      { value: 'merchant_rejected', label: 'Rejet commerçant' },
      { value: 'product_approved', label: 'Approbation produit' },
      { value: 'product_rejected', label: 'Rejet produit' },
      { value: 'user_suspended', label: 'Suspension utilisateur' },
      { value: 'user_unsuspended', label: 'Réactivation utilisateur' },
      { value: 'review_approved', label: 'Approbation avis' },
      { value: 'review_rejected', label: 'Rejet avis' },
      { value: 'settings_updated', label: 'Mise à jour paramètres' }
    ]
  },
  {
    id: 'entity_type',
    label: 'Type d\'entité',
    options: [
      { value: '', label: 'Tous les types' },
      { value: 'User', label: 'Utilisateur' },
      { value: 'Merchant', label: 'Commerçant' },
      { value: 'Product', label: 'Produit' },
      { value: 'Review', label: 'Avis' },
      { value: 'Reservation', label: 'Réservation' }
    ]
  },
  {
    id: 'start_date',
    label: 'Date début',
    options: []
  },
  {
    id: 'end_date',
    label: 'Date fin',
    options: []
  }
]

// Table Columns - Use title property as required by DataTableColumn
const auditTableColumns: AuditTableColumn[] = [
  { key: 'action', title: 'Action', sortable: true },
  { key: 'admin', title: 'Administrateur', sortable: false },
  { key: 'entity', title: 'Entité', sortable: false },
  { key: 'reason', title: 'Raison', sortable: false },
  { key: 'ip_address', title: 'IP', sortable: false },
  { key: 'created_at', title: 'Date', sortable: true },
  { key: 'actions', title: '', sortable: false }
]

// Methods
const fetchAuditLogs = async () => {
  loading.value = true
  try {
    const queryParams = new URLSearchParams()
    Object.entries(filters).forEach(([key, value]) => {
      if (value && value !== '') {
        queryParams.append(key, String(value))
      }
    })

    const response = await apiService.get<{
      success: boolean
      data: AuditLog[]
      meta: {
        current_page: number
        last_page: number
        per_page: number
        total: number
      }
    }>(`/admin/audit?${queryParams.toString()}`)

    if (response.success) {
      auditLogs.value = response.data
      pagination.value = {
        current_page: response.meta.current_page,
        total_pages: response.meta.last_page,
        per_page: response.meta.per_page,
        total: response.meta.total
      }
    }
  } catch (error: any) {
    console.error('Error fetching audit logs:', error)
    addNotification({
      type: 'error',
      title: 'Erreur',
      message: error.response?.data?.message || 'Impossible de charger le journal d\'audit'
    })
  } finally {
    loading.value = false
  }
}

const fetchStats = async () => {
  try {
    const response = await apiService.get<{
      success: boolean
      data: Stats
    }>('/admin/audit/stats')

    if (response.success) {
      stats.value = response.data
    }
  } catch (error) {
    console.error('Error fetching audit stats:', error)
  }
}

const handleFiltersUpdate = (updatedFilters: Record<string, any>) => {
  Object.assign(filters, updatedFilters)
}

const applyFilters = () => {
  filters.page = 1
  fetchAuditLogs()
}

const resetFilters = () => {
  Object.assign(filters, {
    action: '',
    admin_id: '',
    entity_type: '',
    start_date: '',
    end_date: '',
    search: '',
    page: 1,
    per_page: 20
  })
  fetchAuditLogs()
}

const refreshData = () => {
  fetchAuditLogs()
  fetchStats()
}

const handlePageChange = (page: number) => {
  filters.page = page
  fetchAuditLogs()
}

const viewDetails = (log: Record<string, unknown>) => {
  selectedLog.value = log as unknown as AuditLog
  showDetailsModal.value = true
}

const closeDetailsModal = () => {
  showDetailsModal.value = false
  selectedLog.value = null
}

// Helpers
const formatNumber = (value: number): string => {
  return new Intl.NumberFormat('fr-FR').format(value || 0)
}

const formatDate = (dateString: string): string => {
  if (!dateString) return '—'
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('fr-FR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }).format(date)
}

const formatTime = (dateString: string): string => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('fr-FR', {
    hour: '2-digit',
    minute: '2-digit'
  }).format(date)
}

const getInitials = (name: string): string => {
  if (!name) return '?'
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

type BadgeVariant = 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info' | 'outline' | 'promo' | 'soft'

const getActionVariant = (action: string): BadgeVariant => {
  const variants: Record<string, BadgeVariant> = {
    merchant_approved: 'success',
    merchant_rejected: 'error',
    product_approved: 'success',
    product_rejected: 'error',
    user_suspended: 'warning',
    user_unsuspended: 'info',
    review_approved: 'success',
    review_rejected: 'error',
    settings_updated: 'secondary',
    reservation_resolved: 'info'
  }
  return variants[action] || 'secondary'
}

const getActionLabel = (action: string): string => {
  const labels: Record<string, string> = {
    merchant_approved: 'Commerçant approuvé',
    merchant_rejected: 'Commerçant rejeté',
    product_approved: 'Produit approuvé',
    product_rejected: 'Produit rejeté',
    user_suspended: 'Utilisateur suspendu',
    user_unsuspended: 'Utilisateur réactivé',
    review_approved: 'Avis approuvé',
    review_rejected: 'Avis rejeté',
    settings_updated: 'Paramètres modifiés',
    reservation_resolved: 'Réservation résolue',
    broadcast_sent: 'Notification envoyée'
  }
  return labels[action] || action
}

const addNotification = (notification: Omit<Notification, 'id'>) => {
  const id = `notif-${Date.now()}-${Math.random()}`
  notifications.value.push({ ...notification, id })
  setTimeout(() => removeNotification(id), 5000)
}

const removeNotification = (id: string) => {
  const index = notifications.value.findIndex(n => n.id === id)
  if (index !== -1) {
    notifications.value.splice(index, 1)
  }
}

// Lifecycle
onMounted(() => {
  fetchAuditLogs()
  fetchStats()
})
</script>
