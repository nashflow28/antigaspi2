<template>
  <DashboardLayout
    :sidebar="sidebar"
    :header="header"
    class="bg-gradient-to-br from-purple-50 to-indigo-50"
  >
    <div class="p-6">
    <!-- Header -->
    <div class="mb-8">
      <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        <div>
          <h1 class="text-3xl lg:text-4xl font-bold text-neutral-900 mb-2">
            Modération des Avis
          </h1>
          <p class="text-neutral-600 text-lg">
            Gérez les avis en attente et les signalements
          </p>
        </div>

        <div class="flex flex-col sm:flex-row gap-4">
          <button
            @click="refreshData"
            class="btn btn-outline"
            :disabled="loading"
          >
            <RefreshCw class="w-5 h-5 mr-2" :class="{ 'animate-spin': loading }" />
            Actualiser
          </button>
        </div>
      </div>
    </div>

    <!-- Statistics Cards -->
    <div v-if="stats" class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
      <div class="card bg-gradient-to-r from-orange-500 to-orange-600 text-white">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-orange-100 text-sm font-medium">Avis en attente</p>
            <p class="text-3xl font-bold">{{ stats.pending_reviews }}</p>
            <p class="text-orange-200 text-sm mt-1">
              À modérer
            </p>
          </div>
          <div class="p-3 bg-white/20 rounded-xl">
            <Clock class="w-8 h-8" />
          </div>
        </div>
      </div>

      <div class="card bg-gradient-to-r from-red-500 to-red-600 text-white">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-red-100 text-sm font-medium">Signalements</p>
            <p class="text-3xl font-bold">{{ stats.pending_reports }}</p>
            <p class="text-red-200 text-sm mt-1">
              En attente
            </p>
          </div>
          <div class="p-3 bg-white/20 rounded-xl">
            <AlertTriangle class="w-8 h-8" />
          </div>
        </div>
      </div>

      <div class="card bg-gradient-to-r from-blue-500 to-blue-600 text-white">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-blue-100 text-sm font-medium">Avis aujourd'hui</p>
            <p class="text-3xl font-bold">{{ stats.reviews_today }}</p>
            <p class="text-blue-200 text-sm mt-1">
              Nouveaux avis
            </p>
          </div>
          <div class="p-3 bg-white/20 rounded-xl">
            <MessageSquare class="w-8 h-8" />
          </div>
        </div>
      </div>

      <div class="card bg-gradient-to-r from-green-500 to-green-600 text-white">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-green-100 text-sm font-medium">Traités</p>
            <p class="text-3xl font-bold">{{ stats.resolved_reports }}</p>
            <p class="text-green-200 text-sm mt-1">
              Signalements résolus
            </p>
          </div>
          <div class="p-3 bg-white/20 rounded-xl">
            <CheckCircle class="w-8 h-8" />
          </div>
        </div>
      </div>
    </div>

    <!-- Tabs Navigation -->
    <div class="mb-8">
      <div class="border-b border-gray-200">
        <nav class="-mb-px flex space-x-8">
          <button
            @click="activeTab = 'pending'"
            :class="[
              'py-2 px-1 border-b-2 font-medium text-sm',
              activeTab === 'pending'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            ]"
          >
            Avis en attente
            <span v-if="stats?.pending_reviews" class="ml-2 px-2 py-1 text-xs bg-orange-100 text-orange-800 rounded-full">
              {{ stats.pending_reviews }}
            </span>
          </button>
          <button
            @click="activeTab = 'reported'"
            :class="[
              'py-2 px-1 border-b-2 font-medium text-sm',
              activeTab === 'reported'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            ]"
          >
            Avis signalés
            <span v-if="stats?.pending_reports" class="ml-2 px-2 py-1 text-xs bg-red-100 text-red-800 rounded-full">
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
  </DashboardLayout>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import PendingReviewsList from '@/components/admin/PendingReviewsList.vue'
import ReportedReviewsList from '@/components/admin/ReportedReviewsList.vue'
import DashboardLayout from '@/components/ui/DashboardLayout.vue'
import { useDashboardLayout } from '@/composables/useDashboardLayout'
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
    const response = await fetch('http://localhost:8000/api/admin/reviews/stats', {
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
      stats.value = data.data.stats
    } else {
      throw new Error(data.message || 'Erreur lors du chargement')
    }
  } catch (err) {
    console.error('Error loading moderation stats:', err)
    error.value = err instanceof Error ? err.message : 'Erreur inconnue'
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
}

const onReviewRejected = () => {
  // Refresh stats when a review is rejected
  if (stats.value) {
    stats.value.pending_reviews = Math.max(0, stats.value.pending_reviews - 1)
  }
}

const onReportResolved = () => {
  // Refresh stats when a report is resolved
  if (stats.value) {
    stats.value.pending_reports = Math.max(0, stats.value.pending_reports - 1)
    stats.value.resolved_reports = stats.value.resolved_reports + 1
  }
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