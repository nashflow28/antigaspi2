<template>
  <div class="bg-white rounded-lg shadow">
    <div class="p-6 border-b border-neutral-200">
      <div class="flex items-center justify-between">
        <h3 class="text-responsive-lg font-semibold text-neutral-900">Historique des transactions</h3>
        <button
          :disabled="loading"
          class="p-2 text-neutral-400 hover:text-neutral-600 disabled:opacity-50"
          @click="refreshTransactions"
        >
          <svg
            class="w-5 h-5"
            :class="{'animate-spin': loading}"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
        </button>
      </div>

      <!-- Filtres -->
      <div class="mt-4 flex flex-wrap gap-4">
        <select
          v-model="filters.type"
          class="px-3 py-2 border border-neutral-300 rounded-lg text-responsive-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
          @change="applyFilters"
        >
          <option value="">Tous les types</option>
          <option value="credit">Crédits</option>
          <option value="debit">Débits</option>
        </select>

        <input
          v-model="filters.date_from"
          type="date"
          class="px-3 py-2 border border-neutral-300 rounded-lg text-responsive-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
          @change="applyFilters"
        >

        <input
          v-model="filters.date_to"
          type="date"
          class="px-3 py-2 border border-neutral-300 rounded-lg text-responsive-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
          @change="applyFilters"
        >

        <button
          class="px-3 py-2 text-responsive-sm text-neutral-600 hover:text-neutral-800"
          @click="clearFilters"
        >
          Effacer filtres
        </button>
      </div>
    </div>

    <div class="divide-y divide-neutral-200">
      <div v-if="loading && !transactions.length" class="p-6">
        <div class="animate-pulse space-y-4">
          <div v-for="i in 3" :key="i" class="flex items-center space-x-4">
            <div class="w-10 h-10 bg-neutral-200 rounded-full" />
            <div class="flex-1 space-y-2">
              <div class="h-4 bg-neutral-200 rounded w-3/4" />
              <div class="h-3 bg-neutral-200 rounded w-1/2" />
            </div>
            <div class="h-4 bg-neutral-200 rounded w-20" />
          </div>
        </div>
      </div>

      <div v-else-if="!transactions.length" class="p-6 text-center">
        <div class="text-neutral-500">
          <svg
            class="w-12 h-12 mx-auto mb-4 text-neutral-300"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            />
          </svg>
          <p class="text-responsive-sm">Aucune transaction trouvée</p>
        </div>
      </div>

      <div
        v-for="transaction in transactions"
        :key="transaction.id"
        class="p-4 hover:bg-neutral-50 transition-colors"
      >
        <div class="flex items-center space-x-4">
          <div
            class="w-10 h-10 rounded-full flex items-center justify-center"
            :class="getTransactionIconClass(transaction.type)"
          >
            <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path
                v-if="transaction.type === 'credit'"
                fill-rule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z"
                clip-rule="evenodd"
              />
              <path
                v-else
                fill-rule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v3.586L7.707 9.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 10.586V7z"
                clip-rule="evenodd"
              />
            </svg>
          </div>

          <div class="flex-1 min-w-0">
            <div class="flex items-center justify-between">
              <p class="text-responsive-sm font-medium text-neutral-900 truncate">
                {{ transaction.description }}
              </p>
              <div class="text-right">
                <p
                  class="text-responsive-sm font-semibold"
                  :class="getAmountClass(transaction.type)"
                >
                  {{ transaction.formatted_amount }}
                </p>
              </div>
            </div>
            <div class="flex items-center justify-between mt-1">
              <p class="text-responsive-xs text-neutral-500">
                {{ formatDate(transaction.created_at) }}
              </p>
              <p class="text-responsive-xs text-neutral-400">
                #{{ transaction.reference }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Pagination -->
      <div v-if="pagination && pagination.last_page > 1" class="p-4 border-t border-neutral-200">
        <div class="flex items-center justify-between">
          <div class="text-responsive-sm text-neutral-700">
            Affichage de {{ pagination.from }} à {{ pagination.to }} sur {{ pagination.total }} transactions
          </div>
          <div class="flex space-x-2">
            <button
              :disabled="pagination.current_page === 1"
              class="px-3 py-1 text-responsive-sm border border-neutral-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-neutral-50"
              @click="changePage(pagination.current_page - 1)"
            >
              Précédent
            </button>
            <button
              :disabled="pagination.current_page === pagination.last_page"
              class="px-3 py-1 text-responsive-sm border border-neutral-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-neutral-50"
              @click="changePage(pagination.current_page + 1)"
            >
              Suivant
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

interface Transaction {
  id: number
  type: 'credit' | 'debit'
  amount: number
  formatted_amount: string
  description: string
  reference: string
  created_at: string
}

interface Pagination {
  current_page: number
  last_page: number
  per_page: number
  total: number
  from: number
  to: number
}

interface Props {
  initialTransactions?: Transaction[]
  initialPagination?: Pagination
}

const props = withDefaults(defineProps<Props>(), {
  initialTransactions: () => [],
  initialPagination: undefined
})

const emit = defineEmits<{
  loadTransactions: [filters: any, page?: number]
}>()

const transactions = ref<Transaction[]>(props.initialTransactions)
const pagination = ref<Pagination | null>(props.initialPagination || null)
const loading = ref(false)

const filters = ref({
  type: '',
  date_from: '',
  date_to: '',
  per_page: 15
})

const getTransactionIconClass = (type: string) => {
  return type === 'credit'
    ? 'bg-green-100 text-green-600'
    : 'bg-red-100 text-red-600'
}

const getAmountClass = (type: string) => {
  return type === 'credit'
    ? 'text-green-600'
    : 'text-red-600'
}

const formatDate = (dateString: string): string => {
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date)
}

const refreshTransactions = () => {
  applyFilters()
}

const applyFilters = () => {
  loading.value = true
  const activeFilters = Object.fromEntries(
    Object.entries(filters.value).filter(([_, v]) => v !== '')
  )
  emit('loadTransactions', activeFilters, 1)
}

const clearFilters = () => {
  filters.value = {
    type: '',
    date_from: '',
    date_to: '',
    per_page: 15
  }
  applyFilters()
}

const changePage = (page: number) => {
  if (page < 1 || (pagination.value && page > pagination.value.last_page)) return

  loading.value = true
  const activeFilters = Object.fromEntries(
    Object.entries(filters.value).filter(([_, v]) => v !== '')
  )
  emit('loadTransactions', activeFilters, page)
}

const updateTransactions = (newTransactions: Transaction[], newPagination?: Pagination) => {
  transactions.value = newTransactions
  pagination.value = newPagination || null
  loading.value = false
}

const setLoading = (isLoading: boolean) => {
  loading.value = isLoading
}

defineExpose({
  updateTransactions,
  setLoading
})

onMounted(() => {
  if (!props.initialTransactions.length) {
    applyFilters()
  }
})
</script>
