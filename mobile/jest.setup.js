// Jest setup file for React Native Testing Library
// Note: @testing-library/jest-native is deprecated in favor of built-in matchers
// import '@testing-library/jest-native/extend-expect'

// Mock environment variables
process.env.API_BASE_URL = 'http://localhost:8000/api'
process.env.API_TIMEOUT = '30000'

// Mock Expo Winter Runtime Registry (fixes import meta issue)
global.__ExpoImportMetaRegistry = {
  get: () => undefined,
  set: () => {},
}

// Mock structuredClone for Expo Winter runtime
if (typeof global.structuredClone === 'undefined') {
  global.structuredClone = (obj) => JSON.parse(JSON.stringify(obj))
}

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(() => Promise.resolve()),
  getItem: jest.fn(() => Promise.resolve(null)),
  removeItem: jest.fn(() => Promise.resolve()),
  clear: jest.fn(() => Promise.resolve()),
}))

// Mock expo-notifications
jest.mock('expo-notifications', () => ({
  setNotificationHandler: jest.fn(),
  getPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
  requestPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
}))

// Mock react-native-svg
jest.mock('react-native-svg', () => {
  const React = require('react')
  return {
    Svg: ({ children }) => React.createElement('Svg', null, children),
    Path: () => React.createElement('Path'),
    Circle: () => React.createElement('Circle'),
    Rect: () => React.createElement('Rect'),
  }
})

// Silence the warning: Animated: `useNativeDriver` is not supported
// This is handled by jest-expo preset

// Mock Appearance for theme testing
global.appearance = {
  getColorScheme: () => 'light',
  addChangeListener: () => ({ remove: () => {} }),
}

// Mock ToastContext to fix "useToast must be used within a ToastProvider" errors
jest.mock('./src/contexts/ToastContext', () => ({
  useToast: () => ({
    showSuccess: jest.fn(),
    showError: jest.fn(),
    showInfo: jest.fn(),
    showWarning: jest.fn(),
  }),
  ToastProvider: ({ children }) => children,
}))

// Mock API_BASE_URL export to fix imageHelpers.ts errors
jest.mock('./src/services/api', () => {
  const actualModule = jest.requireActual('./src/services/api')
  return {
    ...actualModule,
    API_BASE_URL: 'http://localhost:8000/api',
  }
})

// Mock react-native-maps to avoid native dependency during tests
jest.mock('react-native-maps', () => {
  const React = require('react')
  const { View } = require('react-native')

  const MockMapView = ({ children, testID = 'mock-map-view', ...props }) =>
    React.createElement(View, { testID, ...props }, children)

  const MockMarker = ({ children, testID = 'mock-map-marker', ...props }) =>
    React.createElement(View, { testID, ...props }, children)

  const MockCallout = ({ children, testID = 'mock-map-callout', ...props }) =>
    React.createElement(View, { testID, ...props }, children)

  return {
    __esModule: true,
    default: MockMapView,
    Marker: MockMarker,
    Callout: MockCallout,
    PROVIDER_GOOGLE: 'google',
  }
})

// Mock NetInfo to avoid native module errors during tests
jest.mock('@react-native-community/netinfo', () => {
  const mockState = {
    type: 'wifi',
    isConnected: true,
    isInternetReachable: true,
    details: null,
  }

  return {
    __esModule: true,
    default: {
      addEventListener: jest.fn(() => jest.fn()),
      fetch: jest.fn(() => Promise.resolve(mockState)),
    },
    addEventListener: jest.fn(() => jest.fn()),
    fetch: jest.fn(() => Promise.resolve(mockState)),
    useNetInfo: jest.fn(() => mockState),
  }
})

// Default mock for location service (can be overridden in specific tests)
jest.mock('./src/services/locationService', () => {
  const mockService = {
    hasLocationPermission: jest.fn(() => Promise.resolve(false)),
    requestLocationPermission: jest.fn(() => Promise.resolve(false)),
    getCurrentPosition: jest.fn(() => Promise.resolve(null)),
    calculateDistance: jest.fn(() => ({ distance: 0, formatted: '0 km' })),
    calculateDistanceFromUser: jest.fn(() => null),
    isLocationEnabled: jest.fn(() => Promise.resolve(true)),
    startWatchingPosition: jest.fn(() => Promise.resolve(false)),
    stopWatchingPosition: jest.fn(),
  }

  return {
    __esModule: true,
    default: mockService,
    locationService: mockService,
  }
})