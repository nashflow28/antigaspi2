<template>
  <div class="bg-white rounded shadow-lg p-6 border border-gray-100">
    <div class="flex items-center justify-start sm:justify-between mt-4">
      <div class="flex items-center space-y-2 sm:space-x-3">
        <div class="w-12 h-10 bg-blue-100 rounded flex items-center justify-center">
          <Edit class="h-6 w-6 text-info" />
        </div>
        <div>
          <h3 class="text-lg font-semibold text-gray-900">Modifier votre avis</h3>
          <p class="text-gray-700 text-sm">Mettez à jour votre expérience</p>
        </div>
      </div>
      <button
        class="text-gray-400 hover:transition-colors"
        @click="$emit('cancel')"
      >
        <X class="h-6 w-6" />
      </button>
    </div>

    <form class="space-y-6" @submit.prevent="submitUpdate">
      <!-- Rating -->
      <div>
        <label class="block text-sm font-medium text-gray-800 mb-4">
          Note générale *
        </label>
        <StarRating
          v-model="form.rating"
          :size="32"
          :show-text="true"
        />
        <p v-if="errors.rating" class="mt-1 text-sm text-red-600">{{ errors.rating }}</p>
      </div>

      <!-- Title -->
      <div>
        <label for="edit-title" class="block text-sm font-medium text-gray-800 mt-2">
          Titre de votre avis
        </label>
        <input
          id="edit-title"
          v-model="form.title"
          type="text"
          maxlength="255"
          class="w-full border border-gray-300 rounded px-3 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Ex: Service rapide et produits frais"
        >
        <p v-if="errors.title" class="mt-1 text-sm text-red-600">{{ errors.title }}</p>
      </div>

      <!-- Comment -->
      <div>
        <label for="edit-comment" class="block text-sm font-medium text-gray-800 mt-2">
          Votre commentaire
        </label>
        <textarea
          id="edit-comment"
          v-model="form.comment"
          rows="4"
          maxlength="1000"
          class="w-full border border-gray-300 rounded px-3 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          placeholder="Décrivez votre expérience mise à jour..."
        />
        <div class="flex justify-start sm:justify-between mt-1">
          <p v-if="errors.comment" class="text-sm text-red-600">{{ errors.comment }}</p>
          <p class="text-xs text-gray-500">{{ (form.comment?.length || 0) }}/1000 caractères</p>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="flex justify-center sm:justify-end space-y-2 sm:space-x-3 padding-t-lg">
        <button
          type="button"
          class="px-4 py-3 text-gray-700 hover:transition-colors"
          @click="$emit('cancel')"
        >
          Annuler
        </button>
        <button
          type="button"
          class="px-4 py-3 bg-red-600 text-white rounded hover:transition-colors flex items-center space-y-4 sm:space-x-2"
          :disabled="submitting"
          @click="confirmDelete"
        >
          <Trash2 class="h-4 w-4" />
          <span>Supprimer</span>
        </button>
        <button
          type="submit"
          :disabled="!form.rating || submitting"
          class="px-4 py-3 bg-blue-600 text-white rounded hover:transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-y-4 sm:space-x-2"
        >
          <span>{{ submitting ? 'Mise à jour...' : 'Mettre à jour' }}</span>
          <Save v-if="!submitting" class="h-4 w-4" />
          <div v-else class="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
        </button>
      </div>
    </form>

    <!-- Success/Error Messages -->
    <div
      v-if="message.show"
      class="mt-4 p-4 rounded"
      :class="{
        'bg-green-50 border border-blue-200': message.type === 'success',
        'bg-red-50 border border-red-200': message.type === 'error'
      }"
    >
      <div class="flex items-center">
        <CheckCircle v-if="message.type === 'success'" class="h-4 w-4 text-green-600-500 mr-2" />
        <XCircle v-if="message.type === 'error'" class="h-4 w-4 text-red-500 mr-2" />
        <p
          :class="{
            'text-green-700': message.type === 'success',
            'text-red-700': message.type === 'error'
          }"
        >
          {{ message.text }}
        </p>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div v-if="showDeleteConfirm" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[120]">
      <div class="bg-white rounded p-6 max-w-xl w-full max-w-lg mx-auto">
        <h3 class="text-lg font-semibold text-gray-900 mt-3">Supprimer l'avis</h3>
        <p class="text-gray-700 mt-4">
          Êtes-vous sûr de vouloir supprimer définitivement cet avis ? Cette action ne peut pas être annulée.
        </p>
        <div class="flex justify-center sm:justify-end space-y-2 sm:space-x-3">
          <button
            class="px-3 py-3 text-gray-700 hover:transition-colors"
            @click="showDeleteConfirm = false"
          >
            Annuler
          </button>
          <button
            class="px-3 py-3 bg-red-600 text-white rounded hover:transition-colors"
            :disabled="deleting"
            @click="deleteReview"
          >
            {{ deleting ? 'Suppression...' : 'Supprimer' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import StarRating from './StarRating.vue'
import { Edit, X, Save, Trash2, CheckCircle, XCircle } from 'lucide-vue-next'

interface Props {
  reviewId: number
}

const props = defineProps<Props>()

const emit = defineEmits<{
  success: [review: any]
  deleted: []
  cancel: []
}>()

const authStore = useAuthStore()

const form = reactive({
  rating: 0,
  title: '',
  comment: ''
})

const errors = ref<Record<string, string>>({})
const submitting = ref(false)
const deleting = ref(false)
const showDeleteConfirm = ref(false)
const loading = ref(true)

const message = reactive({
  show: false,
  type: 'success' as 'success' | 'error',
  text: ''
})

const showMessage = (type: 'success' | 'error', text: string) => {
  message.show = true
  message.type = type
  message.text = text

  setTimeout(() => {
    message.show = false
  }, 5000)
}

const loadReview = async () => {
  try {
    loading.value = true
    const response = await fetch(`http://localhost:8000/api/reviews/${props.reviewId}`, {
      headers: {
        'Authorization': `Bearer ${authStore.token}`,
        'Accept': 'application/json'
      }
    })

    const data = await response.json()

    if (response.ok && data.success) {
      form.rating = data.data.rating
      form.title = data.data.title || ''
      form.comment = data.data.comment || ''
    } else {
      showMessage('error', data.message || 'Impossible de charger l\'avis')
    }
  } catch (error) {
    // console.error('Error loading review:', error)
    showMessage('error', 'Erreur de connexion')
  } finally {
    loading.value = false
  }
}

const submitUpdate = async () => {
  errors.value = {}

  if (!form.rating) {
    errors.value.rating = 'La note est obligatoire'
    return
  }

  if (form.title && form.title.length > 255) {
    errors.value.title = 'Le titre ne peut pas dépasser 255 caractères'
    return
  }

  if (form.comment && form.comment.length > 1000) {
    errors.value.comment = 'Le commentaire ne peut pas dépasser 1000 caractères'
    return
  }

  submitting.value = true

  try {
    const response = await fetch(`http://localhost:8000/api/reviews/${props.reviewId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${authStore.token}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        rating: form.rating,
        title: form.title || null,
        comment: form.comment || null
      })
    })

    const data = await response.json()

    if (response.ok && data.success) {
      showMessage('success', 'Avis mis à jour avec succès !')
      emit('success', data.data)
    } else {
      if (data.errors) {
        errors.value = data.errors
      } else {
        showMessage('error', data.message || 'Erreur lors de la mise à jour')
      }
    }
  } catch (error) {
    // console.error('Error updating review:', error)
    showMessage('error', 'Erreur de connexion. Veuillez réessayer.')
  } finally {
    submitting.value = false
  }
}

const confirmDelete = () => {
  showDeleteConfirm.value = true
}

const deleteReview = async () => {
  deleting.value = true

  try {
    const response = await fetch(`http://localhost:8000/api/reviews/${props.reviewId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${authStore.token}`,
        'Accept': 'application/json'
      }
    })

    const data = await response.json()

    if (response.ok && data.success) {
      emit('deleted')
    } else {
      showMessage('error', data.message || 'Erreur lors de la suppression')
      showDeleteConfirm.value = false
    }
  } catch (error) {
    // console.error('Error deleting review:', error)
    showMessage('error', 'Erreur de connexion')
    showDeleteConfirm.value = false
  } finally {
    deleting.value = false
  }
}

onMounted(() => {
  loadReview()
})
</script>
