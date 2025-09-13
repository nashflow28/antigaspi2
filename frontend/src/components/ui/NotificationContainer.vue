<template>
  <div class="fixed top-4 right-4 z-50 space-y-4">
    <!-- Auth errors -->
    <div
      v-if="authStore.error"
      class="alert alert-error max-w-sm animate-slide-in"
    >
      <div class="flex items-center justify-between">
        <span>{{ authStore.error }}</span>
        <button
          @click="authStore.clearError()"
          class="ml-2 text-danger-600 hover:text-danger-800"
        >
          ✕
        </button>
      </div>
    </div>

    <!-- Products errors -->
    <div
      v-if="productsStore.error"
      class="alert alert-error max-w-sm animate-slide-in"
    >
      <div class="flex items-center justify-between">
        <span>{{ productsStore.error }}</span>
        <button
          @click="productsStore.clearError()"
          class="ml-2 text-danger-600 hover:text-danger-800"
        >
          ✕
        </button>
      </div>
    </div>

    <!-- Reservations errors -->
    <div
      v-if="reservationsStore.error"
      class="alert alert-error max-w-sm animate-slide-in"
    >
      <div class="flex items-center justify-between">
        <span>{{ reservationsStore.error }}</span>
        <button
          @click="reservationsStore.clearError()"
          class="ml-2 text-danger-600 hover:text-danger-800"
        >
          ✕
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useAuthStore } from '@/stores/auth'
import { useProductsStore } from '@/stores/products'
import { useReservationsStore } from '@/stores/reservations'

const authStore = useAuthStore()
const productsStore = useProductsStore()
const reservationsStore = useReservationsStore()
</script>

<style scoped>
@keyframes slide-in {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

.animate-slide-in {
  animation: slide-in 0.3s ease-out;
}
</style>