// Jest setup file for React Native Testing Library
// Note: @testing-library/jest-native is deprecated in favor of built-in matchers
// import '@testing-library/jest-native/extend-expect'

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