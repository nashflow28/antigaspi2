import React, { useEffect, useState, useMemo, useCallback } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  RefreshControl,
  Modal,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useDispatch, useSelector } from 'react-redux'
import { AppDispatch, RootState } from '../../store'
import { fetchProducts, fetchCategories } from '../../store/slices/productsSlice'
import { useToast } from '../../contexts/ToastContext'
import { Ionicons } from '@expo/vector-icons'
import { Image } from 'expo-image'
import { useTheme } from '../../theme'
import { Product } from '../../types'
import { getImageUrl } from '../../utils/imageHelpers'
import { formatCurrency } from '../../utils/currencyHelpers'
import FavoriteButton from '../../components/FavoriteButton'
import locationService, { UserLocation } from '../../services/locationService'
import { Button, Card, Badge, Typography, ProductCardSkeleton, EmptyState } from '../../components/2025'
import { TEST_IDS } from '../../utils/testIds'
import { getCategoryIconConfig, IoniconName } from '../../constants/categoryIcons'
import AlertModal from '../../components/AlertModal'
import { useAlert } from '../../hooks/useAlert'
import ProductTypeFilter, { ProductFilterType } from '../../components/ProductTypeFilter'
import PromoBanner, { PromoBannerItem } from '../../components/PromoBanner'
import NativeAdCard from '../../components/NativeAdCard'
import { usePromos } from '../../hooks/usePromos'

interface Props {
  navigation: any
}

const HomeScreen: React.FC<Props> = ({ navigation }) => {
  const dispatch = useDispatch<AppDispatch>()
  const { user } = useSelector((state: RootState) => state.auth)
  const { products, categories, loading } = useSelector((state: RootState) => state.products)
  const { cart } = useSelector((state: RootState) => state.cart)
  const { showError } = useToast()
  const { alertProps, showWarning, hideAlert } = useAlert()
  const theme = useTheme()
  const insets = useSafeAreaInsets()
  const { promoBanners, getNativeAdForIndex } = usePromos()

  const cartItemsCount = cart?.items_count ?? 0

  const [refreshing, setRefreshing] = useState(false)
  const [selectedProductType, setSelectedProductType] = useState<ProductFilterType>('all')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [showAvailable, setShowAvailable] = useState(true)
  const [maxDistance, setMaxDistance] = useState(10)
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null)
  const [distanceEnabled, setDistanceEnabled] = useState(false)
  const [showDistanceModal, setShowDistanceModal] = useState(false)
  const [locationPermissionGranted, setLocationPermissionGranted] = useState(false)

  useEffect(() => {
    loadData()
    initLocation()
  }, [])

  const initLocation = async () => {
    try {
      const hasPermission = await locationService.hasLocationPermission()
      if (hasPermission) {
        setLocationPermissionGranted(true)
        const position = await locationService.getCurrentPosition()
        if (position) {
          setUserLocation(position)
        }
      } else {
        // Demander permission au premier usage du filtre distance
        setLocationPermissionGranted(false)
      }
    } catch (error) {
      console.error('Erreur initialisation géolocalisation:', error)
    }
  }

  const loadData = async () => {
    try {
      const results = await Promise.all([
        dispatch(fetchProducts({ per_page: 100 })),
        dispatch(fetchCategories()),
      ])
      // Check if any thunk was rejected
      const hasError = results.some(
        (result) => result.meta?.requestStatus === 'rejected'
      )
      if (hasError) {
        showError('Impossible de charger certaines données')
      }
    } catch (error) {
      showError('Impossible de charger les données')
    }
  }

  const onRefresh = async () => {
    setRefreshing(true)
    await loadData()
    setRefreshing(false)
  }

  // ⚡ BUG FIX #8: Memoize getTimeSlot to prevent recreation on every render
  const getTimeSlot = useCallback((product: Product) => {
    const today = new Date()
    const expiryDate = new Date(product.expiration_date)
    const diffDays = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 3600 * 24))

    if (diffDays === 0) {
      return { text: "Aujourd'hui entre 18h30 et 21h", color: theme.colors.primary[500] }
    } else if (diffDays === 1) {
      return { text: "Demain entre 16h et 19h", color: theme.colors.success }
    } else {
      return { text: `Dans ${diffDays} jours`, color: theme.colors.neutral[500] }
    }
  }, [theme.colors.primary, theme.colors.success, theme.colors.neutral])

  // ⚡ PERFORMANCE FIX: Memoize product type counts
  const productTypeCounts = useMemo(() => {
    const allProducts = products || []
    const availableProducts = showAvailable
      ? allProducts.filter(p => p.quantity_available > 0)
      : allProducts

    return {
      all: availableProducts.length,
      products: availableProducts.filter(p => !p.is_surprise_basket).length,
      baskets: availableProducts.filter(p => p.is_surprise_basket === true).length,
    }
  }, [products, showAvailable])

  // ⚡ PERFORMANCE FIX: Memoize filtered products to avoid recalculation on every render
  const filteredProducts = useMemo(() => {
    return (products || []).filter(product => {
      // Filtre par type de produit (produits vs paniers surprises)
      if (selectedProductType === 'products' && product.is_surprise_basket === true) {
        return false
      }
      if (selectedProductType === 'baskets' && product.is_surprise_basket !== true) {
        return false
      }

      // Filtre par catégorie
      if (selectedCategory !== 'all' && product.category?.id !== parseInt(selectedCategory)) {
        return false
      }

      // Filtre par disponibilité
      if (showAvailable && product.quantity_available <= 0) {
        return false
      }

      // Filtre par distance (si activé et position utilisateur disponible)
      if (distanceEnabled && userLocation && product.merchant) {
        const { latitude, longitude } = product.merchant
        if (latitude != null && longitude != null) {
          // BUG FIX #H-008: Wrap in try-catch to handle calculation errors gracefully
          try {
            const distanceResult = locationService.calculateDistance(
              userLocation.latitude,
              userLocation.longitude,
              latitude,
              longitude
            )
            // Check if result is valid before accessing distance
            if (distanceResult && distanceResult.distance > maxDistance) {
              return false
            }
          } catch (error) {
            // Include product by default if distance calculation fails
            console.warn('[HomeScreen] Distance calculation error:', error)
          }
        }
      }

      return true
    })
  }, [products, selectedProductType, selectedCategory, showAvailable, distanceEnabled, userLocation, maxDistance])

  // ⚡ PERFORMANCE FIX: Memoize sorted products
  const sortedProducts = useMemo(() => {
    if (!distanceEnabled || !userLocation) return filteredProducts

    return [...filteredProducts].sort((a, b) => {
      const distA = locationService.calculateDistanceFromUser(
        userLocation,
        a.merchant?.latitude || null,
        a.merchant?.longitude || null
      )
      const distB = locationService.calculateDistanceFromUser(
        userLocation,
        b.merchant?.latitude || null,
        b.merchant?.longitude || null
      )
      return (distA?.distance || Infinity) - (distB?.distance || Infinity)
    })
  }, [filteredProducts, distanceEnabled, userLocation])

  /**
   * BUG FIX #L-001: Use vector icons from categoryIcons.ts instead of emojis
   */
  const renderCategoryItem = (id: string, name: string, categoryName: string) => {
    const isActive = selectedCategory === id
    const iconConfig = getCategoryIconConfig(categoryName)
    return (
      <TouchableOpacity
        key={id}
        testID={`category-tab-${id}`}
        accessibilityLabel={name}
        style={[
          styles.categoryItem,
          isActive && styles.categoryItemActive,
        ]}
        onPress={() => setSelectedCategory(id)}
      >
        <Ionicons
          name={iconConfig.name}
          size={20}
          color={isActive ? iconConfig.color : '#6B7280'}
          style={styles.categoryIcon}
        />
        <Typography
          variant="caption"
          weight="medium"
          style={[
            styles.categoryLabel,
            isActive && styles.categoryLabelActive,
          ]}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {name}
        </Typography>
      </TouchableOpacity>
    )
  }

  // Toggle distance filter on/off directly
  const handleDistanceToggle = async () => {
    if (distanceEnabled) {
      // Désactiver directement
      setDistanceEnabled(false)
      return
    }

    // Activer le filtre
    if (!locationPermissionGranted) {
      // Demander permission
      showWarning(
        'Autorisation requise',
        'Antigaspi a besoin d\'accéder à votre position pour afficher les produits proches de vous.',
        [
          { text: 'Annuler', onPress: hideAlert },
          {
            text: 'Autoriser',
            onPress: async () => {
              hideAlert()
              const granted = await locationService.requestLocationPermission()
              if (granted) {
                setLocationPermissionGranted(true)
                const position = await locationService.getCurrentPosition()
                if (position) {
                  setUserLocation(position)
                  setDistanceEnabled(true)
                } else {
                  showError('Impossible de récupérer votre position')
                }
              } else {
                showError('Permission de localisation refusée')
              }
            },
          },
        ]
      )
      return
    }

    // Activer le filtre distance avec la distance actuelle
    setDistanceEnabled(true)
  }

  // Show distance options modal
  const handleDistanceOptionsPress = () => {
    if (distanceEnabled) {
      setShowDistanceModal(true)
    }
  }

  // Select a distance option
  const handleDistanceSelect = (distance: number) => {
    setMaxDistance(distance)
    setShowDistanceModal(false)
  }

  // ⚡ PERFORMANCE FIX: Memoize styles to avoid recreation on every render
  const styles = useMemo(() => createStyles(theme), [theme])

  // ⚡ BUG FIX #8: Memoize renderProductCard to prevent memory leak from recreation on every render
  const renderProductCard = useCallback((product: Product, index?: number) => {
    const timeSlot = getTimeSlot(product)
    // BUG FIX #M-004: Prices are now normalized as numbers in productsSlice
    const discountedPrice = Math.round(product.discounted_price || 0)
    const originalPrice = Math.round(product.original_price || 0)

    // 🐛 FIX: Prevent division by zero
    const discountPercent = originalPrice > 0
      ? Math.round(((originalPrice - discountedPrice) / originalPrice) * 100)
      : 0

    // Calcul de la distance si position utilisateur disponible
    const distanceInfo = locationService.calculateDistanceFromUser(
      userLocation,
      product.merchant?.latitude || null,
      product.merchant?.longitude || null
    )

    return (
      <TouchableOpacity
        key={product.id}
        onPress={() => {
          if (product.is_surprise_basket) {
            navigation.navigate('SurpriseBasketDetails', { basketId: product.id })
          } else {
            navigation.navigate('ProductDetails', { productId: product.id })
          }
        }}
        testID={typeof index === 'number' ? TEST_IDS.productCard(index) : undefined}
        accessibilityLabel={typeof index === 'number' ? TEST_IDS.productCard(index) : undefined}
      >
        <Card variant="elevated" style={{ marginBottom: theme.spacing.lg, overflow: 'hidden' }}>
          {/* Badge horaire */}
          <View style={styles.timeBadge}>
            <Badge variant="primary" size="sm" style={{ backgroundColor: timeSlot.color }}>
              {timeSlot.text}
            </Badge>
          </View>

          {/* Image */}
          <View style={styles.imageContainer}>
            <Image
              source={{ uri: getImageUrl(product.image_url, product.category?.name) }}
              style={styles.productImage}
              contentFit="cover"
              transition={200}
            />

            {/* Badge panier (quantity) */}
            <View style={styles.cartBadge}>
              <Ionicons name="cart" size={16} color={theme.colors.badgeText} />
              <Typography
                variant="caption"
                weight="semibold"
                style={{ marginLeft: 4, color: theme.colors.badgeText }}
              >
                {product.quantity_available}
              </Typography>
            </View>

            {/* Badge discount */}
            {discountPercent > 0 && (
              <View style={styles.discountBadge}>
                <Badge variant="error" size="sm">
                  -{discountPercent}%
                </Badge>
              </View>
            )}

            {/* Bouton Favoris */}
            <View style={styles.favoriteButton}>
              <FavoriteButton productId={product.id} size={22} />
            </View>
          </View>

          {/* Info produit */}
          <View style={styles.productInfo}>
            <Typography variant="body" weight="semibold" numberOfLines={1} style={{ marginBottom: theme.spacing.xs }}>
              {product.name}
            </Typography>
            <Typography variant="caption" color="secondary" numberOfLines={1} style={{ marginBottom: theme.spacing.xs }}>
              {product.merchant?.business_name || 'Commerçant'}
            </Typography>

            {/* Location info */}
            {distanceInfo ? (
              <View style={[styles.distanceBadge, { marginBottom: theme.spacing.sm }]}>
                <Ionicons name="location" size={12} color={theme.colors.badgeText} />
                <Typography
                  variant="caption"
                  weight="semibold"
                  style={{ marginLeft: 4, color: theme.colors.badgeText }}
                >
                  {distanceInfo.formatted}
                </Typography>
              </View>
            ) : (
              <Typography variant="caption" color="secondary" numberOfLines={1} style={{ marginBottom: theme.spacing.sm }}>
                📍 {product.merchant?.city || 'Ville non disponible'}
              </Typography>
            )}

            <View style={styles.priceRow}>
              <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8, marginBottom: 4 }}>
                <Typography variant="h3" weight="bold" color="primary" style={{ fontSize: 24 }}>
                  {formatCurrency(discountedPrice)}
                </Typography>
                {discountPercent > 0 && (
                  <Typography variant="caption" weight="bold" style={{ color: theme.colors.error, fontSize: 13 }}>
                    -{discountPercent}%
                  </Typography>
                )}
              </View>
              <Typography variant="body" color="tertiary" style={{ textDecorationLine: 'line-through', opacity: 0.6, fontSize: 14 }}>
                {formatCurrency(originalPrice)}
              </Typography>
            </View>
          </View>
        </Card>
      </TouchableOpacity>
    )
  }, [getTimeSlot, userLocation, navigation, theme, styles])

  return (
    <View style={styles.container} testID={TEST_IDS.homeScreen}>
      <StatusBar
        backgroundColor={theme.colors.background}
        barStyle={theme.isDark ? 'light-content' : 'dark-content'}
      />

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.colors.primary[500]]} />
        }
      >
        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
          <View style={{ flex: 1 }}>
            <Typography variant="h2" weight="bold" color="primary" style={{ marginBottom: theme.spacing.xs }}>
              Bonjour {user?.first_name || 'Invité'}
            </Typography>
            <View style={styles.locationRow}>
              <Typography variant="body" color="secondary">Qu'allons-nous sauver au </Typography>
              <Typography variant="body" weight="semibold" color="primary">Togo</Typography>
              <Typography variant="body" color="secondary"> ?</Typography>
            </View>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.headerButton} onPress={onRefresh}>
              <Ionicons name="refresh" size={22} color={theme.colors.controlIcon} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.headerButton}
              onPress={() => navigation.getParent()?.navigate('Orders', { screen: 'Cart' })}
              accessibilityRole="button"
              accessibilityLabel="Voir mon panier"
            >
              <Ionicons name="cart" size={22} color={theme.colors.controlIcon} />
              {cartItemsCount > 0 && (
                <View style={styles.headerCartBadge}>
                  <Text style={styles.headerCartBadgeText}>{cartItemsCount > 99 ? '99+' : cartItemsCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Bannière Promotionnelle */}
        {promoBanners.length > 0 && (
          <PromoBanner
            items={promoBanners}
            autoPlayInterval={5000}
            onItemPress={(item) => {
              if (item.merchantId) {
                navigation.navigate('MerchantDetail', { merchantId: item.merchantId })
              }
            }}
          />
        )}

        {/* Filtre Type: Tous | Produits | Paniers */}
        <ProductTypeFilter
          selectedType={selectedProductType}
          onTypeChange={setSelectedProductType}
          counts={productTypeCounts}
        />

        {/* Catégories */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoriesScroll}
          contentContainerStyle={styles.categoriesContent}
        >
          {renderCategoryItem('all', `Tous (${products?.length || 0})`, 'default')}
          {categories && Array.isArray(categories) && categories.map(category => {
            // Compter produits par catégorie (avec filtre disponibilité)
            const categoryProductCount = (products || []).filter(
              p => p.category?.id === category.id &&
              (showAvailable ? p.quantity_available > 0 : true)
            ).length

            return renderCategoryItem(
              category.id.toString(),
              `${category.name} (${categoryProductCount})`,
              category.name
            )
          })}
        </ScrollView>

        {/* Filtres */}
        <View style={styles.filtersRow}>
          <TouchableOpacity
            style={[styles.filterChip, showAvailable && styles.filterChipActive]}
            onPress={() => setShowAvailable(!showAvailable)}
          >
            <Typography
              variant="caption"
              style={{
                color: showAvailable
                  ? theme.colors.interactiveTextActive
                  : theme.colors.interactiveText,
                fontWeight: showAvailable ? '500' : '400',
              }}
            >
              🏷️ Produits disponibles
            </Typography>
            <Ionicons
              name={showAvailable ? "toggle" : "toggle-outline"}
              size={24}
              color={showAvailable
                ? theme.colors.interactiveTextActive
                : theme.colors.textSecondary}
            />
          </TouchableOpacity>

          <View
            style={[
              styles.distanceFilter,
              distanceEnabled && styles.distanceFilterActive
            ]}
          >
            <Ionicons
              name="location"
              size={16}
              color={distanceEnabled
                ? theme.colors.interactiveTextActive
                : theme.colors.textSecondary}
            />
            {/* Tap on text to change distance (when enabled) */}
            <TouchableOpacity
              onPress={distanceEnabled ? handleDistanceOptionsPress : handleDistanceToggle}
            >
              <Typography
                variant="caption"
                weight="medium"
                style={{
                  color: distanceEnabled
                    ? theme.colors.interactiveTextActive
                    : theme.colors.interactiveText,
                  fontWeight: distanceEnabled ? '600' : '500',
                }}
              >
                {`< ${maxDistance} km`}
              </Typography>
            </TouchableOpacity>
            {/* Tap on toggle to enable/disable directly */}
            <TouchableOpacity
              onPress={handleDistanceToggle}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons
                name={distanceEnabled ? "toggle" : "toggle-outline"}
                size={24}
                color={distanceEnabled
                  ? theme.colors.interactiveTextActive
                  : theme.colors.textSecondary}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Compteur de résultats */}
        {sortedProducts.length > 0 && (
          <View style={styles.resultsHeader}>
            <Typography variant="body" weight="semibold">
              {sortedProducts.length} produit{sortedProducts.length > 1 ? 's' : ''} trouvé{sortedProducts.length > 1 ? 's' : ''}
            </Typography>
            {(selectedCategory !== 'all' || selectedProductType !== 'all' || distanceEnabled) && (
              <TouchableOpacity onPress={() => {
                setSelectedProductType('all')
                setSelectedCategory('all')
                setDistanceEnabled(false)
              }}>
                <Typography variant="caption" weight="medium" color="primary">
                  Effacer les filtres
                </Typography>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Produits */}
        <View style={styles.productsGrid} testID={TEST_IDS.productList}>
          {loading && sortedProducts.length === 0 ? (
            <ProductCardSkeleton count={4} />
          ) : sortedProducts.length > 0 ? (
            sortedProducts.map((product, index) => {
              const nativeAd = getNativeAdForIndex(index, 6) // Pub tous les 6 produits
              return (
                <React.Fragment key={product.id}>
                  {renderProductCard(product, index)}
                  {nativeAd && (
                    <NativeAdCard
                      ad={nativeAd}
                      variant="compact"
                      onPress={(ad) => {
                        if (ad.merchantId) {
                          navigation.navigate('MerchantDetail', { merchantId: ad.merchantId })
                        } else if (ad.id === 'wallet-promo') {
                          navigation.getParent()?.navigate('Profile', { screen: 'Wallet' })
                        }
                      }}
                    />
                  )}
                </React.Fragment>
              )
            })
          ) : (
            <EmptyState
              variant={selectedCategory === 'all' && selectedProductType === 'all' ? 'no-products' : 'no-results'}
              description={(() => {
                // Determiner le type d'item pour le message
                const itemType = selectedProductType === 'baskets'
                  ? 'panier surprise'
                  : selectedProductType === 'products'
                    ? 'produit'
                    : 'produit'
                const itemTypePlural = selectedProductType === 'baskets'
                  ? 'paniers surprises'
                  : 'produits'

                const categoryName = selectedCategory !== 'all'
                  ? (categories || []).find(c => c.id.toString() === selectedCategory)?.name || 'cette catégorie'
                  : null

                // Message contextuel selon les filtres actifs
                if (selectedProductType === 'baskets') {
                  if (categoryName) {
                    return showAvailable
                      ? `Aucun panier surprise disponible dans "${categoryName}" pour le moment.`
                      : `Aucun panier surprise dans "${categoryName}" pour le moment.`
                  }
                  return showAvailable
                    ? "Aucun panier surprise disponible pour le moment. Revenez plus tard !"
                    : "Aucun panier surprise pour le moment. Revenez plus tard !"
                }

                if (selectedProductType === 'products') {
                  if (categoryName) {
                    return showAvailable
                      ? `Aucun produit disponible dans "${categoryName}" pour le moment.`
                      : `Aucun produit dans "${categoryName}" pour le moment.`
                  }
                  return showAvailable
                    ? "Aucun produit disponible pour le moment. Revenez plus tard !"
                    : "Aucun produit pour le moment. Revenez plus tard !"
                }

                // Type 'all'
                if (categoryName) {
                  return showAvailable
                    ? `Aucun produit disponible dans "${categoryName}". Essayez une autre catégorie.`
                    : `Aucun produit dans "${categoryName}".`
                }
                return showAvailable
                  ? "Aucun produit disponible actuellement. Revenez plus tard ou désactivez le filtre 'Produits disponibles'."
                  : "Aucun produit dans la base de données. Revenez plus tard."
              })()}
              compact
              actions={(() => {
                const actions = []

                // Action pour réinitialiser le type de produit
                if (selectedProductType !== 'all') {
                  actions.push({
                    label: 'Voir tout',
                    icon: 'apps-outline',
                    onPress: () => setSelectedProductType('all'),
                  })
                }

                // Action pour réinitialiser la catégorie
                if (selectedCategory !== 'all') {
                  actions.push({
                    label: 'Toutes catégories',
                    icon: 'grid-outline',
                    onPress: () => setSelectedCategory('all'),
                  })
                }

                return actions
              })()}
            />
          )}
        </View>
      </ScrollView>

      {/* Distance Options Modal */}
      <Modal
        visible={showDistanceModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDistanceModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowDistanceModal(false)}
        >
          <View style={styles.modalContent}>
            <Typography variant="h3" weight="bold" style={{ marginBottom: theme.spacing.xs }}>
              Filtre distance
            </Typography>
            <Typography variant="body" color="secondary" style={{ marginBottom: theme.spacing.md }}>
              Choisissez une distance maximum
            </Typography>

            <View style={styles.distanceOptions}>
              <TouchableOpacity
                style={[
                  styles.distanceOption,
                  maxDistance === 5 && styles.distanceOptionActive,
                ]}
                onPress={() => handleDistanceSelect(5)}
              >
                <Typography
                  variant="body"
                  weight={maxDistance === 5 ? 'bold' : 'medium'}
                  color="primary"
                >
                  {'< 5 KM'}
                </Typography>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.distanceOption,
                  maxDistance === 10 && styles.distanceOptionActive,
                ]}
                onPress={() => handleDistanceSelect(10)}
              >
                <Typography
                  variant="body"
                  weight={maxDistance === 10 ? 'bold' : 'medium'}
                  color="primary"
                >
                  {'< 10 KM'}
                </Typography>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.distanceOption,
                  maxDistance === 20 && styles.distanceOptionActive,
                ]}
                onPress={() => handleDistanceSelect(20)}
              >
                <Typography
                  variant="body"
                  weight={maxDistance === 20 ? 'bold' : 'medium'}
                  color="primary"
                >
                  {'< 20 KM'}
                </Typography>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      <AlertModal {...alertProps} />
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
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.controlSurface,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  headerCartBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: theme.colors.error,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  headerCartBadgeText: {
    color: 'white',
    fontSize: 11,
    fontWeight: 'bold',
  },
  categoriesScroll: {
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.xs,
    // Ensure visible lane height for horizontal chips
    minHeight: 56,
  },
  categoriesContent: {
    paddingHorizontal: theme.spacing.lg,
    paddingRight: theme.spacing.xl,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: theme.spacing.md,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.interactiveSurface,
    borderWidth: 1,
    borderColor: theme.colors.interactiveBorder,
    // Prevent size jumps and overflow in horizontal scroll
    minHeight: 40,
    maxWidth: 200,
    flexShrink: 0,
  },
  categoryItemActive: {
    backgroundColor: theme.colors.interactiveSurfaceActive,
    borderColor: theme.colors.interactiveBorderActive,
  },
  categoryIcon: {
    marginRight: 6,
  },
  categoryLabel: {
    maxWidth: 120,
    color: theme.colors.interactiveText,
  },
  categoryLabelActive: {
    color: theme.colors.interactiveTextActive,
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
    backgroundColor: theme.colors.interactiveSurface,
    borderWidth: 1,
    borderColor: theme.colors.interactiveBorder,
  },
  filterChipActive: {
    backgroundColor: theme.colors.interactiveSurfaceActive,
    borderColor: theme.colors.interactiveBorderActive,
  },
  distanceFilter: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.interactiveSurface,
    borderWidth: 1,
    borderColor: theme.colors.interactiveBorder,
    gap: 4,
  },
  distanceFilterActive: {
    backgroundColor: theme.colors.interactiveSurfaceActive,
    borderColor: theme.colors.interactiveBorderActive,
  },
  distanceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.badgeBackground,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: theme.radius.md,
    gap: 4,
    marginLeft: 'auto',
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
  },
  productsGrid: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
  },
  timeBadge: {
    position: 'absolute',
    top: theme.spacing.md,
    left: theme.spacing.md,
    maxWidth: '35%',
    zIndex: 1,
  },
  discountBadge: {
    position: 'absolute',
    bottom: theme.spacing.md,
    right: theme.spacing.md,
    zIndex: 2,
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
    backgroundColor: theme.colors.badgeBackgroundStrong,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 6,
    borderRadius: theme.radius.md,
    gap: 4,
  },
  favoriteButton: {
    position: 'absolute',
    top: theme.spacing.md,
    right: theme.spacing.md,
    zIndex: 3,
  },
  productInfo: {
    padding: theme.spacing.md,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing['3xl'],
    paddingHorizontal: theme.spacing.xl,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  modalContent: {
    backgroundColor: theme.colors.background,
    borderRadius: theme.radius.xl,
    padding: theme.spacing.lg,
    width: '100%',
    maxWidth: 320,
    ...theme.shadows.lg,
  },
  distanceOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: theme.spacing.sm,
  },
  distanceOption: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.sm,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.interactiveSurface,
    borderWidth: 1,
    borderColor: theme.colors.interactiveBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  distanceOptionActive: {
    backgroundColor: theme.colors.interactiveSurfaceActive,
    borderColor: theme.colors.interactiveBorderActive,
  },
})

export default HomeScreen
