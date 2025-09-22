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

interface Props {
  navigation: any
  route?: any
}

const ProductsScreen: React.FC<Props> = ({ navigation, route }) => {
  const dispatch = useDispatch<AppDispatch>()
  const { products, categories, loading, filters } = useSelector((state: RootState) => state.products)

  const [searchQuery, setSearchQuery] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [localFilters, setLocalFilters] = useState<ProductFilters>({})
  const [refreshing, setRefreshing] = useState(false)

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
      console.log('Erreur chargement catégories:', error)
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
    dispatch(setFilters(localFilters))
    dispatch(fetchProducts(localFilters))
  }

  const getFilterCount = () => {
    return Object.values(localFilters).filter(v => v !== undefined && v !== '').length
  }

  const formatPrice = (price: string | number) => {
    return Math.round(parseFloat(price.toString())).toLocaleString()
  }

  const formatTimeLeft = (expirationDate: string) => {
    const now = new Date()
    const expiry = new Date(expirationDate)
    const diffTime = expiry.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays <= 0) return 'Expiré'
    if (diffDays === 1) return 'Expire aujourd\'hui'
    return `${diffDays} jour(s)`
  }

  const getExpiryColor = (expirationDate: string) => {
    const now = new Date()
    const expiry = new Date(expirationDate)
    const diffTime = expiry.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays <= 0) return '#EF4444'
    if (diffDays <= 1) return '#F59E0B'
    if (diffDays <= 3) return '#F59E0B'
    return '#10B981'
  }

  const renderProduct = ({ item }: { item: Product }) => (
    <TouchableOpacity
      style={styles.productCard}
      onPress={() => navigation.navigate('ProductDetails', { productId: item.id })}
    >
      <View style={styles.productImage}>
        <Image
          source={{ uri: item.image_url || 'https://via.placeholder.com/150x150?text=Produit' }}
          style={styles.image}
          contentFit="cover"
        />
        <View style={styles.discountBadge}>
          <Text style={styles.discountText}>-{item.discount_percentage}%</Text>
        </View>
        {item.quantity_available <= 5 && (
          <View style={styles.lowStockBadge}>
            <Text style={styles.lowStockText}>Stock faible</Text>
          </View>
        )}
      </View>

      <View style={styles.productInfo}>
        <Text style={styles.productName} numberOfLines={2}>{item.name}</Text>
        <Text style={styles.merchantName} numberOfLines={1}>{item.merchant.business_name}</Text>

        <View style={styles.priceContainer}>
          <Text style={styles.discountedPrice}>{formatPrice(item.discounted_price)} F</Text>
          <Text style={styles.originalPrice}>{formatPrice(item.original_price)} F</Text>
        </View>

        <View style={styles.productFooter}>
          <View style={styles.expiryInfo}>
            <Ionicons
              name="time-outline"
              size={12}
              color={getExpiryColor(item.expiration_date)}
            />
            <Text style={[styles.expiryText, { color: getExpiryColor(item.expiration_date) }]}>
              {formatTimeLeft(item.expiration_date)}
            </Text>
          </View>
          <Text style={styles.stockText}>Stock: {item.quantity_available}</Text>
        </View>
      </View>
    </TouchableOpacity>
  )

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="bag-outline" size={64} color="#D1D5DB" />
      <Text style={styles.emptyTitle}>Aucun produit trouvé</Text>
      <Text style={styles.emptySubtitle}>
        {searchQuery || getFilterCount() > 0
          ? 'Essayez de modifier vos critères de recherche'
          : 'Aucun produit disponible pour le moment'
        }
      </Text>
      {(searchQuery || getFilterCount() > 0) && (
        <TouchableOpacity style={styles.clearButton} onPress={clearFilters}>
          <Text style={styles.clearButtonText}>Effacer les filtres</Text>
        </TouchableOpacity>
      )}
    </View>
  )

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#10B981" barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Produits disponibles</Text>
        <View style={styles.headerSubtitle}>
          <Text style={styles.resultCount}>{products.length} produit(s) trouvé(s)</Text>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={20} color="#9CA3AF" />
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher des produits..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#9CA3AF"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity
          style={[styles.filterButton, getFilterCount() > 0 && styles.filterButtonActive]}
          onPress={() => setShowFilters(true)}
        >
          <Ionicons
            name="filter-outline"
            size={20}
            color={getFilterCount() > 0 ? "#ffffff" : "#6B7280"}
          />
          {getFilterCount() > 0 && (
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>{getFilterCount()}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Quick Category Filters */}
      <ScrollView
        horizontal
        style={styles.categoryFilters}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoryFiltersContent}
      >
        <TouchableOpacity
          style={[
            styles.categoryFilter,
            !localFilters.category && styles.categoryFilterActive
          ]}
          onPress={() => setLocalFilters({ ...localFilters, category: undefined })}
        >
          <Text style={[
            styles.categoryFilterText,
            !localFilters.category && styles.categoryFilterTextActive
          ]}>
            Tous
          </Text>
        </TouchableOpacity>

        {categories.map((category) => (
          <TouchableOpacity
            key={category.id}
            style={[
              styles.categoryFilter,
              localFilters.category === category.id.toString() && styles.categoryFilterActive
            ]}
            onPress={() => handleCategoryFilter(category.id)}
          >
            <Text style={[
              styles.categoryFilterText,
              localFilters.category === category.id.toString() && styles.categoryFilterTextActive
            ]}>
              {category.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Products List */}
      <FlatList
        data={products}
        renderItem={renderProduct}
        keyExtractor={(item) => item.id.toString()}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#10B981']}
            tintColor="#10B981"
          />
        }
        ListEmptyComponent={renderEmpty}
      />

      {/* Filter Modal */}
      <Modal
        visible={showFilters}
        transparent
        animationType="slide"
        onRequestClose={() => setShowFilters(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.filterModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filtres</Text>
              <TouchableOpacity onPress={() => setShowFilters(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.filterContent}>
              {/* Prix maximum */}
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>Prix maximum (F CFA)</Text>
                <TextInput
                  style={styles.filterInput}
                  placeholder="Ex: 5000"
                  value={localFilters.max_price?.toString() || ''}
                  onChangeText={(text) => setLocalFilters({
                    ...localFilters,
                    max_price: text ? parseInt(text) : undefined
                  })}
                  keyboardType="numeric"
                />
              </View>

              {/* Jours d'expiration maximum */}
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>Expire dans (jours max)</Text>
                <View style={styles.expiryOptions}>
                  {[1, 3, 7, 30].map((days) => (
                    <TouchableOpacity
                      key={days}
                      style={[
                        styles.expiryOption,
                        localFilters.max_expiry_days === days && styles.expiryOptionActive
                      ]}
                      onPress={() => setLocalFilters({
                        ...localFilters,
                        max_expiry_days: localFilters.max_expiry_days === days ? undefined : days
                      })}
                    >
                      <Text style={[
                        styles.expiryOptionText,
                        localFilters.max_expiry_days === days && styles.expiryOptionTextActive
                      ]}>
                        {days} jour{days > 1 ? 's' : ''}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.clearFiltersButton} onPress={clearFilters}>
                <Text style={styles.clearFiltersButtonText}>Effacer</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.applyFiltersButton} onPress={applyFilters}>
                <Text style={styles.applyFiltersButtonText}>Appliquer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    backgroundColor: '#10B981',
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  headerSubtitle: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  resultCount: {
    fontSize: 14,
    color: '#ffffff',
    opacity: 0.9,
  },
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
    marginLeft: 12,
  },
  filterButton: {
    width: 48,
    height: 48,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    position: 'relative',
  },
  filterButtonActive: {
    backgroundColor: '#10B981',
  },
  filterBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterBadgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  categoryFilters: {
    maxHeight: 50,
  },
  categoryFiltersContent: {
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  categoryFilter: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  categoryFilterActive: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  categoryFilterText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  categoryFilterTextActive: {
    color: '#ffffff',
  },
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
  row: {
    justifyContent: 'space-between',
  },
  productCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginBottom: 16,
    width: '48%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  productImage: {
    position: 'relative',
    height: 120,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  discountBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#F59E0B',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 12,
  },
  discountText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '600',
  },
  lowStockBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#EF4444',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 12,
  },
  lowStockText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '600',
  },
  productInfo: {
    padding: 12,
  },
  productName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
    height: 35,
  },
  merchantName: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 8,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  discountedPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#10B981',
    marginRight: 6,
  },
  originalPrice: {
    fontSize: 12,
    color: '#9CA3AF',
    textDecorationLine: 'line-through',
  },
  productFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  expiryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  expiryText: {
    fontSize: 11,
    marginLeft: 4,
    fontWeight: '500',
  },
  stockText: {
    fontSize: 11,
    color: '#6B7280',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 40,
  },
  clearButton: {
    backgroundColor: '#10B981',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  clearButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  filterModal: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
  },
  filterContent: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  filterSection: {
    marginBottom: 24,
  },
  filterSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  filterInput: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  expiryOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  expiryOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  expiryOptionActive: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  expiryOptionText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  expiryOptionTextActive: {
    color: '#ffffff',
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  clearFiltersButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
  },
  clearFiltersButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  applyFiltersButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#10B981',
  },
  applyFiltersButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
})

export default ProductsScreen