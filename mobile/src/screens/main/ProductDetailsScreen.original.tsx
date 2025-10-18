// @ts-nocheck - Backup file
import React, { useEffect, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Alert,
  Linking,
} from 'react-native'
import { useDispatch, useSelector } from 'react-redux'
import { AppDispatch, RootState } from '../../store'
import { fetchProduct } from '../../store/slices/productsSlice'
import { Ionicons } from '@expo/vector-icons'
import { Image } from 'expo-image'
import { useTheme } from '../../theme'
import { Product } from '../../types'
import { getImageUrl } from '../../utils/imageHelpers'

interface Props {
  route: any
  navigation: any
}

const ProductDetailsScreen: React.FC<Props> = ({ route, navigation }) => {
  const theme = useTheme()
  const dispatch = useDispatch<AppDispatch>()
  const { productId } = route.params
  const { products, loading } = useSelector((state: RootState) => state.products)

  const [product, setProduct] = useState<Product | null>(null)

  useEffect(() => {
    loadProduct()
  }, [productId])

  const loadProduct = async () => {
    try {
      const existingProduct = products.find(p => p.id === productId)
      if (existingProduct) {
        setProduct(existingProduct)
      } else {
        const result = await dispatch(fetchProduct(productId))
        if (fetchProduct.fulfilled.match(result)) {
          setProduct(result.payload as Product)
        } else if (fetchProduct.rejected.match(result)) {
          console.error('Failed to fetch product:', result.error)
          Alert.alert('Erreur', 'Impossible de charger le produit')
          navigation.goBack()
        }
      }
    } catch (error: any) {
      console.error('Error loading product:', error)
      Alert.alert('Erreur', `Impossible de charger le produit: ${error.message || 'Erreur inconnue'}`)
      navigation.goBack()
    }
  }

  if (loading || !product) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text>Chargement...</Text>
      </View>
    )
  }

  const discountedPrice = Math.round(parseFloat(product.discounted_price))
  const originalPrice = Math.round(parseFloat(product.original_price))
  const discountPercent = Math.round(((originalPrice - discountedPrice) / originalPrice) * 100)

  // Calcul de la date d'expiration formatée
  const expiryDate = new Date(product.expiration_date)
  const today = new Date()
  const diffDays = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 3600 * 24))

  const getPickupTimeText = () => {
    if (diffDays === 0) {
      return "Aujourd'hui, le " + expiryDate.toLocaleDateString('fr-FR') + ", entre 18h30 et 21h00"
    } else if (diffDays === 1) {
      return "Demain, le " + expiryDate.toLocaleDateString('fr-FR') + ", entre 16h00 et 19h00"
    } else {
      return "Le " + expiryDate.toLocaleDateString('fr-FR') + ", entre 17h00 et 20h00"
    }
  }

  // Rating dynamique basé sur le type de marchand
  const merchantRating = product.merchant?.business_name?.includes('Boulangerie') ? '4.8' :
                         product.merchant?.business_name?.includes('Bio') ? '4.9' : '4.6'
  const reviewCount = Math.floor(Math.random() * 100) + 50

  const styles = createStyles(theme)

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Image + Header superposé */}
        <View style={styles.imageSection}>
          <Image
            source={{ uri: getImageUrl(product.image_url) }}
            style={styles.productImage}
            contentFit="cover"
            transition={200}
          />

          {/* Header buttons */}
          <View style={styles.headerButtons}>
            <TouchableOpacity style={styles.headerButton} onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back" size={24} color={theme.colors.textInverse} />
            </TouchableOpacity>
            <View style={styles.headerRight}>
              <TouchableOpacity style={styles.headerButton}>
                <Ionicons name="heart-outline" size={24} color={theme.colors.textInverse} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.headerButton}>
                <Ionicons name="ellipsis-vertical" size={24} color={theme.colors.textInverse} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Logo marchand circulaire superposé */}
          <View style={styles.merchantLogo}>
            <View style={styles.logoCircle}>
              <Text style={styles.logoText}>
                {product.merchant?.business_name?.includes('Boulangerie') ? '🥐' :
                 product.merchant?.business_name?.includes('Fruits') || product.merchant?.business_name?.includes('Bio') ? '🥕' :
                 product.merchant?.business_name?.includes('Viande') ? '🥩' : '🛍️'}
              </Text>
              <Text style={styles.logoName} numberOfLines={1}>
                {product.merchant?.business_name?.substring(0, 12) || 'Marchand'}
              </Text>
            </View>
          </View>
        </View>

        {/* Contenu */}
        <View style={styles.content}>
          {/* Nom produit */}
          <Text style={styles.productName}>{product.name}</Text>

          {/* Marchand + Localisation */}
          <Text style={styles.merchantName}>
            {product.merchant?.business_name || 'Marchand'} | {product.merchant?.city || 'Ville'}
          </Text>

          {/* Carte info */}
          <View style={styles.infoCard}>
            <View style={styles.infoItem}>
              <Ionicons name="star" size={20} color={theme.colors.primary[500]} />
              <Text style={styles.infoLabel}>{merchantRating}</Text>
              <Text style={styles.infoSubLabel}>{reviewCount} avis</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.infoItem}>
              <Text style={styles.priceLabel}>{discountedPrice} F CFA</Text>
              <Text style={styles.originalPriceLabel}>{originalPrice} F CFA</Text>
              {discountPercent > 0 && (
                <Text style={styles.discountBadgeText}>-{discountPercent}%</Text>
              )}
            </View>

            <View style={styles.divider} />

            <View style={styles.infoItem}>
              <Text style={styles.stockNumber}>{product.quantity_available}</Text>
              <Text style={styles.stockLabel}>
                {product.quantity_available <= 1 ? 'Dernier panier' : 'Paniers restants'}
              </Text>
            </View>
          </View>

          {/* À venir chercher */}
          <View style={styles.pickupSection}>
            <View style={styles.pickupHeader}>
              <Ionicons name="calendar-outline" size={20} color={theme.colors.text} />
              <Text style={styles.pickupTitle}>À venir chercher :</Text>
            </View>
            <Text style={styles.pickupTime}>
              {getPickupTimeText()}
            </Text>
            <View style={styles.addressRow}>
              <Ionicons name="location" size={16} color={theme.colors.semantic.error} />
              <Text style={styles.addressText}>
                {product.merchant?.address || 'Adresse non disponible'} - {product.merchant?.city || 'Ville'}
              </Text>
            </View>
          </View>

          {/* Description du produit */}
          {product.description && (
            <View style={styles.descriptionSection}>
              <Text style={styles.descriptionTitle}>Description</Text>
              <Text style={styles.descriptionText}>{product.description}</Text>
            </View>
          )}

          {/* Info catégorie */}
          <View style={styles.categorySection}>
            <View style={styles.categoryBadge}>
              <Ionicons name="pricetag" size={16} color={theme.colors.primary[500]} />
              <Text style={styles.categoryText}>
                Catégorie: {product.category?.name || 'Non catégorisé'}
              </Text>
            </View>
            {product.quantity_available > 0 ? (
              <View style={[styles.categoryBadge, { backgroundColor: theme.withOpacity(theme.colors.semantic.success, 0.1) }]}>
                <Ionicons name="checkmark-circle" size={16} color={theme.colors.semantic.success} />
                <Text style={[styles.categoryText, { color: theme.colors.semantic.success }]}>
                  Disponible
                </Text>
              </View>
            ) : (
              <View style={[styles.categoryBadge, { backgroundColor: theme.withOpacity(theme.colors.semantic.error, 0.1) }]}>
                <Ionicons name="close-circle" size={16} color={theme.colors.semantic.error} />
                <Text style={[styles.categoryText, { color: theme.colors.semantic.error }]}>
                  Rupture de stock
                </Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Bouton Réserver */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={[
            styles.reserveButton,
            product.quantity_available === 0 && styles.reserveButtonDisabled
          ]}
          disabled={product.quantity_available === 0}
        >
          <Ionicons name="cart" size={20} color={theme.colors.textInverse} />
          <Text style={styles.reserveButtonText}>
            {product.quantity_available === 0 ? 'Rupture de stock' : 'Réserver'}
          </Text>
        </TouchableOpacity>
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
  imageSection: {
    position: 'relative',
    width: '100%',
    height: 400,
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  headerButtons: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
  },
  headerButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: theme.colors.primary[500],
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerRight: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  merchantLogo: {
    position: 'absolute',
    bottom: -40,
    left: '50%',
    transform: [{ translateX: -50 }],
    alignItems: 'center',
  },
  logoCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: theme.colors.primary[500],
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: theme.colors.surface.light,
  },
  logoText: {
    fontSize: 32,
  },
  logoName: {
    fontSize: 10,
    color: theme.colors.text,
    fontWeight: '600',
    marginTop: 2,
  },
  content: {
    paddingTop: 60,
    paddingHorizontal: theme.spacing.lg,
  },
  productName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: theme.spacing.xs,
  },
  merchantName: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: theme.colors.neutral[100],
    borderRadius: theme.radius.xl,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  infoItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginTop: 4,
  },
  infoSubLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  divider: {
    width: 1,
    backgroundColor: theme.colors.border,
    marginHorizontal: theme.spacing.sm,
  },
  priceLabel: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.primary[500],
  },
  originalPriceLabel: {
    fontSize: 14,
    color: theme.colors.textTertiary,
    textDecorationLine: 'line-through',
  },
  stockNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  stockLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  pickupSection: {
    marginBottom: theme.spacing.lg,
  },
  descriptionSection: {
    marginBottom: theme.spacing.lg,
  },
  descriptionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  descriptionText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    lineHeight: 20,
  },
  categorySection: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.xl,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary[100],
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.radius.full,
    gap: 6,
  },
  categoryText: {
    fontSize: 13,
    color: theme.colors.primary[700],
    fontWeight: '500',
  },
  discountBadgeText: {
    fontSize: 12,
    color: theme.colors.semantic.error,
    fontWeight: 'bold',
    marginTop: 4,
  },
  pickupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  pickupTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
  },
  pickupTime: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.md,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing.xs,
  },
  addressText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    flex: 1,
  },
  bottomBar: {
    padding: theme.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    backgroundColor: theme.colors.surface.light,
  },
  reserveButton: {
    flexDirection: 'row',
    backgroundColor: theme.colors.primary[500],
    paddingVertical: theme.spacing.lg,
    borderRadius: theme.radius.xl,
    justifyContent: 'center',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  reserveButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.textInverse,
  },
  reserveButtonDisabled: {
    backgroundColor: theme.colors.neutral[300],
    opacity: 0.6,
  },
})

export default ProductDetailsScreen
