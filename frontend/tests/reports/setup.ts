import { beforeEach, afterEach, vi } from 'vitest'

const createStorage = () => {
  let store: Record<string, string> = {}
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key]
    }),
    clear: vi.fn(() => {
      store = {}
    })
  }
}

const localStorageMock = createStorage()

Object.defineProperty(window, 'localStorage', {
  configurable: true,
  value: localStorageMock
})

beforeEach(() => {
  localStorageMock.clear()
})

afterEach(() => {
  vi.clearAllMocks()
})

vi.mock('@/composables/useNotifications', () => ({
  notify: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn()
  }
}))
