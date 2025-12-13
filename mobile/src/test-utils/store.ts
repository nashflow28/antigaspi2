import { configureStore } from '@reduxjs/toolkit'

import { RootState } from '../store'

// DeepPartial type for nested state objects
type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P]
}
import { authReducer, authInitialState } from '../store/slices/authSlice'
import { connectivityReducer, connectivityInitialState } from '../store/slices/connectivitySlice'
import { productsReducer, productsInitialState } from '../store/slices/productsSlice'
import { reservationsReducer, reservationsInitialState } from '../store/slices/reservationsSlice'
import { merchantsReducer, merchantsInitialState } from '../store/slices/merchantsSlice'
import { favoritesReducer, favoritesInitialState } from '../store/slices/favoritesSlice'
import { reviewsReducer, reviewsInitialState } from '../store/slices/reviewsSlice'
import { cartReducer, cartInitialState } from '../store/slices/cartSlice'
import { surpriseBasketsReducer, surpriseBasketsInitialState } from '../store/slices/surpriseBasketsSlice'
import { walletReducer, walletInitialState } from '../store/slices/walletSlice'
import { messagingReducer, messagingInitialState } from '../store/slices/messagingSlice'

const reducers = {
  auth: authReducer,
  connectivity: connectivityReducer,
  products: productsReducer,
  surpriseBaskets: surpriseBasketsReducer,
  reservations: reservationsReducer,
  merchants: merchantsReducer,
  favorites: favoritesReducer,
  reviews: reviewsReducer,
  cart: cartReducer,
  wallet: walletReducer,
  messaging: messagingReducer,
}

type ReducerKey = keyof typeof reducers

type StateFromReducers = {
  [K in ReducerKey]: ReturnType<typeof reducers[K]>
}

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T

const mergeDeep = <T>(target: T, source?: DeepPartial<T>): T => {
  if (!source) {
    return target
  }

  const entries = Object.entries(source as Record<string, unknown>)
  for (const [key, value] of entries) {
    if (value === undefined) {
      continue
    }

    if (Array.isArray(value)) {
      ;(target as any)[key] = value.map(item =>
        typeof item === 'object' && item !== null ? clone(item) : item
      )
      continue
    }

    if (value !== null && typeof value === 'object') {
      const current = (target as any)[key]
      const base = current && typeof current === 'object' && !Array.isArray(current) ? { ...current } : {}
      ;(target as any)[key] = mergeDeep(base, value as any)
      continue
    }

    ;(target as any)[key] = value
  }

  return target
}

const buildDefaultState = (): StateFromReducers => ({
  auth: clone(authInitialState),
  connectivity: clone(connectivityInitialState),
  products: clone(productsInitialState),
  surpriseBaskets: clone(surpriseBasketsInitialState),
  reservations: clone(reservationsInitialState),
  merchants: clone(merchantsInitialState),
  favorites: clone(favoritesInitialState),
  reviews: clone(reviewsInitialState),
  cart: clone(cartInitialState),
  wallet: clone(walletInitialState),
  messaging: clone(messagingInitialState),
})

export const createTestStore = (partialState: DeepPartial<RootState> = {}) => {
  const baseState = buildDefaultState() as unknown as RootState
  const preloadedState = mergeDeep(baseState, partialState)

  return configureStore({
    reducer: reducers,
    preloadedState,
  })
}

export type TestStore = ReturnType<typeof createTestStore>
