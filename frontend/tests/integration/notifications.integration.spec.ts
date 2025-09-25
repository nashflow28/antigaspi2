import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia, type Pinia } from 'pinia'
import { defineComponent, nextTick } from 'vue'

import NotificationContainer from '@/components/ui/NotificationContainer.vue'
import NotificationSystem from '@/components/ui/NotificationSystem.vue'
import Toast from '@/components/ui/Toast.vue'
import { useAuthStore } from '@/stores/auth'
import { useProductsStore } from '@/stores/products'
import { useReservationsStore } from '@/stores/reservations'
import { useNotifications } from '@/composables/useNotifications'

const createLocalStorageMock = () => {
  let store: Record<string, string> = {}

  return {
    getItem: vi.fn(key => (key in store ? store[key] : null)),
    setItem: vi.fn((key, value) => {
      store[key] = value
    }),
    removeItem: vi.fn(key => {
      delete store[key]
    }),
    clear: vi.fn(() => {
      store = {}
    })
  }
}

beforeAll(() => {
  Object.defineProperty(window, 'localStorage', {
    value: createLocalStorageMock(),
    writable: true
  })
})

describe('Notifications integration', () => {
  let pinia: Pinia

  const mountNotifications = () => {
    const TestHost = defineComponent({
      components: { NotificationContainer, NotificationSystem },
      template: `
        <div>
          <NotificationContainer />
          <NotificationSystem />
        </div>
      `
    })

    return mount(TestHost, {
      global: {
        plugins: [pinia],
        stubs: {
          teleport: true,
          transition: false,
          'transition-group': false
        }
      }
    })
  }

  beforeEach(() => {
    pinia = createPinia()
    setActivePinia(pinia)

    const { clearAll } = useNotifications()
    clearAll()
  })

  it('relays Pinia errors into the global notification stack and wires callbacks', async () => {
    const authStore = useAuthStore()
    const productsStore = useProductsStore()
    const reservationsStore = useReservationsStore()

    authStore.error = 'Token expiré' as any
    productsStore.error = 'Catalogue indisponible' as any
    reservationsStore.error = 'Réservation impossible' as any

    const fetchSpy = vi.spyOn(productsStore, 'fetchProducts').mockResolvedValue({} as any)
    const clearProductsSpy = vi.spyOn(productsStore, 'clearError')
    const clearAuthSpy = vi.spyOn(authStore, 'clearError')

    const wrapper = mountNotifications()

    await nextTick()
    await nextTick()

    const toasts = wrapper.findAllComponents(Toast)
    expect(toasts).toHaveLength(3)
    expect(wrapper.html()).toContain("Erreur d'authentification")
    expect(wrapper.html()).toContain('Chargement des produits')
    expect(wrapper.html()).toContain('Réservations')

    const retryToast = toasts.find(toast => toast.text().includes('Chargement des produits'))
    const retryButton = retryToast?.findAll('button').find(button => button.text() === 'Réessayer')
    expect(retryButton).toBeDefined()
    await retryButton?.trigger('click')

    await nextTick()

    expect(fetchSpy).toHaveBeenCalledTimes(1)
    expect(clearProductsSpy).toHaveBeenCalledTimes(1)

    const authToast = toasts.find(toast => toast.text().includes("Erreur d'authentification"))
    const closeAuthButton = authToast?.find('button[aria-label="Fermer la notification"]')
    expect(closeAuthButton).toBeDefined()
    await closeAuthButton?.trigger('click')

    await nextTick()

    expect(clearAuthSpy).toHaveBeenCalledTimes(1)
  })

  it('deduplicates notifications for the same store and updates the message', async () => {
    const productsStore = useProductsStore()

    productsStore.error = 'Erreur initiale' as any

    const wrapper = mountNotifications()

    await nextTick()

    let productToast = wrapper.findAllComponents(Toast).find(toast => toast.text().includes('Erreur initiale'))
    expect(productToast).toBeDefined()

    productsStore.error = 'Nouvelle erreur critique' as any

    await nextTick()
    await nextTick()

    const allToasts = wrapper.findAllComponents(Toast).filter(toast => toast.text().includes('Chargement des produits'))
    expect(allToasts).toHaveLength(1)
    productToast = allToasts[0]
    expect(productToast?.text()).toContain('Nouvelle erreur critique')
  })
})
