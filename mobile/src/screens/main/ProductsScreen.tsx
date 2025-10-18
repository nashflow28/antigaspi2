import React, { useEffect, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  FlatList,
  RefreshControl,
} from 'react-native'
import { useDispatch, useSelector } from 'react-redux'
import { AppDispatch, RootState } from '../../store'
import { fetchProducts, fetchCategories } from '../../store/slices/productsSlice'
import { fetchMerchants } from '../../store/slices/merchantsSlice'
import { Ionicons } from '@expo/vector-icons'
import { Image } from 'expo-image'
import { useTheme } from '../../theme'
import { getImageUrl } from '../../utils/imageHelpers'
import { formatCurrency } from '../../utils/currencyHelpers'
import FavoriteButton from '../../components/FavoriteButton'
import { Product } from '../../types'
import { Button, Card, Badge, Typography } from '../../components/2025'

interface Props {
  navigation: any
}

const ProductsScreen: React.FC<Props> = ({ navigation }) => {
  const dispatch = useDispatch<AppDispatch>()
  const { products, categories, loading: productsLoading } = useSelector((state: RootState) => state.products)
  const { merchants, loading: merchantsLoading } = useSelector((state: RootState) => state.merchants)
  const theme = useTheme()

  const [contentMode, setContentMode] = useState<'merchants' | 'products'>('merchants')
  const [searchQuery, setSearchQuery] = useState('')
  const [refreshing, setRefreshing] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  // Filtrage des marchands
  const filteredMerchants = merchants.filter(merchant => {
    // Filtre par recherche (boutique, ville, type)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      const matchesSearch =
        merchant.business_name.toLowerCase().includes(query) ||
        merchant.user.city.toLowerCase().includes(query) ||
        merchant.business_type.toLowerCase().includes(query)

      if (!matchesSearch) return false
    }

    // TODO: Filtre par catégorie basé sur le type de commerce
    // Pour l'instant on affiche tous les marchands si "all" est sélectionné
    if (selectedCategory !== 'all') {
      const matchesCategory =
        (selectedCategory === '1' && merchant.business_type.toLowerCase().includes('boulang')) ||
        (selectedCategory === '2' && (merchant.business_type.toLowerCase().includes('fruit') || merchant.business_type.toLowerCase().includes('legume'))) ||
        (selectedCategory === '3' && (merchant.business_type.toLowerCase().includes('viande') || merchant.business_type.toLowerCase().includes('boucher'))) ||
        (selectedCategory === '4' && merchant.business_type.toLowerCase().includes('epicerie'))

      if (!matchesCategory) return false
    }

    return true
  })

  // Filtrage des produits
  const filteredProducts = (products || []).filter(product => {
    // Filtre par recherche (nom produit, marchand, ville)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      const matchesSearch =
        product.name.toLowerCase().includes(query) ||
        product.merchant?.business_name.toLowerCase().includes(query) ||
        product.merchant?.city.toLowerCase().includes(query)

      if (!matchesSearch) return false
    }

    // Filtre par catégorie
    if (selectedCategory !== 'all') {
      if (product.category.id !== parseInt(selectedCategory)) return false
    }

    // Filtre disponibilité (produits avec stock uniquement)
    if (product.quantity_available <= 0) return false

    return true
  })

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    // Recharger les données quand on change de mode
    loadData()
  }, [contentMode])

  const loadData = async () => {
    try {
      // Charger les catégories ET les données en parallèle (comme HomeScreen)
      if (contentMode === 'merchants') {
        await Promise.all([
          dispatch(fetchCategories()),
          dispatch(fetchMerchants())
        ])
      } else {
        await Promise.all([
          dispatch(fetchCategories()),
          dispatch(fetchProducts({ per_page: 100 }))
        ])
      }

      console.log('✅ Data loaded - Categories:', categories.length, 'Products:', products.length, 'Merchants:', merchants.length)
    } catch (error) {
      console.error('❌ Error loading data:', error)
    }
  }

  const onRefresh = async () => {
    setRefreshing(true)
    await loadData()
    setRefreshing(false)
  }

  // Mapping emojis pour les catégories
  const getCategoryEmoji = (categoryName: string) => {
    const name = categoryName.toLowerCase()
    if (name.includes('boulang') || name.includes('pain')) return '🥐'
    if (name.includes('fruit') || name.includes('légume') || name.includes('legume')) return '🥕'
    if (name.includes('viande') || name.includes('plat')) return '🥩'
    if (name.includes('épice') || name.includes('epicerie')) return '🥫'
    if (name.includes('laitage') || name.includes('produit laitier')) return '🥛'
    return '🛍️'
  }

  // Emoji dynamique basé sur le type de commerce
  const getMerchantEmoji = (businessType: string) => {
    const type = businessType.toLowerCase()
    if (type.includes('boulang')) return '🥐'
    if (type.includes('fruit') || type.includes('legume') || type.includes('bio')) return '🥕'
    if (type.includes('viande') || type.includes('boucher')) return '🥩'
    if (type.includes('poisson')) return '🐟'
    if (type.includes('fromage')) return '🧀'
    if (type.includes('restaurant')) return '🍽️'
    if (type.includes('supermarche') || type.includes('epicerie')) return '🏪'
    return '🛍️'
  }

  const renderMerchantCard = (merchant: any) => {
    return (
      <TouchableOpacity
        onPress={() => {
          // Navigate to merchant detail
          navigation.navigate('MerchantDetail', { merchantId: merchant.id })
        }}
      >
        <Card variant="elevated" style={{ marginBottom: theme.spacing.md, flexDirection: 'row', overflow: 'hidden' }}>
          {/* Image emoji du commerce */}
          <View style={styles.merchantImagePlaceholder}>
            <Text style={styles.merchantEmoji}>{getMerchantEmoji(merchant.business_type)}</Text>
          </View>

          {/* Badge nombre de produits */}
          {merchant.products_count > 0 && (
            <View style={styles.productCountBadge}>
              <Badge variant="primary" size="sm" style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Ionicons name="basket" size={14} color={theme.colors.textInverse} />
                <Typography variant="caption" weight="bold" style={{ color: theme.colors.textInverse }}>
                  {merchant.products_count}
                </Typography>
              </Badge>
            </View>
          )}

          {/* Badge vérifié */}
          {merchant.is_verified && (
            <View style={styles.verifiedBadge}>
              <Ionicons name="checkmark-circle" size={16} color={theme.colors.success[500]} />
            </View>
          )}

          <View style={styles.merchantInfo}>
            <Typography variant="body" weight="semibold" numberOfLines={1} style={{ marginBottom: theme.spacing.xs }}>
              {merchant.business_name}
            </Typography>

            <Typography variant="caption" color="secondary" style={{ marginBottom: theme.spacing.xs }}>
              {merchant.business_type}
            </Typography>

            <View style={styles.locationRow}>
              <Ionicons name="location" size={14} color={theme.colors.textSecondary} />
              <Typography variant="caption" color="secondary" numberOfLines={1} style={{ marginLeft: 4, flex: 1 }}>
                {merchant.user.city}
              </Typography>
            </View>

            {merchant.products_count > 0 && (
              <Typography variant="caption" weight="medium" color="primary" style={{ marginTop: theme.spacing.xs }}>
                {merchant.products_count} produit{merchant.products_count > 1 ? 's' : ''} disponible{merchant.products_count > 1 ? 's' : ''}
              </Typography>
            )}
          </View>
        </Card>
      </TouchableOpacity>
    )
  }

  const renderProductCard = (product: Product) => {
    const discountedPrice = Math.round(parseFloat(product.discounted_price) || 0)
    const originalPrice = Math.round(parseFloat(product.original_price) || 0)
    const discountPercent = Math.round(((originalPrice - discountedPrice) / originalPrice) * 100)

    return (
      <TouchableOpacity
        style={styles.productCard}
        onPress={() => navigation.navigate('ProductDetails', { productId: product.id })}
      >
        <Card variant="elevated" style={{ overflow: 'hidden' }}>
          {/* Image Container */}
          <View style={styles.productImageContainer}>
            <Image
              source={{ uri: getImageUrl(product.image_url, product.category?.name) }}
              style={styles.productImage}
              contentFit="cover"
              transition={200}
            />

            {/* Badge discount */}
            {discountPercent > 0 && (
              <View style={styles.discountBadge}>
                <Badge variant="error" size="sm">
                  -{discountPercent}%
                </Badge>
              </View>
            )}

            {/* FavoriteButton */}
            <View style={styles.favoriteButton}>
              <FavoriteButton productId={product.id} size={22} />
            </View>

            {/* Badge quantité */}
            <View style={styles.quantityBadge}>
              <Badge variant="primary" size="sm" style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Ionicons name="cart" size={14} color={theme.colors.textInverse} />
                <Typography variant="caption" weight="bold" style={{ color: theme.colors.textInverse }}>
                  {product.quantity_available}
                </Typography>
              </Badge>
            </View>
          </View>

          {/* Info produit */}
          <View style={styles.productInfo}>
            <Typography variant="caption" weight="semibold" numberOfLines={1} style={{ marginBottom: 4 }}>
              {product.name}
            </Typography>
            <Typography variant="caption" color="secondary" numberOfLines={1} style={{ marginBottom: 6, fontSize: 11 }}>
              {product.merchant?.business_name} | {product.merchant?.city}
            </Typography>
            <View style={styles.priceRow}>
              <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6 }}>
                <Typography variant="h3" weight="bold" color="primary" style={{ fontSize: 18 }}>
                  {formatCurrency(discountedPrice)}
                </Typography>
                {discountPercent > 0 && (
                  <Typography variant="caption" weight="bold" style={{ color: theme.colors.error[500], fontSize: 11 }}>
                    -{discountPercent}%
                  </Typography>
                )}
              </View>
              <Typography variant="caption" color="tertiary" style={{ textDecorationLine: 'line-through', fontSize: 11, opacity: 0.6 }}>
                {formatCurrency(originalPrice)}
              </Typography>
            </View>
          </View>
        </Card>
      </TouchableOpacity>
    )
  }

  const styles = createStyles(theme)

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.viewToggle}>
          <TouchableOpacity
            style={[styles.toggleButton, contentMode === 'merchants' && styles.toggleButtonActive]}
            onPress={() => setContentMode('merchants')}
          >
            <Ionicons name="storefront" size={20} color={contentMode === 'merchants' ? theme.colors.text : theme.colors.textSecondary} />
            <Typography variant="caption" weight={contentMode === 'merchants' ? 'semibold' : 'regular'} style={{ color: contentMode === 'merchants' ? theme.colors.text : theme.colors.textSecondary }}>
              Boutiques
            </Typography>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.toggleButton, contentMode === 'products' && styles.toggleButtonActive]}
            onPress={() => setContentMode('products')}
          >
            <Ionicons name="basket" size={20} color={contentMode === 'products' ? theme.colors.text : theme.colors.textSecondary} />
            <Typography variant="caption" weight={contentMode === 'products' ? 'semibold' : 'regular'} style={{ color: contentMode === 'products' ? theme.colors.text : theme.colors.textSecondary }}>
              Produits
            </Typography>
          </TouchableOpacity>
        </View>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={theme.colors.textSecondary} />
        <TextInput
          style={styles.searchInput}
          placeholder="Boutique, ville, type"
          placeholderTextColor={theme.colors.textTertiary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        <TouchableOpacity>
          <Ionicons name="options" size={24} color={theme.colors.text} />
        </TouchableOpacity>
      </View>

      {/* Categories - Barre compacte scrollable */}
      {categories && categories.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoriesScroll}
          contentContainerStyle={styles.categoriesContent}
        >
          <TouchableOpacity
            style={[styles.categoryChip, selectedCategory === 'all' && styles.categoryChipActive]}
            onPress={() => setSelectedCategory('all')}
          >
            <Text style={styles.categoryEmoji}>🛍️</Text>
            <Typography
              variant="caption"
              weight="medium"
              style={{
                maxWidth: 120,
                ...(selectedCategory === 'all' && { color: theme.colors.textInverse })
              }}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              Tous
            </Typography>
          </TouchableOpacity>
          {categories.map(category => (
            <TouchableOpacity
              key={category.id}
              style={[styles.categoryChip, selectedCategory === category.id.toString() && styles.categoryChipActive]}
              onPress={() => setSelectedCategory(category.id.toString())}
            >
              <Text style={styles.categoryEmoji}>{getCategoryEmoji(category.name)}</Text>
              <Typography
                variant="caption"
                weight="medium"
                style={{
                  maxWidth: 120,
                  ...(selectedCategory === category.id.toString() && { color: theme.colors.textInverse })
                }}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {category.name}
              </Typography>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Compteur de résultats */}
      {contentMode === 'merchants' ? (
        filteredMerchants.length > 0 && (
          <View style={styles.resultsHeader}>
            <Typography variant="body" weight="semibold">
              {filteredMerchants.length} boutique{filteredMerchants.length > 1 ? 's' : ''} trouvée{filteredMerchants.length > 1 ? 's' : ''}
            </Typography>
            {(selectedCategory !== 'all' || searchQuery.trim()) && (
              <TouchableOpacity onPress={() => {
                setSelectedCategory('all')
                setSearchQuery('')
              }}>
                <Typography variant="caption" weight="medium" color="primary">
                  Réinitialiser
                </Typography>
              </TouchableOpacity>
            )}
          </View>
        )
      ) : (
        filteredProducts.length > 0 && (
          <View style={styles.resultsHeader}>
            <Typography variant="body" weight="semibold">
              {filteredProducts.length} produit{filteredProducts.length > 1 ? 's' : ''} trouvé{filteredProducts.length > 1 ? 's' : ''}
            </Typography>
            {(selectedCategory !== 'all' || searchQuery.trim()) && (
              <TouchableOpacity onPress={() => {
                setSelectedCategory('all')
                setSearchQuery('')
              }}>
                <Typography variant="caption" weight="medium" color="primary">
                  Réinitialiser
                </Typography>
              </TouchableOpacity>
            )}
          </View>
        )
      )}

      {/* Liste conditionnelle selon mode */}
      {contentMode === 'merchants' ? (
        // Mode Marchands
        filteredMerchants.length > 0 ? (
          <FlatList
            data={filteredMerchants}
            renderItem={({ item }) => renderMerchantCard(item)}
            keyExtractor={(item) => `merchant-${item.id}`}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.colors.primary[500]]} />
            }
          />
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="storefront-outline" size={64} color={theme.colors.neutral[300]} />
            <Typography variant="h3" weight="bold" style={{ marginTop: theme.spacing.lg, marginBottom: theme.spacing.sm }}>
              Aucune boutique trouvée
            </Typography>
            <Typography variant="body" color="secondary" style={{ textAlign: 'center', lineHeight: 20, marginBottom: theme.spacing.lg }}>
              {searchQuery.trim()
                ? `Aucun résultat pour "${searchQuery}"`
                : 'Essayez de changer les filtres ou revenez plus tard'}
            </Typography>
            {(selectedCategory !== 'all' || searchQuery.trim()) && (
              <Button
                variant="primary"
                size="md"
                onPress={() => {
                  setSelectedCategory('all')
                  setSearchQuery('')
                }}
              >
                Réinitialiser les filtres
              </Button>
            )}
          </View>
        )
      ) : (
        // Mode Produits
        filteredProducts.length > 0 ? (
          <FlatList
            data={filteredProducts}
            renderItem={({ item }) => renderProductCard(item)}
            keyExtractor={(item) => `product-${item.id}`}
            numColumns={2}
            columnWrapperStyle={styles.productsRow}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.colors.primary[500]]} />
            }
          />
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="basket-outline" size={64} color={theme.colors.neutral[300]} />
            <Typography variant="h3" weight="bold" style={{ marginTop: theme.spacing.lg, marginBottom: theme.spacing.sm }}>
              Aucun produit trouvé
            </Typography>
            <Typography variant="body" color="secondary" style={{ textAlign: 'center', lineHeight: 20, marginBottom: theme.spacing.lg }}>
              {searchQuery.trim()
                ? `Aucun résultat pour "${searchQuery}"`
                : 'Essayez de changer les filtres ou revenez plus tard'}
            </Typography>
            {(selectedCategory !== 'all' || searchQuery.trim()) && (
              <Button
                variant="primary"
                size="md"
                onPress={() => {
                  setSelectedCategory('all')
                  setSearchQuery('')
                }}
              >
                Réinitialiser les filtres
              </Button>
            )}
          </View>
        )
      )}
    </View>
  )
}

const createStyles = (theme: ReturnType<typeof useTheme>) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.xl,
    paddingBottom: theme.spacing.md,
    alignItems: 'center',
  },
  viewToggle: {
    flexDirection: 'row',
    backgroundColor: theme.colors.neutral[100],
    borderRadius: theme.radius.full,
    padding: 4,
    gap: 4,
  },
  toggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.radius.full,
    gap: theme.spacing.xs,
  },
  toggleButtonActive: {
    backgroundColor: theme.colors.surface.light,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface.light,
    marginHorizontal: theme.spacing.lg,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.radius.xl,
    gap: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: theme.colors.text,
    paddingVertical: theme.spacing.sm,
  },
  categoriesScroll: {
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.xs,
  },
  categoriesContent: {
    paddingHorizontal: theme.spacing.md,
    paddingRight: theme.spacing.lg,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: theme.spacing.sm,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.surface.light,
    borderWidth: 1,
    borderColor: theme.colors.border,
    minHeight: 32,
  },
  categoryEmoji: {
    fontSize: 14,
    marginRight: 4,
  },
  categoryChipActive: {
    backgroundColor: theme.colors.primary[500],
    borderColor: theme.colors.primary[200],
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
  },
  listContent: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.xl,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.xl,
  },
  merchantImagePlaceholder: {
    width: 120,
    height: 120,
    backgroundColor: theme.colors.primary[100],
    justifyContent: 'center',
    alignItems: 'center',
  },
  merchantEmoji: {
    fontSize: 48,
  },
  productCountBadge: {
    position: 'absolute',
    top: theme.spacing.sm,
    left: theme.spacing.sm,
    zIndex: 1,
  },
  verifiedBadge: {
    position: 'absolute',
    top: theme.spacing.sm,
    right: theme.spacing.sm,
    backgroundColor: theme.colors.surface.light,
    borderRadius: theme.radius.full,
    padding: 4,
    zIndex: 1,
  },
  merchantInfo: {
    flex: 1,
    padding: theme.spacing.md,
    justifyContent: 'center',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: theme.spacing.xs,
  },
  productsRow: {
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.sm,
  },
  productCard: {
    flex: 1,
    overflow: 'hidden',
    margin: 6,
    maxWidth: '47%',
  },
  productImageContainer: {
    position: 'relative',
    width: '100%',
    height: 150,
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  discountBadge: {
    position: 'absolute',
    top: theme.spacing.sm,
    left: theme.spacing.sm,
  },
  favoriteButton: {
    position: 'absolute',
    top: theme.spacing.sm,
    right: theme.spacing.sm,
    zIndex: 3,
  },
  quantityBadge: {
    position: 'absolute',
    bottom: theme.spacing.sm,
    left: theme.spacing.sm,
  },
  productInfo: {
    padding: theme.spacing.sm,
  },
  priceRow: {
    flexDirection: 'column',
    gap: 2,
  },
})

export default ProductsScreen
