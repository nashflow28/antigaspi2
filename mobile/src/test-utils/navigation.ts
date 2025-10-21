/**
 * Navigation Mock Helpers
 *
 * Provides centralized navigation mocks for testing React Navigation components
 *
 * @example
 * ```typescript
 * import { createMockNavigation, createMockRoute } from '../test-utils'
 *
 * const navigation = createMockNavigation()
 * const route = createMockRoute({ productId: 1 })
 *
 * render(<ProductDetailsScreen navigation={navigation} route={route} />)
 * ```
 */

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

export interface MockRoute<T = Record<string, any>> {
  key: string
  name: string
  params?: T
  path?: string
}

/**
 * Create a mock navigation object with all common navigation methods
 *
 * @param overrides - Optional overrides for specific methods
 * @returns Mock navigation object with jest.fn() for all methods
 *
 * @example
 * ```typescript
 * const navigation = createMockNavigation({
 *   navigate: jest.fn((screen, params) => {
 *     console.log(`Navigating to ${screen}`, params)
 *   })
 * })
 * ```
 */
export const createMockNavigation = (overrides: Partial<MockNavigation> = {}): MockNavigation => {
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
    addListener: jest.fn(() => jest.fn()), // Returns unsubscribe function
    removeListener: jest.fn(),
    ...overrides,
  }
}

/**
 * Create a mock route object with params
 *
 * @param params - Route parameters
 * @param options - Additional route options (name, key, path)
 * @returns Mock route object
 *
 * @example
 * ```typescript
 * const route = createMockRoute(
 *   { productId: 1, merchantId: 2 },
 *   { name: 'ProductDetails' }
 * )
 * ```
 */
export const createMockRoute = <T = Record<string, any>>(
  params?: T,
  options: { name?: string; key?: string; path?: string } = {}
): MockRoute<T> => {
  return {
    key: options.key || `test-route-${Date.now()}`,
    name: options.name || 'TestScreen',
    params,
    path: options.path,
  }
}

/**
 * Helper to assert navigation was called with correct params
 *
 * @example
 * ```typescript
 * fireEvent.press(productCard)
 *
 * expectNavigationCalled(mockNavigation, 'ProductDetails', { productId: 1 })
 * ```
 */
export const expectNavigationCalled = (
  navigation: MockNavigation,
  screen: string,
  params?: Record<string, any>
) => {
  if (params) {
    expect(navigation.navigate).toHaveBeenCalledWith(screen, params)
  } else {
    expect(navigation.navigate).toHaveBeenCalledWith(screen)
  }
}

/**
 * Helper to reset all navigation mocks
 *
 * @example
 * ```typescript
 * beforeEach(() => {
 *   resetNavigationMocks(mockNavigation)
 * })
 * ```
 */
export const resetNavigationMocks = (navigation: MockNavigation) => {
  Object.values(navigation).forEach((mock) => {
    if (typeof mock === 'function' && 'mockClear' in mock) {
      mock.mockClear()
    }
  })
}
