<template></template>

<script setup lang="ts">
import { onBeforeUnmount, watch } from 'vue'
import type { Ref, WatchStopHandle } from 'vue'
import { storeToRefs } from 'pinia'
import { useAuthStore } from '@/stores/auth'
import { useProductsStore } from '@/stores/products'
import { useReservationsStore } from '@/stores/reservations'
import { useNotifications } from '@/composables/useNotifications'

interface ErrorStore {
  clearError: () => void
}

const authStore = useAuthStore()
const productsStore = useProductsStore()
const reservationsStore = useReservationsStore()

const { notify, removeNotification } = useNotifications()

const errorNotificationIds = new Map<string, number>()
const stops: WatchStopHandle[] = []

const registerErrorWatcher = (
  key: string,
  errorRef: Ref<string | null>,
  store: ErrorStore,
  title: string
) => {
  const stop = watch(
    errorRef,
    value => {
      const currentId = errorNotificationIds.get(key)

      if (!value) {
        if (currentId !== undefined) {
          errorNotificationIds.delete(key)
          removeNotification(currentId)
        }
        return
      }

      if (currentId !== undefined) {
        errorNotificationIds.delete(key)
        removeNotification(currentId)
      }

      const id = notify.error({
        title,
        message: value,
        onClose: () => {
          errorNotificationIds.delete(key)
          store.clearError()
        }
      })

      errorNotificationIds.set(key, id)
    },
    { immediate: true }
  )

  stops.push(stop)
}

const { error: authError } = storeToRefs(authStore)
const { error: productsError } = storeToRefs(productsStore)
const { error: reservationsError } = storeToRefs(reservationsStore)

registerErrorWatcher('auth', authError, authStore, "Erreur d'authentification")
registerErrorWatcher('products', productsError, productsStore, 'Erreur produit')
registerErrorWatcher('reservations', reservationsError, reservationsStore, 'Erreur de réservation')

onBeforeUnmount(() => {
  stops.forEach(stop => stop())
  errorNotificationIds.clear()
})
</script>
