import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { defineComponent, h, nextTick } from 'vue'

import { Button, Card, Input, Textarea, Modal } from '@/components/ui/2025'

describe('UI Components', () => {
  describe('Button', () => {
    it('renders primary variant by default', () => {
      const wrapper = mount(Button, {
        slots: {
          default: 'Découvrir'
        }
      })

      const button = wrapper.find('button')
      // DS2025 Button uses bg-gradient-to-r with from-primary-500
      expect(button.classes()).toContain('bg-gradient-to-r')
      expect(button.classes()).toContain('from-primary-500')
      expect(button.classes()).toContain('text-white')
    })

    it('applies secondary variant and loading state styles', () => {
      const wrapper = mount(Button, {
        props: {
          variant: 'secondary',
          loading: true
        },
        slots: {
          default: 'Charger'
        }
      })

      const button = wrapper.find('button')
      // DS2025 Button uses cursor-wait when loading
      expect(button.classes()).toContain('cursor-wait')
      // DS2025 secondary variant uses bg-surface-light
      expect(button.classes()).toContain('bg-surface-light')
      // Loading spinner should be present
      expect(wrapper.find('.animate-spin').exists()).toBe(true)
    })
  })

  describe('Card', () => {
    it('supports glass variant with backdrop blur', () => {
      const wrapper = mount(Card, {
        props: {
          variant: 'glass'
        },
        slots: {
          default: '<p>Contenu</p>'
        }
      })

      // DS2025 Card glass variant uses bg-surface-light/70 and backdrop-blur-xl
      expect(wrapper.classes()).toContain('bg-surface-light/70')
      expect(wrapper.classes()).toContain('backdrop-blur-xl')
      // Default padding is p-6
      expect(wrapper.classes()).toContain('p-6')
    })
  })

  describe('Input', () => {
    const Icon = defineComponent({
      name: 'DummyIcon',
      render() {
        return h('svg')
      }
    })

    it('renders label, helper text and updates value', async () => {
      const wrapper = mount(Input, {
        props: {
          label: 'Email',
          helpText: 'Nous ne partagerons jamais votre email',
          modelValue: '',
          leftIcon: Icon
        }
      })

      // Check that help text is rendered
      expect(wrapper.text()).toContain('Nous ne partagerons jamais votre email')

      const input = wrapper.find('input')
      await input.setValue('test@antigaspi.fr')
      expect(wrapper.emitted()['update:modelValue']?.[0]).toEqual(['test@antigaspi.fr'])
    })

    it('shows error state with accent border', () => {
      const wrapper = mount(Input, {
        props: {
          label: 'Nom',
          error: 'Champ obligatoire',
          modelValue: ''
        }
      })

      // Error border is on the container div, not the input
      const container = wrapper.find('.border-accent-red')
      expect(container.exists()).toBe(true)
      expect(wrapper.text()).toContain('Champ obligatoire')
    })
  })

  describe('Textarea', () => {
    it('renders helper text and error styles', async () => {
      const wrapper = mount(Textarea, {
        props: {
          label: 'Message',
          helperText: 'Partagez les détails utiles',
          modelValue: ''
        }
      })

      expect(wrapper.text()).toContain('Partagez les détails utiles')

      await wrapper.setProps({ error: 'Ce champ est requis' })
      const textarea = wrapper.find('textarea')
      // DS2025 Textarea uses border-red-600 for errors
      expect(textarea.classes()).toContain('border-red-600')
      expect(wrapper.text()).toContain('Ce champ est requis')
    })
  })

  describe('Modal', () => {
    let originalOverflow: string

    beforeEach(() => {
      originalOverflow = document.body.style.overflow
    })

    afterEach(() => {
      document.body.style.overflow = originalOverflow
    })

    it('renders content and closes on overlay click', async () => {
      const wrapper = mount(Modal, {
        props: {
          modelValue: true,
          title: 'Confirmation',
          description: 'Êtes-vous sûr ? '
        },
        slots: {
          default: '<p>Contenu principal</p>',
          footer: '<button>Action</button>'
        },
        attachTo: document.body,
        global: {
          stubs: {
            Teleport: true,
            Transition: false
          }
        }
      })

      await flushPromises()
      await nextTick()

      // Modal should be rendered with content
      expect(wrapper.text()).toContain('Confirmation')

      // Find and click the overlay (has fixed class and inset-0)
      const overlay = wrapper.find('.fixed.inset-0')
      expect(overlay.exists()).toBe(true)

      await overlay.trigger('click')
      expect(wrapper.emitted()['update:modelValue']).toBeTruthy()
      expect(wrapper.emitted()['update:modelValue']?.[0]).toEqual([false])

      wrapper.unmount()
    })

    it('responds to escape key when enabled', async () => {
      const wrapper = mount(Modal, {
        props: {
          modelValue: true,
          closeOnEscape: true
        },
        attachTo: document.body,
        global: {
          stubs: {
            Teleport: true,
            Transition: false
          }
        }
      })

      await flushPromises()

      const event = new KeyboardEvent('keydown', { key: 'Escape' })
      document.dispatchEvent(event)

      await nextTick()

      // Modal should emit close events
      expect(wrapper.emitted()['escape']).toBeTruthy()
      expect(wrapper.emitted()['update:modelValue']).toBeTruthy()

      wrapper.unmount()
    })
  })
})
