import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'

import NotFoundView2025 from '@/views/NotFoundView2025.vue'
import Button from '@/components/ui/2025/Button.vue'
import Card from '@/components/ui/2025/Card.vue'
import EmptyState from '@/components/ui/2025/EmptyState.vue'

vi.mock('vue-router', () => ({
  useRouter: () => ({
    go: vi.fn(),
    push: vi.fn()
  })
}))

describe('NotFoundView (Design System 2025)', () => {
  it('uses 2025 UI primitives and tokens', () => {
    const wrapper = mount(NotFoundView2025, {
      global: {
        stubs: {
          'router-link': { template: '<a><slot /></a>' }
        }
      }
    })

    expect(wrapper.findAllComponents(Button).length).toBeGreaterThan(0)
    expect(wrapper.findComponent(Card).exists()).toBe(true)
    expect(wrapper.findComponent(EmptyState).exists()).toBe(true)
    expect(wrapper.find('.container-2025').exists()).toBe(true)
    expect(wrapper.html()).not.toContain('btn ')
    expect(wrapper.html()).not.toContain('LegacyNotFoundView')
  })
})
