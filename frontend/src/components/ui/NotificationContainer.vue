<template></template>

<script setup lang="ts">
import { reactive, watch } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useProductsStore } from '@/stores/products'
import { useReservationsStore } from '@/stores/reservations'
import { notify } from '@/composables/useNotifications'

const authStore = useAuthStore()
const productsStore = useProductsStore()
const reservationsStore = useReservationsStore()

type ErrorSource = 'auth' | 'products' | 'reservations'

const notificationIds = reactive<Record<ErrorSource, string | null>>({
  auth: null,
  products: null,
  reservations: null
})

const clearNotification = (source: ErrorSource) => {
  const id = notificationIds[source]
  if (!id) return

  notify.removeNotification(id)
  if (notificationIds[source] === id) {
    notificationIds[source] = null
  }
}

watch(
  () => authStore.error,
  message => {
    if (message) {
      clearNotification('auth')
      const id = notify.error(message, "Erreur d'authentification", {
        onClose: () => {
          if (notificationIds.auth === id) {
            notificationIds.auth = null
          }
          if (authStore.error === message) {
            authStore.clearError()
          }
        }
      })
      notificationIds.auth = id
    } else {
      clearNotification('auth')
    }
  },
  { immediate: true }
)

watch(
  () => productsStore.error,
  message => {
    if (message) {
      clearNotification('products')
      const id = notify.error(message, 'Chargement des produits', {
        actionLabel: 'Réessayer',
        onAction: () => {
          productsStore.clearError()
          productsStore.fetchProducts()
        },
        onClose: () => {
          if (notificationIds.products === id) {
            notificationIds.products = null
          }
          if (productsStore.error === message) {
            productsStore.clearError()
          }
        }
      })
      notificationIds.products = id
    } else {
      clearNotification('products')
    }
  },
  { immediate: true }
)

watch(
  () => reservationsStore.error,
  message => {
    if (message) {
      clearNotification('reservations')
      const id = notify.error(message, 'Réservations', {
        onClose: () => {
          if (notificationIds.reservations === id) {
            notificationIds.reservations = null
          }
          if (reservationsStore.error === message) {
            reservationsStore.clearError()
          }
        }
      })
      notificationIds.reservations = id
    } else {
      clearNotification('reservations')
    }
  },
  { immediate: true }
)
</script>
