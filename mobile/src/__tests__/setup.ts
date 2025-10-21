/**
 * Global test setup for API mocking
 */

// Mock the API module
jest.mock('../services/api', () => ({
  get: jest.fn(() => Promise.resolve({ data: { data: [] } })),
  post: jest.fn(() => Promise.resolve({ data: { data: {} } })),
  put: jest.fn(() => Promise.resolve({ data: { data: {} } })),
  delete: jest.fn(() => Promise.resolve({ data: { data: {} } })),
  patch: jest.fn(() => Promise.resolve({ data: { data: {} } })),
}));

// Helper to create mock thunk actions
const createMockThunk = (baseName: string, payload: any = null) => {
  const mockAction = {
    type: `${baseName}/fulfilled`,
    payload,
  };

  const thunkFunction = jest.fn(() => mockAction);

  // Add the fulfilled/rejected/pending matchers
  (thunkFunction as any).fulfilled = {
    match: (action: any) => action?.type === `${baseName}/fulfilled`,
    type: `${baseName}/fulfilled`,
  };

  (thunkFunction as any).rejected = {
    match: (action: any) => action?.type === `${baseName}/rejected`,
    type: `${baseName}/rejected`,
  };

  (thunkFunction as any).pending = {
    match: (action: any) => action?.type === `${baseName}/pending`,
    type: `${baseName}/pending`,
  };

  return thunkFunction;
};

// Mock Redux async thunks to prevent API calls
jest.mock('../store/slices/reservationsSlice', () => {
  const actual = jest.requireActual('../store/slices/reservationsSlice');
  return {
    ...actual,
    fetchMyReservations: createMockThunk('reservations/fetchMyReservations', []),
    cancelReservation: createMockThunk('reservations/cancelReservation', {}),
  };
});

jest.mock('../store/slices/productsSlice', () => {
  const actual = jest.requireActual('../store/slices/productsSlice');
  return {
    ...actual,
    fetchProducts: createMockThunk('products/fetchProducts', []),
    fetchProductById: createMockThunk('products/fetchProductById', null),
  };
});

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(),
  getItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}));

// Mock expo-notifications
jest.mock('expo-notifications', () => ({
  addNotificationReceivedListener: jest.fn(),
  addNotificationResponseReceivedListener: jest.fn(),
  removeNotificationSubscription: jest.fn(),
  setNotificationHandler: jest.fn(),
  getPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
  requestPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
  setNotificationChannelAsync: jest.fn(() => Promise.resolve()),
  getExpoPushTokenAsync: jest.fn(() => Promise.resolve({ data: 'ExponentPushToken[jest]' })),
  scheduleNotificationAsync: jest.fn(() => Promise.resolve('mock-notification-id')),
  cancelScheduledNotificationAsync: jest.fn(() => Promise.resolve()),
  cancelAllScheduledNotificationsAsync: jest.fn(() => Promise.resolve()),
  getAllScheduledNotificationsAsync: jest.fn(() => Promise.resolve([])),
  setBadgeCountAsync: jest.fn(() => Promise.resolve()),
  AndroidImportance: {
    DEFAULT: 'default',
    HIGH: 'high',
  },
}));

jest.mock('expo-device', () => ({
  isDevice: false,
  modelName: 'Jest Device',
}));

// Mock analytics service
jest.mock('../services/analyticsService', () => ({
  track: jest.fn(),
  identify: jest.fn(),
  reset: jest.fn(),
}));

// Silence console warnings in tests
global.console = {
  ...console,
  warn: jest.fn(),
  error: jest.fn(),
};
