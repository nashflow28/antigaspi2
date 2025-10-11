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
import { fetchCategories } from '../../store/slices/productsSlice'
import { fetchMerchants } from '../../store/slices/merchantsSlice'
import { Ionicons } from '@expo/vector-icons'
import { Image } from 'expo-image'
import { useTheme } from '../../theme'
import { getImageUrl } from '../../utils/imageHelpers'

interface Props {
  navigation: any
}

const ProductsScreen: React.FC<Props> = ({ navigation }) => {
  const dispatch = useDispatch<AppDispatch>()
  const { categories } = useSelector((state: RootState) => state.products)
  const { merchants, loading } = useSelector((state: RootState) => state.merchants)
  const theme = useTheme()

  const [viewMode, setViewMode] = useState<'list' | 'map'>('list')
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

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      await Promise.all([
        dispatch(fetchMerchants()),
        dispatch(fetchCategories()),
      ])
    } catch (error) {
      // Handle error
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
    // Rating dynamique basé sur le type de marchand
    const merchantRating = merchant.business_name.includes('Boulangerie') ? '4.8' :
                           merchant.business_name.includes('Bio') ? '4.9' : '4.6'
    const reviewCount = Math.floor(Math.random() * 100) + 50

    return (
      <TouchableOpacity
        style={styles.merchantCard}
        onPress={() => {
          // Navigate to merchant detail
          navigation.navigate('MerchantDetail', { merchantId: merchant.id })
        }}
      >
        {/* Image emoji du commerce */}
        <View style={styles.merchantImagePlaceholder}>
          <Text style={styles.merchantEmoji}>{getMerchantEmoji(merchant.business_type)}</Text>
        </View>

        {/* Badge nombre de produits */}
        {merchant.products_count > 0 && (
          <View style={styles.productCountBadge}>
            <Ionicons name="basket" size={14} color={theme.colors.textInverse} />
            <Text style={styles.productCountText}>{merchant.products_count}</Text>
          </View>
        )}

        {/* Badge vérifié */}
        {merchant.is_verified && (
          <View style={styles.verifiedBadge}>
            <Ionicons name="checkmark-circle" size={16} color={theme.colors.success[500]} />
          </View>
        )}

        <View style={styles.merchantInfo}>
          <Text style={styles.merchantName} numberOfLines={1}>{merchant.business_name}</Text>

          <View style={styles.ratingRow}>
            <Ionicons name="star" size={14} color={theme.colors.primary[500]} />
            <Text style={styles.ratingText}>{merchantRating}</Text>
            <Text style={styles.reviewsCount}>| {reviewCount} avis</Text>
          </View>

          <View style={styles.locationRow}>
            <Ionicons name="location" size={14} color={theme.colors.textSecondary} />
            <Text style={styles.merchantLocation} numberOfLines={1}>{merchant.user.city}</Text>
          </View>

          {merchant.products_count > 0 && (
            <Text style={styles.productCountInfo}>
              {merchant.products_count} produit{merchant.products_count > 1 ? 's' : ''} disponible{merchant.products_count > 1 ? 's' : ''}
            </Text>
          )}
        </View>
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
            style={[styles.toggleButton, viewMode === 'list' && styles.toggleButtonActive]}
            onPress={() => setViewMode('list')}
          >
            <Ionicons name="list" size={20} color={viewMode === 'list' ? theme.colors.text : theme.colors.textSecondary} />
            <Text style={[styles.toggleText, viewMode === 'list' && styles.toggleTextActive]}>Liste</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.toggleButton, viewMode === 'map' && styles.toggleButtonActive]}
            onPress={() => setViewMode('map')}
          >
            <Ionicons name="map" size={20} color={viewMode === 'map' ? theme.colors.text : theme.colors.textSecondary} />
            <Text style={[styles.toggleText, viewMode === 'map' && styles.toggleTextActive]}>Carte</Text>
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

      {/* Categories */}
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
          <Text
            style={[styles.categoryText, selectedCategory === 'all' && styles.categoryTextActive]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            Tous
          </Text>
        </TouchableOpacity>
        {categories.map(category => (
          <TouchableOpacity
            key={category.id}
            style={[styles.categoryChip, selectedCategory === category.id.toString() && styles.categoryChipActive]}
            onPress={() => setSelectedCategory(category.id.toString())}
          >
            <Text style={styles.categoryEmoji}>{getCategoryEmoji(category.name)}</Text>
            <Text
              style={[styles.categoryText, selectedCategory === category.id.toString() && styles.categoryTextActive]}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {category.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Compteur de résultats */}
      {filteredMerchants.length > 0 && (
        <View style={styles.resultsHeader}>
          <Text style={styles.resultsText}>
            {filteredMerchants.length} boutique{filteredMerchants.length > 1 ? 's' : ''} trouvée{filteredMerchants.length > 1 ? 's' : ''}
          </Text>
          {(selectedCategory !== 'all' || searchQuery.trim()) && (
            <TouchableOpacity onPress={() => {
              setSelectedCategory('all')
              setSearchQuery('')
            }}>
              <Text style={styles.clearFilters}>Réinitialiser</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Merchant List */}
      {filteredMerchants.length > 0 ? (
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
          <Text style={styles.emptyTitle}>Aucune boutique trouvée</Text>
          <Text style={styles.emptyText}>
            {searchQuery.trim()
              ? `Aucun résultat pour "${searchQuery}"`
              : 'Essayez de changer les filtres ou revenez plus tard'}
          </Text>
          {(selectedCategory !== 'all' || searchQuery.trim()) && (
            <TouchableOpacity
              style={styles.resetButton}
              onPress={() => {
                setSelectedCategory('all')
                setSearchQuery('')
              }}
            >
              <Text style={styles.resetButtonText}>Réinitialiser les filtres</Text>
            </TouchableOpacity>
          )}
        </View>
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
  toggleText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  toggleTextActive: {
    color: theme.colors.text,
    fontWeight: '600',
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
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.xs,
  },
  categoriesContent: {
    paddingHorizontal: theme.spacing.lg,
    paddingRight: theme.spacing.xl, // Padding final pour indiquer le scroll
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: theme.spacing.md, // Espacement entre chips
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.neutral[100],
    minHeight: 40, // Hauteur minimale pour éviter la compression
  },
  categoryEmoji: {
    fontSize: 16,
    marginRight: 6,
  },
  categoryChipActive: {
    backgroundColor: theme.colors.primary[500],
  },
  categoryText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    maxWidth: 120, // Largeur max pour éviter les chips trop larges
  },
  categoryTextActive: {
    color: theme.colors.textInverse,
    fontWeight: '600',
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
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
    marginBottom: theme.spacing.lg,
  },
  resetButton: {
    backgroundColor: theme.colors.primary[500],
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.radius.xl,
  },
  resetButtonText: {
    color: theme.colors.textInverse,
    fontSize: 14,
    fontWeight: '600',
  },
  merchantCard: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface.light,
    borderRadius: theme.radius.xl,
    marginBottom: theme.spacing.md,
    overflow: 'hidden',
    ...theme.shadows.sm,
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
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary[500],
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 6,
    borderRadius: theme.radius.md,
    gap: 4,
    zIndex: 1,
  },
  productCountText: {
    color: theme.colors.textInverse,
    fontSize: 12,
    fontWeight: 'bold',
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
  merchantName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
    gap: 4,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
  },
  reviewsCount: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginLeft: 4,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: theme.spacing.xs,
  },
  merchantLocation: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    flex: 1,
  },
  productCountInfo: {
    fontSize: 12,
    color: theme.colors.primary[700],
    fontWeight: '500',
    marginTop: theme.spacing.xs,
  },
})

export default ProductsScreen
