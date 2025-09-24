import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'
import type { Product } from '@/types'
import { notify } from '@/composables/useNotifications'

export interface CartItem {
  id: number
  name: string
  price: number
  originalPrice?: number | null
  quantity: number
  imageUrl?: string | null
  merchantId?: number | null
  merchantName?: string | null
}

interface AddItemPayload {
  id: number
  name: string
  price: number
  originalPrice?: number | null
  quantity?: number
  imageUrl?: string | null
  merchantId?: number | null
  merchantName?: string | null
  silent?: boolean
}

const STORAGE_KEY = 'antigaspi_cart_items'

const resolvePrice = (value: number | string | undefined | null): number => {
  if (value === undefined || value === null) {
    return 0
  }

  if (typeof value === 'number') {
    return value
  }

  const parsed = parseFloat(value)
  return Number.isNaN(parsed) ? 0 : parsed
}

export const useCartStore = defineStore('cart', () => {
  const items = ref<CartItem[]>([])
  const error = ref<string | null>(null)
  const isHydrated = ref(false)

  const itemsCount = computed(() => items.value.reduce((total, item) => total + item.quantity, 0))
  const totalAmount = computed(() => items.value.reduce((total, item) => total + item.price * item.quantity, 0))

  const persist = () => {
    if (typeof window === 'undefined') {
      return
    }

    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items.value))
    } catch (storageError) {
      error.value = 'Impossible d\'enregistrer le panier localement'
      notify.error(error.value, 'Panier')
    }
  }

  const hydrateFromStorage = () => {
    if (isHydrated.value || typeof window === 'undefined') {
      return
    }

    try {
      const raw = window.localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw) as CartItem[]
        if (Array.isArray(parsed)) {
          items.value = parsed.map(item => ({
            ...item,
            price: resolvePrice(item.price),
            originalPrice: item.originalPrice ? resolvePrice(item.originalPrice) : null,
            quantity: Number.isFinite(item.quantity) && item.quantity > 0 ? item.quantity : 1,
          }))
        }
      }
    } catch (storageError) {
      error.value = 'Impossible de charger le panier sauvegardé'
      notify.error(error.value, 'Panier')
      items.value = []
    } finally {
      isHydrated.value = true
    }
  }

  watch(items, () => {
    if (isHydrated.value) {
      persist()
    }
  }, { deep: true })

  const clearError = () => {
    error.value = null
  }

  const upsertItem = (payload: AddItemPayload) => {
    const quantity = payload.quantity && payload.quantity > 0 ? Math.floor(payload.quantity) : 1

    if (!payload.id || !payload.name) {
      const message = 'Article invalide'
      error.value = message
      if (!payload.silent) {
        notify.error(message, 'Panier')
      }
      return { success: false, error: message }
    }

    clearError()

    const existing = items.value.find(item => item.id === payload.id)
    if (existing) {
      existing.quantity += quantity
      existing.price = resolvePrice(payload.price)
      existing.originalPrice = payload.originalPrice ? resolvePrice(payload.originalPrice) : existing.originalPrice ?? null
      existing.imageUrl = payload.imageUrl ?? existing.imageUrl
      existing.merchantId = payload.merchantId ?? existing.merchantId
      existing.merchantName = payload.merchantName ?? existing.merchantName
    } else {
      items.value.push({
        id: payload.id,
        name: payload.name,
        price: resolvePrice(payload.price),
        originalPrice: payload.originalPrice ? resolvePrice(payload.originalPrice) : null,
        quantity,
        imageUrl: payload.imageUrl ?? null,
        merchantId: payload.merchantId ?? null,
        merchantName: payload.merchantName ?? null,
      })
    }

    if (!payload.silent) {
      notify.success('Produit ajouté au panier', 'Panier')
    }

    return { success: true }
  }

  const addProduct = (product: Product, quantity = 1, options: { silent?: boolean } = {}) => {
    return upsertItem({
      id: product.id,
      name: product.name,
      price: resolvePrice(product.discounted_price ?? product.original_price),
      originalPrice: resolvePrice(product.original_price),
      quantity,
      imageUrl: product.image_url ?? null,
      merchantId: product.merchant?.id ?? null,
      merchantName: product.merchant?.business_name ?? null,
      silent: options.silent,
    })
  }

  const updateQuantity = (id: number, quantity: number) => {
    if (quantity <= 0) {
      return removeItem(id)
    }

    const item = items.value.find(entry => entry.id === id)
    if (!item) {
      const message = 'Article introuvable dans le panier'
      error.value = message
      notify.error(message, 'Panier')
      return { success: false, error: message }
    }

    item.quantity = Math.floor(quantity)
    clearError()
    return { success: true, data: item }
  }

  const removeItem = (id: number) => {
    const initialLength = items.value.length
    items.value = items.value.filter(item => item.id !== id)

    if (items.value.length === initialLength) {
      const message = 'Article introuvable dans le panier'
      error.value = message
      notify.error(message, 'Panier')
      return { success: false, error: message }
    }

    notify.info('Article retiré du panier', 'Panier')
    clearError()
    return { success: true }
  }

  const clearCart = (options: { silent?: boolean } = {}) => {
    items.value = []
    clearError()
    if (!options.silent) {
      notify.info('Panier vidé', 'Panier')
    }
    return { success: true }
  }

  return {
    // State
    items,
    itemsCount,
    totalAmount,
    error,
    isHydrated,

    // Actions
    hydrateFromStorage,
    addItem: upsertItem,
    addProduct,
    updateQuantity,
    removeItem,
    clearCart,
  }
})

export type { CartItem }
