<template>
  <form @submit.prevent="handleSubmit" class="space-y-8">
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div class="form-group">
        <label class="form-label" for="name">
          Nom du produit
          <span class="text-error-500">*</span>
        </label>
        <input
          id="name"
          v-model="form.name"
          type="text"
          class="form-input"
          placeholder="Ex: Panier de fruits frais"
        />
        <p v-if="errors.name" class="form-error">{{ errors.name }}</p>
      </div>

      <div class="form-group">
        <label class="form-label" for="category">
          Catégorie
          <span class="text-error-500">*</span>
        </label>
        <select
          id="category"
          v-model.number="form.category_id"
          class="form-input"
        >
          <option disabled value="">Sélectionnez une catégorie</option>
          <option
            v-for="category in categories"
            :key="category.id"
            :value="category.id"
          >
            {{ category.name }}
          </option>
        </select>
        <p v-if="errors.category_id" class="form-error">{{ errors.category_id }}</p>
        <p v-if="categoriesError" class="form-error">{{ categoriesError }}</p>
      </div>

      <div class="form-group md:col-span-2">
        <label class="form-label" for="description">
          Description
        </label>
        <textarea
          id="description"
          v-model="form.description"
          rows="4"
          class="form-textarea"
          placeholder="Décrivez votre produit et les conditions de récupération..."
        ></textarea>
        <p v-if="errors.description" class="form-error">{{ errors.description }}</p>
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div class="form-group">
        <label class="form-label" for="original_price">
          Prix initial (F CFA)
          <span class="text-error-500">*</span>
        </label>
        <input
          id="original_price"
          v-model.number="form.original_price"
          type="number"
          min="0"
          step="0.01"
          class="form-input"
          placeholder="Ex: 5000"
        />
        <p v-if="errors.original_price" class="form-error">{{ errors.original_price }}</p>
      </div>

      <div class="form-group">
        <label class="form-label" for="discount_percentage">
          Pourcentage de remise (%)
          <span class="text-error-500">*</span>
        </label>
        <input
          id="discount_percentage"
          v-model.number="form.discount_percentage"
          type="number"
          min="1"
          max="99"
          step="1"
          class="form-input"
          placeholder="Ex: 30"
        />
        <p v-if="errors.discount_percentage" class="form-error">{{ errors.discount_percentage }}</p>
      </div>

      <div class="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div class="p-4 bg-neutral-50 border border-neutral-200 rounded-xl">
          <p class="text-sm text-neutral-600 mb-2">Prix réduit calculé</p>
          <p class="text-2xl font-semibold text-primary-600">
            {{ formatCurrency(computedDiscountedPrice) }} F CFA
          </p>
          <p class="text-sm text-neutral-500">
            Économies pour le client :
            <span class="font-medium text-success-600">
              {{ formatCurrency(computedSavings) }} F CFA
            </span>
          </p>
        </div>

        <div class="form-group">
          <label class="form-label" for="quantity">
            Quantité disponible
            <span class="text-error-500">*</span>
          </label>
          <input
            id="quantity"
            v-model.number="form.quantity_available"
            type="number"
            min="1"
            step="1"
            class="form-input"
            placeholder="Ex: 10"
          />
          <p v-if="errors.quantity_available" class="form-error">{{ errors.quantity_available }}</p>
        </div>
      </div>

      <div class="form-group">
        <label class="form-label" for="expiration_date">
          Date de péremption
          <span class="text-error-500">*</span>
        </label>
        <input
          id="expiration_date"
          v-model="form.expiration_date"
          type="date"
          class="form-input"
        />
        <p v-if="errors.expiration_date" class="form-error">{{ errors.expiration_date }}</p>
      </div>

      <div class="form-group md:col-span-2">
        <label class="form-label">Image du produit</label>
        <div class="flex flex-col md:flex-row gap-4 md:items-center">
          <div
            v-if="imagePreview"
            class="relative w-full md:w-48 h-36 border border-neutral-200 rounded-lg overflow-hidden"
          >
            <img :src="imagePreview" alt="Aperçu du produit" class="w-full h-full object-cover" />
            <button
              type="button"
              class="absolute top-2 right-2 bg-white/90 text-neutral-700 rounded-full px-2 py-1 text-xs shadow"
              @click="removeImage"
            >
              Retirer
            </button>
          </div>
          <div class="flex-1">
            <input
              ref="imageInput"
              type="file"
              accept="image/*"
              class="block w-full text-sm text-neutral-600 file:btn file:btn-outline"
              @change="onImageChange"
            />
            <p class="text-xs text-neutral-500 mt-2">Formats acceptés: JPG, PNG. Taille maximale: 2 Mo.</p>
          </div>
        </div>
        <p v-if="errors.image" class="form-error">{{ errors.image }}</p>
      </div>
    </div>

    <div v-if="serverError" class="p-4 rounded-lg bg-error-50 text-error-600 border border-error-100">
      {{ serverError }}
    </div>

    <div class="flex justify-end">
      <button
        type="submit"
        class="btn btn-primary"
        :disabled="submitting"
      >
        <span v-if="submitting" class="loader mr-2"></span>
        {{ submitLabel }}
      </button>
    </div>
  </form>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { apiService } from '@/services/api'
import type { Category } from '@/types'

export interface ProductFormInitialValues {
  category_id?: number | null
  name?: string | null
  description?: string | null
  original_price?: number | string | null
  discounted_price?: number | string | null
  quantity_available?: number | null
  expiration_date?: string | null
  image_url?: string | null
  discount_percentage?: number | null
}

export interface ProductFormSubmitPayload {
  category_id: number
  name: string
  description: string
  original_price: number
  discounted_price: number
  quantity_available: number
  expiration_date: string
  image_url: string | null
  discount_percentage: number
}

interface ProductFormState {
  category_id: number | ''
  name: string
  description: string
  original_price: number | null
  discount_percentage: number | null
  quantity_available: number | null
  expiration_date: string
  image_url: string | null
  image_file: File | null
}

const props = defineProps<{
  mode: 'create' | 'edit'
  initialValues?: ProductFormInitialValues
  submitting?: boolean
  submitLabel?: string
  serverError?: string | null
}>()

const emit = defineEmits<{ (e: 'submit', payload: ProductFormSubmitPayload): void }>()

const form = reactive<ProductFormState>({
  category_id: '',
  name: '',
  description: '',
  original_price: null,
  discount_percentage: 30,
  quantity_available: 1,
  expiration_date: '',
  image_url: null,
  image_file: null
})

const categories = ref<Category[]>([])
const categoriesError = ref<string | null>(null)
const errors = ref<Record<string, string>>({})
const imagePreview = ref<string | null>(null)
const existingImageUrl = ref<string | null>(null)
const imageInput = ref<HTMLInputElement | null>(null)

const submitting = computed(() => props.submitting ?? false)
const submitLabel = computed(() => props.submitLabel ?? (props.mode === 'edit' ? 'Mettre à jour le produit' : 'Créer le produit'))
const serverError = computed(() => props.serverError ?? null)

const formatCurrency = (value: number): string => {
  if (!Number.isFinite(value)) {
    return '0'
  }
  return value.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

const computedDiscountedPrice = computed<number>(() => {
  const original = form.original_price ?? 0
  const discount = form.discount_percentage ?? 0

  if (!original || original <= 0 || discount < 0 || discount >= 100) {
    return 0
  }

  const discounted = original * (1 - discount / 100)
  return Math.max(0, Number(discounted.toFixed(2)))
})

const computedSavings = computed<number>(() => {
  const original = form.original_price ?? 0
  const discounted = computedDiscountedPrice.value
  return Math.max(0, Number((original - discounted).toFixed(2)))
})

const resetFileInput = () => {
  if (imageInput.value) {
    imageInput.value.value = ''
  }
}

const removeImage = () => {
  form.image_file = null
  form.image_url = null
  imagePreview.value = null
  existingImageUrl.value = null
  resetFileInput()
}

const toBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = error => reject(error)
    reader.readAsDataURL(file)
  })
}

const onImageChange = async (event: Event) => {
  const target = event.target as HTMLInputElement
  const [file] = target.files ?? []

  if (!file) {
    return
  }

  if (file.size > 2 * 1024 * 1024) {
    errors.value.image = 'L\'image doit être inférieure à 2 Mo'
    resetFileInput()
    return
  }

  try {
    const base64 = await toBase64(file)
    form.image_file = file
    form.image_url = base64
    imagePreview.value = base64
    errors.value.image = ''
  } catch (error) {
    console.error('Erreur lors du chargement de l\'image', error)
    errors.value.image = 'Impossible de charger l\'image. Merci de réessayer.'
    form.image_file = null
  }
}

const applyInitialValues = (values?: ProductFormInitialValues) => {
  if (!values) {
    return
  }

  form.name = values.name ?? ''
  form.description = values.description ?? ''
  form.category_id = values.category_id ?? ''

  if (values.original_price !== undefined && values.original_price !== null) {
    form.original_price = typeof values.original_price === 'string'
      ? parseFloat(values.original_price)
      : values.original_price
  }

  if (values.discount_percentage !== undefined && values.discount_percentage !== null) {
    form.discount_percentage = values.discount_percentage
  } else if (values.original_price && values.discounted_price) {
    const original = typeof values.original_price === 'string' ? parseFloat(values.original_price) : values.original_price
    const discounted = typeof values.discounted_price === 'string' ? parseFloat(values.discounted_price) : values.discounted_price
    if (original > 0 && discounted >= 0) {
      form.discount_percentage = Math.round((1 - discounted / original) * 100)
    }
  }

  if (values.quantity_available !== undefined && values.quantity_available !== null) {
    form.quantity_available = values.quantity_available
  }

  if (values.expiration_date) {
    form.expiration_date = normalizeDate(values.expiration_date)
  }

  if (values.image_url) {
    form.image_url = values.image_url
    imagePreview.value = values.image_url
    existingImageUrl.value = values.image_url
  }
}

const normalizeDate = (date: string): string => {
  if (!date) {
    return ''
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return date
  }

  const parsed = new Date(date)
  if (Number.isNaN(parsed.getTime())) {
    return date
  }

  const offsetDate = new Date(parsed.getTime() - parsed.getTimezoneOffset() * 60000)
  return offsetDate.toISOString().slice(0, 10)
}

const validateForm = (): boolean => {
  errors.value = {}

  if (!form.name || !form.name.trim()) {
    errors.value.name = 'Le nom du produit est requis'
  }

  if (!form.category_id) {
    errors.value.category_id = 'La catégorie est obligatoire'
  }

  if (form.original_price === null || Number.isNaN(form.original_price) || form.original_price <= 0) {
    errors.value.original_price = 'Le prix initial doit être un nombre positif'
  }

  if (
    form.discount_percentage === null ||
    Number.isNaN(form.discount_percentage) ||
    form.discount_percentage <= 0 ||
    form.discount_percentage >= 100
  ) {
    errors.value.discount_percentage = 'La remise doit être comprise entre 1 et 99%'
  }

  if (computedDiscountedPrice.value <= 0) {
    errors.value.discount_percentage = 'Le prix réduit doit être inférieur au prix initial'
  }

  if (form.quantity_available === null || Number.isNaN(form.quantity_available) || form.quantity_available < 1) {
    errors.value.quantity_available = 'La quantité doit être supérieure ou égale à 1'
  }

  if (!form.expiration_date) {
    errors.value.expiration_date = 'La date de péremption est requise'
  } else {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const expiration = new Date(form.expiration_date)
    if (!Number.isNaN(expiration.getTime()) && expiration <= today) {
      errors.value.expiration_date = 'La date de péremption doit être ultérieure à aujourd\'hui'
    }
  }

  return Object.keys(errors.value).length === 0
}

const handleSubmit = () => {
  if (!validateForm()) {
    return
  }

  const payload: ProductFormSubmitPayload = {
    category_id: Number(form.category_id),
    name: form.name.trim(),
    description: form.description.trim(),
    original_price: Number(form.original_price ?? 0),
    discounted_price: computedDiscountedPrice.value,
    quantity_available: Number(form.quantity_available ?? 0),
    expiration_date: form.expiration_date,
    image_url: form.image_url ?? existingImageUrl.value,
    discount_percentage: Number(form.discount_percentage ?? 0)
  }

  emit('submit', payload)
}

const loadCategories = async () => {
  try {
    const response = await apiService.getCategories()
    categories.value = response.data ?? []
  } catch (error) {
    console.error('Erreur lors du chargement des catégories', error)
    categoriesError.value = 'Impossible de charger les catégories. Merci de réessayer plus tard.'
    categories.value = [
      { id: 1, name: 'Fruits et Légumes', icon: '' },
      { id: 2, name: 'Boulangerie', icon: '' },
      { id: 3, name: 'Produits laitiers', icon: '' },
      { id: 4, name: 'Viandes et Poissons', icon: '' },
      { id: 5, name: 'Plats préparés', icon: '' }
    ]
  }
}

onMounted(() => {
  loadCategories()
  applyInitialValues(props.initialValues)
})

watch(
  () => props.initialValues,
  newValues => {
    applyInitialValues(newValues)
  },
  { deep: true }
)
</script>

<style scoped>
.loader {
  width: 1rem;
  height: 1rem;
  border-radius: 9999px;
  border: 2px solid transparent;
  border-top-color: currentColor;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
