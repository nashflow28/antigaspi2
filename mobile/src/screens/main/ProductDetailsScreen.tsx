import React, { useEffect, useState, useRef } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Alert,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useDispatch, useSelector } from 'react-redux'
import { AppDispatch, RootState } from '../../store'
import { fetchProduct } from '../../store/slices/productsSlice'
import { createReservation } from '../../store/slices/reservationsSlice'
import { fetchReviewStats } from '../../store/slices/reviewsSlice'
import { addCartItem } from '../../store/slices/cartSlice'
import { useToast } from '../../contexts/ToastContext'
import { Ionicons } from '@expo/vector-icons'
import { Image } from 'expo-image'
import { PaymentMethod, Product } from '../../types'
import { useTheme } from '../../theme'
import { getImageUrl, getCategoryPlaceholder } from '../../utils/imageHelpers'
import { formatCurrency } from '../../utils/currencyHelpers'
import FavoriteButton from '../../components/FavoriteButton'
import StarRating from '../../components/reviews/StarRating'
import { Button, Card, Badge, Typography, Modal, ProductDetailsSkeleton } from '../../components/2025'
import locationService from '../../services/locationService'
// 🐛 BUG FIX #MOB-L-002: Use centralized environment detection
import { isTestEnv as checkIsTestEnv, isTestMode as checkIsTestMode } from '../../utils/envHelpers'
import { TEST_IDS } from '../../utils/testIds'
import { PAYMENT_OPTIONS, PaymentOption } from '../../constants/paymentOptions'

interface Props {
  route: any
  navigation: any
}

const ProductDetailsScreen: React.FC<Props> = ({ route, navigation }) => {
  const dispatch = useDispatch<AppDispatch>()
  const theme = useTheme()
  const insets = useSafeAreaInsets()
  const { productId } = route.params
  const { products, loading } = useSelector((state: RootState) => state.products)
  const { stats: reviewStats } = useSelector((state: RootState) => state.reviews)
  const { cart, updating } = useSelector((state: RootState) => state.cart)
  const { showSuccess, showError } = useToast()

  const [product, setProduct] = useState<Product | null>(null)
  const [reserving, setReserving] = useState(false)
  const [selectedQuantity, setSelectedQuantity] = useState(1)
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod>('on_site')
  const navigationTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const [confirmVisible, setConfirmVisible] = useState(false)
  const [cartAddedVisible, setCartAddedVisible] = useState(false)
  const [addingToCart, setAddingToCart] = useState(false)
  const [modalQuantity, setModalQuantity] = useState(1)
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number; timestamp: number } | null>(null)
  const isTestEnv = checkIsTestEnv()

  // Load user location for distance calculation
  useEffect(() => {
    const loadLocation = async () => {
      try {
        const hasPermission = await locationService.hasLocationPermission()
        if (hasPermission) {
          const position = await locationService.getCurrentPosition()
          if (position) {
            setUserLocation(position)
          }
        }
      } catch (error) {
        // Silently fail - distance just won't be shown
      }
    }
    loadLocation()
  }, [])

  useEffect(() => {
    // 🐛 BUG FIX #MOB-H-003: Handle loadProduct errors on mount
    loadProduct().catch(() => {
      // Error already shown to user via showError in loadProduct
      // Navigate back since product couldn't be loaded
      // BUG FIX #H-003: Check if we can go back before calling goBack
      if (navigation.canGoBack()) {
        navigation.goBack()
      } else {
        // Fallback to Home if this is the first screen (e.g., deep link)
        navigation.navigate('Home')
      }
    })
  }, [productId])

  useEffect(() => {
    if (product) {
      setSelectedQuantity(1) // Reset quantité quand nouveau produit
      setSelectedPaymentMethod('on_site')
    }
  }, [product])

  // Cleanup timeout on unmount to prevent memory leak
  useEffect(() => {
    return () => {
      if (navigationTimeoutRef.current) {
        clearTimeout(navigationTimeoutRef.current)
      }
    }
  }, [])

  useEffect(() => {
    if (product?.merchant?.id) {
      dispatch(fetchReviewStats(product.merchant.id))
    }
  }, [product?.merchant?.id])

  // 🐛 BUG FIX #MOB-H-003: Throw errors instead of navigation.goBack() to allow proper error handling by callers
  const loadProduct = async () => {
    const existingProduct = products.find(p => p.id === productId)
    if (existingProduct) {
      if (!isTestEnv) {
        console.log('Product found in store:', existingProduct)
      }
      setProduct(existingProduct)
    } else {
      if (!isTestEnv) {
        console.log('Fetching product from API:', productId)
      }
      const result = await dispatch(fetchProduct(productId))
      if (fetchProduct.fulfilled.match(result)) {
        if (!isTestEnv) {
          console.log('Product fetched successfully:', result.payload)
        }
        setProduct(result.payload as Product)
      } else if (fetchProduct.rejected.match(result)) {
        if (!isTestEnv) {
          console.error('Failed to fetch product:', result.error)
        }
        const errorMessage = 'Impossible de charger le produit'
        showError(errorMessage)
        throw new Error(errorMessage)
      }
    }
  }

  if (loading || !product) {
    return (
      <View
        style={{ flex: 1, backgroundColor: theme.colors.background }}
        testID={TEST_IDS.loadingSpinner}
      >
        <ProductDetailsSkeleton />
      </View>
    )
  }

  const discountedPrice = Math.round(parseFloat(product.discounted_price) || 0)
  const originalPrice = Math.round(parseFloat(product.original_price) || 0)
  // Protection contre division par zéro
  const discountPercent = originalPrice > 0
    ? Math.round(((originalPrice - discountedPrice) / originalPrice) * 100)
    : 0

  const isTestMode = checkIsTestMode()

  // Calculate expiration info
  const daysUntilExpiration = product.days_until_expiration ?? (
    product.expiration_date
      ? Math.ceil((new Date(product.expiration_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      : null
  )

  const getExpirationBadge = () => {
    if (daysUntilExpiration === null) return null
    if (daysUntilExpiration <= 0) return { variant: 'error' as const, text: 'Expiré', icon: 'alert-circle' }
    if (daysUntilExpiration === 1) return { variant: 'warning' as const, text: 'Expire demain', icon: 'time' }
    if (daysUntilExpiration <= 3) return { variant: 'warning' as const, text: `${daysUntilExpiration} jours`, icon: 'time' }
    return { variant: 'success' as const, text: `${daysUntilExpiration} jours`, icon: 'checkmark-circle' }
  }

  const expirationBadge = getExpirationBadge()

  // Calculate distance to merchant
  const distanceInfo = userLocation && product.merchant?.latitude && product.merchant?.longitude
    ? locationService.calculateDistanceFromUser(
        userLocation,
        product.merchant.latitude,
        product.merchant.longitude
      )
    : null

  const selectedPayment = PAYMENT_OPTIONS.find(option => option.value === selectedPaymentMethod)
  const totalPrice = discountedPrice * selectedQuantity

  const cartItemsCount = cart?.items_count ?? 0

  const handleAddToCart = async () => {
    if (!product || addingToCart || product.quantity_available === 0) {
      return
    }

    // Validation: Vérifier que la quantité sélectionnée est disponible
    if (selectedQuantity > product.quantity_available) {
      showError(`Seulement ${product.quantity_available} unité(s) disponible(s)`)
      setSelectedQuantity(Math.min(selectedQuantity, product.quantity_available))
      return
    }

    setAddingToCart(true)
    try {
      const response = await dispatch(addCartItem({
        productId: product.id,
        quantity: selectedQuantity,
      })).unwrap()

      const addedQuantity = selectedQuantity
      showSuccess(
        `${addedQuantity} produit${addedQuantity > 1 ? 's' : ''} ajouté${addedQuantity > 1 ? 's' : ''} au panier.`
      )

      if (response?.data?.items_count) {
        // Afficher le popup stylisé
        setCartAddedVisible(true)
      }
    } catch (error: any) {
      const message = typeof error === 'string' ? error : error?.message
      showError(message || 'Impossible d\'ajouter le produit au panier')
    } finally {
      setAddingToCart(false)
    }
  }

  const performReservation = async () => {
    // 🐛 BUG FIX #MOB-C-002: Block IMMEDIATELY to prevent race condition
    // Guard contre les appels multiples simultanés
    if (reserving) return
    setReserving(true) // MOVED HERE - block immediately before any async logic

    // Nettoyer tout timeout de navigation précédent
    if (navigationTimeoutRef.current) {
      clearTimeout(navigationTimeoutRef.current)
      navigationTimeoutRef.current = null
    }
    try {
      console.log('🔵 [ProductDetails] Démarrage réservation...')
      // Recharger le produit pour avoir le stock à jour (protection race condition)
      await loadProduct()

      // Re-vérifier que la quantité est toujours disponible
      if (selectedQuantity > product.quantity_available) {
        console.warn('⚠️ [ProductDetails] Stock insuffisant:', {selectedQuantity, available: product.quantity_available})
        showError(`Stock insuffisant. Seulement ${product.quantity_available} unité(s) disponible(s)`)
        setSelectedQuantity(Math.min(selectedQuantity, product.quantity_available))
        setReserving(false)
        return
      }

      // Préparer la date et l'heure de récupération par défaut (demain à 10h)
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      const pickupDate = tomorrow.toISOString().split('T')[0] // Format YYYY-MM-DD
      const pickupTime = '10:00' // Heure par défaut

      console.log('📤 [ProductDetails] Envoi réservation:', {
        productId: product.id,
        quantity: selectedQuantity,
        paymentMethod: selectedPaymentMethod,
        pickupDate,
        pickupTime
      })

      const result = await dispatch(createReservation({
        productId: product.id,
        quantity: selectedQuantity,
        paymentMethod: selectedPaymentMethod,
        pickupDate,
        pickupTime,
        notes: null,
      }))

      console.log('📥 [ProductDetails] Résultat réservation:', result)

      if (createReservation.fulfilled.match(result)) {
        const reservation = result.payload
        showSuccess(
          `${selectedQuantity} produit${selectedQuantity > 1 ? 's' : ''} réservé${selectedQuantity > 1 ? 's' : ''} avec succès ! 🎉`
        )
        // Recharger le produit pour mettre à jour la quantité disponible
        await loadProduct()
        // Navigation automatique vers les détails de la réservation après 1.5 secondes
        navigationTimeoutRef.current = setTimeout(() => {
          navigation.navigate('ReservationDetails', {
            reservationId: reservation.data.id
          })
        }, 1500)
      } else if (createReservation.rejected.match(result)) {
        const errorMessage = result.payload as string || 'Impossible de créer la réservation'
        console.error('❌ [ProductDetails] Réservation rejetée:', {errorMessage, payload: result.payload, error: result.error})
        showError(errorMessage)
      }
    } catch (error: any) {
      console.error('❌ [ProductDetails] Exception lors de la réservation:', error)
      console.error('❌ [ProductDetails] Stack trace:', error.stack)
      showError(error.message || 'Une erreur est survenue lors de la réservation')
    } finally {
      setReserving(false)
    }
  }

  const handleReserve = async () => {
    // Synchronize modal quantity with selected quantity
    setModalQuantity(selectedQuantity)
    setConfirmVisible(true)
  }

  const styles = createStyles(theme)

  return (
    <View style={styles.container} testID={TEST_IDS.productDetailsScreen}>
      <StatusBar barStyle={theme.isDark ? 'light-content' : 'dark-content'} />

      <ScrollView style={styles.scrollView}>
        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
          </TouchableOpacity>
          <Typography variant="h3" weight="semibold" style={{ flex: 1, textAlign: 'center' }}>
            Détails du produit
          </Typography>
          <View style={styles.headerActions}>
            <FavoriteButton productId={product.id} size={24} />
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Voir mon panier"
              onPress={() => navigation.navigate('Orders', { screen: 'Cart' })}
              style={styles.cartButton}
            >
              <Ionicons name="cart" size={24} color={theme.colors.text} />
              {cartItemsCount > 0 && (
                <View style={styles.cartBadge}>
                  <Text style={styles.cartBadgeText}>{cartItemsCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Image */}
        <Image
          source={{ uri: getImageUrl(product.image_url, product.category?.name) }}
          placeholder={{ uri: getCategoryPlaceholder(product.category?.name) }}
          style={styles.productImage}
          contentFit="cover"
          transition={200}
        />

        {/* Info */}
        <View style={styles.content}>
          <Typography variant="h2" weight="bold" style={{ marginBottom: theme.spacing.sm }}>
            {product.name}
          </Typography>

          {/* Merchant Info with Verified Badge */}
          <View style={styles.merchantRow}>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Typography variant="body" color="secondary">
                  {product.merchant?.business_name || 'Marchand'}
                </Typography>
                {product.merchant?.is_verified && (
                  <View style={styles.verifiedBadge}>
                    <Ionicons name="checkmark-circle" size={16} color={theme.colors.success} />
                    <Typography variant="caption" weight="semibold" style={{ color: theme.colors.success, marginLeft: 2 }}>
                      Vérifié
                    </Typography>
                  </View>
                )}
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 }}>
                <Ionicons name="location-outline" size={14} color={theme.colors.textTertiary} />
                <Typography variant="caption" color="tertiary">
                  {product.merchant?.city || 'Ville'}
                </Typography>
                {distanceInfo && (
                  <>
                    <Typography variant="caption" color="tertiary"> • </Typography>
                    <Ionicons name="navigate-outline" size={14} color={theme.colors.primary[500]} />
                    <Typography variant="caption" weight="semibold" color="primary">
                      {distanceInfo.formatted}
                    </Typography>
                  </>
                )}
              </View>
            </View>
          </View>

          {/* Important Info Cards: Expiration + Savings */}
          <View style={styles.infoCardsRow}>
            {/* Expiration Card */}
            {expirationBadge && (
              <View style={[
                styles.infoCard,
                {
                  backgroundColor: expirationBadge.variant === 'error'
                    ? `${theme.colors.error}15`
                    : expirationBadge.variant === 'warning'
                      ? `${theme.colors.warning}15`
                      : `${theme.colors.success}15`,
                  borderColor: expirationBadge.variant === 'error'
                    ? theme.colors.error
                    : expirationBadge.variant === 'warning'
                      ? theme.colors.warning
                      : theme.colors.success,
                }
              ]}>
                <Ionicons
                  name={expirationBadge.icon as any}
                  size={20}
                  color={
                    expirationBadge.variant === 'error'
                      ? theme.colors.error
                      : expirationBadge.variant === 'warning'
                        ? theme.colors.warning
                        : theme.colors.success
                  }
                />
                <View>
                  <Typography variant="caption" color="secondary">
                    À consommer
                  </Typography>
                  <Typography
                    variant="body"
                    weight="bold"
                    style={{
                      color: expirationBadge.variant === 'error'
                        ? theme.colors.error
                        : expirationBadge.variant === 'warning'
                          ? theme.colors.warning
                          : theme.colors.success
                    }}
                  >
                    {expirationBadge.text}
                  </Typography>
                </View>
              </View>
            )}

            {/* Savings Card */}
            {discountPercent > 0 && (
              <View style={[styles.infoCard, { backgroundColor: `${theme.colors.primary[500]}15`, borderColor: theme.colors.primary[500] }]}>
                <Ionicons name="pricetag" size={20} color={theme.colors.primary[500]} />
                <View>
                  <Typography variant="caption" color="secondary">
                    Économie
                  </Typography>
                  <Typography variant="body" weight="bold" color="primary">
                    {formatCurrency(originalPrice - discountedPrice)}
                  </Typography>
                </View>
              </View>
            )}
          </View>

          <View style={{ marginBottom: theme.spacing.md }}>
            <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8, marginBottom: 4 }}>
              <Typography variant="h2" weight="bold" color="primary" style={{ fontSize: 32 }}>
                {formatCurrency(discountedPrice)}
              </Typography>
              {discountPercent > 0 && (
                <Typography variant="body" weight="bold" style={{ color: theme.colors.error }}>
                  -{discountPercent}%
                </Typography>
              )}
            </View>
            <Typography variant="body" color="tertiary" style={{ textDecorationLine: 'line-through', opacity: 0.6, fontSize: 16 }}>
              {formatCurrency(originalPrice)}
            </Typography>
          </View>

          <Typography variant="body" style={{ marginBottom: theme.spacing.md }}>
            Quantité disponible: {product.quantity_available}
          </Typography>

          {/* Sélecteur de quantité */}
          <View style={styles.quantitySelector}>
            <Typography variant="body" weight="semibold" style={{ marginBottom: theme.spacing.md }}>
              Quantité à réserver :
            </Typography>
            <View style={styles.quantityControls}>
              <TouchableOpacity
                style={[styles.quantityButton, selectedQuantity <= 1 && styles.quantityButtonDisabled]}
                disabled={selectedQuantity <= 1}
                onPress={() => setSelectedQuantity(Math.max(1, selectedQuantity - 1))}
                testID={TEST_IDS.decreaseQuantityButton}
              >
                <Ionicons name="remove" size={20} color={selectedQuantity <= 1 ? theme.colors.neutral[400] : theme.colors.primary[600]} />
              </TouchableOpacity>

              <Typography
                variant="h3"
                weight="bold"
                style={{ minWidth: 40, textAlign: 'center' }}
                testID={TEST_IDS.quantityValue}
              >
                {selectedQuantity}
              </Typography>

              <TouchableOpacity
                style={[styles.quantityButton, selectedQuantity >= product.quantity_available && styles.quantityButtonDisabled]}
                disabled={selectedQuantity >= product.quantity_available}
                onPress={() => setSelectedQuantity(Math.min(product.quantity_available, selectedQuantity + 1))}
                testID={TEST_IDS.increaseQuantityButton}
              >
                <Ionicons name="add" size={20} color={selectedQuantity >= product.quantity_available ? theme.colors.neutral[400] : theme.colors.primary[600]} />
              </TouchableOpacity>
            </View>

            <Typography variant="caption" color="secondary" style={{ textAlign: 'center' }}>
              ({product.quantity_available} disponible{product.quantity_available > 1 ? 's' : ''})
            </Typography>
          </View>

          {/* Méthode de paiement */}
          <View style={styles.paymentMethodSection}>
            <Typography variant="body" weight="semibold" style={{ marginBottom: theme.spacing.sm }}>
              Méthode de paiement
            </Typography>
            <View style={styles.paymentOptions}>
              {PAYMENT_OPTIONS.map(option => {
                const isSelected = option.value === selectedPaymentMethod
                return (
                  <TouchableOpacity
                    key={option.value}
                    onPress={() => setSelectedPaymentMethod(option.value)}
                    style={[
                      styles.paymentOption,
                      {
                        borderColor: isSelected ? theme.colors.primary[500] : theme.colors.borderLight,
                        backgroundColor: isSelected ? theme.colors.primary[50] : theme.colors.surface.light,
                      },
                    ]}
                    activeOpacity={0.85}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: isSelected }}
                  >
                    <View style={styles.paymentOptionHeader}>
                      <Ionicons
                        name={option.icon}
                        size={20}
                        color={isSelected ? theme.colors.primary[600] : theme.colors.neutral[500]}
                      />
                      <Typography
                        variant="body"
                        weight={isSelected ? 'semibold' : 'medium'}
                        style={{ color: isSelected ? theme.colors.primary[700] : theme.colors.text }}
                      >
                        {option.label}
                      </Typography>
                    </View>
                    <Typography
                      variant="caption"
                      color="secondary"
                      style={{ marginTop: 6, lineHeight: 16 }}
                    >
                      {option.description}
                    </Typography>
                  </TouchableOpacity>
                )
              })}
            </View>
            {selectedPaymentMethod === 'flooz' && (
              <Typography variant="caption" color="secondary" style={{ marginTop: theme.spacing.xs }}>
                Vous pourrez préciser votre opérateur mobile et numéro lors du paiement.
              </Typography>
            )}
            {selectedPaymentMethod === 'paystack' && (
              <Typography variant="caption" color="secondary" style={{ marginTop: theme.spacing.xs }}>
                Redirection sécurisée pour régler par carte bancaire via Paystack.
              </Typography>
            )}
          </View>

          {/* Récapitulatif prix */}
          <View style={styles.totalSummary}>
            <View>
              <Typography variant="caption" color="secondary">
                Total à payer
              </Typography>
              <Typography variant="body" weight="semibold">
                {formatCurrency(discountedPrice)} × {selectedQuantity}
              </Typography>
            </View>
            <Typography variant="h3" weight="bold" color="primary">
              {formatCurrency(totalPrice)}
            </Typography>
          </View>

          {product.description && (
            <Typography variant="body" color="secondary" style={{ marginBottom: theme.spacing.md, lineHeight: 20 }}>
              {product.description}
            </Typography>
          )}

          <Typography variant="body" color="secondary">
            Catégorie: {product.category?.name || 'Non catégorisé'}
          </Typography>

          {/* Section Avis Clients */}
          <View style={styles.reviewsSection}>
            <View style={styles.reviewsHeader}>
              <Typography variant="h3" weight="bold" style={{ marginBottom: theme.spacing.md }}>
                Avis clients
              </Typography>
              {reviewStats && (
                <View style={styles.reviewsStatsRow}>
                  <StarRating rating={reviewStats.average_rating} size={18} />
                  <Typography variant="body" weight="semibold" style={{ marginLeft: theme.spacing.sm }}>
                    {reviewStats.average_rating.toFixed(1)}
                  </Typography>
                  <Typography variant="body" color="secondary" style={{ marginLeft: theme.spacing.xs }}>
                    ({reviewStats.total_reviews} avis)
                  </Typography>
                </View>
              )}
            </View>

            <View style={styles.reviewsActions}>
              <Button
                variant="secondary"
                size="sm"
                onPress={() => navigation.navigate('ReviewsList', {
                  merchantId: product.merchant?.id,
                  merchantName: product.merchant?.business_name || 'Marchand',
                })}
                leftIcon={<Ionicons name="star-outline" size={20} color={theme.colors.primary[600]} />}
                style={{ flex: 1 }}
              >
                Voir tous les avis
              </Button>

              <Button
                variant="primary"
                size="sm"
                onPress={() => navigation.navigate('AddReview', {
                  merchantId: product.merchant?.id,
                  productId: product.id,
                  merchantName: product.merchant?.business_name || 'Marchand',
                })}
                leftIcon={<Ionicons name="create-outline" size={20} color={theme.colors.textInverse} />}
                style={{ flex: 1 }}
              >
                Donner un avis
              </Button>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Sticky Bottom Bar - Avis + Réserver */}
      <View style={styles.bottomBar}>
        {/* Section Avis Compacte - Toujours visible */}
        {reviewStats && reviewStats.total_reviews > 0 && (
          <>
            <View style={styles.bottomBarReviews}>
              {/* Rating + Count */}
              <View style={styles.reviewsQuickInfo}>
                <StarRating rating={reviewStats.average_rating} size={16} />
                <Typography variant="caption" weight="semibold" style={{ marginLeft: 6 }}>
                  {reviewStats.average_rating.toFixed(1)} ({reviewStats.total_reviews} avis)
                </Typography>
              </View>

              {/* Boutons Rapides */}
              <View style={styles.reviewsQuickActions}>
                <TouchableOpacity
                  style={styles.reviewIconButton}
                  onPress={() => navigation.navigate('ReviewsList', {
                    merchantId: product.merchant?.id,
                    merchantName: product.merchant?.business_name || 'Marchand',
                  })}
                >
                  <Ionicons name="star-outline" size={20} color={theme.colors.primary[600]} />
                  <Typography variant="caption" color="primary" style={{ marginTop: 2 }}>
                    Voir
                  </Typography>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.reviewIconButton}
                  onPress={() => navigation.navigate('AddReview', {
                    merchantId: product.merchant?.id,
                    productId: product.id,
                    merchantName: product.merchant?.business_name || 'Marchand',
                  })}
                >
                  <Ionicons name="create-outline" size={20} color={theme.colors.primary[600]} />
                  <Typography variant="caption" color="primary" style={{ marginTop: 2 }}>
                    Donner
                  </Typography>
                </TouchableOpacity>
              </View>
            </View>

            {/* Divider */}
            <View style={styles.bottomBarDivider} />
          </>
        )}

        {/* Guidance texte pour clarifier la différence */}
        <View style={{ paddingHorizontal: theme.spacing.md, paddingBottom: theme.spacing.xs }}>
          <Typography variant="caption" color="secondary" style={{ textAlign: 'center', lineHeight: 16 }}>
            💡 <Typography variant="caption" weight="semibold">Panier :</Typography> Ajoutez plusieurs produits pour une réservation groupée.{'\n'}
            <Typography variant="caption" weight="semibold">Réserver :</Typography> Réservation immédiate de ce produit uniquement.
          </Typography>
        </View>

        <View style={styles.bottomBarActions}>
          <Button
            variant="secondary"
            size="lg"
            disabled={product.quantity_available === 0 || addingToCart || updating}
            onPress={handleAddToCart}
            leftIcon={<Ionicons name="bag-add" size={20} color={theme.colors.textInverse} />}
            style={{ flex: 1 }}
            testID={TEST_IDS.addToCartButton}
            accessibilityLabel={TEST_IDS.addToCartButton}
          >
            {product.quantity_available === 0
              ? 'Rupture de stock'
              : addingToCart || updating
                ? 'Ajout en cours...'
                : 'Ajouter au panier'}
          </Button>

          <Button
            variant="primary"
            size="lg"
            disabled={product.quantity_available === 0 || reserving}
            onPress={handleReserve}
            leftIcon={<Ionicons name="cart" size={20} color={theme.colors.textInverse} />}
            style={{ flex: 1 }}
            testID={TEST_IDS.reserveButton}
            accessibilityLabel={TEST_IDS.reserveButton}
          >
            {reserving
              ? 'Réservation en cours...'
              : product.quantity_available === 0
                ? 'Rupture de stock'
                : 'Réserver maintenant'}
          </Button>
        </View>
      </View>

      {/* Styled Reservation Confirmation Modal */}
      <Modal
        visible={confirmVisible}
        onClose={() => setConfirmVisible(false)}
        title="Confirmer la réservation"
        variant="center"
        testID={TEST_IDS.reservationModal}
      >
        {/* Product Preview */}
        <View style={styles.modalProductPreview}>
          <Image
            source={{ uri: getImageUrl(product.image_url, product.category?.name) }}
            style={styles.modalProductImage}
            contentFit="cover"
          />
          <View style={styles.modalProductInfo}>
            <Typography variant="body" weight="semibold" numberOfLines={2}>
              {product.name}
            </Typography>
            <Typography variant="caption" color="secondary">
              {product.merchant?.business_name}
            </Typography>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 }}>
              <Typography variant="body" weight="bold" color="primary">
                {formatCurrency(discountedPrice)}
              </Typography>
              {discountPercent > 0 && (
                <Typography variant="caption" style={{ textDecorationLine: 'line-through', color: theme.colors.neutral[400] }}>
                  {formatCurrency(originalPrice)}
                </Typography>
              )}
            </View>
          </View>
        </View>

        {/* Quantity Selector in Modal */}
        <View style={styles.modalQuantitySection}>
          <Typography variant="body" weight="semibold" style={{ marginBottom: 12 }}>
            Quantité à réserver
          </Typography>
          <View style={styles.modalQuantityControls}>
            <TouchableOpacity
              style={[styles.modalQuantityButton, modalQuantity <= 1 && styles.modalQuantityButtonDisabled]}
              disabled={modalQuantity <= 1}
              onPress={() => setModalQuantity(Math.max(1, modalQuantity - 1))}
            >
              <Ionicons name="remove" size={24} color={modalQuantity <= 1 ? theme.colors.neutral[400] : theme.colors.primary[600]} />
            </TouchableOpacity>

            <View style={styles.modalQuantityValue}>
              <Typography variant="h2" weight="bold">
                {modalQuantity}
              </Typography>
            </View>

            <TouchableOpacity
              style={[styles.modalQuantityButton, modalQuantity >= product.quantity_available && styles.modalQuantityButtonDisabled]}
              disabled={modalQuantity >= product.quantity_available}
              onPress={() => setModalQuantity(Math.min(product.quantity_available, modalQuantity + 1))}
            >
              <Ionicons name="add" size={24} color={modalQuantity >= product.quantity_available ? theme.colors.neutral[400] : theme.colors.primary[600]} />
            </TouchableOpacity>
          </View>
          <Typography variant="caption" color="secondary" style={{ textAlign: 'center', marginTop: 8 }}>
            {product.quantity_available} disponible{product.quantity_available > 1 ? 's' : ''}
          </Typography>
        </View>

        {/* Payment Method Display */}
        <View style={styles.modalPaymentInfo}>
          <Ionicons name={selectedPayment?.icon || 'card-outline'} size={20} color={theme.colors.primary[600]} />
          <Typography variant="body" color="secondary">
            Paiement : {selectedPayment?.label ?? 'Sur place'}
          </Typography>
        </View>

        {/* Total Summary */}
        <View style={styles.modalTotalSection}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="body" color="secondary">
              {formatCurrency(discountedPrice)} × {modalQuantity}
            </Typography>
            <Typography variant="h3" weight="bold" color="primary">
              {formatCurrency(discountedPrice * modalQuantity)}
            </Typography>
          </View>
        </View>

        {/* Action Buttons - Fixed alignment */}
        <View style={styles.modalActions}>
          <Button
            variant="ghost"
            size="lg"
            onPress={() => setConfirmVisible(false)}
            style={styles.modalButtonCancel}
            testID={TEST_IDS.cancelButton}
          >
            Annuler
          </Button>
          <Button
            variant="primary"
            size="lg"
            onPress={async () => {
              // Update the selected quantity with modal quantity before reservation
              setSelectedQuantity(modalQuantity)
              setConfirmVisible(false)
              // Small delay to ensure state is updated
              setTimeout(() => performReservation(), 100)
            }}
            style={styles.modalButtonConfirm}
            leftIcon={<Ionicons name="checkmark-circle" size={20} color={theme.colors.textInverse} />}
            testID={TEST_IDS.confirmButton}
          >
            Confirmer ({formatCurrency(discountedPrice * modalQuantity)})
          </Button>
        </View>
      </Modal>

      {/* Styled "Produit ajouté" Modal */}
      <Modal
        visible={cartAddedVisible}
        onClose={() => setCartAddedVisible(false)}
        title=""
        variant="center"
      >
        <View style={styles.cartAddedContent}>
          <View style={styles.cartAddedIconContainer}>
            <Ionicons name="checkmark-circle" size={56} color={theme.colors.success} />
          </View>
          <Typography variant="h3" weight="bold" style={{ textAlign: 'center', marginBottom: 8 }}>
            Produit ajouté
          </Typography>
          <Typography variant="body" color="secondary" style={{ textAlign: 'center', marginBottom: 24 }}>
            Souhaitez-vous consulter votre panier maintenant ?
          </Typography>
          <View style={styles.cartAddedActions}>
            <Button
              variant="primary"
              size="lg"
              onPress={() => {
                setCartAddedVisible(false)
                navigation.navigate('Orders', { screen: 'Cart' })
              }}
              style={{ flex: 1 }}
            >
              Voir le panier
            </Button>
          </View>
          <TouchableOpacity
            onPress={() => setCartAddedVisible(false)}
            style={{ marginTop: 16, alignSelf: 'center' }}
          >
            <Typography variant="body" weight="semibold" color="primary">
              Continuer mes achats
            </Typography>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  )
}

const createStyles = (theme: ReturnType<typeof useTheme>) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    gap: 16,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  cartButton: {
    padding: 6,
    borderRadius: 16,
    backgroundColor: 'transparent',
    position: 'relative',
  },
  cartBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: theme.colors.error,
    borderRadius: 10,
    minWidth: 20,
    minHeight: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  cartBadgeText: {
    color: theme.colors.textInverse,
    fontSize: 12,
    fontWeight: '700',
  },
  productImage: {
    width: '100%',
    height: 300,
  },
  content: {
    padding: 16,
  },
  merchantRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.md,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${theme.colors.success}15`,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: theme.radius.full,
  },
  infoCardsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: theme.spacing.md,
  },
  infoCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  bottomBar: {
    padding: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: theme.colors.borderLight,
    backgroundColor: theme.colors.background,
  },
  bottomBarReviews: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  reviewsQuickInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reviewsQuickActions: {
    flexDirection: 'row',
    gap: 16,
  },
  reviewIconButton: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    minWidth: 48,
  },
  bottomBarDivider: {
    height: 1,
    backgroundColor: theme.colors.borderLight,
    marginBottom: 12,
  },
  bottomBarActions: {
    flexDirection: 'row',
    gap: 12,
  },
  reviewsSection: {
    marginTop: 24,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: theme.colors.borderLight,
  },
  reviewsHeader: {
    marginBottom: 16,
  },
  reviewsStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reviewsActions: {
    flexDirection: 'row',
    gap: 12,
  },
  quantitySelector: {
    marginTop: 16,
    marginBottom: 16,
    padding: 16,
    backgroundColor: theme.colors.surface.light,
    borderRadius: 12,
    ...theme.shadows.sm,
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 8,
  },
  quantityButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.sm,
  },
  quantityButtonDisabled: {
    backgroundColor: theme.colors.neutral[100],
    opacity: 0.5,
  },
  paymentMethodSection: {
    marginBottom: 16,
  },
  paymentOptions: {
    flexDirection: 'column',
    gap: 12,
  },
  paymentOption: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    ...theme.shadows.sm,
  },
  paymentOptionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  totalSummary: {
    marginTop: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    backgroundColor: theme.colors.surface.light,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...theme.shadows.sm,
  },
  // Modal styles
  modalProductPreview: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: theme.colors.surface.light,
    borderRadius: 12,
    marginBottom: 16,
    gap: 12,
  },
  modalProductImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  modalProductInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  modalQuantitySection: {
    padding: 16,
    backgroundColor: theme.colors.surface.light,
    borderRadius: 12,
    marginBottom: 16,
  },
  modalQuantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
  },
  modalQuantityButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.sm,
  },
  modalQuantityButtonDisabled: {
    backgroundColor: theme.colors.neutral[100],
    opacity: 0.5,
  },
  modalQuantityValue: {
    minWidth: 60,
    alignItems: 'center',
  },
  modalPaymentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: theme.colors.primary[50],
    borderRadius: 8,
    marginBottom: 16,
  },
  modalTotalSection: {
    padding: 16,
    backgroundColor: theme.colors.surface.light,
    borderRadius: 12,
    marginBottom: 16,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  modalButtonCancel: {
    flex: 1,
    minWidth: 100,
  },
  modalButtonConfirm: {
    flex: 1.5,
    minWidth: 140,
  },
  // Styles pour le popup "Produit ajouté"
  cartAddedContent: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  cartAddedIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.colors.success + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  cartAddedActions: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
  },
})

export default ProductDetailsScreen
