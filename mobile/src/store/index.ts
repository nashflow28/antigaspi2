import { configureStore } from '@reduxjs/toolkit'
import { authReducer } from './slices/authSlice'
import { connectivityReducer } from './slices/connectivitySlice'
import { productsReducer } from './slices/productsSlice'
import { reservationsReducer } from './slices/reservationsSlice'
import { merchantsReducer } from './slices/merchantsSlice'
import { favoritesReducer } from './slices/favoritesSlice'
import { reviewsReducer } from './slices/reviewsSlice'
import { cartReducer } from './slices/cartSlice'
import { surpriseBasketsReducer } from './slices/surpriseBasketsSlice'
import { walletReducer } from './slices/walletSlice'
import { messagingReducer } from './slices/messagingSlice'

export const store = configureStore({
  reducer: {
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
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST'],
      },
    }),
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch

// Re-export all memoized selectors for easy access
export * from './selectors'
