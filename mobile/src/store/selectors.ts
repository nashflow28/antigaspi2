/**
 * Memoized Redux Selectors
 * Performance optimization: prevents unnecessary re-renders by caching selector results
 *
 * Usage:
 * import { selectAllProducts, selectProductById } from '../store/selectors'
 * const products = useSelector(selectAllProducts)
 * const product = useSelector(state => selectProductById(state, productId))
 */

import { createSelector } from '@reduxjs/toolkit'
import { RootState } from './index'
import { Product, Category, Reservation } from '../types'

// ============================================
// BASE SELECTORS (non-memoized, used as inputs)
// ============================================

// Products
const selectProductsState = (state: RootState) => state.products
const selectProductsList = (state: RootState) => state.products.products
const selectCategoriesList = (state: RootState) => state.products.categories
const selectProductsFilters = (state: RootState) => state.products.filters

// Auth
const selectAuthState = (state: RootState) => state.auth
const selectAuthUser = (state: RootState) => state.auth.user
const selectAuthToken = (state: RootState) => state.auth.token

// Reservations
const selectReservationsState = (state: RootState) => state.reservations
const selectReservationsList = (state: RootState) => state.reservations.reservations

// Favorites
const selectFavoritesState = (state: RootState) => state.favorites
const selectFavoritesList = (state: RootState) => state.favorites.favorites

// Merchants
const selectMerchantsState = (state: RootState) => state.merchants
const selectMerchantsList = (state: RootState) => state.merchants.merchants

// Cart
const selectCartState = (state: RootState) => state.cart
const selectCart = (state: RootState) => state.cart.cart

// Wallet
const selectWalletState = (state: RootState) => state.wallet

// ============================================
// PRODUCTS SELECTORS (memoized)
// ============================================

export const selectAllProducts = createSelector(
  [selectProductsList],
  (products) => products
)

export const selectProductsLoading = createSelector(
  [selectProductsState],
  (state) => state.loading
)

export const selectProductsLoadingMore = createSelector(
  [selectProductsState],
  (state) => state.loadingMore
)

export const selectProductsError = createSelector(
  [selectProductsState],
  (state) => state.error
)

export const selectProductsHasMore = createSelector(
  [selectProductsState],
  (state) => state.hasMore
)

export const selectProductsCurrentPage = createSelector(
  [selectProductsState],
  (state) => state.currentPage
)

export const selectProductById = createSelector(
  [selectProductsList, (_state: RootState, productId: number) => productId],
  (products, productId) => products.find(p => p.id === productId)
)

export const selectActiveProducts = createSelector(
  [selectProductsList],
  (products) => products.filter(p => p.is_active && p.quantity_available > 0)
)

export const selectProductsByCategory = createSelector(
  [selectProductsList, (_state: RootState, categoryId: number) => categoryId],
  (products, categoryId) => products.filter(p => p.category?.id === categoryId)
)

export const selectProductsByMerchant = createSelector(
  [selectProductsList, (_state: RootState, merchantId: number) => merchantId],
  (products, merchantId) => products.filter(p => p.merchant?.id === merchantId)
)

export const selectDiscountedProducts = createSelector(
  [selectProductsList],
  (products) => products.filter(p => p.discount_percentage && p.discount_percentage > 0)
    .sort((a, b) => (b.discount_percentage || 0) - (a.discount_percentage || 0))
)

export const selectExpiringProducts = createSelector(
  [selectProductsList],
  (products) => products.filter(p => p.days_until_expiration !== undefined && p.days_until_expiration <= 2)
    .sort((a, b) => (a.days_until_expiration || 0) - (b.days_until_expiration || 0))
)

// ============================================
// CATEGORIES SELECTORS (memoized)
// ============================================

export const selectAllCategories = createSelector(
  [selectCategoriesList],
  (categories) => categories
)

export const selectCategoryById = createSelector(
  [selectCategoriesList, (_state: RootState, categoryId: number) => categoryId],
  (categories, categoryId) => categories.find(c => c.id === categoryId)
)

// ============================================
// AUTH SELECTORS (memoized)
// ============================================

export const selectCurrentUser = createSelector(
  [selectAuthUser],
  (user) => user
)

export const selectIsAuthenticated = createSelector(
  [selectAuthToken, selectAuthUser],
  (token, user) => !!token && !!user
)

export const selectUserRole = createSelector(
  [selectAuthUser],
  (user) => user?.role
)

export const selectIsConsumer = createSelector(
  [selectUserRole],
  (role) => role === 'consumer'
)

export const selectIsMerchant = createSelector(
  [selectUserRole],
  (role) => role === 'merchant'
)

export const selectIsAdmin = createSelector(
  [selectUserRole],
  (role) => role === 'admin'
)

export const selectAuthLoading = createSelector(
  [selectAuthState],
  (state) => state.loading
)

export const selectAuthError = createSelector(
  [selectAuthState],
  (state) => state.error
)

// ============================================
// RESERVATIONS SELECTORS (memoized)
// ============================================

export const selectAllReservations = createSelector(
  [selectReservationsList],
  (reservations) => reservations
)

export const selectReservationsLoading = createSelector(
  [selectReservationsState],
  (state) => state.loading
)

export const selectReservationsError = createSelector(
  [selectReservationsState],
  (state) => state.error
)

export const selectReservationById = createSelector(
  [selectReservationsList, (_state: RootState, reservationId: number) => reservationId],
  (reservations, reservationId) => reservations.find(r => r.id === reservationId)
)

export const selectPendingReservations = createSelector(
  [selectReservationsList],
  (reservations) => reservations.filter(r => r.status === 'pending')
)

export const selectConfirmedReservations = createSelector(
  [selectReservationsList],
  (reservations) => reservations.filter(r => r.status === 'confirmed')
)

export const selectCompletedReservations = createSelector(
  [selectReservationsList],
  (reservations) => reservations.filter(r => r.status === 'completed')
)

export const selectActiveReservations = createSelector(
  [selectReservationsList],
  (reservations) => reservations.filter(r =>
    r.status === 'pending' || r.status === 'confirmed' || r.status === 'ready'
  )
)

export const selectReservationsCount = createSelector(
  [selectReservationsList],
  (reservations) => reservations.length
)

export const selectPendingReservationsCount = createSelector(
  [selectPendingReservations],
  (reservations) => reservations.length
)

// ============================================
// FAVORITES SELECTORS (memoized)
// ============================================

export const selectAllFavorites = createSelector(
  [selectFavoritesList],
  (favorites) => favorites
)

export const selectFavoritesLoading = createSelector(
  [selectFavoritesState],
  (state) => state.loading
)

export const selectFavoriteProductIds = createSelector(
  [selectFavoritesState],
  (state) => new Set(state.favoriteIds)
)

export const selectIsFavorite = createSelector(
  [selectFavoriteProductIds, (_state: RootState, productId: number) => productId],
  (favoriteIds, productId) => favoriteIds.has(productId)
)

export const selectFavoritesCount = createSelector(
  [selectFavoritesList],
  (favorites) => favorites.length
)

// ============================================
// MERCHANTS SELECTORS (memoized)
// ============================================

export const selectAllMerchants = createSelector(
  [selectMerchantsList],
  (merchants) => merchants
)

export const selectMerchantsLoading = createSelector(
  [selectMerchantsState],
  (state) => state.loading
)

export const selectMerchantById = createSelector(
  [selectMerchantsList, (_state: RootState, merchantId: number) => merchantId],
  (merchants, merchantId) => merchants.find(m => m.id === merchantId)
)

export const selectVerifiedMerchants = createSelector(
  [selectMerchantsList],
  (merchants) => merchants.filter(m => m.is_verified)
)

export const selectMerchantsWithLocation = createSelector(
  [selectMerchantsList],
  (merchants) => merchants.filter(m => m.latitude && m.longitude)
)

// ============================================
// CART SELECTORS (memoized)
// ============================================

export const selectCartData = createSelector(
  [selectCart],
  (cart) => cart
)

export const selectCartItemsList = createSelector(
  [selectCart],
  (cart) => cart?.items ?? []
)

export const selectCartItemsCount = createSelector(
  [selectCartItemsList],
  (items) => items.reduce((total, item) => total + item.quantity, 0)
)

export const selectCartTotal = createSelector(
  [selectCartItemsList],
  (items) => items.reduce((total, item) => {
    const price = item.product?.discounted_price || item.unit_price || 0
    return total + (price * item.quantity)
  }, 0)
)

export const selectCartSavings = createSelector(
  [selectCart],
  (cart) => {
    if (!cart?.items) return 0
    return cart.items.reduce((total, item) => {
      // CartItem has unit_price which represents original price, and product.discounted_price
      const original = item.unit_price || 0
      const discounted = item.product?.discounted_price || original
      return total + ((original - discounted) * item.quantity)
    }, 0)
  }
)

export const selectIsCartEmpty = createSelector(
  [selectCart],
  (cart) => !cart || (cart.items?.length ?? 0) === 0
)

// ============================================
// WALLET SELECTORS (memoized)
// ============================================

export const selectWallet = createSelector(
  [selectWalletState],
  (state) => state.wallet
)

export const selectWalletBalance = createSelector(
  [selectWalletState],
  (state) => state.wallet?.balance ?? 0
)

export const selectWalletTransactions = createSelector(
  [selectWalletState],
  (state) => state.transactions
)

export const selectWalletLoading = createSelector(
  [selectWalletState],
  (state) => state.loading
)

export const selectWalletStats = createSelector(
  [selectWalletState],
  (state) => state.stats
)

// ============================================
// COMBINED/DERIVED SELECTORS (memoized)
// ============================================

export const selectFavoriteProducts = createSelector(
  [selectProductsList, selectFavoriteProductIds],
  (products, favoriteIds) => products.filter(p => favoriteIds.has(p.id))
)

export const selectProductsWithFavoriteStatus = createSelector(
  [selectProductsList, selectFavoriteProductIds],
  (products, favoriteIds) => products.map(p => ({
    ...p,
    isFavorite: favoriteIds.has(p.id)
  }))
)

// Product statistics
export const selectProductsStats = createSelector(
  [selectProductsList],
  (products) => ({
    total: products.length,
    active: products.filter(p => p.is_active).length,
    outOfStock: products.filter(p => p.quantity_available === 0).length,
    expiringSoon: products.filter(p => p.days_until_expiration !== undefined && p.days_until_expiration <= 2).length,
    avgDiscount: products.length > 0
      ? products.reduce((sum, p) => sum + (p.discount_percentage || 0), 0) / products.length
      : 0
  })
)

// Reservation statistics
export const selectReservationsStats = createSelector(
  [selectReservationsList],
  (reservations) => ({
    total: reservations.length,
    pending: reservations.filter(r => r.status === 'pending').length,
    confirmed: reservations.filter(r => r.status === 'confirmed').length,
    completed: reservations.filter(r => r.status === 'completed').length,
    cancelled: reservations.filter(r => r.status === 'cancelled').length,
  })
)
