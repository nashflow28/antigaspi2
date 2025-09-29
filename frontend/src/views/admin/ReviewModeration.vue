<template>
  <DashboardLayout
    :sidebar="sidebar"
    :header="header"
    class="bg-gradient-to-br from-purple-50 to-indigo-50"
  >
    <div class="p-6">
      <!-- Header -->
      <div class="mt-4 sm:mb-3xl">
        <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 sm:gap-6">
          <div>
            <h1 class="text-xl lg:text-3xl font-semibold text-gray-900 mt-2">
              Modération des Avis
            </h1>
            <p class="text-gray-700 text-lg">
              Gérez les avis en attente et les signalements
            </p>
          </div>

          <div class="flex flex-col sm:flex-row gap-3">
            <Button
              variant="outline"
              :disabled="loading"
              @click="refreshData"
            >
              <RefreshCw class="h-4 w-4 mr-2" :class="{ 'animate-spin': loading }" />
              Actualiser
            </Button>
          </div>
        </div>
      </div>

      <!-- Statistics Cards -->
      <div v-if="stats" class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mt-4 sm:mb-3xl">
        <Card class="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-orange-100 text-sm font-medium">Avis en attente</p>
              <p class="text-xl font-semibold">{{ stats.pending_reviews }}</p>
              <p class="text-orange-200 text-sm mt-1">
                À modérer
              </p>
            </div>
            <div class="p-3 bg-white/20 rounded">
              <Clock class="h-6 w-6" />
            </div>
          </div>
        </Card>

        <Card class="bg-gradient-to-r from-red-500 to-red-600 text-white">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-red-100 text-sm font-medium">Signalements</p>
              <p class="text-xl font-semibold">{{ stats.pending_reports }}</p>
              <p class="text-red-200 text-sm mt-1">
                En attente
              </p>
            </div>
            <div class="p-3 bg-white/20 rounded">
              <AlertTriangle class="h-6 w-6" />
            </div>
          </div>
        </Card>

        <Card class="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-secondary-100 text-sm font-medium">Avis aujourd'hui</p>
              <p class="text-xl font-semibold">{{ stats.reviews_today }}</p>
              <p class="text-secondary-200 text-sm mt-1">
                Nouveaux avis
              </p>
            </div>
            <div class="p-3 bg-white/20 rounded">
              <MessageSquare class="h-6 w-6" />
            </div>
          </div>
        </Card>

        <Card class="bg-gradient-to-r from-green-500 to-green-600 text-white">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-blue-100 text-sm font-medium">Traités</p>
              <p class="text-xl font-semibold">{{ stats.resolved_reports }}</p>
              <p class="text-blue-200 text-sm mt-1">
                Signalements résolus
              </p>
            </div>
            <div class="p-3 bg-white/20 rounded">
              <CheckCircle class="h-6 w-6" />
            </div>
          </div>
        </Card>
      </div>

      <!-- Tabs Navigation -->
      <div class="mt-4 sm:mb-3xl">
        <div class="border-b border-gray-200">
          <nav class="-mb-px flex space-y-8 sm:space-x-8">
            <button
              :class="[
                'py-3 px-1 border-b-2 font-medium text-sm',
                activeTab === 'pending'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-300'
              ]"
              @click="activeTab = 'pending'"
            >
              Avis en attente
              <span v-if="stats?.pending_reviews" class="ml-2 px-3 py-3 text-xs bg-yellow-100 text-yellow-800 rounded-full">
                {{ stats.pending_reviews }}
              </span>
            </button>
            <button
              :class="[
                'py-3 px-1 border-b-2 font-medium text-sm',
                activeTab === 'reported'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-300'
              ]"
              @click="activeTab = 'reported'"
            >
              Avis signalés
              <span v-if="stats?.pending_reports" class="ml-2 px-3 py-3 text-xs bg-red-100 text-red-800 rounded-full">
                {{ stats.pending_reports }}
              </span>
            </button>
          </nav>
        </div>
      </div>

      <!-- Content based on active tab -->
      <div v-if="activeTab === 'pending'">
        <PendingReviewsList
          @review-approved="onReviewApproved"
          @review-rejected="onReviewRejected"
        />
      </div>

      <div v-if="activeTab === 'reported'">
        <ReportedReviewsList
          @report-resolved="onReportResolved"
        />
      </div>
    </div>
  </DashboardLayout>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import PendingReviewsList from '@/components/admin/PendingReviewsList.vue'
import ReportedReviewsList from '@/components/admin/ReportedReviewsList.vue'
import DashboardLayout from '@/components/ui/DashboardLayout.vue'
import Button from '@/components/ui/2025/Button.vue'
import Card from '@/components/ui/2025/Card.vue'
import { useDashboardLayout } from '@/composables/useDashboardLayout'
import { notify } from '@/composables/useNotifications'
import apiService from '@/services/api'
import type { ApiResponse } from '@/types'
import {
  RefreshCw,
  Clock,
  AlertTriangle,
  MessageSquare,
  CheckCircle
} from 'lucide-vue-next'

interface ModerationStats {
  pending_reviews: number
  pending_reports: number
  total_reports: number
  resolved_reports: number
  reviews_today: number
  reports_today: number
  report_reasons: Record<string, number>
}

const authStore = useAuthStore()
const { sidebar, header } = useDashboardLayout('admin')
const stats = ref<ModerationStats | null>(null)
const loading = ref(false)
const error = ref<string | null>(null)
const activeTab = ref<'pending' | 'reported'>('pending')

const loadStats = async () => {
  loading.value = true
  error.value = null

  try {
    const response = await apiService.get<ApiResponse<{ stats: ModerationStats }>>('/admin/reviews/stats')

    if (response.success) {
      stats.value = response.data.stats
    } else {
      const message = response.message || 'Erreur lors du chargement des statistiques de modération'
      error.value = message
      notify.error(message, 'Modération des avis')
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur lors du chargement des statistiques de modération'
    error.value = message
    notify.error(message, 'Modération des avis')
  } finally {
    loading.value = false
  }
}

const refreshData = () => {
  loadStats()
}

const onReviewApproved = () => {
  // Refresh stats when a review is approved
  if (stats.value) {
    stats.value.pending_reviews = Math.max(0, stats.value.pending_reviews - 1)
  }

  loadStats()
}

const onReviewRejected = () => {
  // Refresh stats when a review is rejected
  if (stats.value) {
    stats.value.pending_reviews = Math.max(0, stats.value.pending_reviews - 1)
  }

  loadStats()
}

const onReportResolved = () => {
  // Refresh stats when a report is resolved
  if (stats.value) {
    stats.value.pending_reports = Math.max(0, stats.value.pending_reports - 1)
    stats.value.resolved_reports = stats.value.resolved_reports + 1
  }

  loadStats()
}

onMounted(() => {
  // Check if user is admin
  if (authStore.user?.role !== 'admin') {
    error.value = 'Accès réservé aux administrateurs'
    return
  }

  loadStats()
})
</script>
