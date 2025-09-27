<template>
  <div class="flex flex-col items-center justify-center p-8 text-center">
    <div class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
      <ExclamationTriangleIcon class="w-8 h-8 text-red-600" />
    </div>
    <h3 class="text-responsive-lg font-semibold text-neutral-900 mb-2">
      Erreur de chargement
    </h3>
    <p class="text-neutral-600 mb-4">
      Une erreur s'est produite lors du chargement de ce composant.
    </p>
    <button
      class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
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
