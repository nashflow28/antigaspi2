<template>
  <div class="space-y-4">
    <div class="flex space-y-4 sm:space-x-4">
      <!-- User Avatar -->
      <div class="flex-shrink-0">
        <div class="w-12 h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
          <span class="text-white text-sm font-medium">
            {{ getInitials(review.user.name) }}
          </span>
        </div>
      </div>

      <div class="flex-1 min-w-none">
        <!-- Review Header -->
        <div class="flex items-center justify-start sm:justify-between mb-4">
          <div class="flex items-center space-y-2 sm:space-x-3">
            <span class="font-medium text-gray-900">{{ review.user.name }}</span>
            <span class="text-sm text-gray-500">{{ review.user.email }}</span>
            <div class="flex items-center">
              <Star
                v-for="star in 5"
                :key="star"
                class="h-4 w-4"
                :class="star <= review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-500'"
              />
            </div>
            <span v-if="review.is_verified_purchase" class="inline-flex items-center px-3 py-1 rounded text-xs font-medium bg-green-100 text-green-800">
              <ShieldCheck class="w-3 h-3 mr-1" />
              Achat vérifié
            </span>
          </div>
          <span class="text-sm text-gray-500">{{ review.time_ago }}</span>
        </div>

        <!-- Review Content -->
        <div v-if="review.title" class="mb-4">
          <h4 class="font-medium text-gray-900">{{ review.title }}</h4>
        </div>

        <div v-if="review.comment" class="text-gray-800 text-sm leading-relaxed mb-4">
          {{ review.comment }}
        </div>

        <!-- Merchant and Product Info -->
        <div class="flex items-center space-y-4 sm:space-x-4 mt-3">
          <div class="inline-flex items-center text-xs text-purple-600 bg-purple-50 rounded-full px-3 py-3">
            <Building class="w-3 h-3 mr-1" />
            {{ review.merchant.business_name }}
          </div>
          <div v-if="review.product" class="inline-flex items-center text-xs text-info bg-blue-50 rounded-full px-3 py-3">
            <Package class="w-3 h-3 mr-1" />
            {{ review.product.name }}
          </div>
        </div>

        <!-- Merchant Response if exists -->
        <div v-if="review.merchant_response" class="mt-4 p-3 bg-green-50 border border-blue-200 rounded">
          <div class="flex items-stretch sm:items-start space-y-4 sm:space-x-2">
            <Building class="h-4 w-4 text-green-600 mt-0.5" />
            <div>
              <p class="text-sm font-medium text-green-800">Réponse du commerçant :</p>
              <p class="text-sm text-green-700 mt-1">{{ review.merchant_response }}</p>
            </div>
          </div>
        </div>

        <!-- Admin Actions -->
        <div class="flex items-center space-y-2 sm:space-x-3 mt-4">
          <button
            :disabled="!!processing"
            class="inline-flex items-center px-3 py-3 text-sm bg-blue-600 text-white rounded hover:transition-colors"
            @click="approveReview"
          >
            <Check class="h-4 w-4 mr-2" />
            {{ processing === 'approve' ? 'Approbation...' : 'Approuver' }}
          </button>

          <button
            :disabled="!!processing"
            class="inline-flex items-center px-3 py-3 text-sm bg-red-600 text-white rounded hover:transition-colors"
            @click="rejectReview"
          >
            <X class="h-4 w-4 mr-2" />
            {{ processing === 'reject' ? 'Rejet...' : 'Rejeter' }}
          </button>

          <button
            class="inline-flex items-center px-3 py-3 text-sm text-gray-700 border border-gray-300 rounded hover:transition-colors"
            @click="showDetails = !showDetails"
          >
            <Eye class="h-4 w-4 mr-2" />
            {{ showDetails ? 'Masquer' : 'Détails' }}
          </button>
        </div>

        <!-- Detailed Information -->
        <div v-if="showDetails" class="mt-4 p-4 bg-gray-50 rounded">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div>
              <p class="font-medium text-gray-900">Informations utilisateur</p>
              <p class="text-gray-700">Email: {{ review.user.email }}</p>
              <p class="text-gray-700">ID: {{ review.user.id }}</p>
            </div>
            <div>
              <p class="font-medium text-gray-900">Informations commerçant</p>
              <p class="text-gray-700">Propriétaire: {{ review.merchant.owner_name }}</p>
              <p class="text-gray-700">ID: {{ review.merchant.id }}</p>
            </div>
            <div>
              <p class="font-medium text-gray-900">Date de création</p>
              <p class="text-gray-700">{{ formatDate(review.created_at) }}</p>
            </div>
            <div v-if="review.product">
              <p class="font-medium text-gray-900">Produit</p>
              <p class="text-gray-700">{{ review.product.name }} (ID: {{ review.product.id }})</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Success/Error Messages -->
    <div v-if="successMessage" class="p-3 bg-green-50 border border-blue-200 rounded">
      <div class="flex items-center">
        <CheckCircle class="h-4 w-4 text-green-600 mr-2" />
        <span class="text-sm text-green-800">{{ successMessage }}</span>
      </div>
    </div>

    <div v-if="errorMessage" class="p-3 bg-red-50 border border-red-200 rounded">
      <div class="flex items-center">
        <AlertTriangle class="h-4 w-4 text-red-600 mr-2" />
        <span class="text-sm text-red-800">{{ errorMessage }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { notify } from '@/composables/useNotifications'
import apiService from '@/services/api'
import {
  Star,
  ShieldCheck,
  Building,
  Package,
  Check,
  X,
  Eye,
  CheckCircle,
  AlertTriangle
} from 'lucide-vue-next'

interface Review {
  id: number
  rating: number
  title: string
  comment: string
  time_ago: string
  is_verified_purchase: boolean
  user: {
    id: number
    name: string
    email: string
  }
  merchant: {
    id: number
    business_name: string
    owner_name: string
  }
  product?: {
    id: number
    name: string
  }
  merchant_response?: string
  created_at: string
}

interface Props {
  review: Review
}

const props = defineProps<Props>()
const emit = defineEmits<{
  approved: [reviewId: number]
  rejected: [reviewId: number]
}>()

const processing = ref<'approve' | 'reject' | null>(null)
const showDetails = ref(false)
const successMessage = ref('')
const errorMessage = ref('')

const getInitials = (name: string) => {
  return name.split(' ').map(part => part[0]).join('').toUpperCase().slice(0, 2)
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const approveReview = async () => {
  processing.value = 'approve'
  errorMessage.value = ''
  successMessage.value = ''

  try {
    const response = await apiService.approveReview(props.review.id)

    if (response.success) {
      successMessage.value = 'Avis approuvé avec succès'
      setTimeout(() => {
        emit('approved', props.review.id)
      }, 1000)
    } else {
      const message = response.message || 'Erreur lors de l\'approbation de l\'avis'
      errorMessage.value = message
      notify.error(message, 'Modération des avis')
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur lors de l\'approbation de l\'avis'
    errorMessage.value = message
    notify.error(message, 'Modération des avis')
  } finally {
    processing.value = null
  }
}

const rejectReview = async () => {
  if (!confirm('Êtes-vous sûr de vouloir rejeter cet avis ? Il sera définitivement supprimé.')) {
    return
  }

  processing.value = 'reject'
  errorMessage.value = ''
  successMessage.value = ''

  try {
    const response = await apiService.rejectReview(props.review.id, {
      reason: 'Rejeté par l\'administrateur'
    })

    if (response.success) {
      successMessage.value = 'Avis rejeté et supprimé'
      setTimeout(() => {
        emit('rejected', props.review.id)
      }, 1000)
    } else {
      const message = response.message || 'Erreur lors du rejet de l\'avis'
      errorMessage.value = message
      notify.error(message, 'Modération des avis')
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur lors du rejet de l\'avis'
    errorMessage.value = message
    notify.error(message, 'Modération des avis')
  } finally {
    processing.value = null
  }
}
</script>
