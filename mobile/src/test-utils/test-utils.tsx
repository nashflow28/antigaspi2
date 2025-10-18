/**
 * Test Utilities
 * Helpers pour rendre les composants avec tous les providers nécessaires
 */

import React from 'react'
import { render, RenderOptions } from '@testing-library/react-native'
import { Provider } from 'react-redux'
import { configureStore, PreloadedState } from '@reduxjs/toolkit'
import { ThemeProvider } from '../theme'

import authReducer from '../store/slices/authSlice'
import productsReducer from '../store/slices/productsSlice'
import reservationsReducer from '../store/slices/reservationsSlice'
import merchantsReducer from '../store/slices/merchantsSlice'
import favoritesReducer from '../store/slices/favoritesSlice'
import reviewsReducer from '../store/slices/reviewsSlice'

import { RootState } from '../store'

interface ExtendedRenderOptions extends Omit<RenderOptions, 'queries'> {
  preloadedState?: PreloadedState<RootState>
  store?: ReturnType<typeof configureStore>
}

interface CreateStoreOptions {
  /**
   * État initial du store
   */
  preloadedState?: PreloadedState<RootState>
  /**
   * Si true, crée un store minimal avec uniquement les reducers spécifiés dans preloadedState
   * Utile pour accélérer les tests qui n'ont besoin que de quelques slices
   * @default false
   */
  minimal?: boolean
}

export const createTestStore = (options?: PreloadedState<RootState> | CreateStoreOptions) => {
  // Support ancien format: createTestStore(preloadedState)
  const isLegacyCall = options && !('minimal' in options)
  const preloadedState = isLegacyCall ? options : (options as CreateStoreOptions)?.preloadedState
  const minimal = isLegacyCall ? false : (options as CreateStoreOptions)?.minimal || false

  // Mode minimal: uniquement les reducers présents dans preloadedState
  if (minimal && preloadedState) {
    const reducers: Record<string, any> = {}
    if ('auth' in preloadedState) reducers.auth = authReducer
    if ('products' in preloadedState) reducers.products = productsReducer
    if ('reservations' in preloadedState) reducers.reservations = reservationsReducer
    if ('merchants' in preloadedState) reducers.merchants = merchantsReducer
    if ('favorites' in preloadedState) reducers.favorites = favoritesReducer
    if ('reviews' in preloadedState) reducers.reviews = reviewsReducer

    return configureStore({
      reducer: reducers,
      preloadedState,
    })
  }

  // Mode complet (par défaut): tous les reducers
  return configureStore({
    reducer: {
      auth: authReducer,
      products: productsReducer,
      reservations: reservationsReducer,
      merchants: merchantsReducer,
      favorites: favoritesReducer,
      reviews: reviewsReducer,
    },
    preloadedState,
  })
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
