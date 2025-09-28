<template>
  <div class="flex flex-col items-center justify-center p-4 sm:p-6 lg:p-12 text-left sm:text-center">
    <div class="w-12 h-10 bg-red-100 rounded-full flex items-center justify-center mt-3">
      <ExclamationTriangleIcon class="h-6 w-6 text-red-600" />
    </div>
    <h3 class="text-lg font-semibold text-gray-900 mt-2">
      Erreur de chargement
    </h3>
    <p class="text-gray-700 mt-3">
      Une erreur s'est produite lors du chargement de ce composant.
    </p>
    <button
      class="px-3 py-3 bg-blue-600 text-white rounded hover:transition-colors"
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
