<template>
  <div class="space-y-6">
    <!-- Filters -->
    <div class="bg-white rounded-2xl shadow-lg border border-neutral-100 p-6">
      <h3 class="text-responsive-lg font-semibold text-neutral-900 mb-4">Filtres</h3>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label class="block text-responsive-sm font-medium text-neutral-700 mb-2">Statut</label>
          <select
            v-model="filters.status"
            class="w-full border border-neutral-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            @change="() => loadReports()"
          >
            <option value="">Tous les statuts</option>
            <option value="pending">En attente</option>
            <option value="reviewed">Examiné</option>
            <option value="resolved">Résolu</option>
            <option value="dismissed">Rejeté</option>
          </select>
        </div>

        <div>
          <label class="block text-responsive-sm font-medium text-neutral-700 mb-2">Raison</label>
          <select
            v-model="filters.reason"
            class="w-full border border-neutral-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            @change="() => loadReports()"
          >
            <option value="">Toutes les raisons</option>
            <option value="inappropriate_content">Contenu inapproprié</option>
            <option value="spam">Spam</option>
            <option value="fake_review">Faux avis</option>
            <option value="offensive_language">Langage offensant</option>
            <option value="harassment">Harcèlement</option>
            <option value="copyright_violation">Violation de droits d'auteur</option>
            <option value="other">Autre</option>
          </select>
        </div>

        <div class="flex items-end">
          <button
            class="w-full px-4 py-3 text-responsive-sm text-neutral-600 border border-neutral-300 rounded-lg hover:transition-colors"
            @click="resetFilters"
          >
            Réinitialiser
          </button>
        </div>
      </div>
    </div>

    <!-- Reports List -->
    <div class="bg-white rounded-2xl shadow-lg border border-neutral-100">
      <div class="px-6 py-4 border-b border-neutral-200">
        <div class="flex items-center justify-between">
          <h3 class="text-responsive-xl font-semibold text-neutral-900">
            Avis signalés
            <span v-if="pagination" class="text-neutral-500 font-normal">
              ({{ pagination.total }} au total)
            </span>
          </h3>
          <button
            class="inline-flex items-center px-4 py-3 text-responsive-sm text-primary-600 hover:transition-colors"
            :disabled="loading"
            @click="() => loadReports()"
          >
            <RefreshCw class="w-5 h-5 mr-1" :class="{ 'animate-spin': loading }" />
            Actualiser
          </button>
        </div>
      </div>

      <div class="divide-y divide-neutral-200">
        <!-- Loading State -->
        <div v-if="loading" class="px-6 py-8 text-center">
          <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600 mx-auto" />
          <p class="text-neutral-500 mt-2">Chargement des signalements...</p>
        </div>

        <!-- Empty State -->
        <div v-else-if="reports.length === 0" class="px-6 py-8 text-center">
          <CheckCircle class="w-12 h-12 text-green-400 mx-auto mb-4" />
          <h4 class="text-responsive-lg font-medium text-neutral-900 mb-2">Aucun signalement</h4>
          <p class="text-neutral-600">
            {{ hasActiveFilters ? 'Aucun signalement ne correspond à vos critères' : 'Aucun avis signalé pour le moment' }}
          </p>
        </div>

        <!-- Reports -->
        <div
          v-for="report in reports"
          v-else
          :key="report.id"
          class="px-6 py-6 hover:transition-colors"
        >
          <div class="space-y-4">
            <!-- Report Header -->
            <div class="flex items-start justify-between">
              <div class="flex items-center space-x-3">
                <div class="flex-shrink-0">
                  <AlertTriangle class="w-10 h-10 text-red-500" />
                </div>
                <div>
                  <div class="flex items-center space-x-2">
                    <span
                      class="inline-flex items-center px-4 py-3 rounded text-responsive-xs font-medium"
                      :class="getReasonClass(report.reason)"
                    >
                      {{ report.reason_label }}
                    </span>
                    <span
                      class="inline-flex items-center px-4 py-3 rounded text-responsive-xs font-medium"
                      :class="getStatusClass(report.status)"
                    >
                      {{ report.status_label }}
                    </span>
                  </div>
                  <p class="text-responsive-sm text-neutral-600 mt-1">
                    Signalé par {{ report.reporter.name }} • {{ report.time_ago }}
                  </p>
                </div>
              </div>
              <div class="text-right text-responsive-sm text-neutral-500">
                ID: {{ report.id }}
              </div>
            </div>

            <!-- Report Description -->
            <div v-if="report.description" class="bg-red-50 border border-red-200 rounded-lg p-3">
              <p class="text-responsive-sm text-red-800">
                <strong>Description du signalement :</strong><br>
                {{ report.description }}
              </p>
            </div>

            <!-- Original Review -->
            <div class="bg-neutral-50 border border-neutral-200 rounded-lg p-4">
              <div class="flex items-start space-x-3">
                <div class="flex-shrink-0">
                  <div class="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                    <span class="text-white text-responsive-sm font-medium">
                      {{ getInitials(report.review.user.name) }}
                    </span>
                  </div>
                </div>
                <div class="flex-1">
                  <div class="flex items-center space-x-2 mb-2">
                    <span class="font-medium text-neutral-900">{{ report.review.user.name }}</span>
                    <div class="flex items-center">
                      <Star
                        v-for="star in 5"
                        :key="star"
                        class="w-5 h-5"
                        :class="star <= report.review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-neutral-300'"
                      />
                    </div>
                    <span v-if="report.review.is_verified_purchase" class="inline-flex items-center px-4 py-0.5 rounded text-responsive-xs font-medium bg-green-100 text-green-800">
                      Achat vérifié
                    </span>
                  </div>

                  <div v-if="report.review.title" class="mb-2">
                    <h4 class="font-medium text-neutral-900">{{ report.review.title }}</h4>
                  </div>

                  <div v-if="report.review.comment" class="text-neutral-700 text-responsive-sm mb-2">
                    {{ report.review.comment }}
                  </div>

                  <div class="flex items-center space-x-2 text-responsive-xs text-neutral-500">
                    <span>{{ report.review.merchant.business_name }}</span>
                    <span v-if="report.review.product">• {{ report.review.product.name }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Admin Notes -->
            <div v-if="report.admin_notes" class="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p class="text-responsive-sm text-blue-800">
                <strong>Notes administrateur :</strong><br>
                {{ report.admin_notes }}
              </p>
              <p v-if="report.reviewer" class="text-responsive-xs text-blue-600 mt-1">
                Par {{ report.reviewer.name }} • {{ formatDate(report.reviewed_at) }}
              </p>
            </div>

            <!-- Admin Actions -->
            <div v-if="report.status === 'pending'" class="flex items-center space-x-3">
              <button
                :disabled="processing === report.id"
                class="inline-flex items-center px-4 py-3 text-responsive-sm bg-neutral-600 text-white rounded-lg hover:transition-colors"
                @click="resolveReport(report.id, 'dismiss')"
              >
                <X class="w-5 h-5 mr-2" />
                Rejeter
              </button>

              <button
                :disabled="processing === report.id"
                class="inline-flex items-center px-4 py-3 text-responsive-sm bg-red-600 text-white rounded-lg hover:transition-colors"
                @click="resolveReport(report.id, 'remove_review')"
              >
                <Trash2 class="w-5 h-5 mr-2" />
                Supprimer l'avis
              </button>

              <button
                :disabled="processing === report.id"
                class="inline-flex items-center px-4 py-3 text-responsive-sm bg-orange-600 text-white rounded-lg hover:transition-colors"
                @click="resolveReport(report.id, 'warn_user')"
              >
                <AlertTriangle class="w-5 h-5 mr-2" />
                Avertir
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Pagination -->
      <div v-if="pagination && pagination.last_page > 1" class="px-6 py-4 border-t border-neutral-200">
        <div class="flex items-center justify-between">
          <div class="text-responsive-sm text-neutral-500">
            Page {{ pagination.current_page }} sur {{ pagination.last_page }}
            ({{ pagination.total }} signalements au total)
          </div>
          <div class="flex space-x-2">
            <button
              :disabled="pagination.current_page <= 1"
              class="px-4 py-3 text-responsive-sm border border-neutral-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-neutral-50"
              @click="loadPage(pagination.current_page - 1)"
            >
              Précédent
            </button>
            <button
              :disabled="pagination.current_page >= pagination.last_page"
              class="px-4 py-3 text-responsive-sm border border-neutral-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-neutral-50"
              @click="loadPage(pagination.current_page + 1)"
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
import { ref, onMounted, computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { notify } from '@/composables/useNotifications'
import {
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  Star,
  X,
  Trash2
} from 'lucide-vue-next'

interface Report {
  id: number
  reason: string
  reason_label: string
  description: string
  status: string
  status_label: string
  admin_notes: string
  time_ago: string
  review: {
    id: number
    rating: number
    title: string
    comment: string
    is_verified_purchase: boolean
    user: {
      id: number
      name: string
    }
    merchant: {
      id: number
      business_name: string
    }
    product?: {
      id: number
      name: string
    }
  }
  reporter: {
    id: number
    name: string
    email: string
  }
  reviewer?: {
    id: number
    name: string
  }
  created_at: string
  reviewed_at?: string
}

interface Pagination {
  current_page: number
  last_page: number
  per_page: number
  total: number
}

const emit = defineEmits<{
  reportResolved: []
}>()

const authStore = useAuthStore()
const reports = ref<Report[]>([])
const pagination = ref<Pagination | null>(null)
const loading = ref(false)
const processing = ref<number | null>(null)
const error = ref<string | null>(null)

const filters = ref({
  status: '',
  reason: ''
})

const hasActiveFilters = computed(() => {
  return filters.value.status || filters.value.reason
})

const getInitials = (name: string) => {
  return name.split(' ').map(part => part[0]).join('').toUpperCase().slice(0, 2)
}

const formatDate = (dateString?: string) => {
  if (!dateString) return ''
  return new Date(dateString).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const getReasonClass = (reason: string) => {
  const classes = {
    'inappropriate_content': 'bg-red-100 text-red-800',
    'spam': 'bg-orange-100 text-orange-800',
    'fake_review': 'bg-purple-100 text-purple-800',
    'offensive_language': 'bg-red-100 text-red-800',
    'harassment': 'bg-red-100 text-red-800',
    'copyright_violation': 'bg-blue-100 text-blue-800',
    'other': 'bg-gray-100 text-gray-800'
  }
  return classes[reason as keyof typeof classes] || 'bg-gray-100 text-gray-800'
}

const getStatusClass = (status: string) => {
  const classes = {
    'pending': 'bg-yellow-100 text-yellow-800',
    'reviewed': 'bg-blue-100 text-blue-800',
    'resolved': 'bg-green-100 text-green-800',
    'dismissed': 'bg-gray-100 text-gray-800'
  }
  return classes[status as keyof typeof classes] || 'bg-gray-100 text-gray-800'
}

const loadReports = async (page: number = 1) => {
  loading.value = true
  error.value = null

  try {
    const params = new URLSearchParams({
      page: page.toString(),
      per_page: '10'
    })

    if (filters.value.status) params.append('status', filters.value.status)
    if (filters.value.reason) params.append('reason', filters.value.reason)

    const response = await fetch(`http://localhost:8000/api/admin/reviews/reported?${params}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authStore.token}`
      }
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    if (data.success) {
      reports.value = data.data
      pagination.value = data.pagination
    } else {
      throw new Error(data.message || 'Erreur lors du chargement')
    }
  } catch (err) {
    console.error('Error loading reported reviews:', err)
    error.value = err instanceof Error ? err.message : 'Erreur inconnue'
  } finally {
    loading.value = false
  }
}

const loadPage = (page: number) => {
  if (page >= 1 && page <= (pagination.value?.last_page || 1)) {
    loadReports(page)
  }
}

const resetFilters = () => {
  filters.value.status = ''
  filters.value.reason = ''
  loadReports()
}

const resolveReport = async (reportId: number, action: 'dismiss' | 'remove_review' | 'warn_user') => {
  const actionLabels = {
    'dismiss': 'rejeter ce signalement',
    'remove_review': 'supprimer l\'avis signalé',
    'warn_user': 'avertir l\'utilisateur'
  }

  if (!confirm(`Êtes-vous sûr de vouloir ${actionLabels[action]} ?`)) {
    return
  }

  processing.value = reportId

  try {
    const response = await fetch(`http://localhost:8000/api/admin/reviews/reports/${reportId}/resolve`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authStore.token}`
      },
      body: JSON.stringify({
        action,
        notes: `Action: ${actionLabels[action]} par l'administrateur`
      })
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    if (data.success) {
      // Update the report in the list
      const reportIndex = reports.value.findIndex(r => r.id === reportId)
      if (reportIndex !== -1) {
        reports.value[reportIndex].status = data.data.status
        reports.value[reportIndex].admin_notes = data.data.admin_notes
        reports.value[reportIndex].reviewed_at = data.data.reviewed_at
      }

      emit('reportResolved')
    } else {
      throw new Error(data.message || 'Erreur lors de la résolution')
    }
  } catch (err) {
    console.error('Error resolving report:', err)
    notify.error(err instanceof Error ? err.message : 'Erreur inconnue')
  } finally {
    processing.value = null
  }
}

onMounted(() => {
  loadReports()
})
</script>
