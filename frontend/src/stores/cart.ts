import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'
import type { Product } from '@/types'
import { notify, type Notification } from '@/composables/useNotifications'

export interface CartItem {
  id: number
  type: 'product' | 'surprise_basket' // Type d'item pour différencier
  productId?: number // ID produit si type=product
  basketId?: number // ID panier surprise si type=surprise_basket
  name: string
  price: number
  originalPrice?: number | null
  quantity: number
  imageUrl?: string | null
  merchantId?: number | null
  merchantName?: string | null
  expiryDate?: string | null // Date d'expiration (important pour réservations)
  maxQuantity?: number | null // Quantité maximum disponible
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

interface CartNotificationPayload {
  title?: string
  message: string
  action?: Notification['action']
  onClose?: Notification['onClose']
  operation?: string
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
  const isHydrated = ref(false)
  const pendingOperation = ref<string | null>(null)

  const itemsCount = computed(() => items.value.reduce((total, item) => total + item.quantity, 0))
  const totalAmount = computed(() => items.value.reduce((total, item) => total + item.price * item.quantity, 0))
  const totalSavings = computed(() => items.value.reduce((total, item) => {
    const basePrice = resolvePrice(item.originalPrice)
    return total + Math.max(0, basePrice - item.price) * item.quantity
  }, 0))
  const totalQuantity = computed(() => itemsCount.value)
  const totalPrice = computed(() => totalAmount.value)
  const isEmpty = computed(() => totalQuantity.value === 0)

  const emitCartNotification = (type: 'error' | 'info' | 'success', payload: CartNotificationPayload) => {
    const { title = 'Panier', message, action, onClose, operation } = payload

    if (type === 'error' && operation) {
      pendingOperation.value = operation
    } else if (type !== 'error') {
      pendingOperation.value = null
    }

    const wrappedAction = action
      ? {
        label: action.label,
        callback: async () => {
          await action.callback()
          if (operation && pendingOperation.value === operation) {
            pendingOperation.value = null
          }
        }
      }
      : undefined

    const wrappedOnClose = () => {
      if (operation && pendingOperation.value === operation) {
        pendingOperation.value = null
      }
      onClose?.()
    }

    const options: Partial<Notification> = {
      action: wrappedAction,
      onClose: wrappedOnClose
    }

    if (type === 'error') {
      return notify.error(message, title, options)
    }

    if (type === 'info') {
      return notify.info(message, title, options)
    }

    return notify.success(message, title, options)
  }

  const emitCartError = (payload: CartNotificationPayload) => emitCartNotification('error', payload)
  const emitCartInfo = (payload: CartNotificationPayload) => emitCartNotification('info', payload)
  const emitCartSuccess = (payload: CartNotificationPayload) => emitCartNotification('success', payload)

  const persist = () => {
    if (typeof window === 'undefined') {
      return
    }

    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items.value))
      if (pendingOperation.value === 'persist') {
        pendingOperation.value = null
      }
    } catch (storageError) {
      emitCartError({
        message: "Impossible d'enregistrer le panier localement",
        operation: 'persist',
        action: {
          label: 'Réessayer',
          callback: () => persist()
        }
      })
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
            quantity: Number.isFinite(item.quantity) && item.quantity > 0 ? item.quantity : 1
          }))
        }
      }
      if (pendingOperation.value === 'hydrate') {
        pendingOperation.value = null
      }
    } catch (storageError) {
      emitCartError({
        message: 'Impossible de charger le panier sauvegardé',
        operation: 'hydrate',
        action: {
          label: 'Réessayer',
          callback: () => hydrateFromStorage()
        },
        onClose: () => {
          items.value = []
        }
      })
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

  const upsertItem = (payload: AddItemPayload) => {
    const quantity = payload.quantity && payload.quantity > 0 ? Math.floor(payload.quantity) : 1

    if (!payload.id) {
      const message = 'Article invalide'
      if (!payload.silent) {
        emitCartError({
          message,
          operation: 'upsert',
          action: {
            label: 'Réessayer',
            callback: async () => {
              upsertItem({
                ...payload,
                silent: false
              })
            }
          }
        })
      }
      return { success: false, error: message }
    }

    const normalizedMerchantId = payload.merchantId ?? null
    const existing = items.value.find(item =>
      item.id === payload.id && (item.merchantId ?? null) === normalizedMerchantId
    )
    const normalizedName = payload.name && payload.name.trim().length > 0
      ? payload.name.trim()
      : 'Produit anti-gaspi'
    if (existing) {
      existing.quantity += quantity
      existing.price = resolvePrice(payload.price)
      existing.originalPrice = payload.originalPrice ? resolvePrice(payload.originalPrice) : existing.originalPrice ?? null
      existing.imageUrl = payload.imageUrl ?? existing.imageUrl
      existing.merchantId = normalizedMerchantId
      existing.merchantName = payload.merchantName ?? existing.merchantName
      existing.name = normalizedName
    } else {
      items.value.push({
        id: payload.id,
        type: 'product',
        name: normalizedName,
        price: resolvePrice(payload.price),
        originalPrice: payload.originalPrice ? resolvePrice(payload.originalPrice) : null,
        quantity,
        imageUrl: payload.imageUrl ?? null,
        merchantId: normalizedMerchantId,
        merchantName: payload.merchantName ?? null
      })
    }

    if (pendingOperation.value === 'upsert') {
      pendingOperation.value = null
    }

    if (!payload.silent) {
      emitCartSuccess({
        message: 'Produit ajouté au panier'
      })
    }

    return { success: true }
  }

  const addProduct = (product: Product, quantity = 1, options: { silent?: boolean } = {}) => {
    // Vérifier si le produit est déjà dans le panier
    const existing = items.value.find(item =>
      item.type === 'product' && item.productId === product.id
    )

    if (existing) {
      // Augmenter la quantité
      existing.quantity += quantity
      if (!options.silent) {
        emitCartSuccess({
          message: `${product.name} ajouté au panier (x${existing.quantity})`
        })
      }
      return { success: true }
    }

    // Ajouter nouveau produit
    items.value.push({
      id: product.id,
      type: 'product',
      productId: product.id,
      name: product.name,
      price: resolvePrice(product.discounted_price ?? product.original_price),
      originalPrice: resolvePrice(product.original_price),
      quantity,
      imageUrl: product.image_url ?? null,
      merchantId: product.merchant?.id ?? null,
      merchantName: product.merchant?.business_name ?? null,
      expiryDate: product.expiration_date ?? null,
      maxQuantity: product.quantity_available ?? null
    })

    if (!options.silent) {
      emitCartSuccess({
        message: `${product.name} ajouté au panier`
      })
    }

    return { success: true }
  }

  const updateQuantity = (id: number, quantity: number) => {
    if (quantity <= 0) {
      return removeItem(id)
    }

    const item = items.value.find(entry => entry.id === id)
    if (!item) {
      const message = 'Article introuvable dans le panier'
      emitCartError({
        message,
        operation: 'update-quantity',
        action: {
          label: 'Réessayer',
          callback: async () => {
            updateQuantity(id, quantity)
          }
        }
      })
      return { success: false, error: message }
    }

    item.quantity = Math.floor(quantity)
    if (pendingOperation.value === 'update-quantity') {
      pendingOperation.value = null
    }
    return { success: true, data: item }
  }

  const removeItem = (id: number) => {
    const initialLength = items.value.length
    items.value = items.value.filter(item => item.id !== id)

    if (items.value.length === initialLength) {
      const message = 'Article introuvable dans le panier'
      emitCartError({
        message,
        operation: 'remove-item',
        action: {
          label: 'Réessayer',
          callback: async () => {
            removeItem(id)
          }
        }
      })
      return { success: false, error: message }
    }

    emitCartInfo({
      message: 'Article retiré du panier'
    })
    return { success: true }
  }

  const clearCart = (options: { silent?: boolean } = {}) => {
    items.value = []
    if (!options.silent) {
      emitCartInfo({
        message: 'Panier vidé'
      })
    }
    return { success: true }
  }

  hydrateFromStorage()

  return {
    // State
    items,
    itemsCount,
    totalAmount,
    totalQuantity,
    totalPrice,
    totalSavings,
    isEmpty,
    isHydrated,
    pendingOperation,

    // Actions
    hydrateFromStorage,
    addItem: upsertItem,
    addProduct,
    updateQuantity,
    removeItem,
    clearCart
  }
})

