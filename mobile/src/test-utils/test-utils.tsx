/**
 * Test Utilities
 * Helpers pour rendre les composants avec tous les providers nécessaires
 */

import React from 'react'
import { render, RenderOptions } from '@testing-library/react-native'
import { Provider } from 'react-redux'
import { ThemeProvider } from '../theme'

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
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <Provider store={store}>
      <ThemeProvider>{children}</ThemeProvider>
    </Provider>
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
