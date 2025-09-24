import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import type { Product, Merchant } from '@/types'
import { notify } from '@/composables/useNotifications'

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
  const error = ref<string | null>(null)

  const favoritesCount = computed(() => items.value.length)
  const hasFavorites = computed(() => items.value.length > 0)

  const hydrateFromStorage = () => {
    if (isHydrated.value || typeof window === 'undefined') {
      return
    }

    items.value = parseStorage(window.localStorage.getItem(STORAGE_KEY))
    isHydrated.value = true
  }

  const persist = () => {
    if (!isHydrated.value || typeof window === 'undefined') {
      return
    }

    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items.value))
    } catch (storageError) {
      error.value = 'Impossible de sauvegarder vos favoris'
      notify.error(error.value, 'Favoris')
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
      notify.info('Cet élément est déjà dans vos favoris', 'Favoris')
      return { success: false as const, reason: 'already_exists' as const }
    }

    const favorite: FavoriteItem = {
      ...payload,
      addedAt: new Date().toISOString(),
    }

    items.value = [favorite, ...items.value]
    notify.success('Ajouté à vos favoris', 'Favoris')
    return { success: true as const, data: favorite }
  }

  const removeFavorite = (id: number, type: FavoriteType) => {
    hydrateFromStorage()

    const index = findIndex(id, type)
    if (index === -1) {
      notify.error('Élément introuvable dans vos favoris', 'Favoris')
      return { success: false as const, reason: 'not_found' as const }
    }

    const [removed] = items.value.splice(index, 1)
    notify.info(`${removed.name} retiré de vos favoris`, 'Favoris')
    return { success: true as const }
  }

  const toggleFavorite = (payload: Omit<FavoriteItem, 'addedAt'>) => {
    const index = findIndex(payload.id, payload.type)
    if (index === -1) {
      return addFavorite(payload)
    }

    items.value.splice(index, 1)
    notify.info('Retiré de vos favoris', 'Favoris')
    return { success: true as const, toggledOff: true as const }
  }

  const isFavorite = (id: number, type: FavoriteType) => {
    return findIndex(id, type) !== -1
  }

  const clearFavorites = () => {
    items.value = []
    notify.info('Tous vos favoris ont été effacés', 'Favoris')
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
    error,
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
