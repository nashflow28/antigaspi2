<template>
  <form @submit.prevent="handleSubmit" class="space-y-6">
    <!-- Rating -->
    <div>
      <label class="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
        Note <span class="text-red-500">*</span>
      </label>
      <div class="flex items-center gap-4">
        <div class="flex gap-1">
          <button
            v-for="star in 5"
            :key="star"
            type="button"
            @click="formData.rating = star"
            class="text-3xl transition-colors cursor-pointer"
            :class="star <= formData.rating ? 'text-yellow-400' : 'text-gray-300'"
          >
            ★
          </button>
        </div>
        <span v-if="formData.rating > 0" class="text-sm font-medium text-gray-600 dark:text-gray-300">
          {{ getRatingLabel(formData.rating) }}
        </span>
      </div>
      <p v-if="errors.rating" class="mt-1 text-sm text-red-500">{{ errors.rating }}</p>
    </div>

    <!-- Title -->
    <div>
      <label class="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
        Titre (facultatif)
      </label>
      <input
        v-model="formData.title"
        type="text"
        maxlength="255"
        placeholder="Résumez votre expérience..."
        class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white"
      />
    </div>

    <!-- Comment -->
    <div>
      <label class="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
        Commentaire (facultatif)
      </label>
      <textarea
        v-model="formData.comment"
        maxlength="1000"
        rows="6"
        placeholder="Partagez votre expérience..."
        class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white"
      />
      <div class="mt-1 text-xs text-gray-500 dark:text-gray-400 text-right">
        {{ formData.comment.length }}/1000
      </div>
      <p v-if="errors.comment" class="mt-1 text-sm text-red-500">{{ errors.comment }}</p>
    </div>

    <!-- Submit Button -->
    <button
      type="submit"
      :disabled="loading || formData.rating === 0"
      class="w-full py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold rounded-lg transition-colors"
    >
      <span v-if="!loading">Publier l'avis</span>
      <span v-else>Publication...</span>
    </button>
  </form>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'

interface ReviewData {
  rating: number
  title: string
  comment: string
}

interface Errors {
  rating?: string
  comment?: string
}

defineProps<{
  loading?: boolean
}>()

const emit = defineEmits<{
  submit: [data: ReviewData]
}>()

const formData = reactive<ReviewData>({
  rating: 0,
  title: '',
  comment: ''
})

const errors = ref<Errors>({})

const getRatingLabel = (rating: number): string => {
  const labels: Record<number, string> = {
    1: 'Très mauvais',
    2: 'Mauvais',
    3: 'Moyen',
    4: 'Bien',
    5: 'Excellent'
  }
  return labels[rating] || ''
}

const validate = (): boolean => {
  errors.value = {}
  if (formData.rating === 0) {
    errors.value.rating = 'Sélectionner une note'
  }
  if (formData.comment.length > 1000) {
    errors.value.comment = 'Max 1000 caractères'
  }
  return Object.keys(errors.value).length === 0
}

const handleSubmit = () => {
  if (!validate()) return
  emit('submit', {
    rating: formData.rating,
    title: formData.title.trim() || undefined,
    comment: formData.comment.trim() || undefined
  } as any)
  formData.rating = 0
  formData.title = ''
  formData.comment = ''
}
</script>
