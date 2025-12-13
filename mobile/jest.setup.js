// Setup for Jest tests

// Silence noisy React "act(...)" warnings (tests still assert behavior)
const originalConsoleError = console.error
console.error = (...args) => {
  const firstArg = args[0]
  if (typeof firstArg === 'string' && firstArg.includes('not wrapped in act')) {
    return
  }
  originalConsoleError(...args)
}

// Polyfill atob/btoa for Node.js (used by JWT decoding)
if (typeof global.atob === 'undefined') {
  global.atob = (str) => Buffer.from(str, 'base64').toString('binary')
}
if (typeof global.btoa === 'undefined') {
  global.btoa = (str) => Buffer.from(str, 'binary').toString('base64')
}

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
)

// Mock Sentry to avoid background timers/intervals in Jest
jest.mock('@sentry/react-native', () => ({
  __esModule: true,
  init: jest.fn(),
  captureException: jest.fn(),
  captureMessage: jest.fn(),
  addBreadcrumb: jest.fn(),
  setUser: jest.fn(),
  setTag: jest.fn(),
  withScope: (callback) => callback({ setExtras: jest.fn() }),
  wrap: (App) => App,
}))

// Mock expo-font
jest.mock('expo-font')

// Mock expo-file-system
jest.mock('expo-file-system', () => ({
  documentDirectory: 'file:///data/user/0/com.app/files/',
  cacheDirectory: 'file:///data/user/0/com.app/cache/',
  makeDirectoryAsync: jest.fn().mockResolvedValue(undefined),
  getInfoAsync: jest.fn().mockResolvedValue({ exists: true, isDirectory: true }),
  downloadAsync: jest.fn().mockResolvedValue({ status: 200 }),
  writeAsStringAsync: jest.fn().mockResolvedValue(undefined),
  readAsStringAsync: jest.fn().mockResolvedValue(''),
  deleteAsync: jest.fn().mockResolvedValue(undefined),
  copyAsync: jest.fn().mockResolvedValue(undefined),
  moveAsync: jest.fn().mockResolvedValue(undefined),
  EncodingType: {
    UTF8: 'utf8',
    Base64: 'base64',
  },
}))


// Mock expo-asset
jest.mock('expo-asset')

// Mock expo-sharing
jest.mock('expo-sharing', () => ({
  isAvailableAsync: jest.fn().mockResolvedValue(true),
  shareAsync: jest.fn().mockResolvedValue(undefined),
}))

// Mock expo-location
jest.mock('expo-location', () => ({
  requestForegroundPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  getForegroundPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  getCurrentPositionAsync: jest.fn().mockResolvedValue({
    coords: { latitude: 6.1319, longitude: 1.2228, accuracy: 10 },
  }),
  watchPositionAsync: jest.fn().mockResolvedValue({ remove: jest.fn() }),
  reverseGeocodeAsync: jest.fn().mockResolvedValue([{
    city: 'Lomé',
    country: 'Togo',
    street: 'Rue Test',
    region: 'Maritime',
  }]),
  Accuracy: { High: 4, Balanced: 3, Low: 2 },
}))

// Mock expo-image-picker
jest.mock('expo-image-picker', () => ({
  requestMediaLibraryPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  requestCameraPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  launchImageLibraryAsync: jest.fn().mockResolvedValue({
    canceled: false,
    assets: [{ uri: 'file:///mock/image.jpg', width: 100, height: 100 }],
  }),
  launchCameraAsync: jest.fn().mockResolvedValue({
    canceled: false,
    assets: [{ uri: 'file:///mock/camera.jpg', width: 100, height: 100 }],
  }),
  MediaTypeOptions: { Images: 'Images', Videos: 'Videos', All: 'All' },
}))

// Mock expo-notifications
jest.mock('expo-notifications', () => ({
  setNotificationHandler: jest.fn(),
  addNotificationReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
  addNotificationResponseReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
  getPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  requestPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  getExpoPushTokenAsync: jest.fn().mockResolvedValue({ data: 'mock-push-token' }),
  scheduleNotificationAsync: jest.fn().mockResolvedValue('mock-notification-id'),
  cancelScheduledNotificationAsync: jest.fn().mockResolvedValue(undefined),
  AndroidImportance: { MAX: 5, HIGH: 4, DEFAULT: 3, LOW: 2, MIN: 1 },
}))

// Mock @react-native-community/netinfo
jest.mock('@react-native-community/netinfo', () => ({
  addEventListener: jest.fn(() => jest.fn()),
  fetch: jest.fn().mockResolvedValue({
    isConnected: true,
    isInternetReachable: true,
    type: 'wifi',
    details: { isConnectionExpensive: false },
  }),
  useNetInfo: jest.fn(() => ({
    isConnected: true,
    isInternetReachable: true,
    type: 'wifi',
  })),
}))

// Mock @expo/vector-icons
jest.mock('@expo/vector-icons', () => {
  const { View } = require('react-native')
  return {
    Ionicons: View,
    MaterialIcons: View,
    FontAwesome: View,
  }
})

// Silence Animated warnings / timers in tests (virtual mock for RN/Expo compatibility)
jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper', () => ({}), {
  virtual: true,
})

// Mock react-native-webview
jest.mock('react-native-webview', () => {
  const { View } = require('react-native')
  return {
    WebView: View,
    default: View,
  }
})

// Mock React Navigation
jest.mock('@react-navigation/native', () => {
  const actualNav = jest.requireActual('@react-navigation/native')
  return {
    ...actualNav,
    useNavigation: () => ({
      navigate: jest.fn(),
      goBack: jest.fn(),
      setOptions: jest.fn(),
      addListener: jest.fn(() => jest.fn()),
    }),
    useRoute: () => ({
      params: {},
    }),
    useFocusEffect: (callback) => {
      // Execute callback immediately in tests
      const React = require('react')
      React.useEffect(() => {
        const cleanup = callback()
        return typeof cleanup === 'function' ? cleanup : undefined
      }, [])
    },
    useIsFocused: () => true,
  }
})
