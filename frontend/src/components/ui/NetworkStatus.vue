<template>
  <Transition
    enter-active-class="transition-all duration-300 ease-out"
    enter-from-class="transform -translate-y-full opacity-0"
    enter-to-class="transform translate-y-0 opacity-100"
    leave-active-class="transition-all duration-300 ease-in"
    leave-from-class="transform translate-y-0 opacity-100"
    leave-to-class="transform -translate-y-full opacity-0"
  >
    <div
      v-if="showStatus"
      :class="statusClasses"
      class="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 px-4 py-2 rounded-lg shadow-lg backdrop-blur-sm border"
      data-testid="network-status"
    >
      <div class="flex items-center space-x-2">
        <div class="flex items-center space-x-1">
          <div :class="indicatorClasses" class="w-2 h-2 rounded-full"></div>
          <span class="text-sm font-medium">{{ statusMessage }}</span>
        </div>

        <div v-if="pendingCount > 0" class="flex items-center space-x-1 text-xs">
          <Loader2 class="w-3 h-3 animate-spin" />
          <span>{{ pendingCount }} en attente</span>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { Loader2 } from 'lucide-vue-next'
import { useNetworkError } from '@/composables/useNetworkError'

const { isOnline, pendingRequestsCount } = useNetworkError()

const showStatus = ref(false)
const hideTimeout = ref<NodeJS.Timeout>()

const statusMessage = computed(() => {
  if (!isOnline.value) {
    return 'Hors ligne'
  }
  if (pendingRequestsCount.value > 0) {
    return 'Synchronisation...'
  }
  return 'En ligne'
})

const statusClasses = computed(() => {
  if (!isOnline.value) {
    return 'bg-red-50 border-red-200 text-red-700'
  }
  if (pendingRequestsCount.value > 0) {
    return 'bg-yellow-50 border-yellow-200 text-yellow-700'
  }
  return 'bg-green-50 border-green-200 text-green-700'
})

const indicatorClasses = computed(() => {
  if (!isOnline.value) {
    return 'bg-red-500'
  }
  if (pendingRequestsCount.value > 0) {
    return 'bg-yellow-500 animate-pulse'
  }
  return 'bg-green-500'
})

const pendingCount = computed(() => pendingRequestsCount.value)

// Afficher/masquer le statut automatiquement
watch([isOnline, pendingRequestsCount], ([online, pending]) => {
  // Toujours montrer quand hors ligne
  if (!online) {
    showStatus.value = true
    if (hideTimeout.value) {
      clearTimeout(hideTimeout.value)
      hideTimeout.value = undefined
    }
    return
  }

  // Montrer temporairement quand il y a des requêtes en attente
  if (pending > 0) {
    showStatus.value = true
    if (hideTimeout.value) {
      clearTimeout(hideTimeout.value)
      hideTimeout.value = undefined
    }
    return
  }

  // Masquer après 3 secondes quand tout va bien
  if (online && pending === 0) {
    showStatus.value = true
    if (hideTimeout.value) {
      clearTimeout(hideTimeout.value)
    }
    hideTimeout.value = setTimeout(() => {
      showStatus.value = false
    }, 3000)
  }
}, { immediate: true })

onMounted(() => {
  // Afficher brièvement le statut au chargement
  showStatus.value = true
  setTimeout(() => {
    if (isOnline.value && pendingRequestsCount.value === 0) {
      showStatus.value = false
    }
  }, 2000)
})
</script>

<style scoped>
.animate-blob {
  animation: blob 7s infinite;
}

@keyframes blob {
  0% {
    transform: translate(0px, 0px) scale(1);
  }
  33% {
    transform: translate(30px, -50px) scale(1.1);
  }
  66% {
    transform: translate(-20px, 20px) scale(0.9);
  }
  100% {
    transform: translate(0px, 0px) scale(1);
  }
}
</style>