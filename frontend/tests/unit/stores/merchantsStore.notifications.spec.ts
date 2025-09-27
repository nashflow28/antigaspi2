import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

vi.mock('@/composables/useNotifications', () => {
  const error = vi.fn(() => 'notification-error')
  const info = vi.fn(() => 'notification-info')
  const success = vi.fn(() => 'notification-success')
  return { notify: { error, info, success } }
})

const merchantServiceMocks = vi.hoisted(() => ({
  getMerchants: vi.fn(),
  getMerchantsWithLocation: vi.fn(),
  getMerchantDetail: vi.fn()
}))

vi.mock('@/services/merchantService', () => ({
  merchantService: merchantServiceMocks
}))

import { notify } from '@/composables/useNotifications'
import { useMerchantsStore } from '@/stores/merchants'

describe('merchants store notifications', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('exposes retry callbacks when merchant list fetch fails', async () => {
    merchantServiceMocks.getMerchants.mockRejectedValueOnce(new Error('Network down'))
    merchantServiceMocks.getMerchants.mockResolvedValueOnce({ success: true, data: [] })

    const store = useMerchantsStore()
    const result = await store.fetchMerchants()

    expect(result.success).toBe(false)
    expect(notify.error).toHaveBeenCalledWith(
      'Network down',
      'Commerçants',
      expect.objectContaining({
        action: expect.objectContaining({
          label: 'Réessayer',
          callback: expect.any(Function)
        }),
        onClose: expect.any(Function)
      })
    )
    expect(store.pendingOperation).toBe('fetch-merchants')

    const retryCallback = (notify.error as ReturnType<typeof vi.fn>).mock.calls[0][2].action!.callback
    await retryCallback()

    expect(merchantServiceMocks.getMerchants).toHaveBeenCalledTimes(2)
    expect(store.pendingOperation).toBeNull()

    const onClose = (notify.error as ReturnType<typeof vi.fn>).mock.calls[0][2].onClose
    onClose?.()
    expect(store.pendingOperation).toBeNull()
  })
})
