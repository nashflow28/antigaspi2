import { createPinia } from 'pinia'

export const pinia = createPinia()

// Export all stores for easy importing
export { useAuthStore } from './auth'
export { useProductsStore } from './products'
export { useReservationsStore } from './reservations'
export { usePaymentsStore } from './payments'
export { useThemeStore } from './theme'
export { useMerchantsStore } from './merchants'
export { useCartStore } from './cart'
export { useFavoritesStore } from './favorites'
export { useOnboardingStore } from './onboarding'
export { useMessagingStore } from './messaging'
export { useDriverStore } from './driver'
