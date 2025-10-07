import { configureStore } from '@reduxjs/toolkit'
import authSlice from './slices/authSlice'
import connectivitySlice from './slices/connectivitySlice'
import productsSlice from './slices/productsSlice'
import reservationsSlice from './slices/reservationsSlice'
import merchantsSlice from './slices/merchantsSlice'

export const store = configureStore({
  reducer: {
    auth: authSlice,
    connectivity: connectivitySlice,
    products: productsSlice,
    reservations: reservationsSlice,
    merchants: merchantsSlice,
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
