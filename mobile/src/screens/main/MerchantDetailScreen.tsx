import React, { useEffect, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Dimensions,
  Alert,
} from 'react-native'
import { useDispatch, useSelector } from 'react-redux'
import { AppDispatch, RootState } from '../../store'
import { fetchProducts } from '../../store/slices/productsSlice'
import { Ionicons } from '@expo/vector-icons'
import { Image } from 'expo-image'
import { useTheme } from '../../theme'
import { Product } from '../../types'
import { getImageUrl } from '../../utils/imageHelpers'

const { width } = Dimensions.get('window')

interface Props {
  route: any
  navigation: any
}

const MerchantDetailScreen: React.FC<Props> = ({ route, navigation }) => {
  const theme = useTheme()
  const dispatch = useDispatch<AppDispatch>()
  const { merchantId } = route.params
  const { products } = useSelector((state: RootState) => state.products)

  const [merchantProducts, setMerchantProducts] = useState<Product[]>([])
  const [merchant, setMerchant] = useState<any>(null)

  useEffect(() => {
    loadMerchantData()
  }, [merchantId])

  const loadMerchantData = async () => {
    try {
      if (products.length === 0) {
        await dispatch(fetchProducts({ per_page: 50 }))
      }
      const merchantProds = products.filter(p => p.merchant.id === merchantId)
      if (merchantProds.length > 0) {
        setMerchantProducts(merchantProds)
        setMerchant(merchantProds[0].merchant)
      }
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de charger les données du marchand')
    }
  }

  // Emoji dynamique basé sur le nom du marchand
  const getMerchantEmoji = (businessName: string) => {
    const name = businessName.toLowerCase()
    if (name.includes('boulang')) return '🥐'
    if (name.includes('fruit') || name.includes('bio')) return '🥕'
    if (name.includes('viande') || name.includes('boucher')) return '🥩'
    if (name.includes('poisson')) return '🐟'
    if (name.includes('fromage')) return '🧀'
    return '🛍️'
  }

  // Rating dynamique
  const merchantRating = merchant?.business_name.includes('Boulangerie') ? '4.8' :
                         merchant?.business_name.includes('Bio') ? '4.9' : '4.6'
  const orderCount = Math.floor(Math.random() * 200) + 100

  // ✅ FIX: Create styles BEFORE using them
  const styles = createStyles(theme)

  if (!merchant) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text>Chargement...</Text>
      </View>
    )
  }

  const renderProductCard = (product: Product) => {
    const discountedPrice = Math.round(parseFloat(product.discounted_price))
    const isOutOfStock = product.quantity_available === 0

    return (
      <TouchableOpacity
        key={product.id}
        style={styles.productCard}
        onPress={() => navigation.navigate('ProductDetails', { productId: product.id })}
      >
        <Image
          source={{ uri: getImageUrl(product.image_url) }}
          style={styles.productImage}
          contentFit="cover"
        />
        {isOutOfStock && (
          <View style={styles.soldOutBadge}>
            <Text style={styles.soldOutText}>Victime de son succès</Text>
          </View>
        )}
        <View style={styles.productCardInfo}>
          <Text style={styles.productCardName} numberOfLines={1}>
            {product.name}
          </Text>
          <Text style={styles.productCardPrice}>{discountedPrice}€</Text>
        </View>
      </TouchableOpacity>
    )
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Map Section */}
      <View style={styles.mapContainer}>
        {/* Placeholder for map - can be replaced with actual map component */}
        <View style={styles.mapPlaceholder}>
          <Ionicons name="location" size={48} color={theme.colors.error} />
          <Text style={styles.mapText}>Carte interactive</Text>
          <Text style={styles.mapSubtext}>
            {merchant.address}, {merchant.city}
          </Text>
        </View>

        {/* Header buttons */}
        <View style={styles.headerButtons}>
          <TouchableOpacity style={styles.headerButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.textInverse} />
          </TouchableOpacity>
          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.headerButton}>
              <Ionicons name="share-social" size={24} color={theme.colors.textInverse} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerButton}>
              <Ionicons name="heart-outline" size={24} color={theme.colors.textInverse} />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Merchant Info Card */}
        <View style={styles.merchantCard}>
          <View style={styles.merchantHeader}>
            <View style={styles.merchantLogo}>
              <Text style={styles.logoEmoji}>{getMerchantEmoji(merchant.business_name)}</Text>
            </View>
            <View style={styles.merchantInfo}>
              <Text style={styles.merchantName}>{merchant.business_name}</Text>
              <View style={styles.ratingRow}>
                <Ionicons name="star" size={16} color={theme.colors.primary[500]} />
                <Text style={styles.ratingText}>{merchantRating}</Text>
                <Text style={styles.ordersText}>• {orderCount} commandes</Text>
              </View>
            </View>
          </View>

          <Text style={styles.description}>
            {merchant.business_name.includes('Boulangerie')
              ? 'Boulangerie artisanale proposant du pain frais et des pâtisseries fait maison. Venez découvrir nos spécialités locales et profiter de nos offres anti-gaspi !'
              : merchant.business_name.includes('Bio')
              ? 'Produits biologiques et locaux. Nous sélectionnons les meilleurs produits pour vous permettre de manger sainement tout en luttant contre le gaspillage.'
              : `${merchant.business_name} vous propose des produits de qualité à prix réduits. Profitez de nos offres anti-gaspi et contribuez à la lutte contre le gaspillage alimentaire !`}
          </Text>

          {/* Info Pills */}
          <View style={styles.infoPills}>
            <View style={styles.pill}>
              <Ionicons name="time-outline" size={16} color={theme.colors.text} />
              <Text style={styles.pillText}>8h - 19h</Text>
            </View>
            <View style={styles.pill}>
              <Ionicons name="location-outline" size={16} color={theme.colors.text} />
              <Text style={styles.pillText}>{merchant.city}</Text>
            </View>
            <View style={styles.pill}>
              <Ionicons name="card-outline" size={16} color={theme.colors.text} />
              <Text style={styles.pillText}>CB • Cash</Text>
            </View>
          </View>
        </View>

        {/* Products Section */}
        <View style={styles.productsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Produits disponibles</Text>
            <View style={styles.productCountBadge}>
              <Text style={styles.productCountText}>
                {merchantProducts.filter(p => p.quantity_available > 0).length} disponible{merchantProducts.filter(p => p.quantity_available > 0).length > 1 ? 's' : ''}
              </Text>
            </View>
          </View>
          {merchantProducts.length > 0 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.productsScroll}
            >
              {merchantProducts.map(product => renderProductCard(product))}
            </ScrollView>
          ) : (
            <View style={styles.emptyProducts}>
              <Text style={styles.emptyProductsText}>Aucun produit disponible pour le moment</Text>
            </View>
          )}
        </View>

        {/* Address Section */}
        <View style={styles.addressSection}>
          <Text style={[styles.sectionTitle, { paddingHorizontal: theme.spacing.lg, marginBottom: theme.spacing.md }]}>Adresse</Text>
          <View style={[styles.addressCard, { marginHorizontal: theme.spacing.lg }]}>
            <Ionicons name="location" size={24} color={theme.colors.primary[500]} />
            <View style={styles.addressInfo}>
              <Text style={styles.addressText}>{merchant.address}</Text>
              <Text style={styles.cityText}>
                {merchant.postal_code} {merchant.city}
              </Text>
            </View>
            <TouchableOpacity style={styles.directionButton}>
              <Ionicons name="navigate" size={20} color={theme.colors.primary[500]} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Payment Methods */}
        <View style={styles.paymentSection}>
          <Text style={[styles.sectionTitle, { paddingHorizontal: theme.spacing.lg, marginBottom: theme.spacing.md }]}>Moyens de paiement acceptés</Text>
          <View style={[styles.paymentMethods, { paddingHorizontal: theme.spacing.lg }]}>
            <View style={styles.paymentCard}>
              <Ionicons name="card" size={24} color={theme.colors.primary[500]} />
              <Text style={styles.paymentText}>Carte bancaire</Text>
            </View>
            <View style={styles.paymentCard}>
              <Ionicons name="cash" size={24} color={theme.colors.success[500]} />
              <Text style={styles.paymentText}>Espèces</Text>
            </View>
            <View style={styles.paymentCard}>
              <Ionicons name="phone-portrait" size={24} color={theme.colors.primary[500]} />
              <Text style={styles.paymentText}>Mobile Money</Text>
            </View>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Bottom Contact Bar */}
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.callButton}>
          <Ionicons name="call" size={20} color={theme.colors.textInverse} />
          <Text style={styles.callButtonText}>Appeler</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.messageButton}>
          <Ionicons name="chatbubble" size={20} color={theme.colors.primary[500]} />
          <Text style={styles.messageButtonText}>Message</Text>
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
  mapContainer: {
    position: 'relative',
    width: '100%',
    height: 250,
  },
  mapPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: theme.colors.neutral[200],
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginTop: theme.spacing.sm,
  },
  mapSubtext: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    marginTop: 4,
    textAlign: 'center',
    paddingHorizontal: theme.spacing.lg,
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
  merchantCard: {
    backgroundColor: theme.colors.surface.light,
    marginHorizontal: theme.spacing.lg,
    marginTop: -30,
    borderRadius: theme.radius.xl,
    padding: theme.spacing.lg,
    ...theme.shadows.md,
  },
  merchantHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  merchantLogo: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: theme.colors.primary[100],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  logoEmoji: {
    fontSize: 32,
  },
  merchantInfo: {
    flex: 1,
  },
  merchantName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 4,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
  },
  ordersText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginLeft: 4,
  },
  description: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    lineHeight: 20,
    marginBottom: theme.spacing.md,
  },
  infoPills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.neutral[100],
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.radius.full,
    gap: 6,
  },
  pillText: {
    fontSize: 13,
    color: theme.colors.text,
    fontWeight: '500',
  },
  productsSection: {
    marginTop: theme.spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  productCountBadge: {
    backgroundColor: theme.colors.primary[100],
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 6,
    borderRadius: theme.radius.full,
  },
  productCountText: {
    fontSize: 12,
    color: theme.colors.primary[700],
    fontWeight: '600',
  },
  emptyProducts: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.xl,
    alignItems: 'center',
  },
  emptyProductsText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  productsScroll: {
    paddingHorizontal: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  productCard: {
    width: 160,
    backgroundColor: theme.colors.surface.light,
    borderRadius: theme.radius.xl,
    overflow: 'hidden',
    ...theme.shadows.sm,
  },
  productImage: {
    width: '100%',
    height: 120,
  },
  soldOutBadge: {
    position: 'absolute',
    top: theme.spacing.sm,
    left: theme.spacing.sm,
    right: theme.spacing.sm,
    backgroundColor: theme.colors.error,
    paddingVertical: 6,
    paddingHorizontal: theme.spacing.sm,
    borderRadius: theme.radius.md,
  },
  soldOutText: {
    color: theme.colors.textInverse,
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },
  productCardInfo: {
    padding: theme.spacing.sm,
  },
  productCardName: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 4,
  },
  productCardPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.primary[500],
  },
  addressSection: {
    marginTop: theme.spacing.lg,
  },
  addressCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface.light,
    padding: theme.spacing.md,
    borderRadius: theme.radius.xl,
    gap: theme.spacing.md,
  },
  addressInfo: {
    flex: 1,
  },
  addressText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 4,
  },
  cityText: {
    fontSize: 13,
    color: theme.colors.textSecondary,
  },
  directionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.primary[100],
    justifyContent: 'center',
    alignItems: 'center',
  },
  paymentSection: {
    marginTop: theme.spacing.lg,
  },
  paymentMethods: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  paymentCard: {
    flex: 1,
    backgroundColor: theme.colors.surface.light,
    padding: theme.spacing.md,
    borderRadius: theme.radius.xl,
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  paymentText: {
    fontSize: 11,
    color: theme.colors.text,
    textAlign: 'center',
    fontWeight: '500',
  },
  bottomBar: {
    flexDirection: 'row',
    padding: theme.spacing.lg,
    gap: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    backgroundColor: theme.colors.surface.light,
  },
  callButton: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: theme.colors.primary[500],
    paddingVertical: theme.spacing.md,
    borderRadius: theme.radius.xl,
    justifyContent: 'center',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  callButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.textInverse,
  },
  messageButton: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: theme.colors.primary[100],
    paddingVertical: theme.spacing.md,
    borderRadius: theme.radius.xl,
    justifyContent: 'center',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  messageButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.primary[500],
  },
})

export default MerchantDetailScreen

