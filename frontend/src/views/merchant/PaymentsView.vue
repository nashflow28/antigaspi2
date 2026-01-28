<template>
  <DashboardLayout
    :sidebar="sidebar"
    :header="header"
    :mobile-nav="mobileNav"
    class="bg-gradient-to-br from-neutral-50 via-primary-50/40 to-emerald-50/30"
  >
    <div class="space-y-6 px-4 py-6 lg:px-8">
      <section class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div class="space-y-2">
          <h1 class="text-2xl font-semibold text-neutral-900 lg:text-3xl">
            Suivi des paiements
          </h1>
          <p class="text-base text-neutral-600 lg:text-lg">
            Visualisez vos encaissements, filtrez les statuts et exportez vos transactions en un clic.
          </p>
        </div>

        <div class="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Input
            v-model="filters.search"
            :left-icon="Search"
            placeholder="Référence, client, téléphone..."
            class="w-full sm:w-72"
            clearable
          />

          <Button
            variant="outline"
            class="flex items-center gap-2"
            :disabled="!payments.length || exporting"
            @click="exportPayments"
          >
            <component
              :is="exporting ? RefreshCw : Download"
              class="h-4 w-4"
              :class="exporting ? 'animate-spin' : ''"
            />
            Exporter
          </Button>
        </div>
      </section>

      <StatCardGrid>
        <StatCard
          v-for="card in summaryCards"
          :key="card.title"
          :title="card.title"
          :value="card.value"
          :description="card.description"
          :icon="card.icon"
          :accent="card.accent"
        />
      </StatCardGrid>

      <Card class="space-y-4 p-4">
        <header class="flex flex-wrap items-center justify-between gap-3">
          <div class="flex items-center gap-2 text-sm font-medium text-neutral-600">
            <Filter class="h-4 w-4" />
            <span>Affiner l'analyse</span>
            <Badge v-if="activeFiltersCount" variant="info" size="sm">
              {{ activeFiltersCount }} filtre(s)
            </Badge>
          </div>

          <Button
            variant="ghost"
            size="sm"
            class="flex items-center gap-2 text-sm text-neutral-600 hover:text-neutral-900"
            :disabled="activeFiltersCount === 0"
            @click="resetFilters"
          >
            <RefreshCcw class="h-4 w-4" />
            Réinitialiser
          </Button>
        </header>

        <div class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div class="space-y-2">
            <label class="text-sm font-medium text-neutral-700">Statut</label>
            <Select v-model="filters.status" size="sm">
              <option value="all">Tous les statuts</option>
              <option value="success">Réussi</option>
              <option value="pending">En attente</option>
              <option value="on_site">À payer sur place</option>
              <option value="failed">Échoué</option>
              <option value="refunded">Remboursé</option>
            </Select>
          </div>

          <div class="space-y-2">
            <label class="text-sm font-medium text-neutral-700">Méthode</label>
            <Select v-model="filters.method" size="sm">
              <option value="all">Toutes les méthodes</option>
              <option value="wallet">Portefeuille GÊLADAL</option>
              <option value="flooz">Flooz</option>
              <option value="tmoney">Mixx by Yas (Tmoney)</option>
              <option value="orange_money">Orange Money</option>
              <option value="mtn_momo">MTN MoMo</option>
              <option value="paystack">Paystack</option>
              <option value="on_site">Paiement sur place</option>
            </Select>
          </div>

          <div class="space-y-2">
            <label class="text-sm font-medium text-neutral-700">Du</label>
            <div class="relative">
              <Input
                v-model="filters.date_from"
                type="date"
                class="w-full"
              />
              <CalendarRange class="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
            </div>
          </div>

          <div class="space-y-2">
            <label class="text-sm font-medium text-neutral-700">Au</label>
            <div class="relative">
              <Input
                v-model="filters.date_to"
                type="date"
                class="w-full"
              />
              <CalendarRange class="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
            </div>
          </div>

          <div class="space-y-2">
            <label class="text-sm font-medium text-neutral-700">Montant min.</label>
            <Input
              v-model="filters.min_amount"
              type="number"
              min="0"
              placeholder="Ex: 2000"
              class="w-full"
            />
          </div>

          <div class="space-y-2">
            <label class="text-sm font-medium text-neutral-700">Montant max.</label>
            <Input
              v-model="filters.max_amount"
              type="number"
              min="0"
              placeholder="Ex: 20000"
              class="w-full"
            />
          </div>
        </div>
      </Card>

      <div
        v-if="error"
        class="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
      >
        {{ error }}
      </div>

      <DataTableCard
        :columns="tableColumns"
        :rows="tableRows"
        :loading="loading"
        loading-text="Analyse des paiements en cours..."
        empty-title="Aucun paiement ne correspond à vos filtres"
        empty-description="Ajustez votre recherche ou revenez plus tard pour consulter de nouveaux paiements."
      >
        <template #cell-reference="{ row }">
          <div class="space-y-1">
            <p class="font-medium text-neutral-900">{{ row.reference }}</p>
            <p class="text-xs text-neutral-500">
              Réservation {{ row.reservationCode }}
            </p>
          </div>
        </template>

        <template #cell-customer="{ row }">
          <div class="space-y-1">
            <p class="font-medium text-neutral-900">
              {{ row.customer.name }}
            </p>
            <p v-if="row.customer.phone" class="text-xs text-neutral-500">
              {{ row.customer.phone }}
            </p>
          </div>
        </template>

        <template #cell-product="{ row }">
          <p class="text-sm text-neutral-700">
            {{ row.product }}
          </p>
        </template>

        <template #cell-amount="{ row }">
          <div class="flex flex-col items-end">
            <span class="font-semibold text-neutral-900">
              {{ formatAmountDisplay(row.amount, row.currency) }}
            </span>
            <span class="text-xs text-neutral-400">
              {{ statusLabels[row.status] ?? row.status }}
            </span>
          </div>
        </template>

        <template #cell-status="{ row }">
          <Badge :variant="statusBadgeVariant(row.status)" size="sm">
            {{ statusLabels[row.status] ?? row.status }}
          </Badge>
        </template>

        <template #cell-method="{ row }">
          <Badge variant="secondary" size="sm">
            {{ methodLabels[row.method] ?? row.method }}
          </Badge>
        </template>

        <template #cell-created_at="{ row }">
          <span class="text-sm text-neutral-600">
            {{ formatDateTime(row.created_at) }}
          </span>
        </template>

        <template #cell-paid_at="{ row }">
          <span class="text-sm text-neutral-600">
            {{ row.paid_at ? formatDateTime(row.paid_at) : '—' }}
          </span>
        </template>

        <template #footer>
          <Pagination
            v-if="pagination.total > 0"
            :current-page="pagination.currentPage"
            :total-pages="pagination.lastPage"
            :total="pagination.total"
            :page-size="pagination.perPage"
            show-page-size
            @page-change="handlePageChange"
            @page-size-change="handlePageSizeChange"
          />
        </template>
      </DataTableCard>
    </div>
  </DashboardLayout>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useDebounceFn } from '@vueuse/core'
import {
  Download,
  RefreshCcw,
  RefreshCw,
  Search,
  Filter,
  CalendarRange,
  Wallet,
  BadgeCheck,
  Clock3,
  ClipboardList
} from 'lucide-vue-next'

import DashboardLayout from '@/components/ui/2025/DashboardLayout.vue'
import { useDashboardLayout } from '@/composables/useDashboardLayout'
import { DataTableCard, StatCard, StatCardGrid } from '@/components/dashboard/2025'
import { Badge, Button, Card, Input, Pagination, Select } from '@/components/ui/2025'
import { apiService } from '@/services/api'
import { formatPrice } from '@/utils/currency'
import type {
  MerchantPaymentsResponse,
  PaymentSummaryMeta,
  PaymentWithRelations
} from '@/types'

const { sidebar, header, mobileNav } = useDashboardLayout('merchant')

const payments = ref<PaymentWithRelations[]>([])
const summary = ref<PaymentSummaryMeta | null>(null)
const loading = ref(false)
const error = ref<string | null>(null)
const exporting = ref(false)

const pagination = reactive({
  currentPage: 1,
  perPage: 20,
  lastPage: 1,
  total: 0
})

const filters = reactive({
  status: 'all',
  method: 'all',
  date_from: '',
  date_to: '',
  min_amount: '',
  max_amount: '',
  search: ''
})

const statusLabels: Record<string, string> = {
  success: 'Réussi',
  pending: 'En attente',
  failed: 'Échoué',
  on_site: 'À payer sur place',
  refunded: 'Remboursé'
}

const statusBadgeVariant = (status?: string) => {
  const mapping: Record<string, 'success' | 'warning' | 'error' | 'info' | 'secondary'> = {
    success: 'success',
    pending: 'warning',
    failed: 'error',
    on_site: 'info',
    refunded: 'secondary'
  }
  return mapping[status ?? ''] ?? 'secondary'
}

const methodLabels: Record<string, string> = {
  wallet: 'Portefeuille GÊLADAL',
  flooz: 'Flooz',
  tmoney: 'Mixx by Yas (Tmoney)',
  orange_money: 'Orange Money',
  mtn_momo: 'MTN MoMo',
  paystack: 'Paystack',
  on_site: 'Paiement sur place'
}

const tableColumns = [
  { key: 'reference', title: 'Paiement' },
  { key: 'customer', title: 'Client' },
  { key: 'product', title: 'Produit' },
  { key: 'amount', title: 'Montant', align: 'right' as const },
  { key: 'status', title: 'Statut' },
  { key: 'method', title: 'Méthode' },
  { key: 'created_at', title: 'Créé le' },
  { key: 'paid_at', title: 'Payé le' }
]

const tableRows = computed(() => {
  return payments.value.map(payment => {
    const reservation = payment.reservation ?? null
    const consumer = reservation?.consumer ?? null

    return {
      id: payment.id,
      reference: payment.reference ?? `PAY-${payment.id}`,
      reservationCode: reservation?.reservation_code ?? '—',
      customer: {
        name: consumer?.name ?? 'Client inconnu',
        phone: consumer?.phone ?? null
      },
      product: reservation?.product?.name ?? '—',
      amount: payment.amount ?? 0,
      currency: payment.currency,
      status: payment.status,
      method: payment.payment_method,
      created_at: payment.created_at,
      paid_at: payment.paid_at ?? null
    }
  })
})

const formatAmountDisplay = (amount: number, currency?: string | null) => {
  if (!currency || currency.toUpperCase() === 'XOF') {
    return formatPrice(amount)
  }

  try {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: currency.toUpperCase()
    }).format(amount)
  } catch (error) {
    return `${amount.toFixed(2)} ${currency}`
  }
}

const summaryCards = computed(() => {
  const summaryData = summary.value
  const totalAmount = summaryData?.total_amount ?? 0
  const statuses = summaryData?.status_breakdown ?? {}

  const success = statuses['success'] ?? { count: 0, total_amount: 0 }
  const pending = statuses['pending'] ?? { count: 0, total_amount: 0 }
  const onSite = statuses['on_site'] ?? { count: 0, total_amount: 0 }
  const refunded = statuses['refunded'] ?? { count: 0, total_amount: 0 }

  const reconciliationAmount = onSite.total_amount + refunded.total_amount
  const reconciliationCount = onSite.count + refunded.count

  return [
    {
      title: 'Total encaissé',
      value: formatAmountDisplay(totalAmount),
      description: `${summaryData?.total_count ?? 0} transactions`,
      icon: Wallet,
      accent: 'primary' as const
    },
    {
      title: 'Paiements réussis',
      value: formatAmountDisplay(success.total_amount),
      description: `${success.count} paiement(s) confirmés`,
      icon: BadgeCheck,
      accent: 'success' as const
    },
    {
      title: 'En attente',
      value: formatAmountDisplay(pending.total_amount),
      description: `${pending.count} en cours de confirmation`,
      icon: Clock3,
      accent: 'warning' as const
    },
    {
      title: 'À réconcilier',
      value: formatAmountDisplay(reconciliationAmount),
      description: `${reconciliationCount} opération(s) manuelle(s)`,
      icon: ClipboardList,
      accent: 'info' as const
    }
  ]
})

const activeFiltersCount = computed(() => {
  let count = 0
  if (filters.status !== 'all') count += 1
  if (filters.method !== 'all') count += 1
  if (filters.date_from) count += 1
  if (filters.date_to) count += 1
  if (filters.min_amount) count += 1
  if (filters.max_amount) count += 1
  if (filters.search.trim()) count += 1
  return count
})

const formatDateTime = (value?: string | null) => {
  if (!value) {
    return '—'
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return '—'
  }

  return new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(date)
}

const fetchPayments = async (page = pagination.currentPage) => {
  try {
    loading.value = true
    error.value = null

    const params: Record<string, unknown> = {
      page,
      per_page: pagination.perPage
    }

    if (filters.status !== 'all') {
      params.status = filters.status
    }

    if (filters.method !== 'all') {
      params.method = filters.method
    }

    if (filters.date_from) {
      params.date_from = filters.date_from
    }

    if (filters.date_to) {
      params.date_to = filters.date_to
    }

    const minAmount = filters.min_amount.trim()
    if (minAmount) {
      const parsed = Number(minAmount)
      if (!Number.isNaN(parsed)) {
        params.min_amount = parsed
      }
    }

    const maxAmount = filters.max_amount.trim()
    if (maxAmount) {
      const parsed = Number(maxAmount)
      if (!Number.isNaN(parsed)) {
        params.max_amount = parsed
      }
    }

    const search = filters.search.trim()
    if (search) {
      params.search = search
    }

    const response: MerchantPaymentsResponse = await apiService.getMerchantPayments(params)

    payments.value = Array.isArray(response.data) ? response.data : []
    summary.value = response.meta?.summary ?? null

    const paginationData = response.pagination ?? {
      current_page: page,
      last_page: 1,
      per_page: pagination.perPage,
      total: payments.value.length
    }

    pagination.currentPage = paginationData.current_page ?? page
    pagination.lastPage = paginationData.last_page ?? 1
    pagination.perPage = paginationData.per_page ?? pagination.perPage
    pagination.total = paginationData.total ?? payments.value.length
  } catch (err: any) {
    error.value = err?.message || 'Impossible de récupérer les paiements pour le moment.'
  } finally {
    loading.value = false
  }
}

const fetchWithFilters = useDebounceFn(() => {
  pagination.currentPage = 1
  fetchPayments(1)
}, 300)

const debouncedSearch = useDebounceFn(() => {
  pagination.currentPage = 1
  fetchPayments(1)
}, 400)

watch(
  () => [filters.status, filters.method, filters.date_from, filters.date_to, filters.min_amount, filters.max_amount],
  () => fetchWithFilters()
)

watch(
  () => filters.search,
  () => debouncedSearch()
)

const handlePageChange = (page: number) => {
  pagination.currentPage = page
  fetchPayments(page)
}

const handlePageSizeChange = (size: number) => {
  pagination.perPage = size
  pagination.currentPage = 1
  fetchPayments(1)
}

const resetFilters = () => {
  filters.status = 'all'
  filters.method = 'all'
  filters.date_from = ''
  filters.date_to = ''
  filters.min_amount = ''
  filters.max_amount = ''
  filters.search = ''
  fetchPayments(1)
}

const exportPayments = async () => {
  if (!payments.value.length || exporting.value) {
    return
  }

  try {
    exporting.value = true

    const params: Record<string, unknown> = {}

    if (filters.status !== 'all') params.status = filters.status
    if (filters.method !== 'all') params.method = filters.method
    if (filters.date_from) params.date_from = filters.date_from
    if (filters.date_to) params.date_to = filters.date_to

    const minAmount = filters.min_amount.trim()
    if (minAmount) {
      const parsed = Number(minAmount)
      if (!Number.isNaN(parsed)) params.min_amount = parsed
    }

    const maxAmount = filters.max_amount.trim()
    if (maxAmount) {
      const parsed = Number(maxAmount)
      if (!Number.isNaN(parsed)) params.max_amount = parsed
    }

    const search = filters.search.trim()
    if (search) params.search = search

    const blob = await apiService.exportMerchantPayments(params)
    const downloadUrl = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = downloadUrl
    link.download = `paiements-${new Date().toISOString().replace(/[:T]/g, '-').slice(0, 19)}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(downloadUrl)
  } catch (err: any) {
    error.value = err?.message || 'L\'export des paiements a échoué.'
  } finally {
    exporting.value = false
  }
}

onMounted(() => {
  fetchPayments()
})
</script>
