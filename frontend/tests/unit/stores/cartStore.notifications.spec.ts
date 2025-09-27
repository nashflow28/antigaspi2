import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

vi.mock('@/composables/useNotifications', () => {
  const error = vi.fn(() => 'notification-error')
  const info = vi.fn(() => 'notification-info')
  const success = vi.fn(() => 'notification-success')
  return { notify: { error, info, success } }
})

import { notify } from '@/composables/useNotifications'
import { useCartStore } from '@/stores/cart'

describe('cart store notifications', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('emits a retryable notification when updating a missing item', async () => {
    const store = useCartStore()

    const result = store.updateQuantity(42, 3)
    expect(result.success).toBe(false)

    expect(notify.error).toHaveBeenCalledWith(
      'Article introuvable dans le panier',
      'Panier',
      expect.objectContaining({
        action: expect.objectContaining({
          label: 'Réessayer',
          callback: expect.any(Function)
        }),
        onClose: expect.any(Function)
      })
    )
    expect(store.pendingOperation).toBe('update-quantity')

    store.addItem({ id: 42, name: 'Produit test', price: 5, silent: true })

    const retryCallback = (notify.error as ReturnType<typeof vi.fn>).mock.calls[0][2].action!.callback
    await retryCallback()

    expect(store.pendingOperation).toBeNull()
    expect((notify.error as ReturnType<typeof vi.fn>).mock.calls).toHaveLength(1)

    const onClose = (notify.error as ReturnType<typeof vi.fn>).mock.calls[0][2].onClose
    onClose?.()
    expect(store.pendingOperation).toBeNull()
  })

  it('emits an info notification when an item is removed', () => {
    const store = useCartStore()
    store.addItem({ id: 7, name: 'Produit info', price: 3, silent: true })

    store.removeItem(7)

    expect(notify.info).toHaveBeenCalledWith(
      'Article retiré du panier',
      'Panier',
      expect.objectContaining({ onClose: expect.any(Function) })
    )
    expect(store.pendingOperation).toBeNull()
  })
})
