import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import type { Product, Merchant } from '@/types'
import { notify, type Notification } from '@/composables/useNotifications'

export type FavoriteType = 'product' | 'merchant'

export interface FavoriteItem {
  id: number
  type: FavoriteType
  name: string
  description?: string | null
  imageUrl?: string | null
  merchant?: Merchant | null
  product?: Product | null
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

const STORAGE_KEY = 'antigaspi_favorites'

const parseStorage = (raw: string | null): FavoriteItem[] => {
  if (!raw) {
    return []
  }

  try {
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) {
      return []
    }

    return parsed.map(item => ({
      ...item,
      addedAt: item.addedAt || new Date().toISOString()
    })) as FavoriteItem[]
  } catch (error) {
    console.warn('Unable to parse favorites from storage', error)
    return []
  }
}

export const useFavoritesStore = defineStore('favorites', () => {
  const items = ref<FavoriteItem[]>([])
  const isHydrated = ref(false)
  const loading = ref(false)
  const pendingOperation = ref<string | null>(null)

  const favoritesCount = computed(() => items.value.length)
  const hasFavorites = computed(() => items.value.length > 0)

  const hydrateFromStorage = () => {
    if (isHydrated.value || typeof window === 'undefined') {
      return
    }

    items.value = parseStorage(window.localStorage.getItem(STORAGE_KEY))
    isHydrated.value = true
  }

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
          },
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
      onClose: wrappedOnClose,
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

  const persist = () => {
    if (!isHydrated.value || typeof window === 'undefined') {
      return
    }

    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items.value))
      if (pendingOperation.value === 'persist') {
        pendingOperation.value = null
      }
    } catch (storageError) {
      emitFavoritesError({
        message: 'Impossible de sauvegarder vos favoris',
        operation: 'persist',
        action: {
          label: 'Réessayer',
          callback: () => persist(),
        },
      })
    }
  }

  watch(items, persist, { deep: true })

  const findIndex = (id: number, type: FavoriteType) => {
    return items.value.findIndex(item => item.id === id && item.type === type)
  }

  const addFavorite = (payload: Omit<FavoriteItem, 'addedAt'>) => {
    hydrateFromStorage()

    const existingIndex = findIndex(payload.id, payload.type)
    if (existingIndex !== -1) {
      emitFavoritesInfo({
        message: 'Cet élément est déjà dans vos favoris',
      })
      return { success: false as const, reason: 'already_exists' as const }
    }

    const favorite: FavoriteItem = {
      ...payload,
      addedAt: new Date().toISOString(),
    }

    items.value = [favorite, ...items.value]
    emitFavoritesSuccess({
      message: 'Ajouté à vos favoris',
    })
    return { success: true as const, data: favorite }
  }

  const removeFavorite = (id: number, type: FavoriteType) => {
    hydrateFromStorage()

    const index = findIndex(id, type)
    if (index === -1) {
      emitFavoritesError({
        message: 'Élément introuvable dans vos favoris',
        operation: 'remove',
        action: {
          label: 'Réessayer',
          callback: async () => {
            removeFavorite(id, type)
          },
        },
      })
      return { success: false as const, reason: 'not_found' as const }
    }

    const [removed] = items.value.splice(index, 1)
    if (pendingOperation.value === 'remove') {
      pendingOperation.value = null
    }
    emitFavoritesInfo({
      message: `${removed.name} retiré de vos favoris`,
    })
    return { success: true as const }
  }

  const toggleFavorite = (payload: Omit<FavoriteItem, 'addedAt'>) => {
    const index = findIndex(payload.id, payload.type)
    if (index === -1) {
      return addFavorite(payload)
    }

    items.value.splice(index, 1)
    emitFavoritesInfo({
      message: 'Retiré de vos favoris',
    })
    return { success: true as const, toggledOff: true as const }
  }

  const isFavorite = (id: number, type: FavoriteType) => {
    return findIndex(id, type) !== -1
  }

  const clearFavorites = () => {
    items.value = []
    emitFavoritesInfo({
      message: 'Tous vos favoris ont été effacés',
    })
  }

  const groupedFavorites = computed(() => {
    return items.value.reduce(
      (groups, item) => {
        groups[item.type].push(item)
        return groups
      },
      { product: [] as FavoriteItem[], merchant: [] as FavoriteItem[] }
    )
  })

  return {
    items,
    loading,
    pendingOperation,
    favoritesCount,
    hasFavorites,
    groupedFavorites,
    hydrateFromStorage,
    addFavorite,
    removeFavorite,
    toggleFavorite,
    isFavorite,
    clearFavorites,
  }
})
