import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import DashboardView from '@/views/DashboardView.vue'
import Card from '@/components/ui/2025/Card.vue'
import Badge from '@/components/ui/2025/Badge.vue'
import Button from '@/components/ui/2025/Button.vue'

vi.mock('vue-router', () => ({
  useRouter: () => ({ push: vi.fn() })
}))

vi.mock('@/components/ui/DashboardLayout.vue', () => ({
  default: { template: '<div><slot /></div>' }
}))

vi.mock('@/composables/useDashboardLayout', () => ({
  useDashboardLayout: () => ({ sidebar: [], header: [] })
}))

vi.mock('@/stores/auth', () => ({
  useAuthStore: () => ({
    user: { first_name: 'Camille' },
    token: 'mock-token',
    isAuthenticated: true
  })
}))

vi.mock('@/stores/wallet', () => ({
  useWalletStore: () => ({
    formattedBalance: '25 000 XOF',
    isActive: true,
    fetchWallet: vi.fn()
  })
}))

describe('DashboardView (Design System 2025)', () => {
  beforeEach(() => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ success: true, data: [] })
    }) as unknown as typeof fetch
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('renders using 2025 UI components and tokens', async () => {
    const wrapper = mount(DashboardView, {
      global: {
        stubs: {
          'router-link': { template: '<a><slot /></a>' }
        }
      }
    })

    await flushPromises()

    expect(wrapper.findAllComponents(Card).length).toBeGreaterThan(0)
    expect(wrapper.findAllComponents(Badge).length).toBeGreaterThan(0)
    expect(wrapper.findAllComponents(Button).length).toBeGreaterThan(0)

    // DashboardView uses standard container class
    expect(wrapper.find('.container').exists()).toBe(true)
    expect(wrapper.find('.surface-panel').exists()).toBe(true)
    expect(wrapper.html()).not.toContain('class="card')
    expect(wrapper.html()).not.toContain('class="btn')
  })
})

