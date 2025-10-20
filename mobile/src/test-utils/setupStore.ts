import { configureStore, PreloadedState } from '@reduxjs/toolkit'

import { RootState } from '../store'
import { authReducer, authInitialState } from '../store/slices/authSlice'
import { connectivityReducer, connectivityInitialState } from '../store/slices/connectivitySlice'
import { productsReducer, productsInitialState } from '../store/slices/productsSlice'
import { reservationsReducer, reservationsInitialState } from '../store/slices/reservationsSlice'
import { merchantsReducer, merchantsInitialState } from '../store/slices/merchantsSlice'
import { favoritesReducer, favoritesInitialState } from '../store/slices/favoritesSlice'
import { reviewsReducer, reviewsInitialState } from '../store/slices/reviewsSlice'
import { ProductsState } from '../types'

export const setupStore = (preloadedState?: PreloadedState<RootState>) =>
  configureStore({
    reducer: {
      auth: authReducer,
      connectivity: connectivityReducer,
      products: productsReducer,
      reservations: reservationsReducer,
      merchants: merchantsReducer,
      favorites: favoritesReducer,
      reviews: reviewsReducer,
    },
    preloadedState,
  })

export type AppStore = ReturnType<typeof setupStore>

export const buildProductsState = (overrides: Partial<ProductsState> = {}): ProductsState => {
  const { filters, products, categories, ...rest } = overrides

  return {
    ...productsInitialState,
    products: products ?? [...productsInitialState.products],
    categories: categories ?? [...productsInitialState.categories],
    filters: { ...productsInitialState.filters, ...(filters ?? {}) },
    ...rest,
  }
}

export const buildAuthState = () => ({ ...authInitialState })
export const buildConnectivityState = () => ({ ...connectivityInitialState })
export const buildReservationsState = () => ({ ...reservationsInitialState })
export const buildMerchantsState = () => ({ ...merchantsInitialState })
export const buildFavoritesState = () => ({ ...favoritesInitialState })
export const buildReviewsState = () => ({ ...reviewsInitialState })
