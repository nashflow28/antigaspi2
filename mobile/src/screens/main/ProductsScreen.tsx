import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  FlatList,
  RefreshControl,
  Alert,
  Platform,
  ActivityIndicator,
  Modal,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useDispatch, useSelector } from 'react-redux'
import { AppDispatch, RootState } from '../../store'
import { fetchProducts, fetchCategories } from '../../store/slices/productsSlice'
import { fetchMerchants } from '../../store/slices/merchantsSlice'
import { Ionicons } from '@expo/vector-icons'
import { Image } from 'expo-image'
import { useTheme } from '../../theme'
import { getImageUrl, getCategoryPlaceholder } from '../../utils/imageHelpers'
import { formatCurrency } from '../../utils/currencyHelpers'
import FavoriteButton from '../../components/FavoriteButton'
import { Product } from '../../types'
import { Button, Card, Badge, Typography } from '../../components/2025'
import OpenStreetMap, { MapMarker } from '../../components/OpenStreetMap'
import locationService, { UserLocation } from '../../services/locationService'
import type { Merchant as MerchantEntity } from '../../store/slices/merchantsSlice'
import searchService, {
  type MerchantSearchResult,
  type ProductSearchResult,
} from '../../services/searchService'

interface Props {
  navigation: any
}

type MerchantListItem = {
  merchant: MerchantEntity
  distanceInfo: ReturnType<typeof locationService.calculateDistanceFromUser>
}

const ProductsScreen: React.FC<Props> = ({ navigation }) => {
  const dispatch = useDispatch<AppDispatch>()
  const { isAuthenticated } = useSelector((state: RootState) => state.auth)
  const { products, categories, loading: productsLoading } = useSelector((state: RootState) => state.products)
  const { merchants, loading: merchantsLoading } = useSelector((state: RootState) => state.merchants)
  const theme = useTheme()
  const insets = useSafeAreaInsets()

  const [contentMode, setContentMode] = useState<'merchants' | 'map'>('merchants')
  const [searchQuery, setSearchQuery] = useState('')
  const [refreshing, setRefreshing] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [distanceEnabled, setDistanceEnabled] = useState(false)
  const [maxDistance, setMaxDistance] = useState(10)
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null)
  const [locationPermissionGranted, setLocationPermissionGranted] = useState(false)
  const [isRequestingLocation, setIsRequestingLocation] = useState(false)
  const [showDistanceModal, setShowDistanceModal] = useState(false)
  const [remoteMerchantResults, setRemoteMerchantResults] = useState<MerchantEntity[] | null>(null)
  const [remoteProductResults, setRemoteProductResults] = useState<Product[] | null>(null)
  const [searchLoading, setSearchLoading] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const searchRequestIdRef = useRef(0)

  const mapProductResult = useCallback((result: ProductSearchResult): Product => {
    const existingProduct = products.find(product => product.id === result.id)
    if (existingProduct) {
      return existingProduct
    }

    const attributes = result.attributes
    const discountedRaw = attributes.discounted_price ?? attributes.original_price ?? 0
    const originalRaw = attributes.original_price ?? discountedRaw

    const discountedPrice = Number(discountedRaw)
    const originalPrice = Number(originalRaw)

    const safeDiscounted = Number.isFinite(discountedPrice) ? discountedPrice : 0
    const safeOriginal = Number.isFinite(originalPrice) ? originalPrice : safeDiscounted

    const merchantAttributes = (attributes.merchant ?? {}) as any
    const discountPercentage = safeOriginal > 0
      ? Math.max(0, Math.round(((safeOriginal - safeDiscounted) / safeOriginal) * 100))
      : 0

    const rawQuantity = attributes.quantity_available ?? null
    const normalizedQuantity = Number(rawQuantity)
    // Fallback à 0 pour quantités invalides (sera filtré par availableQuantity > 0)
    const safeQuantity = Number.isFinite(normalizedQuantity) && normalizedQuantity > 0
      ? normalizedQuantity
      : 0

    // Mapper expiration_date et calculer days_until_expiration
    const expirationDate = (attributes.expiration_date as any as string) ?? new Date().toISOString()
    const daysUntilExpiration = attributes.expiration_date
      ? Math.ceil((new Date(attributes.expiration_date as any as string).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      : 0

    // Mapper la catégorie depuis les attributs
    const categoryAttributes = (attributes.category ?? {}) as any
    const category = {
      id: categoryAttributes.id ?? 0,
      name: categoryAttributes.name ?? 'Autres',
      description: categoryAttributes.description ?? '',
    }

    return {
      id: result.id,
      name: attributes.name ?? 'Produit',
      description: attributes.description ?? '',
      original_price: String(safeOriginal),
      discounted_price: String(safeDiscounted),
      quantity_available: safeQuantity,
      expiration_date: expirationDate,
      image_url: typeof attributes.image_url === 'string' ? attributes.image_url : (attributes.image_url as any as string | undefined),
      discount_percentage: discountPercentage,
      savings: Math.max(0, safeOriginal - safeDiscounted),
      days_until_expiration: Math.max(0, daysUntilExpiration),
      category,
      merchant: {
        id: merchantAttributes.id ?? 0,
        business_name: merchantAttributes.business_name ?? 'Commerçant',
        business_type: merchantAttributes.business_type ?? '',
        city: merchantAttributes.city ?? '',
        address: merchantAttributes.address ?? '',
        phone: merchantAttributes.phone ?? '',
        is_verified: merchantAttributes.is_verified ?? false,
        latitude: merchantAttributes.latitude ?? null,
        longitude: merchantAttributes.longitude ?? null,
      },
      created_at: (attributes.created_at as any as string) ?? new Date().toISOString(),
      is_active: (attributes.is_active as any as boolean) ?? true,
      status: (attributes.status as any as string | undefined) ?? undefined,
      needs_approval: (attributes.needs_approval as any as boolean | undefined) ?? undefined,
    }
  }, [products])

  const mapMerchantResult = useCallback((result: MerchantSearchResult): MerchantEntity => {
    const existingMerchant = merchants.find(merchant => merchant.id === result.id)
    if (existingMerchant) {
      return existingMerchant
    }

    const attributes = result.attributes
    const productsCountRaw = attributes.total_products ?? 0
    const productsCount = Number(productsCountRaw)

    return {
      id: result.id,
      business_name: attributes.business_name ?? 'Commerçant',
      business_type: attributes.business_type ?? '',
      is_verified: Boolean(attributes.is_verified),
      latitude: attributes.latitude ?? null,
      longitude: attributes.longitude ?? null,
      products_count: Number.isFinite(productsCount) ? productsCount : 0,
      user: {
        city: attributes.city ?? '',
        address: attributes.address ?? null,
        phone: '',
      },
    }
  }, [merchants])

  const hasActiveSearch = Boolean(searchQuery.trim())
  const isLoadingMerchants =
    contentMode === 'merchants' && (
      (hasActiveSearch && searchLoading) || (!hasActiveSearch && merchantsLoading)
    )

  // Filtrage des marchands avec gestion distance
  const shouldUseRemoteMerchants = useMemo(
    () => Boolean(
      searchQuery.trim() &&
      remoteMerchantResults &&
      remoteMerchantResults.length > 0 &&
      !distanceEnabled
    ),
    [searchQuery, remoteMerchantResults, distanceEnabled]
  )

  const filteredMerchants = useMemo<MerchantListItem[]>(() => {
    const source = shouldUseRemoteMerchants && remoteMerchantResults
      ? remoteMerchantResults
      : merchants

    return source
      .map(merchant => {
        const distanceInfo = locationService.calculateDistanceFromUser(
          userLocation,
          merchant.latitude ?? null,
          merchant.longitude ?? null
        )

        return { merchant, distanceInfo }
      })
      .filter(({ merchant, distanceInfo }) => {
        const query = searchQuery.trim().toLowerCase()

        if (!shouldUseRemoteMerchants && query) {
          const businessName = merchant.business_name?.toLowerCase() ?? ''
          const city = merchant.user?.city?.toLowerCase() ?? ''
          const type = merchant.business_type?.toLowerCase() ?? ''

          const matchesSearch =
            businessName.includes(query) ||
            city.includes(query) ||
            type.includes(query)

          if (!matchesSearch) {
            return false
          }
        }

        if (selectedCategory !== 'all') {
          const type = merchant.business_type?.toLowerCase() ?? ''
          const matchesCategory =
            (selectedCategory === '1' && type.includes('boulang')) ||
            (selectedCategory === '2' && (type.includes('fruit') || type.includes('legume'))) ||
            (selectedCategory === '3' && (type.includes('viande') || type.includes('boucher'))) ||
            (selectedCategory === '4' && type.includes('epicerie'))

          if (!matchesCategory) {
            return false
          }
        }

        if (distanceEnabled) {
          if (!userLocation || !distanceInfo) {
            return false
          }

          if (distanceInfo.distance > maxDistance) {
            return false
          }
        }

        return true
      })
      .sort((a, b) => {
        if (distanceEnabled) {
          const distanceA = a.distanceInfo?.distance ?? Number.POSITIVE_INFINITY
          const distanceB = b.distanceInfo?.distance ?? Number.POSITIVE_INFINITY
          return distanceA - distanceB
        }

        // Protection null/undefined pour éviter les crashes
        return (a.merchant.business_name ?? '').localeCompare(b.merchant.business_name ?? '')
      })
  }, [
    merchants,
    remoteMerchantResults,
    shouldUseRemoteMerchants,
    searchQuery,
    selectedCategory,
    distanceEnabled,
    maxDistance,
    userLocation,
  ])

  const merchantsWithCoordinates = useMemo(
    () =>
      filteredMerchants.filter(
        item => item.merchant.latitude != null && item.merchant.longitude != null
      ),
    [filteredMerchants]
  )

  const merchantsMapRegion = useMemo(() => {
    if (merchantsWithCoordinates.length === 0) {
      return {
        latitude: 6.1319,
        longitude: 1.2228,
        latitudeDelta: 0.1,
        longitudeDelta: 0.1,
      }
    }

    const latitudes = merchantsWithCoordinates.map(item => item.merchant.latitude as number)
    const longitudes = merchantsWithCoordinates.map(item => item.merchant.longitude as number)

    const minLat = Math.min(...latitudes)
    const maxLat = Math.max(...latitudes)
    const minLon = Math.min(...longitudes)
    const maxLon = Math.max(...longitudes)

    const latitudeDelta = Math.max((maxLat - minLat) * 1.5, 0.02)
    const longitudeDelta = Math.max((maxLon - minLon) * 1.5, 0.02)

    return {
      latitude: (minLat + maxLat) / 2,
      longitude: (minLon + maxLon) / 2,
      latitudeDelta,
      longitudeDelta,
    }
  }, [merchantsWithCoordinates])

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    // Recharger les données quand on change de mode
    loadData()
  }, [contentMode])

  useEffect(() => {
    const initLocation = async () => {
      try {
        const hasPermission = await locationService.hasLocationPermission()
        setLocationPermissionGranted(hasPermission)

        if (hasPermission) {
          const position = await locationService.getCurrentPosition()
          if (position) {
            setUserLocation(position)
          }
        }
      } catch (error) {
        console.error('Erreur initialisation géolocalisation (produits):', error)
      }
    }

    initLocation()
  }, [])

  // BUG FIX #23: Reset user location after logout to prevent stale location data
  useEffect(() => {
    if (!isAuthenticated && userLocation !== null) {
      setUserLocation(null)
      setLocationPermissionGranted(false)
      setDistanceEnabled(false)
    }
  }, [isAuthenticated, userLocation])

  const loadData = async (force = false) => {
    try {
      // Éviter les appels réseaux inutiles si les données sont déjà en mémoire
      if (!force) {
        if (contentMode === 'merchants') {
          if (merchants.length > 0 && categories.length > 0) {
            return
          }
        } else {
          if (products.length > 0 && categories.length > 0) {
            return
          }
        }
      }

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

    } catch (error) {
      console.error('❌ Error loading data:', error)
    }
  }

  const onRefresh = async () => {
    setRefreshing(true)
    await loadData(true)
    setRefreshing(false)
  }

  const ensureUserLocation = async (promptUser: boolean = true, useFastLocation: boolean = false): Promise<boolean> => {
    try {
      if (!locationPermissionGranted) {
        if (!promptUser) {
          const hasPermission = await locationService.hasLocationPermission()
          setLocationPermissionGranted(hasPermission)
          if (!hasPermission) {
            return false
          }
        } else {
          setIsRequestingLocation(true)
          const granted = await locationService.requestLocationPermission()
          setLocationPermissionGranted(granted)
          if (!granted) {
            return false
          }
        }
      }

      // Utiliser la dernière position connue si disponible (instantané)
      const position = await locationService.getCurrentPosition(useFastLocation)
      if (position) {
        setUserLocation(position)
      }

      return true
    } catch (error) {
      console.error('Erreur récupération localisation:', error)
      return false
    } finally {
      if (promptUser) {
        setIsRequestingLocation(false)
      }
    }
  }

  // Toggle distance filter on/off directly
  const handleDistanceToggle = async () => {
    // Protection contre les taps multiples pendant le chargement
    if (isRequestingLocation) {
      return
    }

    if (distanceEnabled) {
      // Désactiver directement
      setDistanceEnabled(false)
      return
    }

    // Activer le filtre
    if (!locationPermissionGranted) {
      Alert.alert(
        'Autorisation requise',
        "Activez la géolocalisation pour afficher les commerces proches de vous.",
        [
          { text: 'Annuler', style: 'cancel' },
          {
            text: 'Autoriser',
            onPress: async () => {
              const granted = await ensureUserLocation(true, true) // useFastLocation = true
              if (granted) {
                setDistanceEnabled(true)
              } else {
                Alert.alert('Géolocalisation inactive', "Impossible d'activer le filtre distance sans accès à votre position.")
              }
            },
          },
        ]
      )
      return
    }

    // Utiliser la dernière position connue si on l'a déjà
    if (userLocation) {
      setDistanceEnabled(true)
      return
    }

    // Sinon, récupérer la position (avec priorité à la dernière connue)
    setIsRequestingLocation(true)
    try {
      const ok = await ensureUserLocation(false, true) // useFastLocation = true pour être rapide
      if (ok) {
        setDistanceEnabled(true)
      } else {
        Alert.alert('Géolocalisation inactive', "Impossible d'activer le filtre distance sans accès à votre position.")
      }
    } finally {
      setIsRequestingLocation(false)
    }
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

  useEffect(() => {
    const query = searchQuery.trim()

    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current)
    }

    if (!query) {
      if (remoteMerchantResults) {
        setRemoteMerchantResults(null)
      }
      setSearchError(null)
      setSearchLoading(false)
      searchRequestIdRef.current += 1
      return
    }

    const requestId = searchRequestIdRef.current + 1
    searchRequestIdRef.current = requestId

    searchDebounceRef.current = setTimeout(async () => {
      setSearchLoading(true)
      setSearchError(null)

      try {
        const response = await searchService.search({
          query,
          perPage: 20,
          type: 'merchants',
        })

        if (searchRequestIdRef.current !== requestId) {
          return
        }

        if (response.meta.type === 'merchants') {
          const merchantsResults = response.data
            .filter((item): item is MerchantSearchResult => item.type === 'merchants')
            .map(mapMerchantResult)
          setRemoteMerchantResults(merchantsResults)
        } else {
          const productsResults = response.data
            .filter((item): item is ProductSearchResult => item.type === 'products')
            .map(mapProductResult)
          setRemoteProductResults(productsResults)
        }
      } catch (error) {
        if (searchRequestIdRef.current !== requestId) {
          return
        }

        console.error('Erreur lors de la recherche distante:', error)
        setRemoteProductResults(null)
        setRemoteMerchantResults(null)
        setSearchError(error instanceof Error ? error.message : 'Recherche indisponible pour le moment.')
      } finally {
        if (searchRequestIdRef.current === requestId) {
          setSearchLoading(false)
        }
      }
    }, Platform.OS === 'web' ? 200 : 350)

    // Cleanup function: annuler le debounce timeout si le composant unmount ou si searchQuery change
    return () => {
      if (searchDebounceRef.current) {
        clearTimeout(searchDebounceRef.current)
      }
    }
  }, [
    searchQuery,
    contentMode,
    mapMerchantResult,
    mapProductResult,
    // NOTE: remoteMerchantResults et remoteProductResults retirés car ils sont
    // des OUTPUTS de ce useEffect, pas des inputs. Les inclure causait une boucle infinie.
  ])

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

  const renderLoadingState = (label: string) => (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color={theme.colors.primary[500]} />
      <Typography variant="body" color="secondary" style={styles.loadingMessage}>
        {label}
      </Typography>
    </View>
  )

  const renderMerchantCard = ({ merchant, distanceInfo }: MerchantListItem) => {
    // Priorité: photo_url du merchant > logo_url > user.photo_url > emoji fallback
    const merchantImageUrl = merchant.photo_url || merchant.logo_url || merchant.user?.photo_url
    const hasRating = merchant.average_rating != null && merchant.average_rating > 0

    return (
      <TouchableOpacity
        onPress={() => {
          navigation.navigate('MerchantDetail', { merchantId: merchant.id })
        }}
        activeOpacity={0.7}
      >
        <Card variant="elevated" style={styles.merchantCard} contentStyle={styles.merchantCardContent}>
          {/* Image Container */}
          <View style={styles.merchantImageContainer}>
            {merchantImageUrl ? (
              <Image
                source={{ uri: getImageUrl(merchantImageUrl) }}
                style={styles.merchantImage}
                contentFit="cover"
                transition={200}
              />
            ) : (
              <View style={styles.merchantImagePlaceholder}>
                <Text style={styles.merchantEmoji}>{getMerchantEmoji(merchant.business_type)}</Text>
              </View>
            )}

            {/* Badge nombre de produits */}
            {merchant.products_count > 0 && (
              <View style={styles.productCountBadge}>
                <Badge variant="primary" size="sm" style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
                  <Ionicons name="basket" size={12} color={theme.colors.textInverse} />
                  <Typography variant="caption" weight="bold" style={{ color: theme.colors.textInverse, fontSize: 11 }}>
                    {merchant.products_count}
                  </Typography>
                </Badge>
              </View>
            )}
          </View>

          {/* Info Container */}
          <View style={styles.merchantInfo}>
            {/* Header: Nom + Badge vérifié */}
            <View style={styles.merchantHeader}>
              <Typography variant="body" weight="bold" numberOfLines={1} style={styles.merchantName}>
                {merchant.business_name}
              </Typography>
              {merchant.is_verified && (
                <Ionicons name="checkmark-circle" size={16} color={theme.colors.success} />
              )}
            </View>

            {/* Type de commerce */}
            <Typography variant="caption" color="secondary" numberOfLines={1} style={{ marginBottom: 2 }}>
              {merchant.business_type}
            </Typography>

            {/* Note et avis */}
            {hasRating ? (
              <View style={styles.ratingRow}>
                <Ionicons name="star" size={14} color="#F59E0B" />
                <Typography variant="caption" weight="semibold" style={{ marginLeft: 4 }}>
                  {merchant.average_rating?.toFixed(1)}
                </Typography>
                {merchant.reviews_count != null && merchant.reviews_count > 0 && (
                  <Typography variant="caption" color="secondary" style={{ marginLeft: 4 }}>
                    | {merchant.reviews_count} avis
                  </Typography>
                )}
              </View>
            ) : (
              <View style={styles.ratingRow}>
                <Ionicons name="star-outline" size={14} color={theme.colors.textTertiary} />
                <Typography variant="caption" color="tertiary" style={{ marginLeft: 4 }}>
                  Pas encore d'avis
                </Typography>
              </View>
            )}

            {/* Location + Distance */}
            <View style={styles.locationRow}>
              <Ionicons name="location" size={14} color={theme.colors.textSecondary} />
              <Typography variant="caption" color="secondary" numberOfLines={1} style={{ marginLeft: 4, flex: 1 }}>
                {merchant.user?.city || 'Ville'}
              </Typography>
              {distanceInfo && (
                <View style={styles.distanceInline}>
                  <Ionicons name="navigate" size={12} color={theme.colors.primary[500]} />
                  <Typography variant="caption" weight="medium" color="primary" style={{ marginLeft: 2 }}>
                    {distanceInfo.formatted}
                  </Typography>
                </View>
              )}
            </View>

            {/* Produits disponibles */}
            {merchant.products_count > 0 && (
              <Typography variant="caption" weight="semibold" color="primary" style={{ marginTop: 4 }}>
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
    // Protection contre division par zéro pour produits gratuits/invalides
    const discountPercent = originalPrice > 0
      ? Math.round(((originalPrice - discountedPrice) / originalPrice) * 100)
      : 0

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
              placeholder={{ uri: getCategoryPlaceholder(product.category?.name) }}
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
                  <Typography variant="caption" weight="bold" style={{ color: theme.colors.error, fontSize: 11 }}>
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

  // Prepare map markers from merchants with coordinates
  const mapMarkers: MapMarker[] = useMemo(() => {
    return merchantsWithCoordinates.map(({ merchant }) => ({
      id: merchant.id,
      latitude: merchant.latitude as number,
      longitude: merchant.longitude as number,
      title: merchant.business_name,
      subtitle: merchant.business_type || merchant.user?.city,
      emoji: getMerchantEmoji(merchant.business_type || ''),
    }))
  }, [merchantsWithCoordinates])

  const handleMapMarkerPress = (merchantId: number) => {
    navigation.navigate('MerchantDetail', { merchantId })
  }

  const renderMerchantsMap = () => {
    if (Platform.OS === 'web') {
      return (
        <View style={styles.mapFallback}>
          <Ionicons name="map" size={28} color={theme.colors.primary[500]} />
          <Typography variant="body" weight="semibold" style={{ marginTop: theme.spacing.sm, textAlign: 'center' }}>
            La carte est disponible sur l'application mobile.
          </Typography>
        </View>
      )
    }

    if (merchantsWithCoordinates.length === 0) {
      return (
        <View style={styles.mapFallback}>
          <Ionicons name="location-outline" size={28} color={theme.colors.neutral[400]} />
          <Typography variant="body" color="secondary" style={{ marginTop: theme.spacing.sm, textAlign: 'center' }}>
            Aucun commerçant géolocalisé ne correspond à vos filtres pour le moment.
          </Typography>
        </View>
      )
    }

    // OpenStreetMap with Leaflet.js
    return (
      <View style={styles.mapWrapper}>
        <OpenStreetMap
          markers={mapMarkers}
          height={360}
          onMarkerPress={handleMapMarkerPress}
          initialRegion={
            userLocation
              ? { latitude: userLocation.latitude, longitude: userLocation.longitude, zoom: 13 }
              : undefined
          }
        />
      </View>
    )
  }

  const styles = createStyles(theme)

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <View style={styles.viewToggle}>
          <TouchableOpacity
            style={[styles.toggleButton, contentMode === 'merchants' && styles.toggleButtonActive]}
            onPress={() => setContentMode('merchants')}
          >
            <Ionicons
              name="storefront"
              size={20}
              color={contentMode === 'merchants'
                ? theme.colors.interactiveTextActive
                : theme.colors.interactiveText}
            />
            <Typography
              variant="caption"
              weight={contentMode === 'merchants' ? 'semibold' : 'regular'}
              style={{
                color: contentMode === 'merchants'
                  ? theme.colors.interactiveTextActive
                  : theme.colors.interactiveText,
              }}
            >
              Boutiques
            </Typography>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.toggleButton, contentMode === 'map' && styles.toggleButtonActive]}
            onPress={() => setContentMode('map')}
          >
            <Ionicons
              name="map"
              size={20}
              color={contentMode === 'map'
                ? theme.colors.interactiveTextActive
                : theme.colors.interactiveText}
            />
            <Typography
              variant="caption"
              weight={contentMode === 'map' ? 'semibold' : 'regular'}
              style={{
                color: contentMode === 'map'
                  ? theme.colors.interactiveTextActive
                  : theme.colors.interactiveText,
              }}
            >
              Carte
            </Typography>
          </TouchableOpacity>
        </View>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={theme.colors.textSecondary} />
        <TextInput
          style={styles.searchInput}
          placeholder={
            contentMode === 'merchants'
              ? "Boutique, ville, type"
              : "Produit, boutique, ville"
          }
          placeholderTextColor={theme.colors.textTertiary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {hasActiveSearch && searchLoading && !searchError && (
        <Typography variant="caption" color="secondary" style={styles.searchStatus}>
          Recherche en cours...
        </Typography>
      )}

      {searchError && (
        <Typography
          variant="caption"
          style={[styles.searchStatus, { color: theme.colors.error }]}
        >
          {searchError}
        </Typography>
      )}

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
            <Text
              style={[
                styles.categoryEmoji,
                selectedCategory === 'all' && styles.categoryEmojiActive,
              ]}
            >
              🛍️
            </Text>
            <Typography
              variant="caption"
              weight="medium"
              style={[
                styles.categoryChipLabel,
                selectedCategory === 'all' && styles.categoryChipLabelActive,
              ]}
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
              <Text
                style={[
                  styles.categoryEmoji,
                  selectedCategory === category.id.toString() && styles.categoryEmojiActive,
                ]}
              >
                {getCategoryEmoji(category.name)}
              </Text>
              <Typography
                variant="caption"
                weight="medium"
                style={[
                  styles.categoryChipLabel,
                  selectedCategory === category.id.toString() && styles.categoryChipLabelActive,
                ]}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {category.name}
              </Typography>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {contentMode === 'merchants' && (
        <View style={styles.distanceRow}>
          {/* Quand désactivé: toute la barre est cliquable pour activer */}
          {!distanceEnabled ? (
            <TouchableOpacity
              style={[styles.filterChip, isRequestingLocation && { opacity: 0.6 }]}
              onPress={handleDistanceToggle}
              disabled={isRequestingLocation}
              activeOpacity={0.7}
            >
              <Ionicons
                name="location"
                size={16}
                color={theme.colors.textSecondary}
              />
              <Typography
                variant="caption"
                weight="medium"
                style={{ flex: 1, color: theme.colors.interactiveText }}
              >
                {isRequestingLocation ? 'Localisation...' : 'Filtrer par distance'}
              </Typography>
              <Ionicons
                name="toggle-outline"
                size={24}
                color={theme.colors.textSecondary}
              />
            </TouchableOpacity>
          ) : (
            /* Quand activé: texte pour options, toggle pour désactiver */
            <View style={[styles.filterChip, styles.filterChipActive]}>
              <Ionicons
                name="location"
                size={16}
                color={theme.colors.interactiveTextActive}
              />
              {/* Tap sur le texte pour changer la distance */}
              <TouchableOpacity
                onPress={handleDistanceOptionsPress}
                style={{ flex: 1 }}
              >
                <Typography
                  variant="caption"
                  weight="semibold"
                  style={{ color: theme.colors.interactiveTextActive }}
                >
                  {`< ${maxDistance} km`}
                </Typography>
              </TouchableOpacity>
              {/* Tap sur le toggle pour désactiver */}
              <TouchableOpacity
                onPress={handleDistanceToggle}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              >
                <Ionicons
                  name="toggle"
                  size={24}
                  color={theme.colors.interactiveTextActive}
                />
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}

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
                  color={maxDistance === 5 ? 'primary' : 'primary'}
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
                  color={maxDistance === 10 ? 'primary' : 'primary'}
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
                  color={maxDistance === 20 ? 'primary' : 'primary'}
                >
                  {'< 20 KM'}
                </Typography>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Compteur de résultats */}
      {filteredMerchants.length > 0 && (
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
      )}

      {/* Liste conditionnelle selon mode */}
      {contentMode === 'map' ? (
        isLoadingMerchants ? (
          renderLoadingState('Chargement de la carte…')
        ) : (
          renderMerchantsMap()
        )
      ) : (
        isLoadingMerchants ? (
          renderLoadingState(hasActiveSearch ? 'Recherche des boutiques…' : 'Chargement des boutiques…')
        ) : filteredMerchants.length > 0 ? (
          <FlatList
            key="merchants-list"
            data={filteredMerchants}
            renderItem={({ item }) => renderMerchantCard(item)}
            keyExtractor={(item) => `merchant-${item.merchant.id}`}
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
              {searchError
                ? searchError
                : hasActiveSearch
                  ? `Aucun résultat pour "${searchQuery}"`
                  : 'Essayez de changer les filtres ou revenez plus tard'}
            </Typography>
            {(selectedCategory !== 'all' || hasActiveSearch) && (
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
    backgroundColor: theme.colors.interactiveSurface,
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
    backgroundColor: theme.colors.interactiveSurfaceActive,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.interactiveSurface,
    marginHorizontal: theme.spacing.lg,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.radius.xl,
    gap: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.interactiveBorder,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: theme.colors.text,
    paddingVertical: theme.spacing.sm,
  },
  searchTrailingButton: {
    padding: theme.spacing.xs,
    borderRadius: theme.radius.lg,
  },
  searchTrailingButtonDisabled: {
    opacity: 0.4,
  },
  searchStatus: {
    marginHorizontal: theme.spacing.lg,
    marginTop: theme.spacing.xs,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xl,
  },
  loadingMessage: {
    marginTop: theme.spacing.md,
    textAlign: 'center',
  },
  categoriesScroll: {
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.xs,
    maxHeight: 50, // FIX: Hauteur fixe pour éviter que les chips soient coupés
    height: 50, // FIX: Hauteur fixe pour le conteneur
  },
  categoriesContent: {
    paddingHorizontal: theme.spacing.md,
    paddingRight: theme.spacing.lg,
    alignItems: 'center', // FIX: Centre verticalement les chips
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: theme.spacing.sm,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.interactiveSurface,
    borderWidth: 1,
    borderColor: theme.colors.interactiveBorder,
    minHeight: 32,
    height: 32, // FIX: Hauteur fixe pour éviter la déformation
    maxHeight: 32, // FIX: Hauteur maximale pour empêcher l'expansion
  },
  categoryEmoji: {
    fontSize: 14,
    marginRight: 4,
    color: theme.colors.interactiveText,
  },
  categoryEmojiActive: {
    color: theme.colors.interactiveTextActive,
  },
  categoryChipLabel: {
    maxWidth: 120,
    color: theme.colors.interactiveText,
  },
  categoryChipLabelActive: {
    color: theme.colors.interactiveTextActive,
  },
  categoryChipActive: {
    backgroundColor: theme.colors.interactiveSurfaceActive,
    borderColor: theme.colors.interactiveBorderActive,
  },
  distanceRow: {
    paddingHorizontal: theme.spacing.lg,
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.xs,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.interactiveSurface,
    borderWidth: 1,
    borderColor: theme.colors.interactiveBorder,
    gap: theme.spacing.sm,
  },
  filterChipActive: {
    backgroundColor: theme.colors.interactiveSurfaceActive,
    borderColor: theme.colors.interactiveBorderActive,
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
  merchantCard: {
    marginBottom: theme.spacing.sm,
    overflow: 'hidden',
    borderRadius: theme.radius.lg,
  },
  merchantCardContent: {
    flexDirection: 'row',
    padding: 0,
    alignItems: 'stretch', // L'image s'étire pour matcher la hauteur du contenu
  },
  merchantImageContainer: {
    position: 'relative',
    width: 100,
    minWidth: 100,
    // Pas de height - déterminée par stretch du parent flex
  },
  merchantImagePlaceholder: {
    ...StyleSheet.absoluteFillObject, // Remplit tout le container
    backgroundColor: theme.colors.primary[100],
    justifyContent: 'center',
    alignItems: 'center',
  },
  merchantImage: {
    ...StyleSheet.absoluteFillObject, // Remplit tout le container
  },
  merchantEmoji: {
    fontSize: 36,
  },
  productCountBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    zIndex: 1,
  },
  merchantInfo: {
    flex: 1,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    justifyContent: 'center',
  },
  merchantHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  merchantName: {
    flex: 1,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  distanceInline: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
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
  mapWrapper: {
    height: 360,
    marginHorizontal: theme.spacing.lg,
    borderRadius: theme.radius.xl,
    overflow: 'hidden',
    backgroundColor: theme.colors.surface.light,
    ...theme.shadows.md,
    marginBottom: theme.spacing.lg,
  },
  merchantsMap: {
    flex: 1,
  },
  mapFallback: {
    height: 200,
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    borderRadius: theme.radius.xl,
    backgroundColor: theme.colors.surface.light,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.lg,
    ...theme.shadows.sm,
  },
  mapCallout: {
    maxWidth: 220,
    padding: 6,
  },
  mapCalloutTitle: {
    marginBottom: 4,
  },
  mapCalloutLink: {
    marginTop: 6,
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

export default ProductsScreen
