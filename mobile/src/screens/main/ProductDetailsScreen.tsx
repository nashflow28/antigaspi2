import React, { useEffect, useMemo, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Alert,
  TextInput,
  ActivityIndicator,
  Dimensions,
  Linking,
} from 'react-native'
import { useDispatch, useSelector } from 'react-redux'
import { AppDispatch, RootState } from '../../store'
import { fetchProduct } from '../../store/slices/productsSlice'
import {
  createReservation,
} from '../../store/slices/reservationsSlice'
import { Ionicons } from '@expo/vector-icons'
import { Image } from 'expo-image'
import * as Location from 'expo-location'
import {
  Product,
  ReservationCreationPayload,
  PaymentMethod,
  MobileMoneyProvider,
  ReservationCreationResponse,
  Payment,
  Reservation,
} from '../../types'
import paymentService from '../../services/paymentService'
// import offlineService from '../../services/offlineService'
// import analyticsService from '../../services/analyticsService' // Désactivé pour le web
import { Button, Card, Badge, Typography, Modal as Modal2025 } from '../../components/2025'
import { useTheme } from '../../theme'
import { showErrorAlert } from '../../utils/errorHandling'
import { getImageUrl } from '../../utils/imageHelpers'
// import { useToast } from '../../contexts/ToastContext' // Désactivé pour le web

interface Props {
  route: any
  navigation: any
}

const { width } = Dimensions.get('window')

const ProductDetailsScreen: React.FC<Props> = ({ route, navigation }) => {
  const theme = useTheme()
  const styles = createStyles(theme)
  const dispatch = useDispatch<AppDispatch>()
  // const toast = useToast() // Désactivé pour le web
  const { productId } = route.params
  const { products, loading } = useSelector((state: RootState) => state.products)
  const { user } = useSelector((state: RootState) => state.auth)
  const { loading: reservationLoading } = useSelector((state: RootState) => state.reservations)
  const { isOnline } = useSelector((state: RootState) => state.connectivity)

  const [product, setProduct] = useState<Product | null>(null)
  const [showReservationModal, setShowReservationModal] = useState(false)
  const [quantity, setQuantity] = useState(1)
  const [notes, setNotes] = useState('')
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod>('on_site')
  const [customerPhone, setCustomerPhone] = useState(user?.phone ?? '')
  // ⚠️ SÉCURITÉ: PIN stocké temporairement en mémoire, effacé immédiatement après usage
  // Ne JAMAIS persister ce PIN dans AsyncStorage ou logs
  const [walletPin, setWalletPin] = useState('')
  const [userLocation, setUserLocation] = useState<any>(null)
  const [distance, setDistance] = useState<number | null>(null)

  const mobileProviders = useMemo(() => paymentService.getAvailableProviders(), [])

  const handleCallMerchant = async () => {
    if (!product || !product.merchant.phone?.trim()) {
      Alert.alert(
        'Numéro indisponible',
        "Ce marchand n'a pas renseigné de numéro de téléphone."
      )
      return
    }

    const sanitizedPhone = product.merchant.phone.replace(/[^\d+]/g, '')
    if (!sanitizedPhone) {
      Alert.alert(
        'Numéro invalide',
        "Le numéro de téléphone du marchand est invalide."
      )
      return
    }

    const phoneUrl = `tel:${sanitizedPhone}`

    try {
      const supported = await Linking.canOpenURL(phoneUrl)
      if (!supported) {
        Alert.alert('Appel impossible', "Votre appareil ne permet pas d'initier un appel téléphonique.")
        return
      }

      await Linking.openURL(phoneUrl)
      // analyticsService tracking disabled for web
    } catch (error) {
      Alert.alert('Erreur', "Impossible d'ouvrir l'application téléphone.")
      // analyticsService tracking disabled for web
    }
  }

  const paymentOptions = useMemo(
    () => [
      {
        id: 'on_site' as PaymentMethod,
        label: 'Paiement sur place',
        icon: <Ionicons name="storefront" size={18} color={theme.colors.primary[500]} />,
      },
      {
        id: 'wallet' as PaymentMethod,
        label: 'Mon portefeuille',
        icon: <Ionicons name="wallet" size={18} color={theme.colors.primary[500]} />,
      },
      ...mobileProviders.map(provider => ({
        id: provider.id as PaymentMethod,
        label: provider.name,
        icon: <Text style={styles.paymentEmoji}>{provider.logo}</Text>,
      })),
    ],
    [mobileProviders]
  )

  const isMobileMoneyMethod = (method: PaymentMethod): method is MobileMoneyProvider =>
    ['flooz', 'tmoney', 'orange_money', 'mtn_momo'].includes(method)

  const selectedMobileProvider = isMobileMoneyMethod(selectedPaymentMethod)
    ? paymentService.getProviderById(selectedPaymentMethod)
    : undefined

  useEffect(() => {
    loadProduct()
    getUserLocation()
  }, [productId])

  const handleSelectPaymentMethod = (method: PaymentMethod) => {
    setSelectedPaymentMethod(method)

    if (!isMobileMoneyMethod(method)) {
      setCustomerPhone(user?.phone ?? '')
    }

    if (method !== 'wallet') {
      setWalletPin('')
    }

    // analyticsService tracking disabled for web
  }

  const openReservationModal = () => {
    setShowReservationModal(true)
    // analyticsService tracking disabled for web
  }

  const loadProduct = async () => {
    // Chercher d'abord dans le store
    const existingProduct = products.find(p => p.id === productId)
    if (existingProduct) {
      setProduct(existingProduct)
    } else {
      // Sinon charger depuis l'API
      try {
        const result = await dispatch(fetchProduct(productId))
        // ✅ FIX: Utiliser directement le payload retourné au lieu de chercher dans le tableau obsolète
        if (fetchProduct.fulfilled.match(result)) {
          setProduct(result.payload as Product)
        }
      } catch (error) {
        showErrorAlert(error, 'Chargement du produit')
        // analyticsService tracking disabled for web
        navigation.goBack()
      }
    }
  }

  const getUserLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync()
      if (status === 'granted') {
        const location = await Location.getCurrentPositionAsync({})
        setUserLocation(location.coords)
        calculateDistance(location.coords)
      }
    } catch (error) {
      // analyticsService tracking disabled for web
    }
  }

  const handlePaymentFeedback = async (
    payment: Payment | null | undefined,
    method: PaymentMethod,
    response: ReservationCreationResponse
  ) => {
    if (!product) {
      return
    }

    const amountBase = discountedUnitPrice
    const fallbackReference = response.data?.reservation_code || ''

    if (isMobileMoneyMethod(method)) {
      const provider = paymentService.getProviderById(method)
      if (payment) {
        await paymentService.recordPayment(payment, method, `Réservation ${response.data.reservation_code}`)
      }

      const status = payment?.status ?? 'pending'
      const reference = payment?.reference || fallbackReference
      const amount = payment?.amount ?? amountBase * quantity
      const ussd = paymentService.generateUSSDString(method, reference, amount)

      // analyticsService tracking disabled for web

      let message = ''
      switch (status) {
        case 'success':
          message = 'Votre paiement a été confirmé. Merci pour votre réservation !'
          break
        case 'failed':
          message = 'Le paiement a été refusé. Vous pouvez réessayer depuis vos réservations.'
          break
        default:
          message = 'Votre paiement est en cours de traitement. Vous recevrez une confirmation dès validation.'
          break
      }

      const instructions = status === 'pending' && ussd
        ? `\n\nVous pouvez composer ${ussd} pour finaliser l\'opération.`
        : ''

      Alert.alert(
        provider?.name ?? 'Paiement Mobile Money',
        `${message}${instructions}`,
        [
          {
            text: 'Voir mes réservations',
            onPress: () => navigation.navigate('Reservations')
          },
          { text: 'OK' }
        ]
      )

      return
    }

    if (method === 'wallet') {
      // analyticsService tracking disabled for web
      Alert.alert(
        payment?.status === 'success' ? 'Paiement wallet validé' : 'Réservation enregistrée',
        payment?.status === 'success'
          ? 'Le montant a été débité de votre portefeuille.'
          : 'Votre réservation est enregistrée. Le paiement sera finalisé depuis votre portefeuille.',
        [
          {
            text: 'Voir mes réservations',
            onPress: () => navigation.navigate('Reservations')
          },
          { text: 'OK' }
        ]
      )

      return
    }

    Alert.alert(
      'Réservation créée !',
      `Votre réservation ${response.data.reservation_code} a été créée avec succès.`,
      [
        {
          text: 'Voir mes réservations',
          onPress: () => navigation.navigate('Reservations')
        },
        { text: 'OK' }
      ]
    )
    // analyticsService tracking disabled for web
  }

  const calculateDistance = (coords: { latitude: number; longitude: number }) => {
    // Vérifier que le marchand a des coordonnées GPS
    if (!product || !product.merchant.latitude || !product.merchant.longitude) {
      setDistance(null)
      return
    }

    // Formule de Haversine pour calculer la distance entre deux points GPS
    const R = 6371 // Rayon de la Terre en km
    const dLat = ((product.merchant.latitude - coords.latitude) * Math.PI) / 180
    const dLon = ((product.merchant.longitude - coords.longitude) * Math.PI) / 180

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((coords.latitude * Math.PI) / 180) *
        Math.cos((product.merchant.latitude * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2)

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    const distanceKm = R * c

    // Arrondir à 1 décimale (ex: 2.3 km)
    setDistance(Math.round(distanceKm * 10) / 10)
  }

  const handleReservation = async () => {
    if (!product || !user) return

    // analyticsService tracking disabled for web

    if (quantity > product.quantity_available) {
      Alert.alert('Erreur', 'Quantité demandée supérieure au stock disponible')
      return
    }

    if (isMobileMoneyMethod(selectedPaymentMethod)) {
      if (!paymentService.validatePhoneNumber(customerPhone, selectedPaymentMethod)) {
        Alert.alert('Numéro invalide', 'Veuillez saisir un numéro Mobile Money valide.')
        return
      }
    }

    if (selectedPaymentMethod === 'wallet' && walletPin.trim().length < 4) {
      Alert.alert('Code PIN requis', 'Veuillez renseigner votre code PIN portefeuille (4 à 6 chiffres).')
      return
    }

    // ⚠️ SÉCURITÉ: Empêcher paiement wallet en mode offline
    // Le PIN ne doit JAMAIS être stocké dans AsyncStorage (offline queue)
    if (!isOnline && selectedPaymentMethod === 'wallet') {
      Alert.alert(
        'Connexion requise',
        'Le paiement par portefeuille nécessite une connexion internet active pour des raisons de sécurité.',
        [{ text: 'OK' }]
      )
      return
    }

    const reservationData: ReservationCreationPayload = {
      productId: product.id,
      quantity,
      paymentMethod: selectedPaymentMethod,
      notes,
      customerPhone: isMobileMoneyMethod(selectedPaymentMethod) ? customerPhone : user.phone,
      customerEmail: user.email,
      walletPin: selectedPaymentMethod === 'wallet' ? walletPin : undefined,
    }

    // Offline functionality disabled for web - always use online mode
    if (!isOnline) {
      Alert.alert(
        'Connexion requise',
        'Une connexion internet est nécessaire pour créer une réservation.',
        [{ text: 'OK' }]
      )
      return
    }

    try {
      const result = await dispatch(createReservation(reservationData))
      if (createReservation.fulfilled.match(result)) {
        const response = result.payload as ReservationCreationResponse
        setShowReservationModal(false)
        setQuantity(1)
        setNotes('')
        setWalletPin('')
        setSelectedPaymentMethod('on_site')
        setCustomerPhone(user?.phone ?? '')
        // analyticsService tracking disabled for web
        await handlePaymentFeedback(response.payment, selectedPaymentMethod, response)
      } else {
        showErrorAlert(new Error(result.payload as string), 'Création réservation', () => handleReservation())
      }
    } catch (error) {
      showErrorAlert(error, 'Création réservation', () => handleReservation())
      // analyticsService tracking disabled for web
    }
  }

  const formatTimeLeft = (expirationDate: string) => {
    const now = new Date()
    const expiry = new Date(expirationDate)
    const diffTime = expiry.getTime() - now.getTime()
    const diffHours = Math.ceil(diffTime / (1000 * 60 * 60))

    if (diffHours < 24) {
      return `${diffHours}h restantes`
    }
    const diffDays = Math.ceil(diffHours / 24)
    return `${diffDays} jour(s) restant(s)`
  }

  if (loading || !product) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary[500]} />
        <Typography variant="body" color="secondary" style={{ marginTop: theme.spacing.md }}>
          Chargement du produit...
        </Typography>
      </View>
    )
  }

  const discountedUnitPrice = Math.round(parseFloat(product.discounted_price))
  const originalUnitPrice = Math.round(parseFloat(product.original_price))
  const totalAmount = discountedUnitPrice * quantity
  const hasMerchantPhone = Boolean(product.merchant.phone?.trim())

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar backgroundColor={theme.colors.primary[500]} barStyle="light-content" />

      {/* Header avec navigation */}
      <View style={[styles.header, { backgroundColor: theme.colors.primary[500] }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.textInverse} />
        </TouchableOpacity>
        <Typography variant="h3" weight="semibold" style={{ color: theme.colors.textInverse }}>
          Détail du produit
        </Typography>
        <TouchableOpacity style={styles.shareButton}>
          <Ionicons name="share-outline" size={24} color={theme.colors.textInverse} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Image du produit */}
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: getImageUrl(product.image_url) }}
            style={styles.productImage}
            contentFit="cover"
            transition={200}
          />
          <View style={styles.discountBadge}>
            <Badge variant="warning" size="lg">
              -{product.discount_percentage}%
            </Badge>
          </View>
          {product.quantity_available <= 5 && (
            <View style={styles.lowStockBadge}>
              <Badge variant="error" size="md">
                Stock faible
              </Badge>
            </View>
          )}
        </View>

        {/* Informations principales */}
        <Card variant="elevated" style={{ margin: theme.spacing.md }}>
          <View style={styles.titleSection}>
            <Typography variant="h2" weight="bold" style={{ marginBottom: theme.spacing.sm }}>
              {product.name}
            </Typography>
            <View style={styles.priceContainer}>
              <Typography variant="h1" weight="bold" color="primary" style={{ marginRight: theme.spacing.sm }}>
                {discountedUnitPrice.toLocaleString()} F CFA
              </Typography>
              <Typography variant="h3" color="secondary" style={{ textDecorationLine: 'line-through' }}>
                {originalUnitPrice.toLocaleString()} F CFA
              </Typography>
            </View>
            <Typography variant="body" color="success" weight="medium" style={{ marginTop: theme.spacing.xs }}>
              Vous économisez {product.savings.toLocaleString()} F CFA
            </Typography>
          </View>

          {/* Informations sur l'expiration */}
          <View style={[styles.expirySection, {
            backgroundColor: theme.colors.warning[50],
            padding: theme.spacing.md,
            borderRadius: theme.radius.md,
            marginBottom: theme.spacing.lg
          }]}>
            <View style={styles.expiryHeader}>
              <Ionicons name="time-outline" size={20} color={theme.getExpirationStatusColor(product?.days_until_expiration)} />
              <Typography variant="body" weight="semibold" style={{ color: theme.getExpirationStatusColor(product?.days_until_expiration), marginLeft: theme.spacing.xs }}>
                {formatTimeLeft(product.expiration_date)}
              </Typography>
            </View>
            <Typography variant="caption" color="secondary" style={{ marginTop: theme.spacing.xs }}>
              Expire le {new Date(product.expiration_date).toLocaleDateString('fr-FR')}
            </Typography>
          </View>

          {/* Description */}
          <View style={{ marginBottom: theme.spacing.lg }}>
            <Typography variant="h3" weight="semibold" style={{ marginBottom: theme.spacing.sm }}>
              Description
            </Typography>
            <Typography variant="body" color="secondary">
              {product.description}
            </Typography>
          </View>

          {/* Informations marchand */}
          <View style={{ marginBottom: theme.spacing.lg }}>
            <Typography variant="h3" weight="semibold" style={{ marginBottom: theme.spacing.sm }}>
              Marchand
            </Typography>
            <View style={styles.merchantInfo}>
              <View style={[styles.merchantIcon, { backgroundColor: theme.colors.primary[50] }]}>
                <Ionicons name="storefront" size={24} color={theme.colors.primary[500]} />
              </View>
              <View style={styles.merchantDetails}>
                <Typography variant="body" weight="semibold">
                  {product.merchant.business_name}
                </Typography>
                <Typography variant="caption" color="secondary">
                  {product.merchant.business_type}
                </Typography>
                <View style={styles.locationInfo}>
                  <Ionicons name="location-outline" size={16} color={theme.colors.neutral[500]} />
                  <Typography variant="caption" color="secondary" style={{ marginLeft: theme.spacing.xs }}>
                    {product.merchant.city}
                    {distance && ` • À ${distance} km`}
                  </Typography>
                </View>
              </View>
              <TouchableOpacity
                onPress={handleCallMerchant}
                disabled={!hasMerchantPhone}
                style={[
                  styles.callButton,
                  {
                    backgroundColor: hasMerchantPhone
                      ? theme.colors.primary[50]
                      : theme.colors.neutral[100],
                  },
                  !hasMerchantPhone && styles.callButtonDisabled,
                ]}
              >
                <Ionicons
                  name="call"
                  size={20}
                  color={hasMerchantPhone ? theme.colors.primary[500] : theme.colors.neutral[400]}
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Stock disponible */}
          <View style={{ marginBottom: theme.spacing.lg }}>
            <Typography variant="h3" weight="semibold" style={{ marginBottom: theme.spacing.sm }}>
              Disponibilité
            </Typography>
            <View style={styles.stockInfo}>
              <Ionicons
                name="cube-outline"
                size={20}
                color={product.quantity_available > 5 ? theme.colors.success[500] : theme.colors.warning[500]}
              />
              <Typography variant="body" color="secondary" style={{ marginLeft: theme.spacing.xs }}>
                {product.quantity_available} unité(s) disponible(s)
              </Typography>
            </View>
          </View>
        </Card>
      </ScrollView>

      {/* Bouton de réservation fixe */}
      <View style={[styles.bottomContainer, {
        backgroundColor: theme.colors.surface.light,
        padding: theme.spacing.md,
        borderTopWidth: 1,
        borderTopColor: theme.colors.border
      }]}>
        <Button
          variant={product.quantity_available === 0 ? 'ghost' : 'primary'}
          size="lg"
          fullWidth
          onPress={openReservationModal}
          disabled={product.quantity_available === 0}
          accessibilityLabel={product.quantity_available === 0 ? 'Produit en rupture de stock' : 'Réserver ce produit'}
        >
          {product.quantity_available === 0 ? 'Rupture de stock' : 'Réserver maintenant'}
        </Button>
      </View>

      {/* Modal de réservation */}
      <Modal2025
        visible={showReservationModal}
        variant="bottom"
        dismissable
        onClose={() => {
          setShowReservationModal(false)
          // ⚠️ SÉCURITÉ: Effacer le PIN quand modal se ferme
          setWalletPin('')
          setCustomerPhone(user?.phone ?? '')
        }}
        title="Réserver ce produit"
      >

            <View style={{ padding: theme.spacing.md }}>
              <View style={{ marginBottom: theme.spacing.lg }}>
                <Typography variant="body" weight="medium" style={{ marginBottom: theme.spacing.sm }}>
                  Quantité
                </Typography>
                <View style={styles.quantityControls}>
                  <TouchableOpacity
                    style={[styles.quantityButton, { backgroundColor: theme.colors.primary[50] }]}
                    onPress={() => setQuantity(Math.max(1, quantity - 1))}
                  >
                    <Ionicons name="remove" size={20} color={theme.colors.primary[500]} />
                  </TouchableOpacity>
                  <Typography variant="h2" weight="semibold" style={{ marginHorizontal: theme.spacing.lg, minWidth: 40, textAlign: 'center' }}>
                    {quantity}
                  </Typography>
                  <TouchableOpacity
                    style={[styles.quantityButton, { backgroundColor: theme.colors.primary[50] }]}
                    onPress={() => setQuantity(Math.min(product.quantity_available, quantity + 1))}
                  >
                    <Ionicons name="add" size={20} color={theme.colors.primary[500]} />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={{ marginBottom: theme.spacing.lg }}>
                <Typography variant="body" weight="medium" style={{ marginBottom: theme.spacing.sm }}>
                  Notes (optionnel)
                </Typography>
                <TextInput
                  style={[styles.notesInput, {
                    backgroundColor: theme.colors.neutral[50],
                    borderRadius: theme.radius.md,
                    padding: theme.spacing.sm,
                    borderWidth: 1,
                    borderColor: theme.colors.border
                  }]}
                  placeholder="Instructions particulières..."
                  value={notes}
                  onChangeText={setNotes}
                  multiline
                  numberOfLines={3}
                />
              </View>

              <View style={{ marginBottom: theme.spacing.lg }}>
                <Typography variant="body" weight="medium" style={{ marginBottom: theme.spacing.sm }}>
                  Moyen de paiement
                </Typography>
                <View style={styles.paymentOptionsContainer}>
                  {paymentOptions.map(option => (
                    <TouchableOpacity
                      key={option.id}
                      style={[
                        styles.paymentOption,
                        selectedPaymentMethod === option.id && styles.paymentOptionSelected
                      ]}
                      onPress={() => handleSelectPaymentMethod(option.id)}
                    >
                      <View style={styles.paymentOptionIcon}>{option.icon}</View>
                      <Text style={styles.paymentOptionLabel}>{option.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {isMobileMoneyMethod(selectedPaymentMethod) && (
                  <View style={{ marginTop: theme.spacing.md, gap: theme.spacing.sm }}>
                    <Typography variant="caption" color="secondary">
                      {selectedMobileProvider?.name ?? 'Mobile Money'} nécessite un numéro Mobile Money actif.
                    </Typography>
                    <TextInput
                      style={[styles.phoneInput, {
                        backgroundColor: theme.colors.neutral[50],
                        borderRadius: theme.radius.md,
                        padding: theme.spacing.sm,
                        borderWidth: 1,
                        borderColor: theme.colors.border
                      }]}
                      placeholder="Numéro Mobile Money"
                      value={customerPhone}
                      onChangeText={setCustomerPhone}
                      keyboardType="phone-pad"
                    />
                    <Typography variant="caption" color="success" weight="medium">
                      Frais estimés : {paymentService.formatCurrency(paymentService.calculateFees(totalAmount, selectedPaymentMethod))}
                    </Typography>
                    {selectedMobileProvider && (
                      <Typography variant="caption" color="secondary">
                        Code USSD : {selectedMobileProvider.ussdCode}
                      </Typography>
                    )}
                  </View>
                )}

                {selectedPaymentMethod === 'wallet' && (
                  <View style={{ marginTop: theme.spacing.md, gap: theme.spacing.sm }}>
                    <Typography variant="caption" color="secondary">
                      Entrez le code PIN de votre portefeuille.
                    </Typography>
                    <TextInput
                      style={[styles.walletPinInput, {
                        backgroundColor: theme.colors.neutral[50],
                        borderRadius: theme.radius.md,
                        padding: theme.spacing.sm,
                        borderWidth: 1,
                        borderColor: theme.colors.border
                      }]}
                      placeholder="Code PIN"
                      value={walletPin}
                      onChangeText={setWalletPin}
                      secureTextEntry
                      keyboardType="number-pad"
                    />
                  </View>
                )}
              </View>

              <View style={[styles.totalSection, {
                paddingTop: theme.spacing.md,
                borderTopWidth: 1,
                borderTopColor: theme.colors.border,
                marginBottom: theme.spacing.md
              }]}>
                <Typography variant="h3" weight="semibold">Total</Typography>
                <Typography variant="h2" weight="bold" color="primary">
                  {totalAmount.toLocaleString()} F CFA
                </Typography>
              </View>

              <View style={{ flexDirection: 'row', gap: theme.spacing.sm }}>
                <Button
                  variant="secondary"
                  size="lg"
                  style={{ flex: 1 }}
                  onPress={() => setShowReservationModal(false)}
                >
                  Annuler
                </Button>
                <Button
                  variant="primary"
                  size="lg"
                  style={{ flex: 1 }}
                  onPress={handleReservation}
                  disabled={reservationLoading}
                  loading={reservationLoading}
                >
                  {reservationLoading ? 'Réservation...' : 'Confirmer'}
                </Button>
              </View>
            </View>
      </Modal2025>
    </View>
  )
}

const createStyles = (theme: ReturnType<typeof useTheme>) => StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 40,
    paddingBottom: 16,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.surface.light,
  },
  shareButton: {
    padding: 8,
  },
  scrollView: {
    flex: 1,
  },
  imageContainer: {
    position: 'relative',
    height: 300,
    backgroundColor: theme.colors.surface.light,
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  discountBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
  },
  lowStockBadge: {
    position: 'absolute',
    top: 16,
    left: 16,
  },
  titleSection: {},
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  expirySection: {},
  expiryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  merchantInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  merchantIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  merchantDetails: {
    flex: 1,
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  callButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  callButtonDisabled: {
    opacity: 0.6,
  },
  stockInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bottomContainer: {},
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notesInput: {
    fontSize: 16,
    textAlignVertical: 'top',
  },
  paymentOptionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface.light,
  },
  paymentOptionSelected: {
    borderColor: theme.colors.primary[500],
    backgroundColor: theme.colors.primary[50],
  },
  paymentOptionIcon: {
    marginRight: 8,
  },
  paymentOptionLabel: {
    fontSize: 15,
    color: theme.colors.text,
    fontWeight: '500',
  },
  paymentEmoji: {
    fontSize: 18,
  },
  phoneInput: {
    fontSize: 16,
  },
  walletPinInput: {
    fontSize: 16,
  },
  totalSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
})

export default ProductDetailsScreen
