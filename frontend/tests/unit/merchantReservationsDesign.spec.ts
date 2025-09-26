import { mount, flushPromises } from '@vue/test-utils'
import { computed } from 'vue'
import ReservationsView from '@/views/merchant/ReservationsView.vue'
import Button from '@/components/ui/2025/Button.vue'

vi.mock('@/components/ui/DashboardLayout.vue', () => ({
  default: {
    name: 'DashboardLayoutStub',
    props: ['sidebar', 'header'],
    template: '<div data-test="dashboard-layout"><slot /></div>'
  }
}))

vi.mock('@/stores/auth', () => ({
  useAuthStore: () => ({
    token: 'test-token'
  })
}))

vi.mock('@/composables/useDashboardLayout', () => ({
  useDashboardLayout: () => ({
    sidebar: computed(() => ({ brand: null, navigation: [] })),
    header: computed(() => ({ user: { name: 'Test User', email: 'test@example.com' } }))
  })
}))

describe('Merchant ReservationsView design system 2025 integration', () => {
  beforeEach(() => {
    global.fetch = vi.fn(async () => ({
      ok: true,
      json: async () => ({ success: true, data: [] })
    })) as unknown as typeof fetch
  })

  afterEach(() => {
    vi.restoreAllMocks()
    ;(globalThis as any).fetch = undefined
  })

  it('does not render legacy utility classes', async () => {
    const wrapper = mount(ReservationsView, {
      global: {
        stubs: {
          transition: false
        }
      }
    })

    await flushPromises()

    const html = wrapper.html()

    expect(html).not.toContain('class="btn')
    expect(html).not.toContain('btn-')
    expect(html).not.toMatch(/class="card(\s|"|')/)
    expect(html).not.toContain('glass-bg')
    expect(html).not.toContain('container-fluid')

    expect(wrapper.findAll('.card-2025').length).toBeGreaterThan(0)
    expect(wrapper.findComponent(Button).exists()).toBe(true)
  })
})
