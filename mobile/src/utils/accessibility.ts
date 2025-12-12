/**
 * Accessibility Utilities
 *
 * Centralized accessibility helpers for consistent a11y support.
 * BUG FIX #H-010: Improve accessibility labels across the app
 */

import { AccessibilityRole, AccessibilityState } from 'react-native'

/**
 * Common accessibility roles used in the app
 */
export const A11Y_ROLES: Record<string, AccessibilityRole> = {
  BUTTON: 'button',
  LINK: 'link',
  IMAGE: 'image',
  TEXT: 'text',
  HEADER: 'header',
  SEARCH: 'search',
  TAB: 'tab',
  TAB_LIST: 'tablist',
  CHECKBOX: 'checkbox',
  RADIO: 'radio',
  MENU: 'menu',
  MENU_ITEM: 'menuitem',
  SLIDER: 'adjustable',
  ALERT: 'alert',
  SUMMARY: 'summary',
}

/**
 * Generate accessibility props for interactive elements
 */
export const getButtonA11yProps = (
  label: string,
  options?: {
    hint?: string
    disabled?: boolean
    selected?: boolean
    busy?: boolean
  }
): {
  accessibilityRole: AccessibilityRole
  accessibilityLabel: string
  accessibilityHint?: string
  accessibilityState?: AccessibilityState
} => ({
  accessibilityRole: 'button',
  accessibilityLabel: label,
  ...(options?.hint && { accessibilityHint: options.hint }),
  ...(options && {
    accessibilityState: {
      disabled: options.disabled,
      selected: options.selected,
      busy: options.busy,
    },
  }),
})

/**
 * Generate accessibility props for images
 */
export const getImageA11yProps = (
  label: string
): {
  accessibilityRole: AccessibilityRole
  accessibilityLabel: string
} => ({
  accessibilityRole: 'image',
  accessibilityLabel: label,
})

/**
 * Generate accessibility props for headers
 */
export const getHeaderA11yProps = (
  label: string
): {
  accessibilityRole: AccessibilityRole
  accessibilityLabel: string
} => ({
  accessibilityRole: 'header',
  accessibilityLabel: label,
})

/**
 * Common accessibility labels in French
 */
export const A11Y_LABELS = {
  // Navigation
  BACK_BUTTON: 'Retour',
  CLOSE_BUTTON: 'Fermer',
  MENU_BUTTON: 'Menu',
  SEARCH_BUTTON: 'Rechercher',
  FILTER_BUTTON: 'Filtrer',

  // Actions
  ADD_TO_CART: 'Ajouter au panier',
  REMOVE_FROM_CART: 'Retirer du panier',
  ADD_TO_FAVORITES: 'Ajouter aux favoris',
  REMOVE_FROM_FAVORITES: 'Retirer des favoris',
  RESERVE: 'Réserver',
  CANCEL: 'Annuler',
  CONFIRM: 'Confirmer',
  SUBMIT: 'Envoyer',
  SAVE: 'Sauvegarder',
  DELETE: 'Supprimer',
  EDIT: 'Modifier',

  // Quantity
  INCREASE_QUANTITY: 'Augmenter la quantité',
  DECREASE_QUANTITY: 'Diminuer la quantité',

  // Refresh
  REFRESH: 'Actualiser',
  PULL_TO_REFRESH: 'Tirer pour actualiser',

  // Cart
  VIEW_CART: 'Voir le panier',
  CHECKOUT: 'Passer commande',

  // Profile
  LOGOUT: 'Se déconnecter',
  EDIT_PROFILE: 'Modifier le profil',

  // Loading states
  LOADING: 'Chargement en cours',
  LOADING_MORE: 'Chargement de plus d\'éléments',
}

/**
 * Accessibility hints in French
 */
export const A11Y_HINTS = {
  NAVIGATE_TO_DETAILS: 'Ouvre les détails du produit',
  NAVIGATE_TO_MERCHANT: 'Ouvre la page du commerçant',
  NAVIGATE_TO_RESERVATION: 'Ouvre les détails de la réservation',
  TOGGLE_FAVORITE: 'Ajoute ou retire des favoris',
  CHANGE_QUANTITY: 'Modifie la quantité du produit',
  OPEN_MAP: 'Ouvre la carte pour voir la localisation',
  CALL_MERCHANT: 'Appelle le commerçant',
  SHARE_PRODUCT: 'Partage ce produit',
}

/**
 * Format price for screen readers
 */
export const formatPriceForScreenReader = (price: number, currency: string = 'XOF'): string => {
  if (currency === 'XOF') {
    return `${price} francs CFA`
  }
  return `${price} ${currency}`
}

/**
 * Format discount for screen readers
 */
export const formatDiscountForScreenReader = (percentage: number): string => {
  return `${percentage} pour cent de réduction`
}

/**
 * Format expiration for screen readers
 */
export const formatExpirationForScreenReader = (days: number): string => {
  if (days < 0) return 'Produit expiré'
  if (days === 0) return 'Expire aujourd\'hui'
  if (days === 1) return 'Expire demain'
  return `Expire dans ${days} jours`
}

/**
 * Format quantity for screen readers
 */
export const formatQuantityForScreenReader = (
  quantity: number,
  available: number
): string => {
  return `${quantity} sur ${available} disponibles`
}

export default {
  A11Y_ROLES,
  A11Y_LABELS,
  A11Y_HINTS,
  getButtonA11yProps,
  getImageA11yProps,
  getHeaderA11yProps,
  formatPriceForScreenReader,
  formatDiscountForScreenReader,
  formatExpirationForScreenReader,
  formatQuantityForScreenReader,
}
