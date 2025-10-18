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
import { useToast } from '../../contexts/ToastContext'
import { Ionicons } from '@expo/vector-icons'
import { Image } from 'expo-image'
import { Product } from '../../types'
import { useTheme } from '../../theme'
import { getImageUrl } from '../../utils/imageHelpers'
import { formatCurrency } from '../../utils/currencyHelpers'
import FavoriteButton from '../../components/FavoriteButton'
import StarRating from '../../components/reviews/StarRating'
import { Button, Card, Typography } from '../../components/2025'

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
  const { showSuccess, showError } = useToast()

  const [product, setProduct] = useState<Product | null>(null)
  const [reserving, setReserving] = useState(false)
  const [selectedQuantity, setSelectedQuantity] = useState(1)
  const navigationTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    loadProduct()
  }, [productId])

  useEffect(() => {
    if (product) {
      setSelectedQuantity(1) // Reset quantité quand nouveau produit
    }
  }, [product?.id])

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

  const loadProduct = async () => {
    try {
      const existingProduct = products.find(p => p.id === productId)
      if (existingProduct) {
        console.log('Product found in store:', existingProduct)
        setProduct(existingProduct)
      } else {
        console.log('Fetching product from API:', productId)
        const result = await dispatch(fetchProduct(productId))
        if (fetchProduct.fulfilled.match(result)) {
          console.log('Product fetched successfully:', result.payload)
          setProduct(result.payload as Product)
        } else if (fetchProduct.rejected.match(result)) {
          console.error('Failed to fetch product:', result.error)
          showError('Impossible de charger le produit')
          navigation.goBack()
        }
      }
    } catch (error: any) {
      console.error('Error loading product:', error)
      showError(`Impossible de charger le produit: ${error.message || 'Erreur inconnue'}`)
      navigation.goBack()
    }
  }

  if (loading || !product) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.colors.background, alignItems: 'center', justifyContent: 'center' }}>
        <Typography variant="body">Chargement...</Typography>
      </View>
    )
  }

  const discountedPrice = Math.round(parseFloat(product.discounted_price) || 0)
  const originalPrice = Math.round(parseFloat(product.original_price) || 0)
  const discountPercent = Math.round(((originalPrice - discountedPrice) / originalPrice) * 100)

  const handleReserve = async () => {
    // Guard contre les appels multiples simultanés
    if (reserving) return

    setReserving(true) // Bloquer immédiatement pour éviter double clic
    const totalPrice = discountedPrice * selectedQuantity

    Alert.alert(
      'Confirmer la réservation',
      `Voulez-vous réserver ${selectedQuantity} ${product.name}${selectedQuantity > 1 ? 's' : ''} pour ${formatCurrency(totalPrice)} ?\n\n(${formatCurrency(discountedPrice)} × ${selectedQuantity})`,
      [
        {
          text: 'Annuler',
          style: 'cancel',
          onPress: () => setReserving(false),
        },
        {
          text: 'Confirmer',
          onPress: async () => {
            try {
              const result = await dispatch(createReservation({
                productId: product.id,
                quantity: selectedQuantity,
                paymentMethod: 'on_site', // Paiement sur place
                notes: null,
              }))

              if (createReservation.fulfilled.match(result)) {
                const reservation = result.payload
                showSuccess(`${selectedQuantity} produit${selectedQuantity > 1 ? 's' : ''} réservé${selectedQuantity > 1 ? 's' : ''} avec succès ! 🎉`)
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
          },
        },
      ],
    )
  }

  const styles = createStyles(theme)

  return (
    <View style={styles.container}>
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
              >
                <Ionicons name="remove" size={20} color={selectedQuantity <= 1 ? theme.colors.neutral[400] : theme.colors.primary[600]} />
              </TouchableOpacity>

              <Typography variant="h3" weight="bold" style={{ minWidth: 40, textAlign: 'center' }}>
                {selectedQuantity}
              </Typography>

              <TouchableOpacity
                style={[styles.quantityButton, selectedQuantity >= product.quantity_available && styles.quantityButtonDisabled]}
                disabled={selectedQuantity >= product.quantity_available}
                onPress={() => setSelectedQuantity(Math.min(product.quantity_available, selectedQuantity + 1))}
              >
                <Ionicons name="add" size={20} color={selectedQuantity >= product.quantity_available ? theme.colors.neutral[400] : theme.colors.primary[600]} />
              </TouchableOpacity>
            </View>

            <Typography variant="caption" color="secondary" style={{ textAlign: 'center' }}>
              ({product.quantity_available} disponible{product.quantity_available > 1 ? 's' : ''})
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

      {/* Bouton Réserver */}
      <View style={styles.bottomBar}>
        <Button
          variant="primary"
          size="lg"
          disabled={product.quantity_available === 0 || reserving}
          onPress={handleReserve}
          leftIcon={<Ionicons name="cart" size={20} color={theme.colors.textInverse} />}
          style={{ width: '100%' }}
        >
          {reserving ? 'Réservation en cours...' : product.quantity_available === 0 ? 'Rupture de stock' : 'Réserver'}
        </Button>
      </View>
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
  productImage: {
    width: '100%',
    height: 300,
  },
  content: {
    padding: 16,
  },
  bottomBar: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: theme.colors.borderLight,
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
})

export default ProductDetailsScreen
