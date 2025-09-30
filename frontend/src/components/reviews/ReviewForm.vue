<template>
  <div class="bg-white rounded shadow-lg p-6 border border-gray-100">
    <div class="flex items-center justify-start sm:justify-between mt-4">
      <div class="flex items-center space-y-2 sm:space-x-3">
        <div class="w-12 h-10 bg-yellow-100 rounded flex items-center justify-center">
          <Star class="h-6 w-6 text-yellow-500" />
        </div>
        <div>
          <h3 class="text-lg font-semibold text-gray-900">Donner votre avis</h3>
          <p class="text-gray-700 text-sm">Partagez votre expérience avec ce commerçant</p>
        </div>
      </div>
    </div>

    <form class="space-y-6" @submit.prevent="submitReview">
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
        <label for="title" class="block text-sm font-medium text-gray-800 mt-2">
          Titre de votre avis
        </label>
        <input
          id="title"
          v-model="form.title"
          type="text"
          maxlength="255"
          class="w-full border border-gray-300 rounded px-3 py-3 focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
          placeholder="Ex: Service rapide et produits frais"
        >
        <p v-if="errors.title" class="mt-1 text-sm text-red-600">{{ errors.title }}</p>
      </div>

      <!-- Comment -->
      <div>
        <label for="comment" class="block text-sm font-medium text-gray-800 mt-2">
          Votre commentaire
        </label>
        <textarea
          id="comment"
          v-model="form.comment"
          rows="4"
          maxlength="1000"
          class="w-full border border-gray-300 rounded px-3 py-3 focus:ring-2 focus:ring-yellow-500 focus:border-transparent resize-none"
          placeholder="Décrivez votre expérience avec ce commerçant..."
        />
        <div class="flex justify-start sm:justify-between mt-1">
          <p v-if="errors.comment" class="text-sm text-red-600">{{ errors.comment }}</p>
          <p class="text-xs text-gray-500">{{ (form.comment?.length || 0) }}/1000 caractères</p>
        </div>
      </div>

      <!-- Product Selection (if applicable) -->
      <div v-if="availableProducts.length > 0">
        <label for="product" class="block text-sm font-medium text-gray-800 mt-2">
          Produit concerné (optionnel)
        </label>
        <select
          id="product"
          v-model="form.product_id"
          class="w-full border border-gray-300 rounded px-3 py-3 focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
        >
          <option value="">Avis général sur le commerçant</option>
          <option
            v-for="product in availableProducts"
            :key="product.id"
            :value="product.id"
          >
            {{ product.name }}
          </option>
        </select>
      </div>

      <!-- Submit Buttons -->
      <div class="flex justify-center sm:justify-end space-y-2 sm:space-x-3 padding-t-lg">
        <button
          v-if="showCancel"
          type="button"
          class="px-4 py-3 text-gray-700 hover:transition-colors"
          @click="$emit('cancel')"
        >
          Annuler
        </button>
        <button
          type="submit"
          :disabled="!form.rating || submitting"
          class="px-4 py-3 bg-yellow-600 text-white rounded hover:transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-y-4 sm:space-x-2"
        >
          <span>{{ submitting ? 'Publication...' : 'Publier l\'avis' }}</span>
          <Send v-if="!submitting" class="h-4 w-4" />
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
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import StarRating from './StarRating.vue'
import { Star, Send, CheckCircle, XCircle } from 'lucide-vue-next'
import apiService from '@/services/api'

interface Product {
  id: number
  name: string
}

interface Props {
  merchantId: number
  productId?: number
  availableProducts?: Product[]
  showCancel?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  availableProducts: () => [],
  showCancel: false
})

const emit = defineEmits<{
  success: [review: any]
  cancel: []
}>()

const form = reactive({
  rating: 0,
  title: '',
  comment: '',
  product_id: props.productId || null as number | null
})

const errors = ref<Record<string, string>>({})
const submitting = ref(false)

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

const submitReview = async () => {
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
    const response = await apiService.createReview({
      merchant_id: props.merchantId,
      product_id: form.product_id,
      rating: form.rating,
      title: form.title || null,
      comment: form.comment || null
    })

    if (response.success) {
      showMessage('success', 'Votre avis a été publié avec succès !')

      // Reset form
      form.rating = 0
      form.title = ''
      form.comment = ''
      form.product_id = props.productId || null

      emit('success', response.data)
    } else {
      const validationErrors = (response as typeof response & { errors?: Record<string, string[] | string> }).errors

      if (validationErrors) {
        errors.value = Object.fromEntries(
          Object.entries(validationErrors).map(([field, messages]) => [
            field,
            Array.isArray(messages) ? messages[0] : messages
          ])
        )
      } else {
        showMessage('error', response.message || 'Une erreur est survenue. Veuillez réessayer.')
      }
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : null
    showMessage('error', message || 'Une erreur est survenue. Veuillez réessayer.')
  } finally {
    submitting.value = false
  }
}
</script>
