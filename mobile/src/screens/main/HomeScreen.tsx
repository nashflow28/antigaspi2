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
import { useToast } from '../../contexts/ToastContext'
import { Ionicons } from '@expo/vector-icons'
import { Image } from 'expo-image'
import { useTheme } from '../../theme'
import { Product } from '../../types'
import { getImageUrl } from '../../utils/imageHelpers'
import { formatCurrency } from '../../utils/currencyHelpers'
import FavoriteButton from '../../components/FavoriteButton'
import locationService, { UserLocation } from '../../services/locationService'
import { Button, Card, Badge, Typography } from '../../components/2025'
import { TEST_IDS } from '../../utils/testIds'

interface Props {
  navigation: any
}

const HomeScreen: React.FC<Props> = ({ navigation }) => {
  const dispatch = useDispatch<AppDispatch>()
  const { user } = useSelector((state: RootState) => state.auth)
  const { products, categories, loading } = useSelector((state: RootState) => state.products)
  const { showError } = useToast()
  const theme = useTheme()

  const [refreshing, setRefreshing] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [showAvailable, setShowAvailable] = useState(true)
  const [maxDistance, setMaxDistance] = useState(10)
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null)
  const [distanceEnabled, setDistanceEnabled] = useState(false)
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
      await Promise.all([
        dispatch(fetchProducts({ per_page: 100 })),
        dispatch(fetchCategories()),
      ])
    } catch (error) {
      showError('Impossible de charger les données')
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

  // Filtrage des produits selon catégorie, disponibilité et distance
  const filteredProducts = (products || []).filter(product => {
    // Filtre par catégorie
    if (selectedCategory !== 'all' && product.category.id !== parseInt(selectedCategory)) {
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
        const distanceResult = locationService.calculateDistance(
          userLocation.latitude,
          userLocation.longitude,
          latitude,
          longitude
        )
        if (distanceResult.distance > maxDistance) {
          return false
        }
      }
    }

    return true
  })

  // Tri des produits par distance si filtre distance actif
  const sortedProducts = distanceEnabled && userLocation
    ? [...filteredProducts].sort((a, b) => {
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
    : filteredProducts

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
        <Typography
          variant="caption"
          weight="medium"
          style={{
            maxWidth: 120,
            ...(isActive && { color: theme.colors.textInverse })
          }}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {name}
        </Typography>
      </TouchableOpacity>
    )
  }

  const handleDistanceFilterPress = async () => {
    if (!locationPermissionGranted) {
      // Demander permission
      Alert.alert(
        'Autorisation requise',
        'Antigaspi a besoin d\'accéder à votre position pour afficher les produits proches de vous.',
        [
          { text: 'Annuler', style: 'cancel' },
          {
            text: 'Autoriser',
            onPress: async () => {
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

    if (!distanceEnabled) {
      // Activer le filtre distance avec la distance actuelle
      setDistanceEnabled(true)
    } else {
      // Changer la distance ou désactiver
      Alert.alert(
        'Filtre distance',
        'Choisissez une distance maximum',
        [
          { text: '< 5 km', onPress: () => setMaxDistance(5) },
          { text: '< 10 km', onPress: () => setMaxDistance(10) },
          { text: '< 20 km', onPress: () => setMaxDistance(20) },
          { text: 'Désactiver', style: 'destructive', onPress: () => setDistanceEnabled(false) },
          { text: 'Annuler', style: 'cancel' },
        ]
      )
    }
  }

  const renderProductCard = (product: Product, index?: number) => {
    const timeSlot = getTimeSlot(product)
    const discountedPrice = Math.round(parseFloat(product.discounted_price) || 0)
    const originalPrice = Math.round(parseFloat(product.original_price) || 0)

    // Calcul du discount en pourcentage
    const discountPercent = Math.round(((originalPrice - discountedPrice) / originalPrice) * 100)

    // Calcul de la distance si position utilisateur disponible
    const distanceInfo = locationService.calculateDistanceFromUser(
      userLocation,
      product.merchant?.latitude || null,
      product.merchant?.longitude || null
    )

    return (
      <TouchableOpacity
        key={product.id}
        onPress={() => navigation.navigate('ProductDetails', { productId: product.id })}
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
              <Ionicons name="cart" size={16} color={theme.colors.text} />
              <Typography variant="caption" weight="semibold" style={{ marginLeft: 4 }}>
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
              {product.merchant.business_name}
            </Typography>

            {/* Location info */}
            {distanceInfo ? (
              <View style={[styles.distanceBadge, { marginBottom: theme.spacing.sm }]}>
                <Ionicons name="location" size={12} color={theme.colors.primary[600]} />
                <Typography variant="caption" weight="semibold" color="primary" style={{ marginLeft: 4 }}>
                  {distanceInfo.formatted}
                </Typography>
              </View>
            ) : (
              <Typography variant="caption" color="secondary" numberOfLines={1} style={{ marginBottom: theme.spacing.sm }}>
                📍 {product.merchant.city}
              </Typography>
            )}

            <View style={styles.priceRow}>
              <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8, marginBottom: 4 }}>
                <Typography variant="h3" weight="bold" color="primary" style={{ fontSize: 24 }}>
                  {formatCurrency(discountedPrice)}
                </Typography>
                {discountPercent > 0 && (
                  <Typography variant="caption" weight="bold" style={{ color: theme.colors.error[500], fontSize: 13 }}>
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
  }

  const styles = createStyles(theme)

  return (
    <View style={styles.container} testID={TEST_IDS.homeScreen}>
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
            <Typography variant="h2" weight="bold" color="primary" style={{ marginBottom: theme.spacing.xs }}>
              Bonjour {user?.first_name || 'Invité'}
            </Typography>
            <View style={styles.locationRow}>
              <Typography variant="body" color="secondary">Qu'allons-nous sauver au </Typography>
              <Typography variant="body" weight="semibold" color="primary">Togo</Typography>
              <Typography variant="body" color="secondary"> ?</Typography>
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
          {renderCategoryItem('all', `Tous (${products?.length || 0})`, '🛍️')}
          {categories && Array.isArray(categories) && categories.map(category => {
            // Compter produits par catégorie (avec filtre disponibilité)
            const categoryProductCount = (products || []).filter(
              p => p.category.id === category.id &&
              (showAvailable ? p.quantity_available > 0 : true)
            ).length

            return renderCategoryItem(
              category.id.toString(),
              `${category.name} (${categoryProductCount})`,
              getCategoryEmoji(category.name)
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
              style={{ color: showAvailable ? theme.colors.primary[700] : theme.colors.textSecondary, fontWeight: showAvailable ? '500' : '400' }}
            >
              🏷️ Produits disponibles
            </Typography>
            <Ionicons
              name={showAvailable ? "toggle" : "toggle-outline"}
              size={24}
              color={showAvailable ? theme.colors.primary[500] : theme.colors.neutral[400]}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.distanceFilter,
              distanceEnabled && styles.distanceFilterActive
            ]}
            onPress={handleDistanceFilterPress}
          >
            <Ionicons
              name="location"
              size={16}
              color={distanceEnabled ? theme.colors.primary[600] : theme.colors.textSecondary}
            />
            <Typography
              variant="caption"
              weight="medium"
              style={{ color: distanceEnabled ? theme.colors.primary[700] : theme.colors.textSecondary, fontWeight: distanceEnabled ? '600' : '500' }}
            >
              {`< ${maxDistance} km`}
            </Typography>
            <Ionicons
              name={distanceEnabled ? "toggle" : "toggle-outline"}
              size={24}
              color={distanceEnabled ? theme.colors.primary[500] : theme.colors.neutral[300]}
            />
          </TouchableOpacity>
        </View>

        {/* Compteur de résultats */}
        {sortedProducts.length > 0 && (
          <View style={styles.resultsHeader}>
            <Typography variant="body" weight="semibold">
              {sortedProducts.length} produit{sortedProducts.length > 1 ? 's' : ''} trouvé{sortedProducts.length > 1 ? 's' : ''}
            </Typography>
            {(selectedCategory !== 'all' || distanceEnabled) && (
              <TouchableOpacity onPress={() => {
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
          {sortedProducts.length > 0 ? (
            sortedProducts.map((product, index) => renderProductCard(product, index))
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="basket-outline" size={64} color={theme.colors.neutral[300]} />
              {selectedCategory === 'all' ? (
                <>
                  <Typography variant="h3" weight="bold" style={{ marginTop: theme.spacing.lg, marginBottom: theme.spacing.sm }}>
                    Aucun produit disponible
                  </Typography>
                  <Typography variant="body" color="secondary" style={{ textAlign: 'center', lineHeight: 20 }}>
                    {showAvailable
                      ? "Aucun produit disponible actuellement.\nRevenez plus tard ou désactivez le filtre 'Produits disponibles'."
                      : "Aucun produit dans la base de données.\nRevenez plus tard."}
                  </Typography>
                </>
              ) : (
                <>
                  <Typography variant="h3" weight="bold" style={{ marginTop: theme.spacing.lg, marginBottom: theme.spacing.sm }}>
                    Aucun produit dans cette catégorie
                  </Typography>
                  <Typography variant="body" color="secondary" style={{ textAlign: 'center', lineHeight: 20 }}>
                    {showAvailable
                      ? `Aucun produit disponible dans "${(categories || []).find(c => c.id.toString() === selectedCategory)?.name || 'cette catégorie'}".\nEssayez une autre catégorie ou désactivez le filtre disponibilité.`
                      : `Aucun produit dans "${(categories || []).find(c => c.id.toString() === selectedCategory)?.name || 'cette catégorie'}".\nEssayez une autre catégorie.`}
                  </Typography>
                  <Button
                    variant="primary"
                    size="md"
                    onPress={() => setSelectedCategory('all')}
                    leftIcon={<Ionicons name="refresh" size={20} color={theme.colors.textInverse} />}
                    style={{ marginTop: theme.spacing.lg }}
                  >
                    Voir tous les produits
                  </Button>
                </>
              )}
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
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
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
    backgroundColor: theme.colors.surface.light,
    borderWidth: 1,
    borderColor: theme.colors.border,
    // Prevent size jumps and overflow in horizontal scroll
    minHeight: 40,
    maxWidth: 200,
    flexShrink: 0,
  },
  categoryEmoji: {
    fontSize: 20,
    marginRight: 6,
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
  distanceFilter: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.surface.light,
    borderWidth: 1,
    borderColor: theme.colors.border,
    gap: 4,
  },
  distanceFilterActive: {
    backgroundColor: theme.colors.primary[50],
    borderColor: theme.colors.primary[200],
  },
  distanceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary[50],
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
    backgroundColor: theme.colors.surface.light,
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
})

export default HomeScreen
