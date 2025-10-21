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

    <!-- Photos -->
    <div>
      <label class="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
        Photos (facultatif)
      </label>
      <p class="text-xs text-gray-500 dark:text-gray-400">
        Ajoutez jusqu'à 3 photos (JPG ou PNG, 5MB max par photo) pour illustrer votre expérience.
      </p>
      <div class="mt-3">
        <label
          class="flex items-center justify-center w-full px-4 py-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:border-green-500 hover:text-green-600 text-sm font-medium text-gray-600 dark:text-gray-300 transition-colors"
        >
          <input
            class="sr-only"
            type="file"
            accept="image/jpeg,image/png"
            multiple
            @change="handlePhotosChange"
          >
          <span>Cliquer pour sélectionner des photos</span>
        </label>
      </div>
      <div v-if="photoPreviews.length" class="mt-4 flex flex-wrap gap-3">
        <div
          v-for="(preview, index) in photoPreviews"
          :key="preview.url"
          class="relative w-24 h-24 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-600"
        >
          <img :src="preview.url" :alt="preview.name" class="w-full h-full object-cover">
          <button
            type="button"
            class="absolute top-1 right-1 bg-black/60 text-white text-xs rounded-full px-1.5 py-0.5"
            @click="removePhoto(index)"
          >
            ×
          </button>
        </div>
      </div>
      <p v-if="errors.photos" class="mt-1 text-sm text-red-500">{{ errors.photos }}</p>
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
import { onBeforeUnmount, reactive, ref } from 'vue'

interface ReviewData {
  rating: number
  title: string
  comment: string
  photos?: File[]
}

interface Errors {
  rating?: string
  comment?: string
  photos?: string
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

const selectedPhotos = ref<File[]>([])
const photoPreviews = ref<{ url: string; name: string }[]>([])

const MAX_PHOTOS = 3
const MAX_SIZE = 5 * 1024 * 1024
const ALLOWED_TYPES = ['image/jpeg', 'image/png']

const resetPhotos = () => {
  photoPreviews.value.forEach(preview => URL.revokeObjectURL(preview.url))
  photoPreviews.value = []
  selectedPhotos.value = []
}

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
  if (selectedPhotos.value.length > MAX_PHOTOS) {
    errors.value.photos = `Vous pouvez ajouter jusqu'à ${MAX_PHOTOS} photos.`
  }
  return Object.keys(errors.value).length === 0
}

const handleSubmit = () => {
  if (!validate()) return
  emit('submit', {
    rating: formData.rating,
    title: formData.title.trim() || undefined,
    comment: formData.comment.trim() || undefined,
    photos: selectedPhotos.value.length ? [...selectedPhotos.value] : undefined
  } as any)
  formData.rating = 0
  formData.title = ''
  formData.comment = ''
  resetPhotos()
}

const handlePhotosChange = (event: Event) => {
  const input = event.target as HTMLInputElement
  if (!input.files) {
    return
  }

  const files = Array.from(input.files)
  input.value = ''

  if (selectedPhotos.value.length + files.length > MAX_PHOTOS) {
    errors.value.photos = `Vous pouvez ajouter jusqu'à ${MAX_PHOTOS} photos.`
    return
  }

  const validFiles: File[] = []
  const previews: { url: string; name: string }[] = []
  let errorMessage = ''

  files.forEach(file => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      errorMessage = 'Formats acceptés : JPG ou PNG.'
      return
    }
    if (file.size > MAX_SIZE) {
      errorMessage = 'Chaque photo doit peser moins de 5MB.'
      return
    }

    validFiles.push(file)
    previews.push({ url: URL.createObjectURL(file), name: file.name })
  })

  if (errorMessage) {
    errors.value.photos = errorMessage
  } else {
    delete errors.value.photos
  }

  if (validFiles.length === 0) {
    return
  }

  selectedPhotos.value.push(...validFiles)
  photoPreviews.value.push(...previews)
}

const removePhoto = (index: number) => {
  const [removedPreview] = photoPreviews.value.splice(index, 1)
  selectedPhotos.value.splice(index, 1)
  if (removedPreview) {
    URL.revokeObjectURL(removedPreview.url)
  }
  if (!selectedPhotos.value.length) {
    delete errors.value.photos
  }
}

onBeforeUnmount(() => {
  resetPhotos()
})
</script>
