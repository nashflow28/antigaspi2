import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia, type Pinia } from 'pinia'
import { nextTick } from 'vue'

import NotificationContainer from '@/components/ui/NotificationContainer.vue'
import Toast from '@/components/ui/Toast.vue'
import { useAuthStore } from '@/stores/auth'
import { useProductsStore } from '@/stores/products'
import { useReservationsStore } from '@/stores/reservations'

describe('NotificationContainer', () => {
  let pinia: Pinia

  beforeEach(() => {
    pinia = createPinia()
    setActivePinia(pinia)
  })

  it('renders stacked toasts for each store error', async () => {
    const authStore = useAuthStore()
    const productsStore = useProductsStore()
    const reservationsStore = useReservationsStore()

    authStore.error = "Connexion impossible" as any
    productsStore.error = 'Catalogue momentanément indisponible' as any
    reservationsStore.error = 'Réservation impossible' as any

    const wrapper = mount(NotificationContainer, {
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

    const toasts = wrapper.findAllComponents(Toast)
    expect(toasts).toHaveLength(3)
    expect(wrapper.html()).toContain("Erreur d'authentification")
    expect(wrapper.html()).toContain('Chargement des produits')
    expect(wrapper.html()).toContain('Réservations')
  })

  it('clears the corresponding store error when toast is dismissed', async () => {
    vi.useFakeTimers()

    const authStore = useAuthStore()
    authStore.error = 'Token expiré' as any

    const clearSpy = vi.spyOn(authStore, 'clearError')

    const wrapper = mount(NotificationContainer, {
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

    const toast = wrapper.findComponent(Toast)
    expect(toast.exists()).toBe(true)

    const closeButton = toast.find('button[aria-label="Fermer la notification"]')
    await closeButton.trigger('click')

    await nextTick()

    expect(clearSpy).toHaveBeenCalledTimes(1)
    expect(wrapper.findComponent(Toast).exists()).toBe(false)

    vi.runOnlyPendingTimers()
    vi.useRealTimers()
  })
})

