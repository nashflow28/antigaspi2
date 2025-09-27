<template>
  <div class="border-t border-neutral-200 pt-4 mt-4">
    <!-- Existing Response -->
    <div v-if="review.merchant_response && !isEditing" class="mb-4">
      <div class="flex items-start space-x-3">
        <div class="flex-shrink-0">
          <div class="w-8 h-8 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center">
            <BuildingStorefrontIcon class="w-4 h-4 text-white" />
          </div>
        </div>
        <div class="flex-1 min-w-0">
          <div class="flex items-center space-x-2 mb-2">
            <span class="text-sm font-medium text-neutral-900">Réponse du commerçant</span>
            <span class="text-xs text-neutral-500">{{ formatDate(review.merchant_response_at) }}</span>
          </div>
          <div class="text-sm text-neutral-700 leading-relaxed bg-green-50 rounded-lg p-3">
            {{ review.merchant_response }}
          </div>
          <div class="flex items-center space-x-2 mt-2">
            <button
              class="inline-flex items-center px-2 py-1 text-xs text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-full transition-colors"
              @click="startEditing"
            >
              <PencilIcon class="w-3 h-3 mr-1" />
              Modifier
            </button>
            <button
              class="inline-flex items-center px-2 py-1 text-xs text-red-600 bg-red-50 hover:bg-red-100 rounded-full transition-colors"
              :disabled="deleting"
              @click="deleteResponse"
            >
              <TrashIcon class="w-3 h-3 mr-1" />
              Supprimer
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Response Form -->
    <div v-else-if="!review.merchant_response || isEditing" class="space-y-3">
      <div class="flex items-center space-x-2">
        <BuildingStorefrontIcon class="w-5 h-5 text-green-600" />
        <span class="text-sm font-medium text-neutral-900">
          {{ isEditing ? 'Modifier votre réponse' : 'Répondre à cet avis' }}
        </span>
      </div>

      <div class="space-y-3">
        <textarea
          v-model="responseText"
          :placeholder="isEditing ? 'Modifiez votre réponse...' : 'Écrivez votre réponse à ce client...'"
          rows="3"
          class="w-full border border-neutral-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
          :disabled="submitting"
        />

        <div class="flex items-center justify-between">
          <span class="text-xs text-neutral-500">
            {{ responseText.length }}/1000 caractères
          </span>
          <div class="flex items-center space-x-2">
            <button
              v-if="isEditing"
              class="px-3 py-1 text-sm text-neutral-600 hover:text-neutral-800 transition-colors"
              :disabled="submitting"
              @click="cancelEditing"
            >
              Annuler
            </button>
            <button
              :disabled="!responseText.trim() || submitting || responseText.length > 1000"
              class="inline-flex items-center px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              @click="submitResponse"
            >
              <span v-if="submitting" class="inline-flex items-center">
                <svg
                  class="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    class="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    stroke-width="4"
                  />
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                {{ isEditing ? 'Modification...' : 'Envoi...' }}
              </span>
              <span v-else>
                {{ isEditing ? 'Modifier' : 'Répondre' }}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Success Message -->
    <div v-if="showSuccess" class="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
      <div class="flex items-center">
        <CheckCircleIcon class="w-5 h-5 text-green-600 mr-2" />
        <span class="text-sm text-green-800">{{ successMessage }}</span>
      </div>
    </div>

    <!-- Error Message -->
    <div v-if="error" class="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
      <div class="flex items-center">
        <ExclamationTriangleIcon class="w-5 h-5 text-red-600 mr-2" />
        <span class="text-sm text-red-800">{{ error }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useAuthStore } from '@/stores/auth'
import {
  BuildingStorefrontIcon,
  PencilIcon,
  TrashIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/vue/24/outline'

interface Review {
  id: number
  merchant_response?: string
  merchant_response_at?: string
}

interface Props {
  review: Review
}

const props = defineProps<Props>()
const emit = defineEmits<{
  responseAdded: [reviewId: number, response: any]
  responseUpdated: [reviewId: number, response: any]
  responseDeleted: [reviewId: number]
}>()

const authStore = useAuthStore()
const responseText = ref('')
const isEditing = ref(false)
const submitting = ref(false)
const deleting = ref(false)
const error = ref<string | null>(null)
const showSuccess = ref(false)
const successMessage = ref('')

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

const startEditing = () => {
  isEditing.value = true
  responseText.value = props.review.merchant_response || ''
  error.value = null
}

const cancelEditing = () => {
  isEditing.value = false
  responseText.value = ''
  error.value = null
}

const submitResponse = async () => {
  if (!responseText.value.trim()) return

  submitting.value = true
  error.value = null

  try {
    const isUpdate = isEditing.value && props.review.merchant_response
    const endpoint = isUpdate
      ? `http://localhost:8000/api/merchants/reviews/${props.review.id}/response`
      : `http://localhost:8000/api/merchants/reviews/${props.review.id}/respond`

    const method = isUpdate ? 'PUT' : 'POST'

    const response = await fetch(endpoint, {
      method,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authStore.token}`
      },
      body: JSON.stringify({
        response: responseText.value.trim()
      })
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    if (data.success) {
      // Emit the appropriate event
      if (isUpdate) {
        emit('responseUpdated', props.review.id, data.data)
        successMessage.value = 'Réponse modifiée avec succès'
      } else {
        emit('responseAdded', props.review.id, data.data)
        successMessage.value = 'Réponse ajoutée avec succès'
      }

      // Reset form
      responseText.value = ''
      isEditing.value = false

      // Show success message
      showSuccess.value = true
      setTimeout(() => {
        showSuccess.value = false
      }, 3000)
    } else {
      throw new Error(data.message || 'Erreur lors de l\'envoi')
    }
  } catch (err) {
    console.error('Error submitting response:', err)
    error.value = err instanceof Error ? err.message : 'Erreur inconnue'
  } finally {
    submitting.value = false
  }
}

const deleteResponse = async () => {
  if (!confirm('Êtes-vous sûr de vouloir supprimer votre réponse ?')) {
    return
  }

  deleting.value = true
  error.value = null

  try {
    const response = await fetch(`http://localhost:8000/api/merchants/reviews/${props.review.id}/response`, {
      method: 'DELETE',
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
      emit('responseDeleted', props.review.id)
      successMessage.value = 'Réponse supprimée avec succès'
      showSuccess.value = true
      setTimeout(() => {
        showSuccess.value = false
      }, 3000)
    } else {
      throw new Error(data.message || 'Erreur lors de la suppression')
    }
  } catch (err) {
    console.error('Error deleting response:', err)
    error.value = err instanceof Error ? err.message : 'Erreur inconnue'
  } finally {
    deleting.value = false
  }
}

// Clear error when user starts typing
watch(responseText, () => {
  if (error.value) {
    error.value = null
  }
})
</script>
