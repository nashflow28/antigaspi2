<template></template>

<script setup lang="ts">
import { reactive, watch } from 'vue'
// Auth store removed - now using useNotifications directly
// Products store removed - now using useNotifications directly
import { useReservationsStore } from '@/stores/reservations'
import { notify } from '@/composables/useNotifications'

// authStore removed - now using useNotifications directly
// productsStore removed - now using useNotifications directly
const reservationsStore = useReservationsStore()

type ErrorSource = 'reservations' // auth and products removed

const notificationIds = reactive<Record<ErrorSource, string | null>>({
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

// auth watch removed - now using useNotifications directly in auth store

// products watch removed - now using useNotifications directly in products store

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
