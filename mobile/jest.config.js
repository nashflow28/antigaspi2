module.exports = {
  preset: 'jest-expo',
  openHandlesTimeout: 0,
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|@sentry/react-native|@sentry/core|@sentry/.*|native-base|react-native-svg|immer|@reduxjs/toolkit|redux|redux-thunk|reselect|react-redux|socket\\.io-client|engine\\.io-client|socket\\.io-parser)'
  ],
  moduleNameMapper: {
    '^@test-utils$': '<rootDir>/src/test-utils',
    '^@test-utils/(.*)$': '<rootDir>/src/test-utils/$1',
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testMatch: [
    '**/__tests__/**/*.(test|spec).(ts|tsx|js)',
    '**/*.(test|spec).(ts|tsx|js)'
  ],
  collectCoverageFrom: [
    '**/*.{ts,tsx}',
    '!**/*.d.ts',
    '!**/coverage/**',
    '!**/node_modules/**',
    '!**/babel.config.js',
    '!**/jest.setup.js'
  ]
}
