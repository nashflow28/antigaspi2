import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import Button from '@/components/ui/2025/Button.vue'

// Mock lucide-vue-next icons
vi.mock('lucide-vue-next', () => ({
  Loader2: {
    name: 'Loader2',
    template: '<div class="mock-loader2" />'
  }
}))

describe('Button Component 2025', () => {
  it('should render correctly with default props', () => {
    const wrapper = mount(Button, {
      slots: {
        default: 'Click me'
      }
    })

    expect(wrapper.find('button').exists()).toBe(true)
    expect(wrapper.text()).toContain('Click me')
  })

  it('should apply correct variant classes', () => {
    const wrapper = mount(Button, {
      props: {
        variant: 'primary'
      },
      slots: {
        default: 'Primary Button'
      }
    })

    const button = wrapper.find('button')
    expect(button.classes()).toContain('bg-gradient-to-r')
    // Button uses from-primary-500 in DS2025
    expect(button.classes()).toContain('from-primary-500')
  })

  it('should apply correct size classes', () => {
    const wrapper = mount(Button, {
      props: {
        size: 'lg'
      },
      slots: {
        default: 'Large Button'
      }
    })

    const button = wrapper.find('button')
    // DS2025 uses custom spacing tokens: px-lg, py-lg
    expect(button.classes()).toContain('px-lg')
    expect(button.classes()).toContain('py-lg')
  })

  it('should handle disabled state correctly', () => {
    const wrapper = mount(Button, {
      props: {
        disabled: true
      },
      slots: {
        default: 'Disabled Button'
      }
    })

    const button = wrapper.find('button')
    expect(button.attributes('disabled')).toBeDefined()
    expect(button.classes()).toContain('opacity-50')
  })

  it('should show loading state correctly', () => {
    const wrapper = mount(Button, {
      props: {
        loading: true
      },
      slots: {
        default: 'Loading Button'
      }
    })

    expect(wrapper.find('.mock-loader2').exists()).toBe(true)
  })

  it('should emit click events', async () => {
    const wrapper = mount(Button, {
      slots: {
        default: 'Clickable Button'
      }
    })

    await wrapper.find('button').trigger('click')
    expect(wrapper.emitted()).toHaveProperty('click')
  })

  it('should not emit click when disabled', async () => {
    const wrapper = mount(Button, {
      props: {
        disabled: true
      },
      slots: {
        default: 'Disabled Button'
      }
    })

    await wrapper.find('button').trigger('click')
    expect(wrapper.emitted('click')).toBeFalsy()
  })

  it('should render as different HTML tags', () => {
    const linkWrapper = mount(Button, {
      props: {
        tag: 'a',
        href: 'https://example.com'
      },
      slots: {
        default: 'Link Button'
      }
    })

    expect(linkWrapper.find('a').exists()).toBe(true)
    expect(linkWrapper.find('a').attributes('href')).toBe('https://example.com')
  })

  it('should render full width when specified', () => {
    const wrapper = mount(Button, {
      props: {
        fullWidth: true
      },
      slots: {
        default: 'Full Width Button'
      }
    })

    expect(wrapper.find('button').classes()).toContain('w-full')
  })

  it('should handle different variants', () => {
    const secondaryWrapper = mount(Button, {
      props: {
        variant: 'secondary'
      },
      slots: {
        default: 'Secondary Button'
      }
    })

    // DS2025 uses bg-surface-light for secondary variant
    expect(secondaryWrapper.find('button').classes()).toContain('bg-surface-light')
  })
})
