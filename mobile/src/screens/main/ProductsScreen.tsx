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
  Modal,
  Alert,
} from 'react-native'
import { useDispatch, useSelector } from 'react-redux'
import { AppDispatch, RootState } from '../../store'
import { fetchProducts, fetchCategories, setFilters } from '../../store/slices/productsSlice'
import { Ionicons } from '@expo/vector-icons'
import { Image } from 'expo-image'
import { Product, ProductFilters } from '../../types'
import analyticsService from '../../services/analyticsService'
import { useTheme } from '../../theme'

interface Props {
  navigation: any
  route?: any
}

const ProductsScreen: React.FC<Props> = ({ navigation, route }) => {
  const dispatch = useDispatch<AppDispatch>()
  const { products, categories, loading, filters } = useSelector((state: RootState) => state.products)
  const theme = useTheme()

  const [searchQuery, setSearchQuery] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [localFilters, setLocalFilters] = useState<ProductFilters>({})
  const [refreshing, setRefreshing] = useState(false)

  const styles = createStyles(theme)

  useEffect(() => {
    loadData()
    loadCategories()

    // Si on vient avec un categoryId (depuis Home)
    if (route?.params?.categoryId) {
      handleCategoryFilter(route.params.categoryId)
    }
  }, [])

  useEffect(() => {
    // Recherche en temps réel
    const searchFilters = {
      ...localFilters,
      search: searchQuery || undefined,
    }
    dispatch(setFilters(searchFilters))
    dispatch(fetchProducts(searchFilters))
  }, [searchQuery, localFilters])

  const loadData = async () => {
    try {
      await dispatch(fetchProducts(filters))
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de charger les produits')
    }
  }

  const loadCategories = async () => {
    try {
      await dispatch(fetchCategories())
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de charger les catégories')
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
    setLocalFilters({})
    setSearchQuery('')
  }

  const applyFilters = () => {
    setShowFilters(false)
  }

  const renderProduct = ({ item }: { item: Product }) => (
    <TouchableOpacity
      style={styles.productCard}
      onPress={() => navigation.navigate('ProductDetails', { productId: item.id })}
    >
      <Image
        source={{ uri: item.image_url || 'https://via.placeholder.com/150' }}
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
          {Object.keys(localFilters).length > 0 && (
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>{Object.keys(localFilters).length}</Text>
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
          <Text style={[
            styles.categoryChipText,
            !localFilters.category && styles.categoryChipTextActive,
          ]}>Toutes</Text>
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
            <Text style={[
              styles.categoryChipText,
              localFilters.category === category.id.toString() && styles.categoryChipTextActive,
            ]}>{category.name}</Text>
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
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowFilters(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filtres</Text>
              <TouchableOpacity onPress={() => setShowFilters(false)}>
                <Ionicons name="close" size={24} color={theme.colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>Prix maximum</Text>
                <TextInput
                  style={styles.filterInput}
                  placeholder="Ex: 5000"
                  placeholderTextColor={theme.colors.textTertiary}
                  keyboardType="numeric"
                  value={localFilters.max_price?.toString() || ''}
                  onChangeText={(text) => setLocalFilters({
                    ...localFilters,
                    max_price: text ? parseFloat(text) : undefined,
                  })}
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
                  onChangeText={(text) => setLocalFilters({
                    ...localFilters,
                    radius: text ? parseFloat(text) : undefined,
                  })}
                />
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.clearButton} onPress={clearFilters}>
                <Text style={styles.clearButtonText}>Réinitialiser</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.applyButton} onPress={applyFilters}>
                <Text style={styles.applyButtonText}>Appliquer</Text>
              </TouchableOpacity>
            </View>
          </View>
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
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    backgroundColor: theme.colors.backgroundSecondary,
    borderRadius: theme.radius.full,
    marginRight: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: theme.colors.overlay,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: theme.colors.background,
    borderTopLeftRadius: theme.radius['2xl'],
    borderTopRightRadius: theme.radius['2xl'],
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  modalTitle: {
    ...theme.getTypography('h3'),
    color: theme.colors.text,
  },
  modalBody: {
    padding: theme.spacing.lg,
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
  modalFooter: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    padding: theme.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  clearButton: {
    flex: 1,
    ...theme.buttonStyle('ghost', 'md'),
  },
  clearButtonText: {
    ...theme.getTypography('body'),
    color: theme.colors.text,
    fontWeight: '600',
    textAlign: 'center',
  },
  applyButton: {
    flex: 1,
    ...theme.buttonStyle('primary', 'md'),
  },
  applyButtonText: {
    ...theme.getTypography('body'),
    color: theme.colors.textInverse,
    fontWeight: '600',
    textAlign: 'center',
  },
})

export default ProductsScreen