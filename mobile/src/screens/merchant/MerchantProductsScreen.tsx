import React, { useEffect, useState, useCallback, useMemo } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  RefreshControl,
  Image,
  ActivityIndicator,
  Modal,
} from 'react-native'
import { FlashList } from '@shopify/flash-list'
import { Ionicons } from '@expo/vector-icons'
import { useFocusEffect } from '@react-navigation/native'
import { useTheme } from '../../theme'
import { Product } from '../../types'
import apiService from '../../services/api'
import { getImageUrl } from '../../utils/imageHelpers'
import { TEST_IDS } from '../../utils/testIds'
import AlertModal from '../../components/AlertModal'
import { useAlert } from '../../hooks/useAlert'

type StatusFilter = 'all' | 'active' | 'inactive' | 'pending'

interface Props {
  navigation: any
}

/**
 * Détermine si un produit est en attente d'approbation admin
 *
 * Priorité de vérification:
 * 1. Champ needs_approval (boolean) si disponible
 * 2. Status string exact match (évite les faux positifs)
 *
 * @param product - Produit à vérifier
 * @returns true si en attente d'approbation
 */
const isPendingAdminApproval = (product: Product): boolean => {
  // Priorité 1: Utiliser le champ needs_approval si disponible
  if (typeof product.needs_approval === 'boolean') {
    return product.needs_approval
  }

  // Priorité 2: Vérifier le status avec exact match (évite faux positifs)
  if (typeof product.status === 'string') {
    const status = product.status.toLowerCase().trim()
    const pendingStatuses = [
      'pending_admin_approval',
      'pending_approval',
      'pending',
    ]
    return pendingStatuses.includes(status)
  }

  // Par défaut: pas en attente
  return false
}

const MerchantProductsScreen: React.FC<Props> = ({ navigation }) => {
  const theme = useTheme()
  const { alertProps, showError, showSuccess, showWarning, hideAlert } = useAlert()
  // 🐛 BUG FIX #MOB-L-001: Prevent console logs in production
  const isDev = __DEV__
  const [products, setProducts] = useState<Product[]>([])
  const [refreshing, setRefreshing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [addModalVisible, setAddModalVisible] = useState(false)

  // Recharger la liste à chaque fois que l'écran devient actif
  useFocusEffect(
    useCallback(() => {
      loadProducts()
    }, [])
  )

  const loadProducts = async () => {
    try {
      setLoading(true)
      if (isDev) console.log('📦 [MerchantProducts] Chargement des produits...')
      const response = await apiService.get('/products/merchant')
      if (isDev) console.log('📦 [MerchantProducts] Réponse API complète:', response)
      // apiService peut retourner le tableau directement ou {data: [...]}
      const allProducts = Array.isArray(response.data) ? response.data : (response.data?.data || [])
      console.log('🟢 [MerchantProducts] Nombre de produits:', allProducts.length)
      setProducts(allProducts)
      if (isDev) console.log('📦 [MerchantProducts] Produits définis dans le state:', response.data?.length)
    } catch (error: any) {
      if (isDev) console.error('❌ [MerchantProducts] Erreur chargement produits:', error)
      if (isDev) console.error('❌ [MerchantProducts] Error details:', error.response?.data)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const onRefresh = () => {
    setRefreshing(true)
    loadProducts()
  }

  const handleAddButtonPress = () => {
    setAddModalVisible(true)
  }

  const handleAddProduct = () => {
    setAddModalVisible(false)
    navigation.navigate('ProductForm', { mode: 'create' })
  }

  const handleAddSurpriseBasket = () => {
    setAddModalVisible(false)
    navigation.navigate('SurpriseBaskets')
  }

  const handleCreateProduct = () => {
    navigation.navigate('ProductForm', { mode: 'create' })
  }

  const handleEditProduct = (product: Product) => {
    navigation.navigate('ProductForm', { mode: 'edit', product })
  }

  const handleDeleteProduct = (productId: number) => {
    showWarning(
      'Supprimer le produit',
      'Êtes-vous sûr de vouloir supprimer ce produit ?',
      [
        { text: 'Annuler', style: 'cancel', onPress: hideAlert },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            hideAlert()
            try {
              if (isDev) console.log('🗑️ [MerchantProducts] Suppression du produit:', productId)
              setLoading(true)
              await apiService.delete(`/products/${productId}`)
              if (isDev) console.log('✅ [MerchantProducts] Produit supprimé avec succès')

              // Recharger la liste
              await loadProducts()

              showSuccess('Succès', 'Le produit a été supprimé')
            } catch (error: any) {
              if (isDev) console.error('❌ [MerchantProducts] Erreur suppression:', error)
              showError('Erreur', 'Impossible de supprimer le produit')
            } finally {
              setLoading(false)
            }
          },
        },
      ]
    )
  }

  const pendingCount = useMemo(
    () => products.filter(product => isPendingAdminApproval(product)).length,
    [products]
  )

  const activeCount = useMemo(
    () =>
      products.filter(product => product.is_active === true && !isPendingAdminApproval(product)).length,
    [products]
  )

  const inactiveCount = useMemo(
    () =>
      products.filter(product => product.is_active === false && !isPendingAdminApproval(product)).length,
    [products]
  )

  const filteredProducts = useMemo(() => {
    if (statusFilter === 'all') {
      return products
    }

    return products.filter(product => {
      if (statusFilter === 'pending') {
        return isPendingAdminApproval(product)
      }

      if (statusFilter === 'active') {
        return product.is_active === true && !isPendingAdminApproval(product)
      }

      if (statusFilter === 'inactive') {
        return product.is_active === false && !isPendingAdminApproval(product)
      }

      return true
    })
  }, [products, statusFilter])

  const statusFilters: Array<{ key: StatusFilter; label: string; count: number }> = [
    { key: 'all', label: 'Tous', count: products.length },
    { key: 'active', label: 'Actifs', count: activeCount },
    { key: 'pending', label: 'En attente', count: pendingCount },
    { key: 'inactive', label: 'Inactifs', count: inactiveCount },
  ]

  const renderProduct = ({ item }: { item: Product }) => {
    const pendingApproval = isPendingAdminApproval(item)

    return (
      <View style={[styles.productCard, { backgroundColor: theme.colors.cardBackground, borderColor: theme.colors.cardBorder, borderWidth: 1 }]}>
        <TouchableOpacity
          style={styles.productContent}
          onPress={() => handleEditProduct(item)}
        >
          {/* Image */}
          {item.image_url ? (
            <Image
              source={{ uri: getImageUrl(item.image_url) }}
              style={styles.productImage}
            />
          ) : (
            <View style={[styles.productImage, { backgroundColor: '#f0f0f0', alignItems: 'center', justifyContent: 'center' }]}>
              <Ionicons name="image-outline" size={32} color="#ccc" />
            </View>
          )}

          {/* Infos */}
          <View style={styles.productInfo}>
            {pendingApproval && (
              <View
                style={[
                  styles.statusBadge,
                  {
                    backgroundColor: theme.withOpacity(theme.colors.semantic.warning, 0.15),
                  },
                ]}
              >
                <Text
                  style={[
                    styles.statusBadgeText,
                    { color: theme.colors.semantic.warning },
                  ]}
                >
                  Pending Admin Approval
                </Text>
              </View>
            )}
            <Text style={[styles.productName, { color: theme.colors.text }]}>
              {item.name}
            </Text>
            <Text style={[styles.productCategory, { color: theme.colors.textSecondary }]}>
              {item.category?.name}
            </Text>
            <View style={styles.priceRow}>
              <Text style={[styles.productPrice, { color: theme.colors.primary[500] }]}>
                {item.discounted_price} F CFA
              </Text>
              <Text style={[styles.productOriginalPrice, { color: theme.colors.textSecondary }]}>
                {item.original_price} F CFA
              </Text>
            </View>
            <View style={styles.stockRow}>
              <View style={[
                styles.stockBadge,
                {
                  backgroundColor: item.quantity_available > 0
                    ? theme.withOpacity(theme.colors.semantic.success, 0.1)
                    : theme.withOpacity(theme.colors.semantic.error, 0.1)
                }
              ]}>
                <Text style={[
                  styles.stockText,
                  {
                    color: item.quantity_available > 0
                      ? theme.colors.semantic.success
                      : theme.colors.semantic.error
                  }
                ]}>
                  {item.quantity_available > 0 ? `Stock: ${item.quantity_available}` : 'Rupture'}
                </Text>
              </View>
            </View>
          </View>

          {/* Actions */}
          <View style={styles.actionsContainer}>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: theme.withOpacity(theme.colors.primary[500], 0.1) }]}
              onPress={() => handleEditProduct(item)}
            >
              <Ionicons name="create" size={20} color={theme.colors.primary[500]} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: theme.withOpacity(theme.colors.semantic.error, 0.1) }]}
              onPress={() => handleDeleteProduct(item.id)}
            >
              <Ionicons name="trash" size={20} color={theme.colors.semantic.error} />
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]} testID={TEST_IDS.merchantProducts}>
      <StatusBar barStyle={theme.isDark ? "light-content" : "dark-content"} backgroundColor={theme.colors.background} />

      {/* Add Product/Basket Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={addModalVisible}
        onRequestClose={() => setAddModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setAddModalVisible(false)}
        >
          <View style={[styles.addModalContainer, { backgroundColor: theme.colors.background }]}>
            {/* Header */}
            <View style={styles.addModalHeader}>
              <View style={[styles.addModalIcon, {
                backgroundColor: theme.isDark ? theme.colors.primary[900] : theme.colors.primary[50]
              }]}>
                <Ionicons name="add-circle" size={32} color={theme.colors.primary[500]} />
              </View>
              <Text style={[styles.addModalTitle, { color: theme.colors.text }]}>
                Que souhaitez-vous créer ?
              </Text>
            </View>

            {/* Options */}
            <View style={styles.addModalOptions}>
              <TouchableOpacity
                style={[styles.addModalOption, {
                  backgroundColor: theme.isDark ? theme.colors.neutral[800] : theme.colors.primary[50],
                  borderColor: theme.isDark ? theme.colors.neutral[600] : theme.colors.primary[200]
                }]}
                onPress={handleAddProduct}
              >
                <View style={[styles.addModalOptionIcon, { backgroundColor: theme.colors.primary[500] }]}>
                  <Ionicons name="cube" size={24} color="white" />
                </View>
                <View style={styles.addModalOptionText}>
                  <Text style={[styles.addModalOptionTitle, { color: theme.colors.text }]}>Produit</Text>
                  <Text style={[styles.addModalOptionDesc, { color: theme.colors.textSecondary }]}>
                    Ajouter un produit individuel
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={theme.colors.primary[500]} />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.addModalOption, {
                  backgroundColor: theme.isDark ? theme.colors.neutral[800] : theme.colors.accent.orange + '10',
                  borderColor: theme.isDark ? theme.colors.neutral[600] : theme.colors.accent.orange + '30'
                }]}
                onPress={handleAddSurpriseBasket}
              >
                <View style={[styles.addModalOptionIcon, { backgroundColor: theme.colors.accent.orange }]}>
                  <Ionicons name="gift" size={24} color="white" />
                </View>
                <View style={styles.addModalOptionText}>
                  <Text style={[styles.addModalOptionTitle, { color: theme.colors.text }]}>Panier Surprise</Text>
                  <Text style={[styles.addModalOptionDesc, { color: theme.colors.textSecondary }]}>
                    Créer un panier mystère à prix réduit
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={theme.colors.accent.orange} />
              </TouchableOpacity>
            </View>

            {/* Cancel Button */}
            <TouchableOpacity
              style={[styles.addModalCancelButton, {
                borderColor: theme.isDark ? theme.colors.neutral[600] : theme.colors.neutral[200],
                backgroundColor: theme.isDark ? theme.colors.neutral[800] : 'transparent'
              }]}
              onPress={() => setAddModalVisible(false)}
            >
              <Text style={[styles.addModalCancelText, { color: theme.colors.textSecondary }]}>Annuler</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.isDark ? '#0F1622' : theme.colors.primary[500] }]}>
        <View style={styles.headerContent}>
          <Text style={[styles.headerTitle, { color: theme.isDark ? '#F8FAFF' : 'white' }]}>Mes Produits</Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={handleAddButtonPress}
            testID={TEST_IDS.addProductButton}
            accessibilityLabel="Ajouter un produit ou un panier surprise"
          >
            <Ionicons name="add-circle" size={32} color={theme.isDark ? '#E9EDF5' : 'white'} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.filtersContainer}>
        {statusFilters.map(filter => {
          const isActiveFilter = statusFilter === filter.key
          return (
            <TouchableOpacity
              key={filter.key}
              style={[
                styles.filterChip,
                {
                  backgroundColor: isActiveFilter
                    ? theme.withOpacity(theme.colors.primary[500], 0.15)
                    : theme.isDark ? theme.colors.neutral[800] : theme.colors.surface.light,
                  borderColor: isActiveFilter ? theme.colors.primary[500] : theme.isDark ? theme.colors.neutral[600] : theme.colors.neutral[200],
                },
              ]}
              onPress={() => setStatusFilter(filter.key)}
              accessibilityRole="button"
              accessibilityState={{ selected: isActiveFilter }}
            >
              <Text
                style={[
                  styles.filterChipText,
                  { color: isActiveFilter ? theme.colors.primary[500] : theme.colors.textSecondary },
                ]}
              >
                {filter.label}
              </Text>
              <View
                style={[
                  styles.filterChipCount,
                  { backgroundColor: isActiveFilter
                      ? theme.colors.primary[500]
                      : (theme.isDark ? theme.colors.neutral[600] : theme.colors.neutral[200])
                  },
                ]}
              >
                <Text
                  style={[
                    styles.filterChipCountText,
                    { color: isActiveFilter
                        ? 'white'
                        : (theme.isDark ? theme.colors.neutral[200] : theme.colors.neutral[700])
                    },
                  ]}
                >
                  {filter.count}
                </Text>
              </View>
            </TouchableOpacity>
          )
        })}
      </View>

      {/* Liste des produits - FlashList pour performance optimale */}
      <FlashList
        data={filteredProducts}
        renderItem={renderProduct}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        testID={TEST_IDS.merchantProductsList}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={[styles.emptyState, { backgroundColor: theme.colors.cardBackground, borderColor: theme.colors.cardBorder, borderWidth: 1 }]}>
            <Ionicons name="cube-outline" size={64} color={theme.colors.textTertiary} />
            <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
              Aucun produit
            </Text>
            <Text style={[styles.emptySubtext, { color: theme.colors.textSecondary }]}>
              Appuyez sur + pour ajouter votre premier produit
            </Text>
          </View>
        }
      />

      {/* Overlay de chargement */}
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={theme.colors.primary[500]} />
        </View>
      )}

      <AlertModal {...alertProps} />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    color: 'white',
    fontSize: 28,
    fontWeight: 'bold',
  },
  addButton: {
    padding: 4,
  },
  filtersContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    marginRight: 8,
    marginBottom: 8,
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '600',
  },
  filterChipCount: {
    marginLeft: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 999,
  },
  filterChipCountText: {
    fontSize: 12,
    fontWeight: '600',
  },
  listContent: {
    padding: 16,
    flexGrow: 1,
  },
  productCard: {
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
  },
  productContent: {
    flexDirection: 'row',
    padding: 12,
  },
  productImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  productInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'space-between',
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 6,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  productCategory: {
    fontSize: 12,
    marginBottom: 8,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  productOriginalPrice: {
    fontSize: 12,
    textDecorationLine: 'line-through',
  },
  stockRow: {
    marginTop: 4,
  },
  stockBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  stockText: {
    fontSize: 11,
    fontWeight: '600',
  },
  actionsContainer: {
    flexDirection: 'column',
    gap: 8,
    justifyContent: 'center',
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyState: {
    flex: 1,
    padding: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 40,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: '600',
  },
  emptySubtext: {
    marginTop: 8,
    fontSize: 14,
    textAlign: 'center',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  // Add Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  addModalContainer: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  addModalHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  addModalIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  addModalTitle: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
  },
  addModalOptions: {
    gap: 12,
    marginBottom: 20,
  },
  addModalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  addModalOptionIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  addModalOptionText: {
    flex: 1,
  },
  addModalOptionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  addModalOptionDesc: {
    fontSize: 13,
  },
  addModalCancelButton: {
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  addModalCancelText: {
    fontSize: 16,
    fontWeight: '600',
  },
})

export default MerchantProductsScreen
