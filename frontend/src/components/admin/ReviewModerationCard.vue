<template>
  <div class="space-y-4">
    <div class="flex space-x-4">
      <!-- User Avatar -->
      <div class="flex-shrink-0">
        <div class="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
          <span class="text-white text-sm font-medium">
            {{ getInitials(review.user.name) }}
          </span>
        </div>
      </div>

      <div class="flex-1 min-w-0">
        <!-- Review Header -->
        <div class="flex items-center justify-between mb-3">
          <div class="flex items-center space-x-3">
            <span class="font-medium text-gray-900">{{ review.user.name }}</span>
            <span class="text-sm text-gray-500">{{ review.user.email }}</span>
            <div class="flex items-center">
              <Star
                v-for="star in 5"
                :key="star"
                class="w-4 h-4"
                :class="star <= review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'"
              />
            </div>
            <span v-if="review.is_verified_purchase" class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
              <ShieldCheck class="w-3 h-3 mr-1" />
              Achat vérifié
            </span>
          </div>
          <span class="text-sm text-gray-500">{{ review.time_ago }}</span>
        </div>

        <!-- Review Content -->
        <div v-if="review.title" class="mb-3">
          <h4 class="font-medium text-gray-900">{{ review.title }}</h4>
        </div>

        <div v-if="review.comment" class="text-gray-700 text-sm leading-relaxed mb-3">
          {{ review.comment }}
        </div>

        <!-- Merchant and Product Info -->
        <div class="flex items-center space-x-4 mb-4">
          <div class="inline-flex items-center text-xs text-purple-600 bg-purple-50 rounded-full px-3 py-1">
            <Building class="w-3 h-3 mr-1" />
            {{ review.merchant.business_name }}
          </div>
          <div v-if="review.product" class="inline-flex items-center text-xs text-blue-600 bg-blue-50 rounded-full px-3 py-1">
            <Package class="w-3 h-3 mr-1" />
            {{ review.product.name }}
          </div>
        </div>

        <!-- Merchant Response if exists -->
        <div v-if="review.merchant_response" class="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <div class="flex items-start space-x-2">
            <Building class="w-4 h-4 text-green-600 mt-0.5" />
            <div>
              <p class="text-sm font-medium text-green-800">Réponse du commerçant :</p>
              <p class="text-sm text-green-700 mt-1">{{ review.merchant_response }}</p>
            </div>
          </div>
        </div>

        <!-- Admin Actions -->
        <div class="flex items-center space-x-3 mt-4">
          <button
            @click="approveReview"
            :disabled="!!processing"
            class="inline-flex items-center px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Check class="w-4 h-4 mr-2" />
            {{ processing === 'approve' ? 'Approbation...' : 'Approuver' }}
          </button>

          <button
            @click="rejectReview"
            :disabled="!!processing"
            class="inline-flex items-center px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <X class="w-4 h-4 mr-2" />
            {{ processing === 'reject' ? 'Rejet...' : 'Rejeter' }}
          </button>

          <button
            @click="showDetails = !showDetails"
            class="inline-flex items-center px-3 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Eye class="w-4 h-4 mr-2" />
            {{ showDetails ? 'Masquer' : 'Détails' }}
          </button>
        </div>

        <!-- Detailed Information -->
        <div v-if="showDetails" class="mt-4 p-4 bg-gray-50 rounded-lg">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <p class="font-medium text-gray-900">Informations utilisateur</p>
              <p class="text-gray-600">Email: {{ review.user.email }}</p>
              <p class="text-gray-600">ID: {{ review.user.id }}</p>
            </div>
            <div>
              <p class="font-medium text-gray-900">Informations commerçant</p>
              <p class="text-gray-600">Propriétaire: {{ review.merchant.owner_name }}</p>
              <p class="text-gray-600">ID: {{ review.merchant.id }}</p>
            </div>
            <div>
              <p class="font-medium text-gray-900">Date de création</p>
              <p class="text-gray-600">{{ formatDate(review.created_at) }}</p>
            </div>
            <div v-if="review.product">
              <p class="font-medium text-gray-900">Produit</p>
              <p class="text-gray-600">{{ review.product.name }} (ID: {{ review.product.id }})</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Success/Error Messages -->
    <div v-if="successMessage" class="p-3 bg-green-50 border border-green-200 rounded-lg">
      <div class="flex items-center">
        <CheckCircle class="w-5 h-5 text-green-600 mr-2" />
        <span class="text-sm text-green-800">{{ successMessage }}</span>
      </div>
    </div>

    <div v-if="errorMessage" class="p-3 bg-red-50 border border-red-200 rounded-lg">
      <div class="flex items-center">
        <AlertTriangle class="w-5 h-5 text-red-600 mr-2" />
        <span class="text-sm text-red-800">{{ errorMessage }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
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

const authStore = useAuthStore()
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
    const response = await fetch(`http://localhost:8000/api/admin/reviews/${props.review.id}/approve`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authStore.token}`
      }
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    if (data.success) {
      successMessage.value = 'Avis approuvé avec succès'
      setTimeout(() => {
        emit('approved', props.review.id)
      }, 1000)
    } else {
      throw new Error(data.message || 'Erreur lors de l\'approbation')
    }
  } catch (err) {
    console.error('Error approving review:', err)
    errorMessage.value = err instanceof Error ? err.message : 'Erreur inconnue'
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
    const response = await fetch(`http://localhost:8000/api/admin/reviews/${props.review.id}/reject`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authStore.token}`
      },
      body: JSON.stringify({
        reason: 'Rejeté par l\'administrateur'
      })
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    if (data.success) {
      successMessage.value = 'Avis rejeté et supprimé'
      setTimeout(() => {
        emit('rejected', props.review.id)
      }, 1000)
    } else {
      throw new Error(data.message || 'Erreur lors du rejet')
    }
  } catch (err) {
    console.error('Error rejecting review:', err)
    errorMessage.value = err instanceof Error ? err.message : 'Erreur inconnue'
  } finally {
    processing.value = null
  }
}
</script>