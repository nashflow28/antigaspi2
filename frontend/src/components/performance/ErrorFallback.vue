<template>
  <div class="flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8 text-left sm:text-center">
    <div class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
      <ExclamationTriangleIcon class="w-10 h-10 text-error" />
    </div>
    <h3 class="text-responsive-lg font-semibold text-heading mb-2">
      Erreur de chargement
    </h3>
    <p class="text-body mb-4">
      Une erreur s'est produite lors du chargement de ce composant.
    </p>
    <button
      class="px-4 py-3 bg-blue-600 text-white rounded-lg hover:transition-colors"
      @click="retry"
    >
      Réessayer
    </button>
  </div>
</template>

<script setup lang="ts">
import { ExclamationTriangleIcon } from '@heroicons/vue/24/outline'

const emit = defineEmits<{
  retry: []
}>()

const retry = () => {
  emit('retry')
  // Force page reload as fallback
  window.location.reload()
}
</script>
