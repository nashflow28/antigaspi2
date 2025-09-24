<template>
  <Teleport to="body">
    <div
      v-if="activeErrors.length > 0"
      class="pointer-events-none fixed inset-0 z-[120] flex items-start justify-end px-4 py-6 sm:inset-auto sm:right-6 sm:py-6"
    >
      <TransitionGroup
        name="toast-stack"
        tag="div"
        class="flex w-full max-w-sm flex-col gap-3 sm:max-w-md"
      >
        <div
          v-for="error in activeErrors"
          :key="error.id"
          class="pointer-events-auto"
        >
          <Toast
            :is-open="true"
            tone="error"
            position="stacked"
            :title="error.title"
            :description="error.message"
            :action-label="error.actionLabel"
            :on-action="error.onAction"
            :on-close="error.onClose"
          />
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import Toast from '@/components/ui/Toast.vue'
import { useAuthStore } from '@/stores/auth'
import { useProductsStore } from '@/stores/products'
import { useReservationsStore } from '@/stores/reservations'

interface ErrorToast {
  id: string
  title: string
  message: string
  actionLabel?: string
  onAction?: () => void
  onClose: () => void
}

const authStore = useAuthStore()
const productsStore = useProductsStore()
const reservationsStore = useReservationsStore()

const activeErrors = computed<ErrorToast[]>(() => {
  const errors: ErrorToast[] = []

  if (authStore.error) {
    errors.push({
      id: 'auth-error',
      title: "Erreur d'authentification",
      message: authStore.error,
      onClose: authStore.clearError
    })
  }

  if (productsStore.error) {
    errors.push({
      id: 'products-error',
      title: 'Chargement des produits',
      message: productsStore.error,
      actionLabel: 'Réessayer',
      onAction: () => {
        productsStore.clearError()
        productsStore.fetchProducts()
      },
      onClose: productsStore.clearError
    })
  }

  if (reservationsStore.error) {
    errors.push({
      id: 'reservations-error',
      title: 'Réservations',
      message: reservationsStore.error,
      onClose: reservationsStore.clearError
    })
  }

  return errors
})
</script>

<style scoped>
.toast-stack-enter-active,
.toast-stack-leave-active {
  transition: all 0.24s ease;
}

.toast-stack-enter-from,
.toast-stack-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>