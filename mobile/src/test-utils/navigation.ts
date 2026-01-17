export interface MockNavigation {
  navigate: jest.Mock
  goBack: jest.Mock
  setOptions: jest.Mock
  push: jest.Mock
  pop: jest.Mock
  popToTop: jest.Mock
  replace: jest.Mock
  reset: jest.Mock
  setParams: jest.Mock
  dispatch: jest.Mock
  isFocused: jest.Mock
  canGoBack: jest.Mock
  getId: jest.Mock
  getState: jest.Mock
  getParent: jest.Mock
  addListener: jest.Mock
  removeListener: jest.Mock
}

export interface MockRoute<T = Record<string, unknown>> {
  key: string
  name: string
  params?: T
  path?: string
}

export function createMockNavigation(overrides: Partial<MockNavigation> = {}): MockNavigation {
  return {
    navigate: jest.fn(),
    goBack: jest.fn(),
    setOptions: jest.fn(),
    push: jest.fn(),
    pop: jest.fn(),
    popToTop: jest.fn(),
    replace: jest.fn(),
    reset: jest.fn(),
    setParams: jest.fn(),
    dispatch: jest.fn(),
    isFocused: jest.fn(() => true),
    canGoBack: jest.fn(() => true),
    getId: jest.fn(() => 'test-screen-id'),
    getState: jest.fn(() => ({ routes: [], index: 0 })),
    getParent: jest.fn(() => undefined),
    addListener: jest.fn(() => jest.fn()),
    removeListener: jest.fn(),
    ...overrides,
  }
}

export function createMockRoute<T = Record<string, unknown>>(
  params?: T,
  options: { name?: string; key?: string; path?: string } = {}
): MockRoute<T> {
  return {
    key: options.key || `test-route-${Date.now()}`,
    name: options.name || 'TestScreen',
    params,
    path: options.path,
  }
}

export function expectNavigationCalled(
  navigation: MockNavigation,
  screen: string,
  params?: Record<string, unknown>
): void {
  if (params) {
    expect(navigation.navigate).toHaveBeenCalledWith(screen, params)
  } else {
    expect(navigation.navigate).toHaveBeenCalledWith(screen)
  }
}

export function resetNavigationMocks(navigation: MockNavigation): void {
  Object.values(navigation).forEach((mock) => {
    if (typeof mock === 'function' && 'mockClear' in mock) {
      mock.mockClear()
    }
  })
}
