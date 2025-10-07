import React, { useEffect, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  RefreshControl,
  Alert,
} from 'react-native'
import { useDispatch, useSelector } from 'react-redux'
import { AppDispatch, RootState } from '../../store'
import { fetchProducts, fetchCategories } from '../../store/slices/productsSlice'
import { Ionicons } from '@expo/vector-icons'
import { Image } from 'expo-image'
import { useTheme } from '../../theme'
import { Product } from '../../types'
import { getImageUrl } from '../../utils/imageHelpers'

interface Props {
  navigation: any
}

const HomeScreen: React.FC<Props> = ({ navigation }) => {
  const dispatch = useDispatch<AppDispatch>()
  const { user } = useSelector((state: RootState) => state.auth)
  const { products, categories, loading } = useSelector((state: RootState) => state.products)
  const theme = useTheme()

  const [refreshing, setRefreshing] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [showAvailable, setShowAvailable] = useState(true)
  const [maxDistance, setMaxDistance] = useState(10)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      await Promise.all([
        dispatch(fetchProducts({ per_page: 20 })),
        dispatch(fetchCategories()),
      ])
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de charger les données')
    }
  }

  const onRefresh = async () => {
    setRefreshing(true)
    await loadData()
    setRefreshing(false)
  }

  const getTimeSlot = (product: Product) => {
    const today = new Date()
    const expiryDate = new Date(product.expiration_date)
    const diffDays = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 3600 * 24))

    if (diffDays === 0) {
      return { text: "Aujourd'hui entre 18h30 et 21h", color: theme.colors.primary[500] }
    } else if (diffDays === 1) {
      return { text: "Demain entre 16h et 19h", color: theme.colors.success[500] }
    } else {
      return { text: `Dans ${diffDays} jours`, color: theme.colors.neutral[500] }
    }
  }

  // Filtrage des produits selon catégorie et disponibilité
  const filteredProducts = products.filter(product => {
    // Filtre par catégorie
    if (selectedCategory !== 'all' && product.category.id !== parseInt(selectedCategory)) {
      return false
    }

    // Filtre par disponibilité
    if (showAvailable && product.quantity_available <= 0) {
      return false
    }

    return true
  })

  // Mapping des emojis par catégorie
  const getCategoryEmoji = (categoryName: string) => {
    const name = categoryName.toLowerCase()
    if (name.includes('boulang') || name.includes('pain')) return '🥐'
    if (name.includes('fruit') || name.includes('légume') || name.includes('legume')) return '🥕'
    if (name.includes('viande') || name.includes('plat')) return '🥩'
    if (name.includes('épice') || name.includes('epicerie')) return '🥫'
    if (name.includes('laitage') || name.includes('produit laitier')) return '🥛'
    return '🛍️'
  }

  const renderCategoryItem = (id: string, name: string, emoji: string) => {
    const isActive = selectedCategory === id
    return (
      <TouchableOpacity
        key={id}
        style={[
          styles.categoryItem,
          isActive && { backgroundColor: theme.colors.primary[500] }
        ]}
        onPress={() => setSelectedCategory(id)}
      >
        <Text style={styles.categoryEmoji}>{emoji}</Text>
        <Text style={[
          styles.categoryText,
          isActive && { color: theme.colors.textInverse }
        ]}>{name}</Text>
      </TouchableOpacity>
    )
  }

  const renderProductCard = (product: Product) => {
    const timeSlot = getTimeSlot(product)
    const discountedPrice = Math.round(parseFloat(product.discounted_price))
    const originalPrice = Math.round(parseFloat(product.original_price))

    // Calcul du discount en pourcentage
    const discountPercent = Math.round(((originalPrice - discountedPrice) / originalPrice) * 100)

    return (
      <TouchableOpacity
        key={product.id}
        style={styles.productCard}
        onPress={() => navigation.navigate('ProductDetails', { productId: product.id })}
      >
        {/* Badge horaire */}
        <View style={[styles.timeBadge, { backgroundColor: timeSlot.color }]}>
          <Text style={styles.timeBadgeText}>{timeSlot.text}</Text>
        </View>

        {/* Image */}
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: getImageUrl(product.image_url) }}
            style={styles.productImage}
            contentFit="cover"
            transition={200}
          />

          {/* Badge panier */}
          <View style={styles.cartBadge}>
            <Ionicons name="cart" size={16} color={theme.colors.textInverse} />
            <Text style={styles.cartBadgeText}>{product.quantity_available}</Text>
          </View>

          {/* Badge discount */}
          {discountPercent > 0 && (
            <View style={styles.discountBadge}>
              <Text style={styles.discountText}>-{discountPercent}%</Text>
            </View>
          )}
        </View>

        {/* Info produit */}
        <View style={styles.productInfo}>
          <Text style={styles.productName} numberOfLines={1}>
            {product.name}
          </Text>
          <Text style={styles.merchantName} numberOfLines={1}>
            {product.merchant.business_name}
          </Text>

          <View style={styles.ratingRow}>
            <Ionicons name="star" size={14} color={theme.colors.primary[500]} />
            <Text style={styles.ratingText}>
              {product.merchant.business_name.includes('Boulangerie') ? '4.8' : '4.5'}
            </Text>
            <Text style={styles.reviewsText}>
              ({Math.floor(Math.random() * 50) + 20})
            </Text>
            <Text style={styles.locationText} numberOfLines={1}>
              {product.merchant.city}
            </Text>
          </View>

          <View style={styles.priceRow}>
            <Text style={styles.currentPrice}>{discountedPrice} F CFA</Text>
            <Text style={styles.originalPriceStrike}>{originalPrice} F CFA</Text>
          </View>
        </View>
      </TouchableOpacity>
    )
  }

  const styles = createStyles(theme)

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor={theme.colors.background} barStyle="dark-content" />

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.colors.primary[500]]} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Bonjour {user?.first_name || 'Invité'}</Text>
            <View style={styles.locationRow}>
              <Text style={styles.locationQuestion}>Qu'allons-nous sauver au </Text>
              <Text style={styles.locationName}>Togo</Text>
              <Text style={styles.locationQuestion}> ?</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.refreshButton} onPress={onRefresh}>
            <Ionicons name="refresh" size={24} color={theme.colors.primary[500]} />
          </TouchableOpacity>
        </View>

        {/* Catégories */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoriesScroll}
          contentContainerStyle={styles.categoriesContent}
        >
          {renderCategoryItem('all', 'Tous', '🛍️')}
          {categories.map(category =>
            renderCategoryItem(
              category.id.toString(),
              category.name,
              getCategoryEmoji(category.name)
            )
          )}
        </ScrollView>

        {/* Filtres */}
        <View style={styles.filtersRow}>
          <TouchableOpacity
            style={[styles.filterChip, showAvailable && styles.filterChipActive]}
            onPress={() => setShowAvailable(!showAvailable)}
          >
            <Text style={[styles.filterText, showAvailable && styles.filterTextActive]}>
              🏷️ Produits disponibles
            </Text>
            <Ionicons
              name={showAvailable ? "toggle" : "toggle-outline"}
              size={24}
              color={showAvailable ? theme.colors.primary[500] : theme.colors.neutral[400]}
            />
          </TouchableOpacity>

          <TouchableOpacity style={styles.distanceFilter}>
            <Ionicons name="location" size={16} color={theme.colors.primary[500]} />
            <Text style={styles.distanceText}>{'< 10 km'}</Text>
            <Ionicons name="toggle" size={24} color={theme.colors.neutral[300]} />
          </TouchableOpacity>
        </View>

        {/* Compteur de résultats */}
        {filteredProducts.length > 0 && (
          <View style={styles.resultsHeader}>
            <Text style={styles.resultsText}>
              {filteredProducts.length} produit{filteredProducts.length > 1 ? 's' : ''} trouvé{filteredProducts.length > 1 ? 's' : ''}
            </Text>
            {selectedCategory !== 'all' && (
              <TouchableOpacity onPress={() => setSelectedCategory('all')}>
                <Text style={styles.clearFilters}>Effacer les filtres</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Produits */}
        <View style={styles.productsGrid}>
          {filteredProducts.length > 0 ? (
            filteredProducts.map(product => renderProductCard(product))
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="basket-outline" size={64} color={theme.colors.neutral[300]} />
              <Text style={styles.emptyTitle}>Aucun produit disponible</Text>
              <Text style={styles.emptyText}>
                Essayez de changer les filtres ou revenez plus tard
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
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
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.xl,
    paddingBottom: theme.spacing.md,
  },
  greeting: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.colors.primary[500],
    marginBottom: 4,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationQuestion: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  locationName: {
    fontSize: 14,
    color: theme.colors.primary[500],
    fontWeight: '600',
  },
  refreshButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.primary[50],
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoriesScroll: {
    marginTop: theme.spacing.md,
  },
  categoriesContent: {
    paddingHorizontal: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.surface.light,
    borderWidth: 1,
    borderColor: theme.colors.border,
    gap: theme.spacing.sm,
  },
  categoryEmoji: {
    fontSize: 20,
  },
  categoryText: {
    fontSize: 14,
    color: theme.colors.text,
    fontWeight: '500',
  },
  filtersRow: {
    flexDirection: 'row',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  filterChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.surface.light,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  filterChipActive: {
    backgroundColor: theme.colors.primary[50],
    borderColor: theme.colors.primary[200],
  },
  filterText: {
    fontSize: 13,
    color: theme.colors.textSecondary,
  },
  filterTextActive: {
    color: theme.colors.primary[700],
    fontWeight: '500',
  },
  distanceFilter: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.surface.light,
    gap: 4,
  },
  distanceText: {
    fontSize: 13,
    color: theme.colors.text,
    fontWeight: '500',
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
  },
  resultsText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
  },
  clearFilters: {
    fontSize: 13,
    color: theme.colors.primary[500],
    fontWeight: '500',
  },
  productsGrid: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
  },
  productCard: {
    backgroundColor: theme.colors.surface.light,
    borderRadius: theme.radius.xl,
    marginBottom: theme.spacing.lg,
    overflow: 'hidden',
    ...theme.shadows.md,
  },
  timeBadge: {
    position: 'absolute',
    top: theme.spacing.md,
    left: theme.spacing.md,
    maxWidth: '35%',
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.radius.full,
    zIndex: 1,
  },
  timeBadgeText: {
    color: theme.colors.textInverse,
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  discountBadge: {
    position: 'absolute',
    bottom: theme.spacing.md,
    right: theme.spacing.md,
    backgroundColor: theme.colors.error,
    paddingVertical: 6,
    paddingHorizontal: theme.spacing.sm,
    borderRadius: theme.radius.md,
    zIndex: 2,
  },
  discountText: {
    color: theme.colors.textInverse,
    fontSize: 12,
    fontWeight: 'bold',
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    height: 200,
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  cartBadge: {
    position: 'absolute',
    bottom: theme.spacing.md,
    left: theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface.light,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 6,
    borderRadius: theme.radius.md,
    gap: 4,
  },
  cartBadgeText: {
    color: theme.colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  productInfo: {
    padding: theme.spacing.md,
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 4,
  },
  merchantName: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
    gap: 4,
  },
  ratingText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.text,
  },
  reviewsText: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    marginRight: theme.spacing.sm,
  },
  locationText: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    flex: 1,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  currentPrice: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.primary[500],
  },
  originalPriceStrike: {
    fontSize: 16,
    color: theme.colors.textTertiary,
    textDecorationLine: 'line-through',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing['3xl'],
    paddingHorizontal: theme.spacing.xl,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
  },
  emptyText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
})

export default HomeScreen
