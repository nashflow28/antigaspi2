import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'

import NotificationSystem from '@/components/ui/NotificationSystem.vue'
import Toast from '@/components/ui/Toast.vue'
import { useNotifications } from '@/composables/useNotifications'

describe('NotificationSystem', () => {
  beforeEach(() => {
    const { clearAll } = useNotifications()
    clearAll()
  })

  it('renders notifications from the composable and triggers action callbacks', async () => {
    const { addNotification, notifications } = useNotifications()

    const onAction = vi.fn()
    const onClose = vi.fn()

    addNotification({
      type: 'success',
      title: 'Réservation confirmée',
      message: 'Votre panier est prêt.',
      autoClose: false,
      action: {
        label: 'Voir',
        callback: onAction
      },
      onClose
    })

    const wrapper = mount(NotificationSystem, {
      global: {
        stubs: {
          teleport: true,
          transition: false,
          'transition-group': false
        }
      }
    })

    await nextTick()

    let toasts = wrapper.findAllComponents(Toast)
    expect(toasts).toHaveLength(1)
    expect(toasts[0].text()).toContain('Réservation confirmée')

    const actionButton = toasts[0]
      .findAll('button')
      .find(button => button.text() === 'Voir')

    expect(actionButton).toBeDefined()
    await actionButton?.trigger('click')

    await nextTick()

    expect(onAction).toHaveBeenCalledTimes(1)
    expect(onClose).toHaveBeenCalledTimes(1)
    expect(notifications.value).toHaveLength(0)

    addNotification({
      type: 'error',
      title: 'Erreur',
      message: 'Une erreur est survenue',
      autoClose: false,
      onClose
    })

    await nextTick()

    toasts = wrapper.findAllComponents(Toast)
    expect(toasts).toHaveLength(1)

    const closeButton = toasts[0].find('button[aria-label="Fermer la notification"]')
    await closeButton.trigger('click')

    await nextTick()

    expect(onClose).toHaveBeenCalledTimes(2)
    expect(notifications.value).toHaveLength(0)
  })
})

