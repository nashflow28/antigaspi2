import { createPinia } from 'pinia'

export const pinia = createPinia()

// Export all stores for easy importing
export { useAuthStore } from './auth'
export { useProductsStore } from './products'
export { useReservationsStore } from './reservations'