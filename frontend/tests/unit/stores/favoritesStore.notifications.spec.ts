import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

vi.mock('@/composables/useNotifications', () => {
  const error = vi.fn(() => 'notification-error')
  const info = vi.fn(() => 'notification-info')
  const success = vi.fn(() => 'notification-success')
  return { notify: { error, info, success } }
})

import { notify } from '@/composables/useNotifications'
import { useFavoritesStore } from '@/stores/favorites'

const baseFavorite = {
  id: 42,
  type: 'product' as const,
  name: 'Produit star'
}

describe('favorites store notifications', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('emits retryable notifications when removing a missing favorite', async () => {
    const store = useFavoritesStore()

    const result = store.removeFavorite(baseFavorite.id, baseFavorite.type)
    expect(result.success).toBe(false)

    expect(notify.error).toHaveBeenCalledWith(
      'Élément introuvable dans vos favoris',
      'Favoris',
      expect.objectContaining({
        action: expect.objectContaining({
          label: 'Réessayer',
          callback: expect.any(Function)
        }),
        onClose: expect.any(Function)
      })
    )
    expect(store.pendingOperation).toBe('remove')

    store.addFavorite(baseFavorite)

    const retryCallback = (notify.error as ReturnType<typeof vi.fn>).mock.calls[0][2].action!.callback
    await retryCallback()

    expect(store.pendingOperation).toBeNull()

    const onClose = (notify.error as ReturnType<typeof vi.fn>).mock.calls[0][2].onClose
    onClose?.()
    expect(store.pendingOperation).toBeNull()
  })

  it('emits info notifications when toggling favorites', () => {
    const store = useFavoritesStore()
    store.addFavorite(baseFavorite)

    store.toggleFavorite(baseFavorite)

    expect(notify.info).toHaveBeenCalledWith(
      'Retiré de vos favoris',
      'Favoris',
      expect.objectContaining({ onClose: expect.any(Function) })
    )
    expect(store.pendingOperation).toBeNull()
  })
})
