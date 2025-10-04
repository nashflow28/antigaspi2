import React, { useEffect, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StatusBar,
  FlatList,
  RefreshControl,
  ActivityIndicator,
} from 'react-native'
import { useDispatch, useSelector } from 'react-redux'
import { AppDispatch, RootState } from '../../store'
import { fetchProducts, fetchCategories, setFilters, clearFilters as clearFiltersAction, fetchMoreProducts, resetProducts } from '../../store/slices/productsSlice'
import { Ionicons } from '@expo/vector-icons'
import { Image } from 'expo-image'
import { Product, ProductFilters } from '../../types'
import analyticsService from '../../services/analyticsService'
import { useTheme } from '../../theme'
import { Modal, Button } from '../../components/2025'
import { showErrorAlert } from '../../utils/errorHandling'
import { getImageUrl } from '../../utils/imageHelpers'

interface Props {
  navigation: any
  route?: any
}

const getActiveFilterCount = (filters: ProductFilters): number =>
  Object.values(filters).reduce((count, value) => {
    if (value === undefined || value === null) {
      return count
    }

    if (typeof value === 'string' && value.trim().length === 0) {
      return count
    }

    return count + 1
  }, 0)

const ProductsScreen: React.FC<Props> = ({ navigation, route }) => {
  const dispatch = useDispatch<AppDispatch>()
  const { products, categories, loading, loadingMore, filters, currentPage, hasMore } = useSelector((state: RootState) => state.products)
  const theme = useTheme()

  const [searchQuery, setSearchQuery] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [localFilters, setLocalFilters] = useState<ProductFilters>({})
  const [refreshing, setRefreshing] = useState(false)

  const styles = createStyles(theme)
  const activeFilterCount = getActiveFilterCount(localFilters)

  useEffect(() => {
    loadData()
    loadCategories()

    // Si on vient avec un categoryId (depuis Home)
    if (route?.params?.categoryId) {
      handleCategoryFilter(route.params.categoryId)
    }
  }, [])

  useEffect(() => {
    // Recherche en temps réel avec debounce pour éviter surcharge API
    const searchFilters = {
      ...localFilters,
      search: searchQuery || undefined,
    }
    dispatch(setFilters(searchFilters))

    // Reset products before fetching new filtered results
    dispatch(resetProducts())

    // Debounce de 300ms pour éviter trop d'appels API
    const timer = setTimeout(() => {
      dispatch(fetchProducts(searchFilters))
    }, 300)

    // Cleanup: annuler le timer si searchQuery/localFilters changent avant 300ms
    return () => clearTimeout(timer)
  }, [searchQuery, localFilters])

  const loadData = async () => {
    try {
      await dispatch(fetchProducts(filters))
    } catch (error) {
      showErrorAlert(error, 'Chargement des produits', () => loadData())
    }
  }

  const loadCategories = async () => {
    try {
      await dispatch(fetchCategories())
    } catch (error) {
      showErrorAlert(error, 'Chargement des catégories', () => loadCategories())
      if (error instanceof Error) {
        void analyticsService.trackError(error, 'loadCategories')
      } else {
        void analyticsService.track('Categories Load Failed', 'System', {
          details: String(error),
        })
      }
    }
  }

  const onRefresh = async () => {
    setRefreshing(true)
    await loadData()
    setRefreshing(false)
  }

  const handleCategoryFilter = (categoryId: number | string) => {
    const newFilters = {
      ...localFilters,
      category: categoryId.toString(),
    }
    setLocalFilters(newFilters)
  }

  const clearFilters = () => {
    // ✅ FIX: Synchroniser avec Redux pour éviter les filtres fantômes
    dispatch(clearFiltersAction())
    setLocalFilters({})
    setSearchQuery('')
  }

  const applyFilters = () => {
    setShowFilters(false)
  }

  const loadMore = () => {
    // Only load more if:
    // 1. Not already loading
    // 2. Not loading more
    // 3. Has more pages
    if (!loading && !loadingMore && hasMore) {
      const searchFilters = {
        ...localFilters,
        search: searchQuery || undefined,
      }
      dispatch(fetchMoreProducts({ filters: searchFilters, page: currentPage + 1 }))
    }
  }

  const renderProduct = ({ item }: { item: Product }) => (
    <TouchableOpacity
      style={styles.productCard}
      onPress={() => navigation.navigate('ProductDetails', { productId: item.id })}
    >
      <Image
        source={{ uri: getImageUrl(item.image_url) }}
        style={styles.productImage}
        contentFit="cover"
        transition={200}
      />

      <View style={styles.productInfo}>
        <Text style={styles.productName}>{item.name}</Text>
        <Text style={styles.merchantName}>{item.merchant.business_name}</Text>

        <View style={styles.priceRow}>
          <Text style={styles.discountedPrice}>
            {Math.round(parseFloat(item.discounted_price)).toLocaleString()} F
          </Text>
          <Text style={styles.originalPrice}>
            {Math.round(parseFloat(item.original_price)).toLocaleString()} F
          </Text>
        </View>

        <View style={styles.badges}>
          <View style={styles.discountBadge}>
            <Text style={styles.discountText}>-{item.discount_percentage}%</Text>
          </View>
          {item.days_until_expiration <= 2 && (
            <View style={styles.urgentBadge}>
              <Text style={styles.urgentText}>Urgent</Text>
            </View>
          )}
        </View>

        <View style={styles.productFooter}>
          <View style={styles.footerItem}>
            <Ionicons name="time-outline" size={14} color={theme.colors.textSecondary} />
            <Text style={styles.footerText}>
              {item.days_until_expiration} jour(s)
            </Text>
          </View>
          <View style={styles.footerItem}>
            <Ionicons name="cube-outline" size={14} color={theme.colors.textSecondary} />
            <Text style={styles.footerText}>Stock: {item.quantity_available}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  )

  const renderFooter = () => {
    if (!loadingMore) return null

    return (
      <View style={styles.loadingMore}>
        <ActivityIndicator size="small" color={theme.colors.primary[500]} />
        <Text style={styles.loadingMoreText}>Chargement...</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor={theme.colors.background} barStyle={theme.isDark ? "light-content" : "dark-content"} />

      {/* Header avec recherche */}
      <View style={styles.header}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color={theme.colors.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher un produit..."
            placeholderTextColor={theme.colors.textTertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity style={styles.filterButton} onPress={() => setShowFilters(true)}>
          <Ionicons name="filter" size={20} color={theme.colors.primary[500]} />
          {activeFilterCount > 0 && (
            <View style={styles.filterBadge} testID="active-filter-badge">
              <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Catégories horizontales */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoriesContainer}
        contentContainerStyle={styles.categoriesContent}
      >
        <TouchableOpacity
          style={[
            styles.categoryChip,
            !localFilters.category && styles.categoryChipActive,
          ]}
          onPress={() => clearFilters()}
        >
          <Text
            numberOfLines={1}
            ellipsizeMode="tail"
            style={[
              styles.categoryChipText,
              !localFilters.category && styles.categoryChipTextActive,
              { flexShrink: 1 },
            ]}
          >
            Toutes
          </Text>
        </TouchableOpacity>

        {categories.map((category) => (
          <TouchableOpacity
            key={category.id}
            style={[
              styles.categoryChip,
              localFilters.category === category.id.toString() && styles.categoryChipActive,
            ]}
            onPress={() => handleCategoryFilter(category.id)}
          >
            <Text
              numberOfLines={1}
              ellipsizeMode="tail"
              style={[
                styles.categoryChipText,
                localFilters.category === category.id.toString() && styles.categoryChipTextActive,
                { flexShrink: 1 },
              ]}
            >
              {category.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Liste des produits */}
      <FlatList
        data={products}
        renderItem={renderProduct}
        keyExtractor={(item) => item.id.toString()}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.colors.primary[500]]} />
        }
        contentContainerStyle={styles.listContent}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="basket-outline" size={64} color={theme.colors.textTertiary} />
            <Text style={styles.emptyTitle}>Aucun produit trouvé</Text>
            <Text style={styles.emptyText}>
              Essayez de modifier vos filtres ou revenez plus tard
            </Text>
          </View>
        }
      />

      {/* Modal Filtres */}
      <Modal
        visible={showFilters}
        onClose={() => setShowFilters(false)}
        title="Filtres"
        variant="bottom"
        scrollable
        footer={
          <View style={{ flexDirection: 'row', gap: theme.spacing.sm }}>
            <Button
              variant="secondary"
              onPress={clearFilters}
              style={{ flex: 1 }}
            >
              Réinitialiser
            </Button>
            <Button
              variant="primary"
              onPress={applyFilters}
              style={{ flex: 1 }}
            >
              Appliquer
            </Button>
          </View>
        }
      >
        <View style={styles.filterSection}>
          <Text style={styles.filterSectionTitle}>Prix maximum</Text>
          <TextInput
            style={styles.filterInput}
            placeholder="Ex: 5000"
            placeholderTextColor={theme.colors.textTertiary}
            keyboardType="numeric"
            value={localFilters.max_price?.toString() || ''}
            onChangeText={(text) =>
              setLocalFilters((previousFilters) => {
                const updatedFilters = { ...previousFilters }

                if (text.trim().length === 0) {
                  delete updatedFilters.max_price
                } else {
                  const parsedValue = parseFloat(text)
                  updatedFilters.max_price = Number.isNaN(parsedValue) ? undefined : parsedValue
                }

                if (updatedFilters.max_price === undefined) {
                  delete updatedFilters.max_price
                }

                return updatedFilters
              })
            }
          />
        </View>

        <View style={styles.filterSection}>
          <Text style={styles.filterSectionTitle}>Distance maximum (km)</Text>
          <TextInput
            style={styles.filterInput}
            placeholder="Ex: 5"
            placeholderTextColor={theme.colors.textTertiary}
            keyboardType="numeric"
            value={localFilters.radius?.toString() || ''}
            onChangeText={(text) =>
              setLocalFilters((previousFilters) => {
                const updatedFilters = { ...previousFilters }

                if (text.trim().length === 0) {
                  delete updatedFilters.radius
                } else {
                  const parsedValue = parseFloat(text)
                  updatedFilters.radius = Number.isNaN(parsedValue) ? undefined : parsedValue
                }

                if (updatedFilters.radius === undefined) {
                  delete updatedFilters.radius
                }

                return updatedFilters
              })
            }
          />
        </View>
      </Modal>
    </View>
  )
}

const createStyles = (theme: ReturnType<typeof useTheme>) => {
  const inactiveBackground = theme.isDark
    ? theme.withOpacity(theme.colors.neutral[300], 0.16)
    : theme.colors.backgroundSecondary
  const inactiveBorder = theme.isDark ? theme.colors.neutral[500] : theme.colors.border

  return StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    backgroundColor: theme.colors.background,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    gap: theme.spacing.sm,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.inputBackground,
    borderRadius: theme.radius.lg,
    paddingHorizontal: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.inputBorder,
    gap: theme.spacing.sm,
  },
  searchInput: {
    flex: 1,
    ...theme.getTypography('body'),
    color: theme.colors.text,
    paddingVertical: theme.spacing.sm,
  },
  filterButton: {
    ...theme.buttonStyle('ghost', 'md'),
    position: 'relative',
  },
  filterBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: theme.colors.primary[500],
    borderRadius: theme.radius.full,
    width: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterBadgeText: {
    ...theme.getTypography('caption'),
    color: theme.colors.textInverse,
    fontWeight: 'bold',
  },
  categoriesContainer: {
    backgroundColor: theme.colors.background,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  categoriesContent: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    gap: theme.spacing.sm,
  },
  categoryChip: {
    minHeight: 36,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    backgroundColor: inactiveBackground,
    borderRadius: theme.radius.full,
    borderWidth: 1,
    borderColor: inactiveBorder,
    alignItems: 'center',
  },
  categoryChipActive: {
    backgroundColor: theme.colors.primary[500],
    borderColor: theme.colors.primary[500],
  },
  categoryChipText: {
    ...theme.getTypography('small'),
    color: theme.colors.text,
  },
  categoryChipTextActive: {
    color: theme.colors.textInverse,
    fontWeight: '600',
  },
  listContent: {
    padding: theme.spacing.md,
  },
  productCard: {
    ...theme.cardStyle(true),
    flexDirection: 'row',
    marginBottom: theme.spacing.md,
  },
  productImage: {
    width: 100,
    height: 100,
    borderRadius: theme.radius.lg,
    marginRight: theme.spacing.md,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    ...theme.getTypography('body'),
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  merchantName: {
    ...theme.getTypography('caption'),
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.sm,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
    gap: theme.spacing.sm,
  },
  discountedPrice: {
    ...theme.getTypography('h4'),
    fontWeight: 'bold',
    color: theme.colors.primary[500],
  },
  originalPrice: {
    ...theme.getTypography('small'),
    color: theme.colors.textTertiary,
    textDecorationLine: 'line-through',
  },
  badges: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  discountBadge: {
    backgroundColor: theme.withOpacity(theme.colors.accent.yellow, 0.2),
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 2,
    borderRadius: theme.radius.md,
  },
  discountText: {
    ...theme.getTypography('caption'),
    color: theme.colors.accent.orange,
    fontWeight: '600',
  },
  urgentBadge: {
    backgroundColor: theme.withOpacity(theme.colors.error, 0.1),
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 2,
    borderRadius: theme.radius.md,
  },
  urgentText: {
    ...theme.getTypography('caption'),
    color: theme.colors.error,
    fontWeight: '600',
  },
  productFooter: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  footerText: {
    ...theme.getTypography('caption'),
    color: theme.colors.textSecondary,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: theme.spacing['3xl'],
  },
  emptyTitle: {
    ...theme.getTypography('h3'),
    color: theme.colors.text,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  emptyText: {
    ...theme.getTypography('body'),
    color: theme.colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: theme.spacing.xl,
  },
  filterSection: {
    marginBottom: theme.spacing.lg,
  },
  filterSectionTitle: {
    ...theme.getTypography('body'),
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  filterInput: {
    ...theme.inputStyle(false),
    ...theme.getTypography('body'),
    color: theme.colors.text,
  },
  loadingMore: {
    paddingVertical: theme.spacing.lg,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  loadingMoreText: {
    ...theme.getTypography('body'),
    color: theme.colors.textSecondary,
  },
  })
}

export default ProductsScreen
