import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useNotifications } from '@/composables/useNotifications'

describe('useNotifications', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    const { clearNotifications } = useNotifications()
    clearNotifications()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('adds and automatically removes notifications after the configured duration', () => {
    const { notifications, notify } = useNotifications()

    const id = notify.success({ message: 'Produit ajouté', duration: 1500 })

    expect(notifications.value).toHaveLength(1)
    expect(notifications.value[0]?.id).toBe(id)

    vi.advanceTimersByTime(1500)

    expect(notifications.value).toHaveLength(0)
  })

  it('executes onClose callback when a notification is removed', () => {
    const { notify, removeNotification } = useNotifications()

    const onClose = vi.fn()

    const id = notify.error({
      message: 'Une erreur est survenue',
      onClose,
      persistent: true
    })

    const removed = removeNotification(id)

    expect(removed).toBe(true)
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('supports actions that keep notifications visible when dismissOnClick is false', () => {
    const { notifications, notify } = useNotifications()

    const handler = vi.fn()

    const id = notify.info({
      message: 'Confirmez votre action',
      action: { label: 'Confirmer', handler, dismissOnClick: false },
      duration: 0
    })

    const notification = notifications.value.find(item => item.id === id)

    expect(notification?.action?.dismissOnClick).toBe(false)
    expect(notification?.action?.handler).toBe(handler)
  })
})
