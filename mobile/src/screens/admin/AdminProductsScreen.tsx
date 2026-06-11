import React, { useEffect, useState, useCallback } from 'react'
import {
  View,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  RefreshControl,
  TextInput,
  Modal,
  ScrollView,
  ActivityIndicator,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { FlashList } from '@shopify/flash-list'
import { Ionicons } from '@expo/vector-icons'
import { Image } from 'expo-image'
import { useTheme } from '../../theme'
import { Product, Category } from '../../types'
import apiService from '../../services/api'
import { formatCurrency } from '../../utils/currencyHelpers'
import { getImageUrl } from '../../utils/imageHelpers'
import { Button, Badge, Card, Typography, ConfirmModal } from '../../components/2025'
import AlertModal from '../../components/AlertModal'
import { useAlert } from '../../hooks/useAlert'

interface ProductWithModeration extends Product {
  needs_approval?: boolean
  merchant_name?: string
}

type ProductStatus = 'all' | 'active' | 'inactive' | 'pending'
type ConfirmAction = 'activate' | 'deactivate' | 'approve' | 'reject' | 'delete' | null

const AdminProductsScreen: React.FC = () => {
  const theme = useTheme()
  const insets = useSafeAreaInsets()
  const { alertProps, showError, showSuccess, showWarning } = useAlert()
  const [products, setProducts] = useState<ProductWithModeration[]>([])
  const [filteredProducts, setFilteredProducts] = useState<ProductWithModeration[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [refreshing, setRefreshing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<ProductStatus>('all')
  const [categoryFilter, setCategoryFilter] = useState<number | 'all'>('all')
  const [selectedProduct, setSelectedProduct] = useState<ProductWithModeration | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  // Utiliser un Set d'IDs au lieu d'un boolean pour éviter les race conditions
  const [actionLoadingIds, setActionLoadingIds] = useState<Set<number>>(new Set())

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [hasMorePages, setHasMorePages] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const PER_PAGE = 50

  // Confirm modal state
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null)
  const [productToConfirm, setProductToConfirm] = useState<ProductWithModeration | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    filterProducts()
  }, [products, searchQuery, statusFilter, categoryFilter])

  const loadData = async (page: number = 1, append: boolean = false) => {
    try {
      if (page === 1) {
        setLoading(true)
      } else {
        setLoadingMore(true)
      }

      // Charger produits avec pagination et catégories en parallèle
      // Use admin endpoint to get ALL products (including inactive)
      const requests: Promise<any>[] = [
        apiService.get(`/admin/products?per_page=${PER_PAGE}&page=${page}`),
      ]

      // Ne charger les catégories que la première fois
      if (page === 1) {
        requests.push(apiService.get('/categories'))
      }

      const responses = await Promise.all(requests)
      const productsRes = responses[0]

      // Extraire les produits
      const newProducts = Array.isArray(productsRes.data) ? productsRes.data : (productsRes.data?.data || [])

      // Vérifier s'il y a plus de pages - backend returns pagination.last_page
      const totalPages = productsRes.pagination?.last_page || productsRes.data?.last_page || productsRes.meta?.last_page || 1
      setHasMorePages(page < totalPages)
      setCurrentPage(page)

      if (append && page > 1) {
        setProducts(prev => [...prev, ...newProducts])
      } else {
        setProducts(newProducts)
      }

      // Catégories (seulement sur la première page)
      if (page === 1 && responses[1]) {
        const categoriesRes = responses[1]
        const allCategories = Array.isArray(categoriesRes.data) ? categoriesRes.data : (categoriesRes.data?.data || [])
        setCategories(allCategories)
      }
    } catch (error: any) {
      // Gestion des erreurs d'autorisation
      if (error.response?.status === 401 || error.response?.status === 403) {
        showWarning(
          'Session expirée',
          'Votre session a expiré. Veuillez vous reconnecter.'
        )
        return
      }

      showError('Erreur', 'Impossible de charger les produits')
    } finally {
      setLoading(false)
      setRefreshing(false)
      setLoadingMore(false)
    }
  }

  const loadMoreProducts = useCallback(() => {
    if (!loadingMore && hasMorePages && !loading) {
      loadData(currentPage + 1, true)
    }
  }, [loadingMore, hasMorePages, loading, currentPage])

  const filterProducts = useCallback(() => {
    let filtered = [...products]

    // Filtre par statut
    if (statusFilter === 'active') {
      filtered = filtered.filter(p => p.is_active === true)
    } else if (statusFilter === 'inactive') {
      filtered = filtered.filter(p => p.is_active === false)
    } else if (statusFilter === 'pending') {
      filtered = filtered.filter(p => (p as ProductWithModeration).needs_approval === true)
    }

    // Filtre par catégorie
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(p => p.category?.id === categoryFilter)
    }

    // Filtre par recherche (guard against null description/merchant)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        p =>
          (p.name || '').toLowerCase().includes(query) ||
          (p.description || '').toLowerCase().includes(query) ||
          (p.merchant?.business_name || '').toLowerCase().includes(query)
      )
    }

    setFilteredProducts(filtered)
  }, [products, searchQuery, statusFilter, categoryFilter])

  const onRefresh = () => {
    setRefreshing(true)
    setCurrentPage(1)
    setHasMorePages(true)
    loadData(1, false)
  }

  const renderFooter = () => {
    if (!loadingMore) return null
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={theme.colors.primary[500]} />
        <Typography variant="caption" color="secondary" style={{ marginLeft: 8 }}>
          Chargement...
        </Typography>
      </View>
    )
  }

  const handleProductPress = (product: ProductWithModeration) => {
    setSelectedProduct(product)
    setShowDetailModal(true)
  }

  const handleToggleActive = (product: ProductWithModeration) => {
    setProductToConfirm(product)
    setConfirmAction(product.is_active ? 'deactivate' : 'activate')
    setShowConfirmModal(true)
  }

  const handleApproveProduct = (product: ProductWithModeration) => {
    setProductToConfirm(product)
    setConfirmAction('approve')
    setShowConfirmModal(true)
  }

  const handleRejectProduct = (product: ProductWithModeration) => {
    setProductToConfirm(product)
    setConfirmAction('reject')
    setShowConfirmModal(true)
  }

  const handleDeleteProduct = (product: ProductWithModeration) => {
    setProductToConfirm(product)
    setConfirmAction('delete')
    setShowConfirmModal(true)
  }

  const executeConfirmAction = async () => {
    if (!productToConfirm || !confirmAction) return

    const previousProducts = [...products]

    try {
      setActionLoadingIds(prev => new Set(prev).add(productToConfirm.id))

      switch (confirmAction) {
        case 'activate':
          setProducts(prev =>
            prev.map(p => (p.id === productToConfirm.id ? { ...p, is_active: true } : p))
          )
          // Use admin endpoint for activation (allows admin to update any product)
          await apiService.put(`/admin/products/${productToConfirm.id}`, { is_active: true })
          break

        case 'deactivate':
          setProducts(prev =>
            prev.map(p => (p.id === productToConfirm.id ? { ...p, is_active: false } : p))
          )
          // Use admin endpoint for deactivation (allows admin to update any product)
          await apiService.put(`/admin/products/${productToConfirm.id}`, { is_active: false })
          break

        case 'approve':
          setProducts(prev =>
            prev.map(p =>
              p.id === productToConfirm.id
                ? { ...p, needs_approval: false, is_active: true }
                : p
            )
          )
          await apiService.post(`/admin/products/${productToConfirm.id}/approve`)
          setShowDetailModal(false)
          break

        case 'reject':
          setProducts(prev =>
            prev.map(p =>
              p.id === productToConfirm.id
                ? { ...p, needs_approval: false, is_active: false }
                : p
            )
          )
          await apiService.post(`/admin/products/${productToConfirm.id}/reject`, {
            reason: 'Rejeté par l\'administrateur',
          })
          setShowDetailModal(false)
          break

        case 'delete':
          setProducts(prev => prev.filter(p => p.id !== productToConfirm.id))
          await apiService.delete(`/products/${productToConfirm.id}`)
          setShowDetailModal(false)
          break
      }

      setShowConfirmModal(false)
      showSuccess('Succès', getSuccessMessage())
    } catch (error) {
      setProducts(previousProducts)
      showError('Erreur', getErrorMessage())
    } finally {
      setActionLoadingIds(prev => {
        const newSet = new Set(prev)
        newSet.delete(productToConfirm.id)
        return newSet
      })
    }
  }

  const getSuccessMessage = () => {
    switch (confirmAction) {
      case 'activate': return 'Produit activé avec succès'
      case 'deactivate': return 'Produit désactivé avec succès'
      case 'approve': return 'Produit approuvé avec succès'
      case 'reject': return 'Produit rejeté'
      case 'delete': return 'Produit supprimé définitivement'
      default: return 'Action effectuée'
    }
  }

  const getErrorMessage = () => {
    switch (confirmAction) {
      case 'activate': return 'Impossible d\'activer le produit'
      case 'deactivate': return 'Impossible de désactiver le produit'
      case 'approve': return 'Impossible d\'approuver le produit'
      case 'reject': return 'Impossible de rejeter le produit'
      case 'delete': return 'Impossible de supprimer le produit'
      default: return 'Erreur lors de l\'action'
    }
  }

  const getConfirmModalConfig = () => {
    switch (confirmAction) {
      case 'activate':
        return {
          title: 'Activer le produit',
          message: `Voulez-vous activer "${productToConfirm?.name}" ? Il sera visible par les clients.`,
          confirmText: 'Activer',
          variant: 'success' as const,
          icon: 'eye' as const,
        }
      case 'deactivate':
        return {
          title: 'Désactiver le produit',
          message: `Voulez-vous désactiver "${productToConfirm?.name}" ? Il ne sera plus visible par les clients.`,
          confirmText: 'Désactiver',
          variant: 'warning' as const,
          icon: 'eye-off' as const,
        }
      case 'approve':
        return {
          title: 'Approuver le produit',
          message: `Voulez-vous approuver "${productToConfirm?.name}" ? Il sera visible par les clients.`,
          confirmText: 'Approuver',
          variant: 'success' as const,
          icon: 'checkmark-circle' as const,
        }
      case 'reject':
        return {
          title: 'Rejeter le produit',
          message: `Voulez-vous rejeter "${productToConfirm?.name}" ? Le commerçant sera notifié.`,
          confirmText: 'Rejeter',
          variant: 'danger' as const,
          icon: 'close-circle' as const,
        }
      case 'delete':
        return {
          title: 'Supprimer le produit',
          message: `⚠️ ATTENTION : Cette action est irréversible.\n\nVoulez-vous vraiment supprimer "${productToConfirm?.name}" ?`,
          confirmText: 'Supprimer',
          variant: 'danger' as const,
          icon: 'trash' as const,
        }
      default:
        return {
          title: 'Confirmer',
          message: 'Confirmer cette action ?',
          confirmText: 'Confirmer',
          variant: 'info' as const,
          icon: 'information-circle' as const,
        }
    }
  }

  const getStatusBadge = (product: ProductWithModeration) => {
    if ((product as ProductWithModeration).needs_approval) {
      return (
        <Badge variant="warning" size="sm">
          En attente
        </Badge>
      )
    }
    if (product.is_active) {
      return (
        <Badge variant="success" size="sm">
          Actif
        </Badge>
      )
    }
    return (
      <Badge variant="error" size="sm">
        Inactif
      </Badge>
    )
  }

  const renderProduct = ({ item }: { item: ProductWithModeration }) => {
    // Conversion robuste des prix (supporte string et number)
    const discountedPrice = Number(item.discounted_price) || 0
    const originalPrice = Number(item.original_price) || 0
    const isActionLoading = actionLoadingIds.has(item.id)

    return (
      <TouchableOpacity
        onPress={() => handleProductPress(item)}
        activeOpacity={0.7}
      >
        <Card variant="elevated" style={{ marginBottom: theme.spacing.md }}>
          <View style={styles.productCard}>
            {/* Image */}
            <Image
              source={{ uri: getImageUrl(item.image_url, item.category?.name) }}
              style={styles.productImage}
              contentFit="cover"
            />

            {/* Infos */}
            <View style={styles.productInfo}>
              <View style={styles.productHeader}>
                <Typography variant="body" weight="semibold" numberOfLines={2} style={{ flex: 1 }}>
                  {item.name}
                </Typography>
                {getStatusBadge(item)}
              </View>

              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                <Ionicons name="storefront-outline" size={12} color={theme.colors.neutral[500]} />
                <Typography variant="caption" color="secondary" numberOfLines={1} style={{ marginLeft: 4 }}>
                  {item.merchant.business_name}
                </Typography>
              </View>

              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                <Ionicons name="folder-outline" size={12} color={theme.colors.neutral[500]} />
                <Typography variant="caption" color="secondary" style={{ marginLeft: 4 }}>
                  {item.category?.name || 'Non catégorisé'}
                </Typography>
                <Typography variant="caption" color="secondary" style={{ marginHorizontal: 6 }}>
                  •
                </Typography>
                <Ionicons name="cube-outline" size={12} color={theme.colors.neutral[500]} />
                <Typography variant="caption" color="secondary" style={{ marginLeft: 4 }}>
                  {item.quantity_available} dispo
                </Typography>
              </View>

              <View style={styles.priceRow}>
                <Typography variant="h4" weight="bold" color="primary">
                  {formatCurrency(discountedPrice)}
                </Typography>
                <Typography
                  variant="caption"
                  color="tertiary"
                  style={{ textDecorationLine: 'line-through', marginLeft: 8 }}
                >
                  {formatCurrency(originalPrice)}
                </Typography>
                <Badge variant="success" size="sm" style={{ marginLeft: 'auto' }}>
                  -{item.discount_percentage}%
                </Badge>
              </View>

              {/* Actions rapides */}
              <View style={styles.quickActions}>
                <TouchableOpacity
                  style={[
                    styles.quickActionBtn,
                    { backgroundColor: theme.withOpacity(theme.colors.primary[500], 0.1) },
                  ]}
                  onPress={() => handleToggleActive(item)}
                  disabled={isActionLoading}
                >
                  <Ionicons
                    name={item.is_active ? 'eye-off' : 'eye'}
                    size={16}
                    color={theme.colors.primary[500]}
                  />
                  <Typography variant="caption" weight="semibold" style={{ color: theme.colors.primary[500] }}>
                    {item.is_active ? 'Désactiver' : 'Activer'}
                  </Typography>
                </TouchableOpacity>

                {item.needs_approval && (
                  <>
                    <TouchableOpacity
                      style={[
                        styles.quickActionBtn,
                        { backgroundColor: theme.withOpacity(theme.colors.success, 0.1) },
                      ]}
                      onPress={() => handleApproveProduct(item)}
                      disabled={isActionLoading}
                    >
                      <Ionicons name="checkmark" size={16} color={theme.colors.success} />
                      <Typography variant="caption" weight="semibold" style={{ color: theme.colors.success }}>
                        Approuver
                      </Typography>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.quickActionBtn,
                        { backgroundColor: theme.withOpacity(theme.colors.error, 0.1) },
                      ]}
                      onPress={() => handleRejectProduct(item)}
                      disabled={isActionLoading}
                    >
                      <Ionicons name="close" size={16} color={theme.colors.error} />
                      <Typography variant="caption" weight="semibold" style={{ color: theme.colors.error }}>
                        Rejeter
                      </Typography>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            </View>
          </View>
        </Card>
      </TouchableOpacity>
    )
  }

  const renderDetailModal = () => {
    if (!selectedProduct) return null

    // Conversion robuste des prix (supporte string et number)
    const discountedPrice = Number(selectedProduct.discounted_price) || 0
    const originalPrice = Number(selectedProduct.original_price) || 0

    return (
      <Modal
        visible={showDetailModal}
        animationType="slide"
        onRequestClose={() => setShowDetailModal(false)}
      >
        <View style={[styles.modalContainer, { backgroundColor: theme.colors.background }]}>
          {/* Header */}
          <View style={[styles.modalHeader, { backgroundColor: theme.colors.primary[500] }]}>
            <TouchableOpacity onPress={() => setShowDetailModal(false)}>
              <Ionicons name="close" size={28} color="white" />
            </TouchableOpacity>
            <Typography variant="h3" weight="bold" style={{ color: 'white' }}>
              Détails Produit
            </Typography>
            <View style={{ width: 28 }} />
          </View>

          <ScrollView style={styles.modalContent}>
            {/* Image */}
            <Image
              source={{ uri: getImageUrl(selectedProduct.image_url, selectedProduct.category?.name) }}
              style={styles.modalImage}
              contentFit="cover"
            />

            {/* Statut */}
            <View style={styles.modalSection}>
              <Typography variant="caption" color="secondary">
                STATUT
              </Typography>
              {getStatusBadge(selectedProduct)}
            </View>

            {/* Infos produit */}
            <View style={styles.modalSection}>
              <Typography variant="h3" weight="bold" style={{ marginBottom: 8 }}>
                {selectedProduct.name}
              </Typography>
              <Typography variant="body" color="secondary" style={{ marginBottom: 16 }}>
                {selectedProduct.description}
              </Typography>

              <View style={styles.infoRow}>
                <Ionicons name="pricetag" size={20} color={theme.colors.textSecondary} />
                <Typography variant="body" color="secondary" style={{ marginLeft: 8 }}>
                  {selectedProduct.category?.name}
                </Typography>
              </View>

              <View style={styles.infoRow}>
                <Ionicons name="cube" size={20} color={theme.colors.textSecondary} />
                <Typography variant="body" color="secondary" style={{ marginLeft: 8 }}>
                  {selectedProduct.quantity_available} disponibles
                </Typography>
              </View>

              <View style={styles.infoRow}>
                <Ionicons name="calendar" size={20} color={theme.colors.textSecondary} />
                <Typography variant="body" color="secondary" style={{ marginLeft: 8 }}>
                  Expire le {new Date(selectedProduct.expiration_date).toLocaleDateString('fr-FR')}
                </Typography>
              </View>
            </View>

            {/* Prix */}
            <View style={styles.modalSection}>
              <Typography variant="caption" color="secondary" style={{ marginBottom: 8 }}>
                PRIX
              </Typography>
              <View style={styles.priceRow}>
                <Typography variant="h2" weight="bold" color="primary">
                  {formatCurrency(discountedPrice)}
                </Typography>
                <Typography
                  variant="body"
                  color="tertiary"
                  style={{ textDecorationLine: 'line-through', marginLeft: 12 }}
                >
                  {formatCurrency(originalPrice)}
                </Typography>
              </View>
              <Badge variant="success" size="md" style={{ alignSelf: 'flex-start', marginTop: 8 }}>
                -{selectedProduct.discount_percentage}% de réduction
              </Badge>
            </View>

            {/* Commerçant */}
            <View style={styles.modalSection}>
              <Typography variant="caption" color="secondary" style={{ marginBottom: 8 }}>
                COMMERÇANT
              </Typography>
              <Typography variant="h4" weight="semibold">
                {selectedProduct.merchant.business_name}
              </Typography>
              <Typography variant="body" color="secondary">
                {selectedProduct.merchant.city}
              </Typography>
              {selectedProduct.merchant.phone && (
                <Typography variant="body" color="secondary">
                  📞 {selectedProduct.merchant.phone}
                </Typography>
              )}
            </View>

            {/* Actions admin */}
            <View style={styles.modalSection}>
              <Typography variant="caption" color="secondary" style={{ marginBottom: 12 }}>
                ACTIONS ADMINISTRATEUR
              </Typography>

              {(selectedProduct as ProductWithModeration).needs_approval && (
                <>
                  <Button
                    variant="primary"
                    size="lg"
                    onPress={() => handleApproveProduct(selectedProduct)}
                    leftIcon={<Ionicons name="checkmark-circle" size={20} color="white" />}
                    style={{ marginBottom: 12 }}
                    disabled={actionLoadingIds.has(selectedProduct.id)}
                  >
                    Approuver le produit
                  </Button>

                  <Button
                    variant="destructive"
                    size="lg"
                    onPress={() => handleRejectProduct(selectedProduct)}
                    leftIcon={<Ionicons name="close-circle" size={20} color="white" />}
                    style={{ marginBottom: 12 }}
                    disabled={actionLoadingIds.has(selectedProduct.id)}
                  >
                    Rejeter le produit
                  </Button>
                </>
              )}

              <Button
                variant={selectedProduct.is_active ? 'secondary' : 'primary'}
                size="lg"
                onPress={() => handleToggleActive(selectedProduct)}
                leftIcon={
                  <Ionicons
                    name={selectedProduct.is_active ? 'eye-off' : 'eye'}
                    size={20}
                    color={selectedProduct.is_active ? theme.colors.text : 'white'}
                  />
                }
                style={{ marginBottom: 12 }}
                disabled={actionLoadingIds.has(selectedProduct.id)}
              >
                {selectedProduct.is_active ? 'Désactiver' : 'Activer'}
              </Button>

              <Button
                variant="destructive"
                size="lg"
                onPress={() => handleDeleteProduct(selectedProduct)}
                leftIcon={<Ionicons name="trash" size={20} color="white" />}
                disabled={actionLoadingIds.has(selectedProduct.id)}
              >
                Supprimer définitivement
              </Button>
            </View>

            <View style={{ height: 40 }} />
          </ScrollView>

          {actionLoadingIds.size > 0 && (
            <View style={[styles.loadingOverlay, { backgroundColor: theme.withOpacity(theme.colors.background, 0.9) }]}>
              <ActivityIndicator size="large" color={theme.colors.primary[500]} />
            </View>
          )}
        </View>
      </Modal>
    )
  }

  const pendingCount = products.filter(p => (p as ProductWithModeration).needs_approval).length

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar barStyle={theme.isDark ? 'light-content' : 'dark-content'} backgroundColor={theme.colors.background} />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.colors.primary[500] }]}>
        <View style={styles.headerContent}>
          <View>
            <Typography variant="h2" weight="bold" style={{ color: 'white', marginBottom: 4 }}>
              Gestion Produits
            </Typography>
            {pendingCount > 0 && (
              <View style={styles.pendingBadge}>
                <Ionicons name="alert-circle" size={16} color={theme.colors.warning} />
                <Typography variant="caption" weight="semibold" style={{ color: '#FFF3CD' }}>
                  {pendingCount} produit{pendingCount > 1 ? 's' : ''} en attente
                </Typography>
              </View>
            )}
          </View>
          <TouchableOpacity onPress={() => loadData()} accessibilityLabel="Rafraîchir les produits" testID="refresh-products-button">
            <Ionicons name="refresh" size={24} color="white" testID="refresh-icon" />
          </TouchableOpacity>
        </View>

        {/* Search */}
        <View style={[styles.searchContainer, { backgroundColor: 'rgba(255, 255, 255, 0.2)' }]}>
          <Ionicons name="search" size={20} color="rgba(255, 255, 255, 0.8)" />
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher un produit..."
            placeholderTextColor="rgba(255, 255, 255, 0.6)"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} testID="clear-search-button">
              <Ionicons name="close-circle" size={20} color="rgba(255, 255, 255, 0.8)" testID="close-circle-icon" />
            </TouchableOpacity>
          )}
        </View>

        {/* Filtres statut */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersScroll}>
          {[
            { value: 'all', label: 'Tous', count: products.length },
            { value: 'pending', label: 'En attente', count: pendingCount },
            {
              value: 'active',
              label: 'Actifs',
              count: products.filter(p => p.is_active).length,
            },
            {
              value: 'inactive',
              label: 'Inactifs',
              count: products.filter(p => !p.is_active).length,
            },
          ].map(filter => (
            <TouchableOpacity
              key={filter.value}
              style={[
                styles.filterChip,
                {
                  backgroundColor:
                    statusFilter === filter.value ? 'white' : 'rgba(255, 255, 255, 0.2)',
                },
              ]}
              onPress={() => setStatusFilter(filter.value as ProductStatus)}
            >
              <Typography
                variant="caption"
                weight="semibold"
                style={{
                  color: statusFilter === filter.value ? theme.colors.primary[500] : 'white',
                }}
              >
                {filter.label} ({filter.count})
              </Typography>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Filtre catégorie */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersScroll}>
          <TouchableOpacity
            style={[
              styles.filterChip,
              {
                backgroundColor:
                  categoryFilter === 'all' ? 'white' : 'rgba(255, 255, 255, 0.2)',
              },
            ]}
            onPress={() => setCategoryFilter('all')}
          >
            <Typography
              variant="caption"
              weight="semibold"
              style={{
                color: categoryFilter === 'all' ? theme.colors.primary[500] : 'white',
              }}
            >
              Toutes catégories
            </Typography>
          </TouchableOpacity>

          {categories.map(cat => {
            const count = products.filter(p => p.category?.id === cat.id).length
            return (
              <TouchableOpacity
                key={cat.id}
                style={[
                  styles.filterChip,
                  {
                    backgroundColor:
                      categoryFilter === cat.id ? 'white' : 'rgba(255, 255, 255, 0.2)',
                  },
                ]}
                onPress={() => setCategoryFilter(cat.id)}
              >
                <Typography
                  variant="caption"
                  weight="semibold"
                  style={{
                    color: categoryFilter === cat.id ? theme.colors.primary[500] : 'white',
                  }}
                >
                  {cat.name} ({count})
                </Typography>
              </TouchableOpacity>
            )
          })}
        </ScrollView>
      </View>

      {/* Liste produits */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary[500]} />
          <Typography variant="body" color="secondary" style={{ marginTop: 16 }}>
            Chargement des produits...
          </Typography>
        </View>
      ) : (
        <FlashList
          testID="products-flatlist"
          data={filteredProducts}
          renderItem={renderProduct}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={[styles.listContent, { paddingTop: insets.top + 16 }]}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          onEndReached={loadMoreProducts}
          onEndReachedThreshold={0.5}
          ListFooterComponent={renderFooter}
          ListEmptyComponent={
            <View style={[styles.emptyState, { backgroundColor: theme.colors.surface.light }]}>
              <Ionicons name="cube-outline" size={64} color={theme.colors.neutral[300]} />
              <Typography variant="h4" weight="semibold" style={{ marginTop: 16 }}>
                Aucun produit trouvé
              </Typography>
              <Typography
                variant="body"
                color="secondary"
                style={{ marginTop: 8, textAlign: 'center' }}
              >
                {searchQuery || statusFilter !== 'all' || categoryFilter !== 'all'
                  ? 'Essayez de modifier vos filtres'
                  : 'Aucun produit dans la base de données'}
              </Typography>
            </View>
          }
        />
      )}

      {/* Modal détail */}
      {renderDetailModal()}

      {/* Confirm Modal */}
      {confirmAction && (
        <ConfirmModal
          visible={showConfirmModal}
          onClose={() => setShowConfirmModal(false)}
          onConfirm={executeConfirmAction}
          title={getConfirmModalConfig().title}
          message={getConfirmModalConfig().message}
          confirmText={getConfirmModalConfig().confirmText}
          cancelText="Annuler"
          variant={getConfirmModalConfig().variant}
          loading={productToConfirm ? actionLoadingIds.has(productToConfirm.id) : false}
          icon={getConfirmModalConfig().icon}
        />
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
    paddingBottom: 16,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  pendingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    color: 'white',
    fontSize: 16,
  },
  filtersScroll: {
    marginBottom: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    marginRight: 8,
    minHeight: 44,
  },
  listContent: {
    padding: 16,
    flexGrow: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    flex: 1,
    padding: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 40,
  },
  productCard: {
    flexDirection: 'row',
    padding: 12,
  },
  productImage: {
    width: 100,
    height: 100,
    borderRadius: 12,
    marginRight: 12,
  },
  productInfo: {
    flex: 1,
  },
  productHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 4,
    gap: 8,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  quickActions: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
  },
  quickActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 16,
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  modalImage: {
    width: '100%',
    height: 250,
    borderRadius: 16,
    marginBottom: 24,
  },
  modalSection: {
    marginBottom: 24,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerLoader: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
  },
})

export default AdminProductsScreen
