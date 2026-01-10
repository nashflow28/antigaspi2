<template>
  <DashboardLayout
    :sidebar="sidebar"
    :header="header"
    class="bg-gradient-to-br from-surface-light via-surface-light to-primary-50 dark:from-surface-dark dark:via-surface-darker dark:to-primary-950"
  >
    <div class="mx-auto w-full max-w-7xl space-y-8 px-3 py-6 sm:px-6 sm:py-8">
      <DashboardHeader
        data-testid="payments-header"
        eyebrow="Administration"
        title="Dashboard Paiements"
        subtitle="Suivez et analysez tous les paiements de la plateforme"
      >
        <template #actions>
          <Button
            data-testid="payments-refresh"
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

      <StatCardGrid
        data-testid="payments-stats-grid"
        :columns="'grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5'"
      >
        <StatCard
          title="Total Paiements"
          :value="formatNumber(summary.total_payments)"
          description="Tous statuts confondus"
          :icon="BanknotesIcon"
          accent="primary"
        />
        <StatCard
          title="Montant Total"
          :value="formatCurrency(summary.total_amount)"
          description="Somme des transactions"
          :icon="CurrencyDollarIcon"
          accent="success"
        />
        <StatCard
          title="Réussis"
          :value="formatNumber(summary.successful_payments)"
          description="Paiements complétés"
          :icon="CheckCircleIcon"
          accent="success"
        />
        <StatCard
          title="En attente"
          :value="formatNumber(summary.pending_payments)"
          description="À traiter"
          :icon="ClockIcon"
          accent="warning"
        />
        <StatCard
          title="Échoués"
          :value="formatNumber(summary.failed_payments)"
          description="Nécessite attention"
          :icon="XCircleIcon"
          accent="warning"
        />
      </StatCardGrid>

      <DataTableCard
        data-testid="payments-table"
        title="Transactions"
        description="Consultez l'historique complet des paiements avec filtres avancés"
        :columns="paymentTableColumns"
        :rows="payments"
        :loading="loading"
        loading-text="Chargement des paiements..."
        empty-title="Aucun paiement"
        empty-description="Aucune transaction trouvée pour les critères sélectionnés."
        variant="glass"
      >
        <template #filters>
          <DashboardFilterBar
            v-model:search="filters.search"
            data-testid="payments-filters"
            :filters="dashboardFilters"
            placeholder="Rechercher par transaction, référence, téléphone..."
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

        <template #cell-amount="{ value }">
          <span class="font-semibold text-neutral-900 dark:text-neutral-50">
            {{ formatCurrency(value) }}
          </span>
        </template>

        <template #cell-status="{ value }">
          <Badge
            :variant="getStatusVariant(value)"
            size="sm"
          >
            {{ getStatusLabel(value) }}
          </Badge>
        </template>

        <template #cell-payment_method="{ value }">
          <Badge
            variant="secondary"
            size="sm"
          >
            {{ getPaymentMethodLabel(value) }}
          </Badge>
        </template>

        <template #cell-customer="{ value }">
          <div v-if="value" class="flex flex-col gap-0.5">
            <span class="font-medium text-sm text-neutral-900 dark:text-neutral-50">
              {{ value.name }}
            </span>
            <span class="text-xs text-neutral-500 dark:text-neutral-400">
              {{ value.email }}
            </span>
          </div>
          <span v-else class="text-sm text-neutral-400 dark:text-neutral-500">—</span>
        </template>

        <template #cell-merchant="{ value }">
          <div v-if="value" class="flex flex-col gap-0.5">
            <span class="font-medium text-sm text-neutral-900 dark:text-neutral-50">
              {{ value.business_name }}
            </span>
            <span class="text-xs text-neutral-500 dark:text-neutral-400">
              {{ value.business_type }}
            </span>
          </div>
          <span v-else class="text-sm text-neutral-400 dark:text-neutral-500">—</span>
        </template>

        <template #cell-created_at="{ value }">
          <span class="text-sm text-neutral-600 dark:text-neutral-300">
            {{ formatDate(value) }}
          </span>
        </template>

        <template #cell-actions="{ row }">
          <div class="flex items-center justify-end gap-2">
            <Button
              variant="ghost"
              size="sm"
              class="text-primary-600 hover:text-primary-700 dark:text-primary-300"
              :aria-label="`Voir détails paiement ${row.transaction_id}`"
              @click="viewPaymentDetails(row)"
            >
              <EyeIcon class="h-4 w-4" />
              <span class="sr-only">Détails</span>
            </Button>
          </div>
        </template>

        <template #footer>
          <Pagination
            data-testid="payments-pagination"
            :current-page="pagination.current_page"
            :total-pages="pagination.total_pages"
            :total="pagination.total"
            :page-size="pagination.per_page"
            @page-change="handlePageChange"
          />
        </template>
      </DataTableCard>
    </div>

    <div class="fixed top-4 right-4 z-[110] space-y-3">
      <NotificationToast
        v-for="notification in notifications"
        :key="notification.id"
        :type="notification.type"
        :title="notification.title"
        :message="notification.message"
        @close="removeNotification(notification.id)"
      />
    </div>
  </DashboardLayout>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import {
  ArrowPathIcon,
  BanknotesIcon,
  CurrencyDollarIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  EyeIcon
} from '@heroicons/vue/24/outline'
import apiService from '@/services/api'
import NotificationToast from '@/components/ui/NotificationToast.vue'
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
interface PaymentTableColumn {
  key: string
  title: string
  sortable?: boolean
}

interface Payment {
  id: number
  amount: number
  currency: string
  payment_method: string
  status: string
  transaction_id: string
  reference: string
  provider: string
  customer_phone: string
  paid_at: string | null
  created_at: string
  customer: {
    id: number
    name: string
    email: string
    phone: string
  } | null
  merchant: {
    id: number
    business_name: string
    business_type: string
    email: string
  } | null
  reservation_id: number
}

interface Summary {
  total_payments: number
  total_amount: number
  successful_payments: number
  failed_payments: number
  pending_payments: number
}

interface Pagination {
  current_page: number
  total_pages: number
  per_page: number
  total: number
  from: number | null
  to: number | null
}

interface Notification {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message: string
}

// Refs and Reactive State
const loading = ref(false)
const payments = ref<Payment[]>([])
const summary = ref<Summary>({
  total_payments: 0,
  total_amount: 0,
  successful_payments: 0,
  failed_payments: 0,
  pending_payments: 0
})
const pagination = ref<Pagination>({
  current_page: 1,
  total_pages: 1,
  per_page: 20,
  total: 0,
  from: null,
  to: null
})

const filters = reactive({
  status: '',
  payment_method: '',
  start_date: '',
  end_date: '',
  merchant_id: '',
  min_amount: '',
  max_amount: '',
  search: '',
  page: 1,
  per_page: 20
})

const notifications = ref<Notification[]>([])

// Sidebar and Header config - Use 'as any' to bypass strict typing
const sidebar = { brand: { name: 'Antigaspi Admin' }, navigation: [] } as any
const header = { user: { name: 'Admin', email: 'admin@antigaspi.com' } } as any

// Dashboard Filters Configuration - Using 'id' as required by DashboardFilter type
const dashboardFilters = [
  {
    id: 'status',
    label: 'Statut',
    options: [
      { value: '', label: 'Tous les statuts' },
      { value: 'success', label: 'Réussi' },
      { value: 'pending', label: 'En attente' },
      { value: 'failed', label: 'Échoué' },
      { value: 'on_site', label: 'Sur place' },
      { value: 'refunded', label: 'Remboursé' }
    ]
  },
  {
    id: 'payment_method',
    label: 'Méthode',
    options: [
      { value: '', label: 'Toutes les méthodes' },
      { value: 'flooz', label: 'Flooz' },
      { value: 'tmoney', label: 'Tmoney' },
      { value: 'orange_money', label: 'Orange Money' },
      { value: 'mtn_momo', label: 'MTN Mobile Money' },
      { value: 'paystack', label: 'Paystack' },
      { value: 'on_site', label: 'Sur place' },
      { value: 'wallet', label: 'Portefeuille' }
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
  },
  {
    id: 'min_amount',
    label: 'Montant min',
    options: []
  },
  {
    id: 'max_amount',
    label: 'Montant max',
    options: []
  }
]

// Table Columns - Using 'title' as required by DataTableColumn type
const paymentTableColumns: PaymentTableColumn[] = [
  { key: 'transaction_id', title: 'Transaction ID', sortable: true },
  { key: 'amount', title: 'Montant', sortable: true },
  { key: 'status', title: 'Statut', sortable: true },
  { key: 'payment_method', title: 'Méthode', sortable: true },
  { key: 'customer', title: 'Client', sortable: false },
  { key: 'merchant', title: 'Commerçant', sortable: false },
  { key: 'created_at', title: 'Date', sortable: true },
  { key: 'actions', title: '', sortable: false }
]

// Methods
const fetchPayments = async () => {
  loading.value = true
  try {
    const queryParams = new URLSearchParams()

    // Add all non-empty filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value && value !== '') {
        queryParams.append(key, String(value))
      }
    })

    const response = await apiService.get<{
      success: boolean
      data: Payment[]
      summary: Summary
      pagination: Pagination
    }>(`/admin/payments?${queryParams.toString()}`)

    if (response.success) {
      payments.value = response.data
      summary.value = response.summary
      pagination.value = response.pagination
    }
  } catch (error: any) {
    console.error('Error fetching payments:', error)
    addNotification({
      type: 'error',
      title: 'Erreur',
      message: error.response?.data?.message || 'Impossible de charger les paiements'
    })
  } finally {
    loading.value = false
  }
}

const handleFiltersUpdate = (updatedFilters: Record<string, any>) => {
  Object.assign(filters, updatedFilters)
}

const applyFilters = () => {
  filters.page = 1 // Reset to first page when applying filters
  fetchPayments()
}

const resetFilters = () => {
  Object.assign(filters, {
    status: '',
    payment_method: '',
    start_date: '',
    end_date: '',
    merchant_id: '',
    min_amount: '',
    max_amount: '',
    search: '',
    page: 1,
    per_page: 20
  })
  fetchPayments()
}

const refreshData = () => {
  fetchPayments()
}

const handlePageChange = (page: number) => {
  filters.page = page
  fetchPayments()
}

const viewPaymentDetails = (payment: Record<string, unknown>) => {
  console.log('View payment details:', payment)
  // TODO: Open modal or navigate to details page
  addNotification({
    type: 'info',
    title: 'Détails du paiement',
    message: `Transaction: ${(payment as unknown as Payment).transaction_id}`
  })
}

// Helper Functions
const formatNumber = (value: number): string => {
  return new Intl.NumberFormat('fr-FR').format(value || 0)
}

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'XOF',
    minimumFractionDigits: 0
  }).format(value || 0)
}

const formatDate = (dateString: string): string => {
  if (!dateString) return '—'
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('fr-FR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date)
}

type BadgeVariant = 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info' | 'outline' | 'promo' | 'soft'

const getStatusVariant = (status: string): BadgeVariant => {
  const variants: Record<string, BadgeVariant> = {
    success: 'success',
    pending: 'warning',
    failed: 'error',
    on_site: 'info',
    refunded: 'secondary'
  }
  return variants[status] || 'secondary'
}

const getStatusLabel = (status: string): string => {
  const labels: Record<string, string> = {
    success: 'Réussi',
    pending: 'En attente',
    failed: 'Échoué',
    on_site: 'Sur place',
    refunded: 'Remboursé'
  }
  return labels[status] || status
}

const getPaymentMethodLabel = (method: string): string => {
  const labels: Record<string, string> = {
    flooz: 'Flooz',
    tmoney: 'Tmoney',
    orange_money: 'Orange Money',
    mtn_momo: 'MTN MoMo',
    paystack: 'Paystack',
    on_site: 'Sur place',
    wallet: 'Portefeuille'
  }
  return labels[method] || method
}

const addNotification = (notification: Omit<Notification, 'id'>) => {
  const id = `notif-${Date.now()}-${Math.random()}`
  notifications.value.push({ ...notification, id })

  // Auto-remove after 5 seconds
  setTimeout(() => {
    removeNotification(id)
  }, 5000)
}

const removeNotification = (id: string) => {
  const index = notifications.value.findIndex(n => n.id === id)
  if (index !== -1) {
    notifications.value.splice(index, 1)
  }
}

// Lifecycle
onMounted(() => {
  fetchPayments()
})
</script>
