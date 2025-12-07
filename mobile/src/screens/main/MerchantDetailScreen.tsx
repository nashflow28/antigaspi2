import React, { useEffect, useMemo, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Dimensions,
  Alert,
  Linking,
  Share,
  Platform,
} from 'react-native'
import { useDispatch, useSelector } from 'react-redux'
import { AppDispatch, RootState } from '../../store'
import { fetchProducts } from '../../store/slices/productsSlice'
import { fetchMerchants } from '../../store/slices/merchantsSlice'
import { fetchReviews, fetchReviewStats } from '../../store/slices/reviewsSlice'
import StarRating from '../../components/reviews/StarRating'
import { Ionicons } from '@expo/vector-icons'
import { Image } from 'expo-image'
import { useTheme } from '../../theme'
import { Product, Merchant } from '../../types'
import { getImageUrl } from '../../utils/imageHelpers'
import { formatCurrency } from '../../utils/currencyHelpers'
import { Button, Card, Badge, Typography } from '../../components/2025'
import MapView, { Marker, UrlTile } from 'react-native-maps'
import locationService, { UserLocation } from '../../services/locationService'

const { width } = Dimensions.get('window')

interface Props {
  route: any
  navigation: any
}

const MerchantDetailScreen: React.FC<Props> = ({ route, navigation }) => {
  const theme = useTheme()
  const dispatch = useDispatch<AppDispatch>()
  const { merchantId } = route.params
  const { products } = useSelector((state: RootState) => state.products)
  const { merchants } = useSelector((state: RootState) => state.merchants)
  const { reviews, stats: reviewStats, loading: reviewsLoading } = useSelector((state: RootState) => state.reviews)

  const [merchantProducts, setMerchantProducts] = useState<Product[]>([])
  const [merchant, setMerchant] = useState<Merchant | null>(null)
  const [activeTab, setActiveTab] = useState<'products' | 'info' | 'reviews'>('products')
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null)
  const [locationPermissionGranted, setLocationPermissionGranted] = useState(false)
  const [requestingLocation, setRequestingLocation] = useState(false)
  const [mapExpanded, setMapExpanded] = useState(false)

  // Load reviews when tab changes to reviews
  useEffect(() => {
    if (activeTab === 'reviews' && merchantId) {
      dispatch(fetchReviews({ merchantId }))
      dispatch(fetchReviewStats(merchantId))
    }
  }, [activeTab, merchantId, dispatch])

  // ✅ FIX: Race condition + Memory leak + Undefined access
  useEffect(() => {
    let isMounted = true

    const loadMerchantData = async () => {
      try {
        // 🐛 BUG FIX: unwrap() retourne directement les produits
        const allProducts = await dispatch(fetchProducts({ per_page: 100 })).unwrap()

        if (!isMounted) return

        // Filtrer les produits retournés par le dispatch
        const merchantProds = allProducts.filter((p: any) => p.merchant?.id === merchantId)

        if (merchantProds.length > 0) {
          const firstProduct = merchantProds[0]
          if (firstProduct && firstProduct.merchant) {
            setMerchantProducts(merchantProds)
            setMerchant(firstProduct.merchant)
          }
        } else {
          // 🐛 BUG FIX: Si aucun produit, essayer de récupérer le marchand depuis le store merchants
          if (isMounted) {
            console.log('⚠️ No products found for merchant', merchantId, '- Trying to load from merchants store')

            // Essayer de charger les marchands si pas déjà en mémoire
            if (merchants.length === 0) {
              await dispatch(fetchMerchants()).unwrap()
            }

            // Chercher le marchand dans le store
            const foundMerchant = merchants.find(m => m.id === merchantId)

            if (foundMerchant && isMounted) {
              // Mapper le type Merchant du store vers le type attendu
              setMerchant({
                id: foundMerchant.id,
                business_name: foundMerchant.business_name,
                business_type: foundMerchant.business_type,
                city: foundMerchant.user?.city || '',
                address: foundMerchant.user?.address || '',
                phone: foundMerchant.user?.phone || '',
                is_verified: foundMerchant.is_verified,
                latitude: foundMerchant.latitude,
                longitude: foundMerchant.longitude,
              })
              setMerchantProducts([]) // Pas de produits disponibles
            } else if (isMounted) {
              // Marchand vraiment introuvable
              Alert.alert(
                'Marchand introuvable',
                'Ce marchand n\'existe pas ou a été supprimé.',
                [{ text: 'Retour', onPress: () => navigation.goBack() }]
              )
            }
          }
        }
      } catch (error) {
        console.error('❌ Error loading merchant data:', error)
        if (isMounted) {
          // Ne pas faire goBack() directement, laisser l'utilisateur voir l'erreur et décider
          Alert.alert(
            'Erreur',
            'Impossible de charger les données du marchand. Veuillez réessayer.',
            [{ text: 'Retour', onPress: () => navigation.goBack() }]
          )
        }
      }
    }

    loadMerchantData()

    // ✅ Cleanup pour éviter memory leak
    return () => {
      isMounted = false
    }
  }, [merchantId, dispatch, navigation, merchants]) // Include merchants to access the store

  useEffect(() => {
    const initLocation = async () => {
      try {
        const hasPermission = await locationService.hasLocationPermission()
        if (hasPermission) {
          setLocationPermissionGranted(true)
          const position = await locationService.getCurrentPosition()
          if (position) {
            setUserLocation(position)
          }
        }
      } catch (error) {
        console.error('Erreur initialisation géolocalisation (merchant detail):', error)
      }
    }

    initLocation()
  }, [])

  const ensureUserLocation = async () => {
    try {
      setRequestingLocation(true)
      const granted = await locationService.requestLocationPermission()
      setLocationPermissionGranted(granted)

      if (granted) {
        const position = await locationService.getCurrentPosition()
        if (position) {
          setUserLocation(position)
        }
      } else {
        Alert.alert('Permission requise', 'Activez la géolocalisation pour afficher votre position sur la carte.')
      }
    } catch (error) {
      Alert.alert('Erreur', "Impossible de récupérer votre position pour le moment.")
    } finally {
      setRequestingLocation(false)
    }
  }

  const toggleMapSize = async () => {
    if (!locationPermissionGranted && !userLocation) {
      await ensureUserLocation()
    }
    setMapExpanded(prev => !prev)
  }

  const mapRegion = useMemo(() => {
    if (merchant?.latitude != null && merchant?.longitude != null) {
      return {
        latitude: merchant.latitude,
        longitude: merchant.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }
    }
    return null
  }, [merchant?.latitude, merchant?.longitude])

  // Emoji dynamique basé sur le nom du marchand
  const getMerchantEmoji = (businessName: string) => {
    const name = businessName.toLowerCase()
    if (name.includes('boulang')) return '🥐'
    if (name.includes('fruit') || name.includes('bio')) return '🥕'
    if (name.includes('viande') || name.includes('boucher')) return '🥩'
    if (name.includes('poisson')) return '🐟'
    if (name.includes('fromage')) return '🧀'
    return '🛍️'
  }

  // ✅ FIX: Create styles BEFORE using them
  const styles = createStyles(theme)

  if (!merchant) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Typography variant="body">Chargement...</Typography>
      </View>
    )
  }

  const renderProductCard = (product: Product) => {
    // ✅ FIX: Fallback pour éviter NaN si discounted_price invalide
    const discountedPrice = Math.round(parseFloat(product.discounted_price) || 0)
    const isOutOfStock = product.quantity_available === 0

    return (
      <TouchableOpacity
        key={product.id}
        onPress={() => navigation.navigate('ProductDetails', { productId: product.id })}
      >
        <Card variant="elevated" style={{ width: 160, overflow: 'hidden' }}>
          <Image
            source={{ uri: getImageUrl(product.image_url) }}
            style={styles.productImage}
            contentFit="cover"
          />
          {isOutOfStock && (
            <View style={styles.soldOutBadge}>
              <Badge variant="error" size="sm" style={{ width: '100%' }}>
                Victime de son succès
              </Badge>
            </View>
          )}
          <View style={styles.productCardInfo}>
            <Typography variant="body" weight="semibold" numberOfLines={1} style={{ marginBottom: 4 }}>
              {product.name}
            </Typography>
            <Typography variant="h4" weight="bold" color="primary">
              {formatCurrency(discountedPrice)}
            </Typography>
          </View>
        </Card>
      </TouchableOpacity>
    )
  }

  // ✅ ÉTAPE 3: Contact Handlers (Fixed with error handling)
  const handleCall = async () => {
    if (!merchant?.phone) {
      Alert.alert('Téléphone non disponible', 'Ce marchand n\'a pas renseigné de numéro de téléphone.')
      return
    }

    try {
      const url = `tel:${merchant.phone}`
      const canOpen = await Linking.canOpenURL(url)
      if (canOpen) {
        await Linking.openURL(url)
      } else {
        Alert.alert('Erreur', 'Impossible d\'appeler depuis cet appareil.')
      }
    } catch (error) {
      Alert.alert('Erreur', 'Une erreur est survenue lors de l\'appel.')
    }
  }

  const handleMessage = () => {
    if (!merchant) {
      Alert.alert('Marchand introuvable', 'Impossible de démarrer la conversation pour le moment.')
      return
    }

    navigation.navigate('MerchantMessaging', {
      merchantId,
      merchantName: merchant.business_name,
    })
  }

  const handleDirections = async () => {
    if (!merchant) return

    const { latitude, longitude, address, city } = merchant
    const destination =
      latitude != null && longitude != null
        ? `${latitude},${longitude}`
        : encodeURIComponent(`${address || ''} ${city}`.trim())

    if (!destination) {
      Alert.alert('Adresse indisponible', "Ce marchand n'a pas encore renseigné son adresse complète.")
      return
    }

    const url = `https://www.google.com/maps/dir/?api=1&destination=${destination}`
    const supported = await Linking.canOpenURL(url)
    if (supported) {
      await Linking.openURL(url)
    } else {
      Alert.alert('Erreur', "Impossible d'ouvrir l'application de navigation.")
    }
  }

  const handleShare = async () => {
    if (!merchant) return

    const { business_name, address, city, latitude, longitude } = merchant
    const mapsLink = latitude != null && longitude != null
      ? `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`
      : address
        ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${address} ${city}`)}`
        : null

    const message = [
      `Découvrez ${business_name} sur Antigaspi !`,
      address ? `${address}, ${city}` : city,
      mapsLink || undefined,
    ]
      .filter(Boolean)
      .join('\n')

    try {
      await Share.share({
        title: business_name,
        message,
      })
    } catch (error) {
      Alert.alert('Erreur', 'Le partage a échoué, veuillez réessayer plus tard.')
    }
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Map Section */}
      <View style={[styles.mapContainer, mapExpanded && styles.mapContainerExpanded]}>
        {Platform.OS === 'web' || !mapRegion ? (
          <View style={styles.mapPlaceholder}>
            <Ionicons name="location" size={48} color={theme.colors.error} />
            <Typography variant="body" weight="semibold" style={{ marginTop: theme.spacing.sm }}>
              Carte interactive
            </Typography>
            <Typography
              variant="caption"
              color="secondary"
              style={{ marginTop: 4, textAlign: 'center', paddingHorizontal: theme.spacing.lg }}
            >
              {merchant.address}, {merchant.city}
            </Typography>
            {!mapRegion && (
              <Typography variant="caption" color="secondary" style={{ marginTop: theme.spacing.md, textAlign: 'center' }}>
                La localisation précise de ce marchand sera bientôt disponible.
              </Typography>
            )}
          </View>
        ) : (
          <MapView
            style={[styles.mapView, mapExpanded && styles.mapViewExpanded]}
            initialRegion={mapRegion}
            showsUserLocation={locationPermissionGranted && !!userLocation}
            showsMyLocationButton={false}
            mapType={Platform.OS === 'android' ? 'none' : 'standard'}
          >
            {/* OpenStreetMap Tiles */}
            <UrlTile
              urlTemplate="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
              maximumZ={19}
              flipY={false}
              tileSize={256}
            />
            <Marker
              coordinate={{ latitude: mapRegion.latitude, longitude: mapRegion.longitude }}
              title={merchant.business_name}
              description={merchant.address || merchant.city}
            />
            {userLocation && (
              <Marker
                coordinate={{ latitude: userLocation.latitude, longitude: userLocation.longitude }}
                title="Vous"
                pinColor={theme.colors.primary[500]}
              />
            )}
          </MapView>
        )}

        {/* Header buttons */}
        <View style={styles.headerButtons}>
          <TouchableOpacity style={styles.headerButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.textInverse} />
          </TouchableOpacity>
          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.headerButton} onPress={handleShare}>
              <Ionicons name="share-social" size={24} color={theme.colors.textInverse} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerButton}>
              <Ionicons name="heart-outline" size={24} color={theme.colors.textInverse} />
            </TouchableOpacity>
          </View>
        </View>

        {mapRegion && Platform.OS !== 'web' && (
          <View style={styles.mapActions}>
            <TouchableOpacity style={styles.mapActionButton} onPress={toggleMapSize}>
              <Ionicons
                name={mapExpanded ? 'contract' : 'expand'}
                size={18}
                color={theme.colors.textInverse}
              />
              <Typography variant="caption" style={{ color: theme.colors.textInverse, marginLeft: 6 }}>
                {mapExpanded ? 'Réduire' : 'Agrandir'}
              </Typography>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.mapActionButton}
              onPress={ensureUserLocation}
              disabled={requestingLocation}
            >
              <Ionicons name="locate" size={18} color={theme.colors.textInverse} />
              <Typography variant="caption" style={{ color: theme.colors.textInverse, marginLeft: 6 }}>
                {requestingLocation ? 'Chargement…' : 'Ma position'}
              </Typography>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Merchant Info Card */}
        <View style={styles.merchantCard}>
          <View style={styles.merchantHeader}>
            <View style={styles.merchantLogo}>
              <Text style={styles.logoEmoji}>{getMerchantEmoji(merchant.business_name)}</Text>
            </View>
            <View style={styles.merchantInfo}>
              <Typography variant="h3" weight="bold" style={{ marginBottom: 4 }}>
                {merchant.business_name}
              </Typography>
              <Typography variant="caption" color="secondary">
                {merchant.city} • {merchant.business_type}
              </Typography>
            </View>
          </View>

          <Typography variant="body" color="secondary" style={{ lineHeight: 20, marginBottom: theme.spacing.md }}>
            {merchant.business_name.includes('Boulangerie')
              ? 'Boulangerie artisanale proposant du pain frais et des pâtisseries fait maison. Venez découvrir nos spécialités locales et profiter de nos offres anti-gaspi !'
              : merchant.business_name.includes('Bio')
              ? 'Produits biologiques et locaux. Nous sélectionnons les meilleurs produits pour vous permettre de manger sainement tout en luttant contre le gaspillage.'
              : `${merchant.business_name} vous propose des produits de qualité à prix réduits. Profitez de nos offres anti-gaspi et contribuez à la lutte contre le gaspillage alimentaire !`}
          </Typography>

          {/* Info Pills */}
          <View style={styles.infoPills}>
            <View style={styles.pill}>
              <Ionicons name="time-outline" size={16} color={theme.colors.text} />
              <Typography variant="caption" weight="medium" style={{ fontSize: 13 }}>
                8h - 19h
              </Typography>
            </View>
            <View style={styles.pill}>
              <Ionicons name="location-outline" size={16} color={theme.colors.text} />
              <Typography variant="caption" weight="medium" style={{ fontSize: 13 }}>
                {merchant.city}
              </Typography>
            </View>
            <View style={styles.pill}>
              <Ionicons name="card-outline" size={16} color={theme.colors.text} />
              <Typography variant="caption" weight="medium" style={{ fontSize: 13 }}>
                CB • Cash
              </Typography>
            </View>
          </View>
        </View>

        {/* Tabs Navigation */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'products' && styles.tabActive]}
            onPress={() => setActiveTab('products')}
          >
            <Ionicons
              name="storefront"
              size={20}
              color={activeTab === 'products' ? theme.colors.primary[600] : theme.colors.textSecondary}
            />
            <Typography
              variant="body"
              weight="semibold"
              style={{
                fontSize: 14,
                color: activeTab === 'products' ? theme.colors.textInverse : theme.colors.textSecondary,
              }}
            >
              Produits
            </Typography>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'info' && styles.tabActive]}
            onPress={() => setActiveTab('info')}
          >
            <Ionicons
              name="information-circle"
              size={20}
              color={activeTab === 'info' ? theme.colors.primary[600] : theme.colors.textSecondary}
            />
            <Typography
              variant="body"
              weight="semibold"
              style={{
                fontSize: 14,
                color: activeTab === 'info' ? theme.colors.textInverse : theme.colors.textSecondary,
              }}
            >
              Infos
            </Typography>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'reviews' && styles.tabActive]}
            onPress={() => setActiveTab('reviews')}
          >
            <Ionicons
              name="star"
              size={20}
              color={activeTab === 'reviews' ? theme.colors.primary[600] : theme.colors.textSecondary}
            />
            <Typography
              variant="body"
              weight="semibold"
              style={{
                fontSize: 14,
                color: activeTab === 'reviews' ? theme.colors.textInverse : theme.colors.textSecondary,
              }}
            >
              Avis
            </Typography>
          </TouchableOpacity>
        </View>

        {/* Tab Content - Products */}
        {activeTab === 'products' && (
          <View style={styles.productsSection}>
          <View style={styles.sectionHeader}>
            <Typography variant="h4" weight="bold">
              Produits disponibles
            </Typography>
            <Badge variant="primary" size="sm">
              {merchantProducts.filter(p => p.quantity_available > 0).length} disponible{merchantProducts.filter(p => p.quantity_available > 0).length > 1 ? 's' : ''}
            </Badge>
          </View>
          {merchantProducts.length > 0 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.productsScroll}
            >
              {merchantProducts.map(product => renderProductCard(product))}
            </ScrollView>
          ) : (
            <View style={styles.emptyProducts}>
              <Typography variant="body" color="secondary" style={{ textAlign: 'center' }}>
                Aucun produit disponible pour le moment
              </Typography>
            </View>
          )}
          </View>
        )}

        {/* Tab Content - Info */}
        {activeTab === 'info' && (
          <View>
            {/* Address Section */}
            <View style={styles.addressSection}>
          <Typography variant="h4" weight="bold" style={{ paddingHorizontal: theme.spacing.lg, marginBottom: theme.spacing.md }}>
            Adresse
          </Typography>
          <View style={[styles.addressCard, { marginHorizontal: theme.spacing.lg }]}>
            <Ionicons name="location" size={24} color={theme.colors.primary[500]} />
            <View style={styles.addressInfo}>
              <Typography variant="body" weight="semibold" style={{ marginBottom: 4 }}>
                {merchant.address}
              </Typography>
              <Typography variant="caption" color="secondary">
                {merchant.city}
              </Typography>
            </View>
            <TouchableOpacity style={styles.directionButton} onPress={handleDirections}>
              <Ionicons name="navigate" size={20} color={theme.colors.primary[500]} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Payment Methods */}
        <View style={styles.paymentSection}>
          <Typography variant="h4" weight="bold" style={{ paddingHorizontal: theme.spacing.lg, marginBottom: theme.spacing.md }}>
            Moyens de paiement acceptés
          </Typography>
          <View style={[styles.paymentMethods, { paddingHorizontal: theme.spacing.lg }]}>
            <View style={styles.paymentCard}>
              <Ionicons name="card" size={24} color={theme.colors.primary[500]} />
              <Typography variant="caption" weight="medium" style={{ fontSize: 11, textAlign: 'center' }}>
                Carte bancaire
              </Typography>
            </View>
            <View style={styles.paymentCard}>
              <Ionicons name="cash" size={24} color={theme.colors.success} />
              <Typography variant="caption" weight="medium" style={{ fontSize: 11, textAlign: 'center' }}>
                Espèces
              </Typography>
            </View>
            <View style={styles.paymentCard}>
              <Ionicons name="phone-portrait" size={24} color={theme.colors.primary[500]} />
              <Typography variant="caption" weight="medium" style={{ fontSize: 11, textAlign: 'center' }}>
                Mobile Money
              </Typography>
            </View>
          </View>
            </View>
          </View>
        )}

        {/* Tab Content - Reviews */}
        {activeTab === 'reviews' && (
          <View style={styles.reviewsContainer}>
            {/* Header with stats */}
            <View style={{ paddingHorizontal: theme.spacing.lg, marginBottom: theme.spacing.md }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h4" weight="bold">
                  Avis clients
                </Typography>
                <Button
                  variant="primary"
                  size="sm"
                  onPress={() => navigation.navigate('AddReview', {
                    merchantId,
                    merchantName: merchant?.business_name || 'Commerçant',
                  })}
                  leftIcon={<Ionicons name="create-outline" size={16} color={theme.colors.textInverse} />}
                >
                  Donner un avis
                </Button>
              </View>

              {/* Stats summary */}
              {reviewStats && reviewStats.total_reviews > 0 && (
                <View style={[styles.reviewsStats, { marginTop: theme.spacing.md }]}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <StarRating rating={reviewStats.average_rating} size={20} />
                    <Typography variant="h3" weight="bold">
                      {reviewStats.average_rating.toFixed(1)}
                    </Typography>
                  </View>
                  <Typography variant="caption" color="secondary">
                    {reviewStats.total_reviews} avis
                  </Typography>
                </View>
              )}
            </View>

            {/* Reviews list */}
            <View style={{ paddingHorizontal: theme.spacing.lg }}>
              {reviewsLoading ? (
                <View style={{ padding: theme.spacing.xl, alignItems: 'center' }}>
                  <Typography variant="body" color="secondary">Chargement des avis...</Typography>
                </View>
              ) : reviews.length === 0 ? (
                <View style={[styles.emptyProducts, { marginTop: theme.spacing.lg }]}>
                  <Ionicons name="star-outline" size={64} color={theme.colors.neutral[300]} />
                  <Typography variant="h4" weight="bold" style={{ marginTop: theme.spacing.lg, marginBottom: theme.spacing.sm }}>
                    Aucun avis pour le moment
                  </Typography>
                  <Typography variant="body" color="secondary" style={{ textAlign: 'center', lineHeight: 20 }}>
                    Soyez le premier à donner votre avis sur ce commerçant !
                  </Typography>
                </View>
              ) : (
                <View style={{ gap: theme.spacing.md }}>
                  {reviews.map((review) => (
                    <Card key={review.id} variant="outline" style={{ padding: theme.spacing.md }}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: theme.spacing.sm }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                          <View style={[styles.reviewAvatar, { backgroundColor: theme.colors.primary[100] }]}>
                            <Typography variant="body" weight="bold" color="primary">
                              {review.user?.name?.charAt(0) || 'U'}
                            </Typography>
                          </View>
                          <View>
                            <Typography variant="body" weight="semibold">
                              {review.user?.name || 'Utilisateur'}
                            </Typography>
                            <Typography variant="caption" color="secondary">
                              {new Date(review.created_at).toLocaleDateString('fr-FR')}
                            </Typography>
                          </View>
                        </View>
                        <StarRating rating={review.rating} size={14} />
                      </View>
                      {review.comment && (
                        <Typography variant="body" color="secondary" style={{ lineHeight: 20 }}>
                          {review.comment}
                        </Typography>
                      )}
                    </Card>
                  ))}
                </View>
              )}
            </View>
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Bottom Contact Bar */}
      <View style={styles.bottomBar}>
        <Button
          variant="primary"
          size="md"
          onPress={handleCall}
          leftIcon={<Ionicons name="call" size={20} color={theme.colors.textInverse} />}
          style={{ flex: 1 }}
        >
          Appeler
        </Button>
        <Button
          variant="secondary"
          size="md"
          onPress={handleMessage}
          leftIcon={<Ionicons name="chatbubble" size={20} color={theme.colors.primary[500]} />}
          style={{ flex: 1 }}
        >
          Message
        </Button>
      </View>
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
  mapContainer: {
    position: 'relative',
    width: '100%',
    height: 250,
  },
  mapContainerExpanded: {
    height: 360,
  },
  mapPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: theme.colors.neutral[200],
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapView: {
    width: '100%',
    height: '100%',
  },
  mapViewExpanded: {
    height: '115%',
  },
  headerButtons: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
  },
  headerButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: theme.colors.primary[500],
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerRight: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  mapActions: {
    position: 'absolute',
    bottom: theme.spacing.md,
    right: theme.spacing.md,
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  mapActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
    backgroundColor: theme.withOpacity(theme.colors.surface.dark, 0.85),
    borderRadius: theme.radius.lg,
  },
  merchantCard: {
    backgroundColor: theme.colors.surface.light,
    marginHorizontal: theme.spacing.lg,
    marginTop: -30,
    borderRadius: theme.radius.xl,
    padding: theme.spacing.lg,
    ...theme.shadows.md,
  },
  merchantHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  merchantLogo: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: theme.colors.primary[100],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  logoEmoji: {
    fontSize: 32,
  },
  merchantInfo: {
    flex: 1,
  },
  infoPills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.neutral[100],
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.radius.full,
    gap: 6,
  },
  productsSection: {
    marginTop: theme.spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  emptyProducts: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.xl,
    alignItems: 'center',
  },
  productsScroll: {
    paddingHorizontal: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  productImage: {
    width: '100%',
    height: 120,
  },
  soldOutBadge: {
    position: 'absolute',
    top: theme.spacing.sm,
    left: theme.spacing.sm,
    right: theme.spacing.sm,
  },
  productCardInfo: {
    padding: theme.spacing.sm,
  },
  addressSection: {
    marginTop: theme.spacing.lg,
  },
  addressCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface.light,
    padding: theme.spacing.md,
    borderRadius: theme.radius.xl,
    gap: theme.spacing.md,
  },
  addressInfo: {
    flex: 1,
  },
  directionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.primary[100],
    justifyContent: 'center',
    alignItems: 'center',
  },
  paymentSection: {
    marginTop: theme.spacing.lg,
  },
  paymentMethods: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  paymentCard: {
    flex: 1,
    backgroundColor: theme.colors.surface.light,
    padding: theme.spacing.md,
    borderRadius: theme.radius.xl,
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  bottomBar: {
    flexDirection: 'row',
    padding: theme.spacing.lg,
    gap: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    backgroundColor: theme.colors.surface.light,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface.light,
    marginHorizontal: theme.spacing.lg,
    marginTop: theme.spacing.lg,
    borderRadius: theme.radius.xl,
    padding: 4,
    gap: 4,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.xs,
    borderRadius: theme.radius.lg,
    gap: 6,
  },
  tabActive: {
    backgroundColor: theme.colors.primary[500],
  },
  reviewsContainer: {
    marginTop: theme.spacing.lg,
  },
  reviewsStats: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: theme.spacing.md,
    backgroundColor: theme.colors.surface.light,
    borderRadius: theme.radius.lg,
  },
  reviewAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
})

export default MerchantDetailScreen

