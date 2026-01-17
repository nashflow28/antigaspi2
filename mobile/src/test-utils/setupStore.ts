import { configureStore } from '@reduxjs/toolkit'
import { authReducer, authInitialState } from '../store/slices/authSlice'
import { connectivityReducer, connectivityInitialState } from '../store/slices/connectivitySlice'
import { productsReducer, productsInitialState } from '../store/slices/productsSlice'
import { reservationsReducer, reservationsInitialState } from '../store/slices/reservationsSlice'
import { merchantsReducer, merchantsInitialState } from '../store/slices/merchantsSlice'
import { favoritesReducer, favoritesInitialState } from '../store/slices/favoritesSlice'
import { reviewsReducer, reviewsInitialState } from '../store/slices/reviewsSlice'
import { cartReducer, cartInitialState } from '../store/slices/cartSlice'
import { ProductsState } from '../types'

const reducers = {
  auth: authReducer,
  connectivity: connectivityReducer,
  products: productsReducer,
  reservations: reservationsReducer,
  merchants: merchantsReducer,
  favorites: favoritesReducer,
  reviews: reviewsReducer,
  cart: cartReducer,
} as const

export function setupStore(preloadedState?: any) {
  return configureStore({
    reducer: reducers as any,
    preloadedState,
  })
}

export type AppStore = ReturnType<typeof setupStore>

export function buildProductsState(overrides: Partial<ProductsState> = {}): ProductsState {
  const { filters, products, categories, ...rest } = overrides
  return {
    ...productsInitialState,
    products: products ?? [...productsInitialState.products],
    categories: categories ?? [...productsInitialState.categories],
    filters: { ...productsInitialState.filters, ...(filters ?? {}) },
    ...rest,
  }
}

export function buildAuthState() {
  return { ...authInitialState }
}

export function buildConnectivityState() {
  return { ...connectivityInitialState }
}

export function buildReservationsState() {
  return { ...reservationsInitialState }
}

export function buildMerchantsState() {
  return { ...merchantsInitialState }
}

export function buildFavoritesState() {
  return { ...favoritesInitialState }
}

export function buildReviewsState() {
  return { ...reviewsInitialState }
}

export function buildCartState() {
  return { ...cartInitialState }
}
