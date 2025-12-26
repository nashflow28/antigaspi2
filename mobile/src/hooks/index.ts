/**
 * Hooks - Export centralisé
 */

export { usePersistedForm, clearAllFormCaches } from './usePersistedForm'
export type { } from './usePersistedForm'

export { default as useWebSocket } from './useWebSocket'
export { default as usePushNotifications } from './usePushNotifications'
export { useFavorite } from './useFavorite'
export { useNotificationPreferences } from './useNotificationPreferences'
export { useDebounce, useDebouncedCallback, useDebouncedEffect } from './useDebounce'
export { useAlert } from './useAlert'
export { useRequireAuth } from './useRequireAuth'
export { usePromos } from './usePromos'
export { useNearbyMerchants } from './useNearbyMerchants'
export { useLoyalty, TIER_COLORS, TIER_LABELS, TIER_ICONS, formatPointsSource } from './useLoyalty'
export type { LoyaltyData, LoyaltyTierData, ReferralInfo, TierInfo, TierBenefits } from './useLoyalty'
export { useAddressSearch, useCurrentLocationAddress } from './useAddressSearch'
