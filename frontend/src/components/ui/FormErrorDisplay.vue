<template>
  <div
    v-if="hasErrors"
    class="rounded-md border border-red-200 bg-red-50 p-4"
  >
    <div class="flex">
      <div class="flex-shrink-0">
        <AlertCircle class="h-5 w-5 text-red-400" />
      </div>
      <div class="ml-3">
        <h3 class="text-responsive-sm font-medium text-red-800">
          {{ title || 'Erreurs de validation' }}
        </h3>
        <div class="mt-2 text-responsive-sm text-red-700">
          <ul
            v-if="Array.isArray(errors)"
            class="list-disc space-y-2 pl-5"
          >
            <li v-for="(error, index) in errors" :key="index">
              {{ error }}
            </li>
          </ul>
          <p v-else-if="typeof errors === 'string'">
            {{ errors }}
          </p>
          <div v-else-if="errors && typeof errors === 'object'">
            <ul class="list-disc space-y-2 pl-5">
              <li
                v-for="(fieldErrors, field) in errors"
                :key="field"
              >
                <strong>{{ getFieldLabel(field) }}:</strong>
                <span v-if="Array.isArray(fieldErrors)">
                  {{ fieldErrors.join(', ') }}
                </span>
                <span v-else>{{ fieldErrors }}</span>
              </li>
            </ul>
          </div>
        </div>

        <!-- Action buttons -->
        <div
          v-if="showActions"
          class="mt-4 flex gap-2"
        >
          <button
            v-if="allowDismiss"
            type="button"
            class="rounded-md bg-red-100 px-4 py-3 text-responsive-sm font-medium text-red-800 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
            @click="dismissErrors"
          >
            Masquer
          </button>
          <button
            v-if="allowRetry"
            type="button"
            class="rounded-md bg-red-600 px-4 py-3 text-responsive-sm font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
            @click="retryAction"
          >
            Réessayer
          </button>
        </div>
      </div>

      <div
        v-if="allowDismiss"
        class="ml-auto pl-3"
      >
        <div class="-mx-1.5 -my-1.5">
          <button
            type="button"
            class="inline-flex rounded-md bg-red-50 p-1.5 text-red-500 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-offset-2 focus:ring-offset-red-50"
            @click="dismissErrors"
          >
            <span class="sr-only">Fermer</span>
            <X class="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { AlertCircle, X } from 'lucide-vue-next'

interface Props {
  errors?: string | string[] | Record<string, string | string[]> | null
  title?: string
  allowDismiss?: boolean
  allowRetry?: boolean
  showActions?: boolean
  fieldLabels?: Record<string, string>
}

const props = withDefaults(defineProps<Props>(), {
  allowDismiss: true,
  allowRetry: false,
  showActions: true,
  fieldLabels: () => ({})
})

const emit = defineEmits<{
  dismiss: []
  retry: []
}>()

const hasErrors = computed(() => {
  if (!props.errors) return false

  if (Array.isArray(props.errors)) {
    return props.errors.length > 0
  }

  if (typeof props.errors === 'string') {
    return props.errors.trim().length > 0
  }

  if (typeof props.errors === 'object') {
    return Object.keys(props.errors).length > 0
  }

  return false
})

const getFieldLabel = (field: string): string => {
  if (props.fieldLabels[field]) {
    return props.fieldLabels[field]
  }

  // Convert snake_case to readable format
  const readable = field
    .replace(/_/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase())

  // Common field translations
  const translations: Record<string, string> = {
    'Email': 'Email',
    'Password': 'Mot de passe',
    'Name': 'Nom',
    'Phone': 'Téléphone',
    'Address': 'Adresse',
    'Product Id': 'Produit',
    'Quantity': 'Quantité',
    'Payment Method': 'Méthode de paiement',
    'Customer Phone': 'Téléphone client',
    'Customer Email': 'Email client'
  }

  return translations[readable] || readable
}

const dismissErrors = () => {
  emit('dismiss')
}

const retryAction = () => {
  emit('retry')
}
</script>
