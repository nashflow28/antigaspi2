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
import { getImageUrl } from '../../utils/imageHelpers'
import { formatCurrency } from '../../utils/currencyHelpers'
import FavoriteButton from '../../components/FavoriteButton'
import StarRating from '../../components/reviews/StarRating'
import { Button, Card, Typography, Modal } from '../../components/2025'
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
  const [addingToCart, setAddingToCart] = useState(false)
  const isTestEnv = checkIsTestEnv()

  useEffect(() => {
    // 🐛 BUG FIX #MOB-H-003: Handle loadProduct errors on mount
    loadProduct().catch(() => {
      // Error already shown to user via showError in loadProduct
      // Navigate back since product couldn't be loaded
      navigation.goBack()
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
        style={{ flex: 1, backgroundColor: theme.colors.background, alignItems: 'center', justifyContent: 'center' }}
        testID={TEST_IDS.loadingSpinner}
      >
        <Typography variant="body">Chargement...</Typography>
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
        // Optionnel : proposer de consulter le panier
        Alert.alert(
          'Produit ajouté',
          'Souhaitez-vous consulter votre panier maintenant ?',
          [
            { text: 'Continuer mes achats', style: 'cancel' },
            {
              text: 'Voir le panier',
              onPress: () => navigation.navigate('Orders'),
            },
          ]
        )
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
      // Recharger le produit pour avoir le stock à jour (protection race condition)
      await loadProduct()

      // Re-vérifier que la quantité est toujours disponible
      if (selectedQuantity > product.quantity_available) {
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

      const result = await dispatch(createReservation({
        productId: product.id,
        quantity: selectedQuantity,
        paymentMethod: selectedPaymentMethod,
        pickupDate,
        pickupTime,
        notes: null,
      }))

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
        showError(errorMessage)
      }
    } catch (error: any) {
      showError(error.message || 'Une erreur est survenue lors de la réservation')
    } finally {
      setReserving(false)
    }
  }

  const handleReserve = async () => {
    if (isTestMode) {
      setConfirmVisible(true)
      return
    }
    // Default path with native Alert
    Alert.alert(
      'Confirmer la réservation',
      `Voulez-vous réserver ${selectedQuantity} ${product.name}${
        selectedQuantity > 1 ? 's' : ''
      } pour ${formatCurrency(totalPrice)} ?\n\n(${formatCurrency(discountedPrice)} × ${selectedQuantity})\nPaiement : ${
        selectedPayment?.label ?? 'Sur place'
      }`,
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Confirmer', onPress: () => performReservation() },
      ],
    )
  }

  const styles = createStyles(theme)

  return (
    <View style={styles.container} testID={TEST_IDS.productDetailsScreen}>
      <StatusBar barStyle={theme.isDark ? 'light-content' : 'dark-content'} />

      <ScrollView style={styles.scrollView}>
        {/* Header */}
        <View style={styles.header}>
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
              onPress={() => navigation.navigate('Orders')}
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
          style={styles.productImage}
          contentFit="cover"
          transition={200}
        />

        {/* Info */}
        <View style={styles.content}>
          <Typography variant="h2" weight="bold" style={{ marginBottom: theme.spacing.sm }}>
            {product.name}
          </Typography>

          <Typography variant="body" color="secondary" style={{ marginBottom: theme.spacing.md }}>
            {product.merchant?.business_name || 'Marchand'} | {product.merchant?.city || 'Ville'}
          </Typography>

          <View style={{ marginBottom: theme.spacing.md }}>
            <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8, marginBottom: 4 }}>
              <Typography variant="h2" weight="bold" color="primary" style={{ fontSize: 32 }}>
                {formatCurrency(discountedPrice)}
              </Typography>
              {discountPercent > 0 && (
                <Typography variant="body" weight="bold" style={{ color: theme.colors.error[500] }}>
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

      {/* Test-mode confirmation modal for MCP */}
      {isTestMode && (
        <Modal
          visible={confirmVisible}
          onClose={() => setConfirmVisible(false)}
          title="Confirmer la réservation"
          variant="center"
          testID={TEST_IDS.reservationModal}
          footer={
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <Button
                variant="ghost"
                onPress={() => setConfirmVisible(false)}
                testID={TEST_IDS.cancelButton}
              >
                Annuler
              </Button>
              <Button
                variant="primary"
                onPress={async () => {
                  setConfirmVisible(false)
                  await performReservation()
                }}
                testID={TEST_IDS.confirmButton}
              >
                Confirmer
              </Button>
            </View>
          }
        >
          <Typography variant="body">
            Voulez-vous réserver {selectedQuantity} {product.name}
            {selectedQuantity > 1 ? 's' : ''} ?
            {'\n'}Paiement : {selectedPayment?.label ?? 'Sur place'}
          </Typography>
        </Modal>
      )}
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
    backgroundColor: theme.colors.error[500],
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
    ...theme.shadows.xs,
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
})

export default ProductDetailsScreen
