import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'

import NotFoundView from '@/views/NotFoundView.vue'
import Button from '@/components/ui/2025/Button.vue'

vi.mock('vue-router', () => ({
  useRouter: () => ({
    go: vi.fn(),
    push: vi.fn()
  })
}))

describe('NotFoundView (Design System 2025)', () => {
  it('uses 2025 UI primitives and tokens', () => {
    const wrapper = mount(NotFoundView, {
      global: {
        stubs: {
          'router-link': { template: '<a><slot /></a>' }
        }
      }
    })

    expect(wrapper.findAllComponents(Button).length).toBeGreaterThan(0)
    expect(wrapper.find('.container-2025').exists()).toBe(true)
    expect(wrapper.html()).not.toContain('btn ')
  })
})
