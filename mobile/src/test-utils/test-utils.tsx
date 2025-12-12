/**
 * Test Utilities
 * Helpers pour rendre les composants avec tous les providers nécessaires
 */

import React from 'react'
import { render, RenderOptions } from '@testing-library/react-native'
import { Provider } from 'react-redux'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { ThemeProvider } from '../theme'
import { ToastProvider } from '../contexts/ToastContext'
import { AlertProvider } from '../contexts/AlertContext'

import { RootState } from '../store'
import { createTestStore, TestStore } from './store'

// PreloadedState type compatibility for older @reduxjs/toolkit versions
type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P]
}

type PreloadedState<S> = DeepPartial<S>

interface ExtendedRenderOptions extends Omit<RenderOptions, 'queries'> {
  preloadedState?: PreloadedState<RootState>
  store?: TestStore
}

/**
 * Render avec tous les providers (Redux, Theme, etc.)
 */
export const renderWithProviders = (
  component: React.ReactElement,
  {
    preloadedState,
    store = createTestStore(preloadedState),
    ...renderOptions
  }: ExtendedRenderOptions = {}
) => {
  // Initial safe area insets for testing (mock device with no notch)
  const initialMetrics = {
    frame: { x: 0, y: 0, width: 390, height: 844 },
    insets: { top: 0, left: 0, right: 0, bottom: 0 },
  }

  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <SafeAreaProvider initialMetrics={initialMetrics}>
      <Provider store={store}>
        <ThemeProvider>
          <ToastProvider>
            <AlertProvider>{children}</AlertProvider>
          </ToastProvider>
        </ThemeProvider>
      </Provider>
    </SafeAreaProvider>
  )

  return {
    store,
    ...render(component, { wrapper: Wrapper, ...renderOptions }),
  }
}

// Re-export everything from testing-library
export * from '@testing-library/react-native'
export { renderWithProviders as render }
export { createTestStore } from './store'
