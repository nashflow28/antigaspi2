import React, { useEffect, useMemo, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Alert,
  Modal,
  TextInput,
  ActivityIndicator,
  Dimensions,
} from 'react-native'
import { useDispatch, useSelector } from 'react-redux'
import { AppDispatch, RootState } from '../../store'
import { fetchProduct } from '../../store/slices/productsSlice'
import {
  addOfflineReservation,
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
import offlineService from '../../services/offlineService'

interface Props {
  route: any
  navigation: any
}

const { width } = Dimensions.get('window')

const ProductDetailsScreen: React.FC<Props> = ({ route, navigation }) => {
  const dispatch = useDispatch<AppDispatch>()
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
  const [walletPin, setWalletPin] = useState('')
  const [userLocation, setUserLocation] = useState<any>(null)
  const [distance, setDistance] = useState<number | null>(null)

  const mobileProviders = useMemo(() => paymentService.getAvailableProviders(), [])

  const paymentOptions = useMemo(
    () => [
      {
        id: 'on_site' as PaymentMethod,
        label: 'Paiement sur place',
        icon: <Ionicons name="storefront" size={18} color="#10B981" />,
      },
      {
        id: 'wallet' as PaymentMethod,
        label: 'Mon portefeuille',
        icon: <Ionicons name="wallet" size={18} color="#10B981" />,
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
  }

  const loadProduct = async () => {
    // Chercher d'abord dans le store
    const existingProduct = products.find(p => p.id === productId)
    if (existingProduct) {
      setProduct(existingProduct)
    } else {
      // Sinon charger depuis l'API
      try {
        await dispatch(fetchProduct(productId))
        const updatedProduct = products.find(p => p.id === productId)
        if (updatedProduct) {
          setProduct(updatedProduct)
        }
      } catch (error) {
        Alert.alert('Erreur', 'Impossible de charger le produit')
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
      console.log('Erreur géolocalisation:', error)
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
  }

  const calculateDistance = (coords: any) => {
    // Simulation d'une distance - en production, utilisez les coordonnées réelles du marchand
    const simulatedDistance = Math.random() * 5 + 0.5 // Entre 0.5 et 5.5 km
    setDistance(Math.round(simulatedDistance * 10) / 10)
  }

  const handleReservation = async () => {
    if (!product || !user) return

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

    const reservationData: ReservationCreationPayload = {
      productId: product.id,
      quantity,
      paymentMethod: selectedPaymentMethod,
      notes,
      customerPhone: isMobileMoneyMethod(selectedPaymentMethod) ? customerPhone : user.phone,
      customerEmail: user.email,
      walletPin: selectedPaymentMethod === 'wallet' ? walletPin : undefined,
    }

    if (!isOnline) {
      try {
        await offlineService.queueSyncAction('create', '/reservations', {
          action: 'createReservation',
          payload: reservationData,
        })

        const now = Date.now()
        const tempReservation: Reservation = {
          id: -now,
          reservation_code: `TMP-${now}`,
          quantity,
          original_price: parseFloat(product.original_price),
          discounted_price: parseFloat(product.discounted_price),
          total_amount: totalAmount,
          status: 'pending',
          payment_status: 'pending',
          notes,
          pickup_date: reservationData.pickupDate || undefined,
          pickup_time: reservationData.pickupTime || undefined,
          created_at: new Date().toISOString(),
          product: {
            id: product.id,
            name: product.name,
            description: product.description,
            image_url: product.image_url,
            merchant: {
              id: product.merchant.id,
              name: product.merchant.business_name,
              business_type: product.merchant.business_type,
              address: product.merchant.address,
              city: product.merchant.city,
              phone: product.merchant.phone,
            },
            category: product.category,
          },
          consumer: user || undefined,
          pendingSync: true,
          pendingAction: 'create',
        }

        dispatch(addOfflineReservation(tempReservation))
        setShowReservationModal(false)
        setQuantity(1)
        setNotes('')
        setWalletPin('')
        setSelectedPaymentMethod('on_site')
        setCustomerPhone(user?.phone ?? '')

        Alert.alert(
          'Réservation enregistrée hors ligne',
          'Nous enverrons votre demande dès que la connexion sera rétablie.'
        )
      } catch (error) {
        Alert.alert('Erreur', 'Impossible de préparer la synchronisation hors ligne.')
      }
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
        await handlePaymentFeedback(response.payment, selectedPaymentMethod, response)
      } else {
        Alert.alert('Erreur', result.payload as string)
      }
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de créer la réservation')
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

  const getStatusColor = () => {
    if (!product) return '#6B7280'
    if (product.days_until_expiration <= 1) return '#EF4444'
    if (product.days_until_expiration <= 3) return '#F59E0B'
    return '#10B981'
  }

  if (loading || !product) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#10B981" />
        <Text style={styles.loadingText}>Chargement du produit...</Text>
      </View>
    )
  }

  const discountedUnitPrice = Math.round(parseFloat(product.discounted_price))
  const originalUnitPrice = Math.round(parseFloat(product.original_price))
  const totalAmount = discountedUnitPrice * quantity

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#10B981" barStyle="light-content" />

      {/* Header avec navigation */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Détail du produit</Text>
        <TouchableOpacity style={styles.shareButton}>
          <Ionicons name="share-outline" size={24} color="#ffffff" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Image du produit */}
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: product.image_url || 'https://via.placeholder.com/400x300?text=Produit' }}
            style={styles.productImage}
            contentFit="cover"
            transition={200}
          />
          <View style={styles.discountBadge}>
            <Text style={styles.discountText}>-{product.discount_percentage}%</Text>
          </View>
          {product.quantity_available <= 5 && (
            <View style={styles.lowStockBadge}>
              <Text style={styles.lowStockText}>Stock faible</Text>
            </View>
          )}
        </View>

        {/* Informations principales */}
        <View style={styles.contentContainer}>
          <View style={styles.titleSection}>
            <Text style={styles.productName}>{product.name}</Text>
            <View style={styles.priceContainer}>
              <Text style={styles.discountedPrice}>
                {discountedUnitPrice.toLocaleString()} F CFA
              </Text>
              <Text style={styles.originalPrice}>
                {originalUnitPrice.toLocaleString()} F CFA
              </Text>
            </View>
            <Text style={styles.savings}>
              Vous économisez {product.savings.toLocaleString()} F CFA
            </Text>
          </View>

          {/* Informations sur l'expiration */}
          <View style={styles.expirySection}>
            <View style={styles.expiryHeader}>
              <Ionicons name="time-outline" size={20} color={getStatusColor()} />
              <Text style={[styles.expiryText, { color: getStatusColor() }]}>
                {formatTimeLeft(product.expiration_date)}
              </Text>
            </View>
            <Text style={styles.expiryDate}>
              Expire le {new Date(product.expiration_date).toLocaleDateString('fr-FR')}
            </Text>
          </View>

          {/* Description */}
          <View style={styles.descriptionSection}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.description}>{product.description}</Text>
          </View>

          {/* Informations marchand */}
          <View style={styles.merchantSection}>
            <Text style={styles.sectionTitle}>Marchand</Text>
            <View style={styles.merchantInfo}>
              <View style={styles.merchantIcon}>
                <Ionicons name="storefront" size={24} color="#10B981" />
              </View>
              <View style={styles.merchantDetails}>
                <Text style={styles.merchantName}>{product.merchant.business_name}</Text>
                <Text style={styles.merchantType}>{product.merchant.business_type}</Text>
                <View style={styles.locationInfo}>
                  <Ionicons name="location-outline" size={16} color="#6B7280" />
                  <Text style={styles.locationText}>
                    {product.merchant.city}
                    {distance && ` • À ${distance} km`}
                  </Text>
                </View>
              </View>
              <TouchableOpacity style={styles.callButton}>
                <Ionicons name="call" size={20} color="#10B981" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Stock disponible */}
          <View style={styles.stockSection}>
            <Text style={styles.sectionTitle}>Disponibilité</Text>
            <View style={styles.stockInfo}>
              <Ionicons
                name="cube-outline"
                size={20}
                color={product.quantity_available > 5 ? '#10B981' : '#F59E0B'}
              />
              <Text style={styles.stockText}>
                {product.quantity_available} unité(s) disponible(s)
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Bouton de réservation fixe */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity
          style={[
            styles.reserveButton,
            product.quantity_available === 0 && styles.disabledButton
          ]}
          onPress={() => setShowReservationModal(true)}
          disabled={product.quantity_available === 0}
        >
          <Text style={styles.reserveButtonText}>
            {product.quantity_available === 0 ? 'Rupture de stock' : 'Réserver maintenant'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Modal de réservation */}
      <Modal
        visible={showReservationModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowReservationModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Réserver ce produit</Text>
              <TouchableOpacity onPress={() => setShowReservationModal(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <View style={styles.quantitySection}>
                <Text style={styles.inputLabel}>Quantité</Text>
                <View style={styles.quantityControls}>
                  <TouchableOpacity
                    style={styles.quantityButton}
                    onPress={() => setQuantity(Math.max(1, quantity - 1))}
                  >
                    <Ionicons name="remove" size={20} color="#10B981" />
                  </TouchableOpacity>
                  <Text style={styles.quantityText}>{quantity}</Text>
                  <TouchableOpacity
                    style={styles.quantityButton}
                    onPress={() => setQuantity(Math.min(product.quantity_available, quantity + 1))}
                  >
                    <Ionicons name="add" size={20} color="#10B981" />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.notesSection}>
                <Text style={styles.inputLabel}>Notes (optionnel)</Text>
                <TextInput
                  style={styles.notesInput}
                  placeholder="Instructions particulières..."
                  value={notes}
                  onChangeText={setNotes}
                  multiline
                  numberOfLines={3}
                />
              </View>

              <View style={styles.paymentSection}>
                <Text style={styles.inputLabel}>Moyen de paiement</Text>
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
                  <View style={styles.mobileMoneySection}>
                    <Text style={styles.helperText}>
                      {selectedMobileProvider?.name ?? 'Mobile Money'} nécessite un numéro Mobile Money actif.
                    </Text>
                    <TextInput
                      style={styles.phoneInput}
                      placeholder="Numéro Mobile Money"
                      value={customerPhone}
                      onChangeText={setCustomerPhone}
                      keyboardType="phone-pad"
                    />
                    <Text style={styles.feeText}>
                      Frais estimés : {paymentService.formatCurrency(paymentService.calculateFees(totalAmount, selectedPaymentMethod))}
                    </Text>
                    {selectedMobileProvider && (
                      <Text style={styles.helperText}>Code USSD : {selectedMobileProvider.ussdCode}</Text>
                    )}
                  </View>
                )}

                {selectedPaymentMethod === 'wallet' && (
                  <View style={styles.mobileMoneySection}>
                    <Text style={styles.helperText}>Entrez le code PIN de votre portefeuille.</Text>
                    <TextInput
                      style={styles.walletPinInput}
                      placeholder="Code PIN"
                      value={walletPin}
                      onChangeText={setWalletPin}
                      secureTextEntry
                      keyboardType="number-pad"
                    />
                  </View>
                )}
              </View>

              <View style={styles.totalSection}>
                <Text style={styles.totalLabel}>Total</Text>
                <Text style={styles.totalAmount}>
                  {totalAmount.toLocaleString()} F CFA
                </Text>
              </View>
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowReservationModal(false)}
              >
                <Text style={styles.cancelButtonText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmButton, reservationLoading && styles.disabledButton]}
                onPress={handleReservation}
                disabled={reservationLoading}
              >
                <Text style={styles.confirmButtonText}>
                  {reservationLoading ? 'Réservation...' : 'Confirmer'}
                </Text>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  header: {
    backgroundColor: '#10B981',
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
    color: '#ffffff',
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
    backgroundColor: '#ffffff',
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  discountBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: '#F59E0B',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  discountText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 14,
  },
  lowStockBadge: {
    position: 'absolute',
    top: 16,
    left: 16,
    backgroundColor: '#EF4444',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  lowStockText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 12,
  },
  contentContainer: {
    backgroundColor: '#ffffff',
    margin: 16,
    borderRadius: 12,
    padding: 20,
  },
  titleSection: {
    marginBottom: 20,
  },
  productName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 12,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  discountedPrice: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#10B981',
    marginRight: 12,
  },
  originalPrice: {
    fontSize: 18,
    color: '#9CA3AF',
    textDecorationLine: 'line-through',
  },
  savings: {
    fontSize: 16,
    color: '#059669',
    fontWeight: '500',
  },
  expirySection: {
    backgroundColor: '#FEF3C7',
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
  },
  expiryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  expiryText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  expiryDate: {
    fontSize: 14,
    color: '#6B7280',
  },
  descriptionSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    color: '#6B7280',
    lineHeight: 24,
  },
  merchantSection: {
    marginBottom: 20,
  },
  merchantInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  merchantIcon: {
    width: 48,
    height: 48,
    backgroundColor: '#ECFDF5',
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  merchantDetails: {
    flex: 1,
  },
  merchantName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  merchantType: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 4,
  },
  callButton: {
    width: 40,
    height: 40,
    backgroundColor: '#ECFDF5',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stockSection: {
    marginBottom: 20,
  },
  stockInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stockText: {
    fontSize: 16,
    color: '#6B7280',
    marginLeft: 8,
  },
  bottomContainer: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  reserveButton: {
    backgroundColor: '#10B981',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#9CA3AF',
  },
  reserveButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 20,
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
  modalBody: {
    padding: 20,
  },
  quantitySection: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityButton: {
    width: 40,
    height: 40,
    backgroundColor: '#ECFDF5',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    marginHorizontal: 20,
    minWidth: 40,
    textAlign: 'center',
  },
  notesSection: {
    marginBottom: 20,
  },
  notesInput: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  paymentSection: {
    marginBottom: 20,
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
    borderColor: '#E5E7EB',
    backgroundColor: '#ffffff',
  },
  paymentOptionSelected: {
    borderColor: '#10B981',
    backgroundColor: '#ECFDF5',
  },
  paymentOptionIcon: {
    marginRight: 8,
  },
  paymentOptionLabel: {
    fontSize: 15,
    color: '#1F2937',
    fontWeight: '500',
  },
  paymentEmoji: {
    fontSize: 18,
  },
  mobileMoneySection: {
    marginTop: 16,
    gap: 8,
  },
  helperText: {
    fontSize: 13,
    color: '#6B7280',
  },
  phoneInput: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  feeText: {
    fontSize: 14,
    color: '#059669',
    fontWeight: '500',
  },
  walletPinInput: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  totalSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  totalAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#10B981',
  },
  modalFooter: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#10B981',
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
})

export default ProductDetailsScreen
