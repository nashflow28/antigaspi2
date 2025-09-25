import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useNotifications } from '@/composables/useNotifications'

describe('useNotifications', () => {
  beforeEach(() => {
    const { clearAll } = useNotifications()
    clearAll()
    vi.useRealTimers()
    vi.clearAllMocks()
  })

  it('adds a notification and removes it via handleAction', async () => {
    const { addNotification, notifications, handleAction } = useNotifications()

    const onAction = vi.fn()
    const onClose = vi.fn()

    const id = addNotification({
      type: 'success',
      title: 'Succès',
      message: 'Action effectuée',
      autoClose: false,
      action: {
        label: 'Annuler',
        callback: onAction
      },
      onClose
    })

    expect(notifications.value).toHaveLength(1)

    await handleAction(id)

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

  it('auto closes notifications when duration elapses', () => {
    vi.useFakeTimers()

    const { addNotification, notifications } = useNotifications()
    const onClose = vi.fn()

    addNotification({
      type: 'info',
      title: 'Synchro',
      message: 'Synchronisation en cours',
      duration: 200,
      onClose
    })

    expect(notifications.value).toHaveLength(1)

    vi.advanceTimersByTime(200)
    vi.runOnlyPendingTimers()

    expect(onClose).toHaveBeenCalledTimes(1)
    expect(notifications.value).toHaveLength(0)
  })

  it('respects autoClose false and keeps the notification in the stack', () => {
    vi.useFakeTimers()

    const { addNotification, notifications } = useNotifications()

    addNotification({
      type: 'warning',
      title: 'Attention',
      message: 'Action requise',
      autoClose: false,
      duration: 200
    })

    vi.advanceTimersByTime(2000)

    expect(notifications.value).toHaveLength(1)
  })

  it('is idempotent when removeNotification is called multiple times', () => {
    const { addNotification, removeNotification } = useNotifications()

    const onClose = vi.fn()

    const id = addNotification({
      type: 'info',
      message: 'Mise à jour',
      autoClose: false,
      onClose
    })

    removeNotification(id)
    removeNotification(id)

    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('clearAll removes every notification and cancels timers', () => {
    vi.useFakeTimers()

    const { addNotification, notifications, clearAll } = useNotifications()

    const onCloseA = vi.fn()
    const onCloseB = vi.fn()

    addNotification({ type: 'success', message: 'Réservation confirmée', onClose: onCloseA })
    addNotification({ type: 'info', message: 'Produit ajouté', onClose: onCloseB })

    expect(notifications.value).toHaveLength(2)

    clearAll()

    expect(onCloseA).toHaveBeenCalledTimes(1)
    expect(onCloseB).toHaveBeenCalledTimes(1)
    expect(notifications.value).toHaveLength(0)

    vi.runAllTimers()
  })

  it('exposes helper shortcuts with expected defaults', () => {
    const { success, error, warning, info, notifications } = useNotifications()

    const successId = success('Panier validé', 'Succès')
    const errorId = error('Erreur critique', 'Erreur', { autoClose: true })
    const warningId = warning('Quota bientôt atteint')
    const infoId = info('Information importante', undefined, { duration: 1000 })

    const payloads = notifications.value.reduce<Record<string, any>>((acc, item) => {
      acc[item.id] = item
      return acc
    }, {})

    expect(payloads[successId].type).toBe('success')
    expect(payloads[warningId].type).toBe('warning')
    expect(payloads[infoId].duration).toBe(1000)
    expect(payloads[errorId].autoClose).toBe(true)
  })
})
