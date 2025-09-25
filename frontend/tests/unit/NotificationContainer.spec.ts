import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia, type Pinia } from 'pinia'
import { nextTick } from 'vue'

import NotificationContainer from '@/components/ui/NotificationContainer.vue'
import { useNotifications } from '@/composables/useNotifications'
import { useAuthStore } from '@/stores/auth'
import { useProductsStore } from '@/stores/products'
import { useReservationsStore } from '@/stores/reservations'

describe('NotificationContainer', () => {
  let pinia: Pinia

  beforeEach(() => {
    pinia = createPinia()
    setActivePinia(pinia)
    const { clearAll } = useNotifications()
    clearAll()
  })

  it('renders stacked toasts for each store error', async () => {
    const authStore = useAuthStore()
    const productsStore = useProductsStore()
    const reservationsStore = useReservationsStore()

    authStore.error = "Connexion impossible" as any
    productsStore.error = 'Catalogue momentanément indisponible' as any
    reservationsStore.error = 'Réservation impossible' as any

    mount(NotificationContainer, {
      global: {
        plugins: [pinia],
        stubs: {
          teleport: true,
          transition: false,
          'transition-group': false
        }
      }
    })

    await nextTick()

    const { notifications } = useNotifications()

    expect(notifications.value).toHaveLength(3)

    const payloads = notifications.value.reduce<Record<string, any>>((acc, notification) => {
      acc[notification.title ?? notification.id] = notification
      return acc
    }, {})

    expect(Object.values(payloads).map(notification => notification.title)).toEqual(
      expect.arrayContaining(["Erreur d'authentification", 'Chargement des produits', 'Réservations'])
    )
  })

  it('clears the corresponding store error when toast is dismissed', async () => {
    vi.useFakeTimers()

    const authStore = useAuthStore()
    authStore.error = 'Token expiré' as any

    const clearSpy = vi.spyOn(authStore, 'clearError')

    mount(NotificationContainer, {
      global: {
        plugins: [pinia],
        stubs: {
          teleport: true,
          transition: false,
          'transition-group': false
        }
      }
    })

    await nextTick()

    const { notifications, removeNotification } = useNotifications()
    expect(notifications.value).toHaveLength(1)

    const [notification] = notifications.value
    removeNotification(notification.id)

    await nextTick()

    expect(clearSpy).toHaveBeenCalledTimes(1)
    expect(notifications.value).toHaveLength(0)

    vi.runOnlyPendingTimers()
    vi.useRealTimers()
  })
})

