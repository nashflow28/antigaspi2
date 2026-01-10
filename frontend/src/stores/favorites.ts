import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'
import type { Category, Merchant, Product, FavoriteProductSummary } from '@/types'
import { apiService } from '@/services/api'
import { notify, type Notification } from '@/composables/useNotifications'

export type FavoriteType = 'product' | 'merchant'

export interface FavoriteItem {
  id: number
  type: FavoriteType
  name: string
  description?: string | null
  imageUrl?: string | null
  merchant?: Partial<Merchant> | null
  product?: Partial<Product> | null
  tags?: string[]
  addedAt: string
}

interface FavoritesNotificationPayload {
  title?: string
  message: string
  action?: Notification['action']
  onClose?: Notification['onClose']
  operation?: string
}

const MERCHANT_STORAGE_KEY = 'antigaspi_favorite_merchants'

const parseMerchantStorage = (raw: string | null): FavoriteItem[] => {
  if (!raw) {
    return []
  }

  try {
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) {
      return []
    }

    return parsed
      .filter(item => item && item.type === 'merchant')
      .map(item => ({
        id: Number(item.id),
        type: 'merchant' as const,
        name: item.name ?? 'Commerçant AntiGaspi',
        description: item.description ?? null,
        imageUrl: item.imageUrl ?? null,
        merchant: item.merchant ?? null,
        product: null,
        tags: item.tags ?? [],
        addedAt: item.addedAt ?? new Date().toISOString()
      }))
  } catch (error) {
    console.warn('Unable to parse merchant favorites from storage', error)
    return []
  }
}

const mapProductFavorite = (favorite: FavoriteProductSummary): FavoriteItem => {
  const addedAt = favorite.favorited_at ?? new Date().toISOString()

  const merchant: Partial<Merchant> | null = favorite.merchant
    ? {
      id: Number(favorite.merchant.id ?? 0),
      business_name: favorite.merchant.business_name ?? 'Commerçant AntiGaspi',
      business_type: favorite.merchant.business_type,
      city: favorite.merchant.city,
      address: favorite.merchant.address,
      phone: favorite.merchant.phone,
      is_verified: Boolean((favorite.merchant as any).is_verified)
    }
    : null

  const product: Partial<Product> = {
    id: Number(favorite.id),
    name: favorite.name,
    description: favorite.description ?? '',
    original_price: String(favorite.original_price ?? 0),
    discounted_price: String(favorite.discounted_price ?? 0),
    quantity_available: favorite.quantity_available ?? 0,
    expiration_date: favorite.expiration_date ?? '',
    image_url: favorite.image_url ?? undefined,
    discount_percentage: favorite.discount_percentage ?? 0,
    savings: (favorite.original_price ?? 0) - (favorite.discounted_price ?? 0),
    days_until_expiration: 0,
    category: (favorite.category as Category | undefined) ?? undefined,
    merchant: merchant as any,
    created_at: addedAt
  }

  return {
    id: Number(favorite.id),
    type: 'product',
    name: favorite.name,
    description: favorite.description ?? null,
    imageUrl: favorite.image_url ?? null,
    merchant,
    product,
    tags: [],
    addedAt
  }
}

export const useFavoritesStore = defineStore('favorites', () => {
  const productFavorites = ref<FavoriteItem[]>([])
  const merchantFavorites = ref<FavoriteItem[]>([])
  const favoriteProductIds = ref<Set<number>>(new Set())
  const loading = ref(false)
  const pendingOperation = ref<string | null>(null)
  const initialized = ref(false)
  const merchantsHydrated = ref(false)

  const items = computed(() => {
    const combined = [...productFavorites.value, ...merchantFavorites.value]
    return combined.sort((a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime())
  })

  const favoritesCount = computed(() => items.value.length)
  const hasFavorites = computed(() => items.value.length > 0)

  const groupedFavorites = computed(() => {
    return items.value.reduce(
      (groups, item) => {
        groups[item.type].push(item)
        return groups
      },
      { product: [] as FavoriteItem[], merchant: [] as FavoriteItem[] }
    )
  })

  const emitFavoritesNotification = (
    type: 'error' | 'info' | 'success',
    payload: FavoritesNotificationPayload
  ) => {
    const { title = 'Favoris', message, action, onClose, operation } = payload

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

  const emitFavoritesError = (payload: FavoritesNotificationPayload) =>
    emitFavoritesNotification('error', payload)
  const emitFavoritesInfo = (payload: FavoritesNotificationPayload) =>
    emitFavoritesNotification('info', payload)
  const emitFavoritesSuccess = (payload: FavoritesNotificationPayload) =>
    emitFavoritesNotification('success', payload)

  const loadMerchantFavorites = () => {
    if (merchantsHydrated.value || typeof window === 'undefined') {
      return
    }

    merchantFavorites.value = parseMerchantStorage(window.localStorage.getItem(MERCHANT_STORAGE_KEY))
    merchantsHydrated.value = true
  }

  const persistMerchantFavorites = () => {
    if (!merchantsHydrated.value || typeof window === 'undefined') {
      return
    }

    try {
      window.localStorage.setItem(MERCHANT_STORAGE_KEY, JSON.stringify(merchantFavorites.value))
    } catch (error) {
      emitFavoritesError({
        message: 'Impossible de sauvegarder vos commerçants favoris',
        operation: 'persist-merchants',
        action: {
          label: 'Réessayer',
          callback: () => persistMerchantFavorites()
        }
      })
    }
  }

  watch(merchantFavorites, persistMerchantFavorites, { deep: true })

  const setProductFavorites = (favorites: FavoriteItem[]) => {
    productFavorites.value = favorites
    favoriteProductIds.value = new Set(favorites.map(favorite => favorite.id))
  }

  const fetchProductFavorites = async () => {
    try {
      loading.value = true
      const response = await apiService.getFavoriteProducts()

      if (!response.success) {
        throw new Error(response.message || 'Erreur lors du chargement des favoris')
      }

      const list = Array.isArray(response.data) ? response.data : []
      setProductFavorites(list.map(mapProductFavorite))
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erreur lors du chargement des favoris'
      emitFavoritesError({
        message,
        operation: 'fetch-products',
        action: {
          label: 'Réessayer',
          callback: async () => {
            await fetchProductFavorites()
          }
        }
      })
    } finally {
      loading.value = false
    }
  }

  const ensureInitialized = async () => {
    if (!merchantsHydrated.value) {
      loadMerchantFavorites()
    }

    if (!initialized.value) {
      await fetchProductFavorites()
      initialized.value = true
    }
  }

  const findMerchantIndex = (id: number) => merchantFavorites.value.findIndex(item => item.id === id)

  const addMerchantFavorite = (payload: Omit<FavoriteItem, 'addedAt' | 'type'>) => {
    const index = findMerchantIndex(payload.id)
    if (index !== -1) {
      emitFavoritesInfo({ message: 'Ce commerçant est déjà dans vos favoris' })
      return { success: false as const, reason: 'already_exists' as const }
    }

    const favorite: FavoriteItem = {
      ...payload,
      type: 'merchant',
      addedAt: new Date().toISOString()
    }

    merchantFavorites.value = [favorite, ...merchantFavorites.value]
    emitFavoritesSuccess({ message: 'Commerçant ajouté à vos favoris' })
    return { success: true as const, data: favorite }
  }

  const removeMerchantFavorite = (id: number) => {
    const index = findMerchantIndex(id)
    if (index === -1) {
      return { success: false as const, reason: 'not_found' as const }
    }

    const [removed] = merchantFavorites.value.splice(index, 1)
    emitFavoritesInfo({ message: `${removed.name} retiré de vos favoris` })
    return { success: true as const }
  }

  const buildFavoriteFromPayload = async (payload: Omit<FavoriteItem, 'addedAt'>) => {
    if (payload.product) {
      const summary: FavoriteProductSummary = {
        id: payload.id,
        name: payload.name,
        description: payload.description ?? null,
        original_price: Number(payload.product.original_price ?? payload.product.discounted_price ?? 0),
        discounted_price: Number(payload.product.discounted_price ?? payload.product.original_price ?? 0),
        discount_percentage: (payload.product as any)?.discount_percentage ?? undefined,
        quantity_available: Number(payload.product.quantity_available ?? 0),
        expiration_date: payload.product.expiration_date ?? undefined,
        image_url: payload.product.image_url ?? undefined,
        is_active: payload.product.is_active,
        favorited_at: new Date().toISOString(),
        category: payload.product.category ?? undefined,
        merchant: payload.merchant ?? undefined
      }

      return mapProductFavorite(summary)
    }

    try {
      const response = await apiService.getProduct(payload.id)
      if (!response.success) {
        throw new Error(response.message || 'Produit introuvable')
      }

      return mapProductFavorite({
        id: response.data.id,
        name: response.data.name,
        description: response.data.description,
        original_price: Number(response.data.original_price ?? 0),
        discounted_price: Number(response.data.discounted_price ?? 0),
        discount_percentage: (response.data as any)?.discount_percentage ?? 0,
        quantity_available: response.data.quantity_available ?? 0,
        expiration_date: response.data.expiration_date ?? null,
        image_url: response.data.image_url ?? null,
        is_active: response.data.is_active,
        favorited_at: new Date().toISOString(),
        category: response.data.category ?? null,
        merchant: response.data.merchant ?? null
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Impossible de récupérer les informations du produit'
      emitFavoritesError({ message })
      return null
    }
  }

  const toggleProductFavorite = async (payload: Omit<FavoriteItem, 'addedAt'>) => {
    await ensureInitialized()

    const alreadyFavorite = favoriteProductIds.value.has(payload.id)

    try {
      const response = await apiService.toggleFavoriteProduct(payload.id)
      if (!response.success) {
        throw new Error(response.message || 'Action favori impossible')
      }

      if (response.is_favorite) {
        if (alreadyFavorite) {
          emitFavoritesInfo({ message: 'Ce panier est déjà dans vos favoris' })
          return { success: true as const }
        }

        const favorite = await buildFavoriteFromPayload(payload)
        if (!favorite) {
          return { success: false as const, reason: 'hydrate_failed' as const }
        }

        productFavorites.value = [favorite, ...productFavorites.value]
        favoriteProductIds.value.add(favorite.id)
        emitFavoritesSuccess({ message: 'Panier ajouté à vos favoris' })
        return { success: true as const, data: favorite }
      }

      if (!alreadyFavorite) {
        // nothing to remove
        return { success: true as const, toggledOff: true as const }
      }

      productFavorites.value = productFavorites.value.filter(item => item.id !== payload.id)
      favoriteProductIds.value.delete(payload.id)
      emitFavoritesInfo({ message: 'Panier retiré de vos favoris' })
      return { success: true as const, toggledOff: true as const }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Impossible de mettre à jour vos favoris'
      emitFavoritesError({
        message,
        operation: 'toggle-product',
        action: {
          label: 'Réessayer',
          callback: async () => {
            await toggleProductFavorite(payload)
          }
        }
      })
      return { success: false as const, reason: 'error' as const }
    }
  }

  const toggleFavorite = async (payload: Omit<FavoriteItem, 'addedAt'>) => {
    if (payload.type === 'merchant') {
      loadMerchantFavorites()
      const index = findMerchantIndex(payload.id)
      if (index === -1) {
        const { type: _type, ...rest } = payload
        return addMerchantFavorite(rest)
      }
      return removeMerchantFavorite(payload.id)
    }

    return toggleProductFavorite(payload)
  }

  const removeFavorite = async (id: number, type: FavoriteType) => {
    if (type === 'merchant') {
      loadMerchantFavorites()
      return removeMerchantFavorite(id)
    }

    if (!favoriteProductIds.value.has(id)) {
      return { success: false as const, reason: 'not_found' as const }
    }

    try {
      const response = await apiService.toggleFavoriteProduct(id)
      if (!response.success) {
        throw new Error(response.message || 'Action favori impossible')
      }

      productFavorites.value = productFavorites.value.filter(item => item.id !== id)
      favoriteProductIds.value.delete(id)
      emitFavoritesInfo({ message: 'Panier retiré de vos favoris' })
      return { success: true as const }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Impossible de retirer ce favori'
      emitFavoritesError({ message })
      return { success: false as const, reason: 'error' as const }
    }
  }

  const isFavorite = (id: number, type: FavoriteType) => {
    if (type === 'product') {
      return favoriteProductIds.value.has(id)
    }

    if (!merchantsHydrated.value) {
      loadMerchantFavorites()
    }

    return merchantFavorites.value.some(item => item.id === id)
  }

  const clearFavorites = async () => {
    await ensureInitialized()

    const productIds = Array.from(favoriteProductIds.value)

    for (const id of productIds) {
      try {
        await apiService.toggleFavoriteProduct(id)
      } catch (error) {
        console.warn('Unable to clear product favorite', id, error)
      }
    }

    setProductFavorites([])
    merchantFavorites.value = []

    emitFavoritesInfo({ message: 'Tous vos favoris ont été effacés' })
  }

  return {
    items,
    loading,
    pendingOperation,
    favoritesCount,
    hasFavorites,
    groupedFavorites,
    initialize: ensureInitialized,
    toggleFavorite,
    removeFavorite,
    isFavorite,
    clearFavorites
  }
})
