import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

vi.mock('@/composables/useNotifications', () => {
  const error = vi.fn(() => 'notification-error')
  const info = vi.fn(() => 'notification-info')
  const success = vi.fn(() => 'notification-success')
  return { notify: { error, info, success } }
})

vi.mock('@/services/api', () => ({
  apiService: {
    toggleFavoriteProduct: vi.fn(),
    getFavoriteProducts: vi.fn().mockResolvedValue({ success: true, data: [] }),
    getProduct: vi.fn()
  }
}))

import { notify } from '@/composables/useNotifications'
import { useFavoritesStore } from '@/stores/favorites'

const baseMerchantFavorite = {
  id: 42,
  type: 'merchant' as const,
  name: 'Commerçant Star'
}

describe('favorites store notifications', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    // Clear localStorage for merchant favorites
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem('antigaspi_favorite_merchants')
    }
  })

  it('returns not_found when removing a missing merchant favorite', async () => {
    const store = useFavoritesStore()

    // removeFavorite for merchant returns {success: false, reason: 'not_found'} when not in list
    const result = await store.removeFavorite(baseMerchantFavorite.id, baseMerchantFavorite.type)
    expect(result.success).toBe(false)
    expect(result.reason).toBe('not_found')
  })

  it('emits info notifications when removing merchant favorites via toggleFavorite', async () => {
    const store = useFavoritesStore()

    // First add the merchant using toggleFavorite (which calls addMerchantFavorite)
    await store.toggleFavorite(baseMerchantFavorite)

    // Clear mocks to check next notification
    vi.clearAllMocks()

    // Now toggle again to remove
    await store.toggleFavorite(baseMerchantFavorite)

    expect(notify.info).toHaveBeenCalledWith(
      expect.stringContaining('retiré de vos favoris'),
      'Favoris',
      expect.objectContaining({ onClose: expect.any(Function) })
    )
  })

  it('emits success notification when adding merchant favorite', async () => {
    const store = useFavoritesStore()

    await store.toggleFavorite(baseMerchantFavorite)

    expect(notify.success).toHaveBeenCalledWith(
      'Commerçant ajouté à vos favoris',
      'Favoris',
      expect.objectContaining({ onClose: expect.any(Function) })
    )
  })
})
