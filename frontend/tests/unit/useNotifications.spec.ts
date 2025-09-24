import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useNotifications } from '@/composables/useNotifications'

describe('useNotifications', () => {
  beforeEach(() => {
    const { clearAll } = useNotifications()
    clearAll()
    vi.clearAllMocks()
  })

  it('adds a notification and removes it via handleAction', () => {
    const { addNotification, notifications, handleAction } = useNotifications()

    const onAction = vi.fn()
    const onClose = vi.fn()

    const id = addNotification({
      type: 'success',
      title: 'Succès',
      message: 'Action effectuée',
      autoClose: false,
      actionLabel: 'Annuler',
      onAction,
      onClose
    })

    expect(notifications.value).toHaveLength(1)

    handleAction(id)

    expect(onAction).toHaveBeenCalledTimes(1)
    expect(onClose).toHaveBeenCalledTimes(1)
    expect(notifications.value).toHaveLength(0)
  })

  it('clears notification and triggers onClose when removed manually', () => {
    const { addNotification, notifications, removeNotification } = useNotifications()

    const onClose = vi.fn()

    const id = addNotification({
      type: 'error',
      title: 'Erreur',
      message: 'Une erreur est survenue',
      autoClose: false,
      onClose
    })

    expect(notifications.value).toHaveLength(1)

    removeNotification(id)

    expect(onClose).toHaveBeenCalledTimes(1)
    expect(notifications.value).toHaveLength(0)
  })
})
