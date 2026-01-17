import React from 'react'
import { render, RenderOptions } from '@testing-library/react-native'
import { Provider } from 'react-redux'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { ThemeProvider } from '../theme'
import { ToastProvider } from '../contexts/ToastContext'
import { AlertProvider } from '../contexts/AlertContext'
import { AuthPromptProvider } from '../contexts/AuthPromptContext'
import { RootState } from '../store'
import { createTestStore, TestStore } from './store'

type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P]
}

interface ExtendedRenderOptions extends Omit<RenderOptions, 'queries'> {
  preloadedState?: DeepPartial<RootState>
  store?: TestStore
}

export function renderWithProviders(
  component: React.ReactElement,
  {
    preloadedState,
    store = createTestStore(preloadedState),
    ...renderOptions
  }: ExtendedRenderOptions = {}
) {
  const initialMetrics = {
    frame: { x: 0, y: 0, width: 390, height: 844 },
    insets: { top: 0, left: 0, right: 0, bottom: 0 },
  }

  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <SafeAreaProvider initialMetrics={initialMetrics}>
        <Provider store={store}>
          <ThemeProvider>
            <ToastProvider>
              <AlertProvider>
                <AuthPromptProvider>{children}</AuthPromptProvider>
              </AlertProvider>
            </ToastProvider>
          </ThemeProvider>
        </Provider>
      </SafeAreaProvider>
    )
  }

  return {
    store,
    ...render(component, { wrapper: Wrapper, ...renderOptions }),
  }
}

export * from '@testing-library/react-native'
export { renderWithProviders as render }
export { createTestStore } from './store'
