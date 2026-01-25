import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  View,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Platform,
  StatusBar,
  ActivityIndicator,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import DateTimePicker from '@react-native-community/datetimepicker'
import { useDispatch, useSelector } from 'react-redux'
import { useFocusEffect } from '@react-navigation/native'
import { Image } from 'expo-image'
import { Ionicons } from '@expo/vector-icons'
import AsyncStorage from '@react-native-async-storage/async-storage'

import { AppDispatch, RootState } from '../../store'
import { useTheme } from '../../theme'
import { Button, Card, Typography, QuantityStepperInline, PhoneInput } from '../../components/2025'
import { formatCurrency } from '../../utils/currencyHelpers'
import { getImageUrl } from '../../utils/imageHelpers'
import { TEST_IDS } from '../../utils/testIds'
import { PAYMENT_OPTIONS } from '../../constants/paymentOptions'
import { PaymentMethod, CartItem as CartItemType, MobileMoneyProvider } from '../../types'
import paymentService from '../../services/paymentService'
import {
  fetchCart,
  updateCartItem,
  removeCartItem,
  clearCart,
  checkoutCart,
  resetCartState,
  CheckoutResultWithPayment,
} from '../../store/slices/cartSlice'
import { useToast } from '../../contexts/ToastContext'
import AlertModal from '../../components/AlertModal'
import { useAlert } from '../../hooks/useAlert'
import KeyboardAwareContainer from '../../components/KeyboardAwareContainer'
import { useHaptics } from '../../hooks/useHaptics'
import CheckoutConfirmationModal from '../../components/CheckoutConfirmationModal'

type Props = {
  navigation: any
}

const MOBILE_MONEY_METHODS: PaymentMethod[] = ['flooz', 'tmoney']
const CART_BACKUP_KEY = 'cart_backup_for_retry'

const CartScreen: React.FC<Props> = ({ navigation }) => {
  const dispatch = useDispatch<AppDispatch>()
  const theme = useTheme()
  const insets = useSafeAreaInsets()
  const { showSuccess, showError } = useToast()
  const { alertProps, showWarning, hideAlert } = useAlert()
  const haptics = useHaptics()
  const {
    cart,
    loading,
    updating,
    checkoutLoading,
    error,
    checkoutError,
  } = useSelector((state: RootState) => state.cart)

  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod>('wallet')
  const [selectedPickupDate, setSelectedPickupDate] = useState<string | null>(null)
  const [selectedPickupTime, setSelectedPickupTime] = useState('12:00')
  const [notes, setNotes] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [customerEmail, setCustomerEmail] = useState('')
  const [walletPin, setWalletPin] = useState('')
  const [showTimePicker, setShowTimePicker] = useState(false)
  const [showConfirmation, setShowConfirmation] = useState(false)

  useFocusEffect(
    useCallback(() => {
      dispatch(fetchCart())
    }, [dispatch])
  )

  useEffect(() => {
    if (!cart) {
      setSelectedPickupDate(null)
      setSelectedPickupTime('12:00')
      setNotes('')
      setCustomerPhone('')
      setCustomerEmail('')
      setWalletPin('')
      setSelectedPaymentMethod('wallet')
    }
  }, [cart])

  const normalizedBusinessType = useMemo(() => {
    if (!cart?.merchant?.business_type) {
      return ''
    }

    return cart.merchant.business_type
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')
      .replace(/\s+/g, '_')
      .toLowerCase()
  }, [cart?.merchant?.business_type])

  const maxPickupOffset = useMemo(() => {
    switch (normalizedBusinessType) {
      case 'supermarche':
        return 2
      case 'restaurant':
      case 'boulangerie':
      case 'fruits_legumes':
      case 'fruits_et_legumes':
      case 'fruits_legume':
        return 1
      default:
        return 1
    }
  }, [normalizedBusinessType])

  const dateOptions = useMemo(() => {
    const days = Math.max(maxPickupOffset, 0)
    return Array.from({ length: days + 1 }, (_, index) => {
      const date = new Date()
      date.setHours(0, 0, 0, 0)
      date.setDate(date.getDate() + index)
      const labelPrefix = index === 0 ? "Aujourd'hui" : index === 1 ? 'Demain' : `Dans ${index} jours`
      const formatted = date.toLocaleDateString('fr-FR', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
      })
      return {
        value: date.toISOString().split('T')[0],
        label: `${labelPrefix} (${formatted})`,
      }
    })
  }, [maxPickupOffset])

  useEffect(() => {
    if (dateOptions.length === 0) {
      setSelectedPickupDate(null)
      return
    }

    setSelectedPickupDate(prev => {
      if (prev && dateOptions.some(option => option.value === prev)) {
        return prev
      }
      return dateOptions[0].value
    })
  }, [dateOptions])

  const pickupWindowMessage = useMemo(() => {
    if (maxPickupOffset <= 0) {
      return 'Retrait dans la journée ou au plus tôt disponible.'
    }

    if (maxPickupOffset === 1) {
      return "Retrait possible aujourd'hui ou demain selon les disponibilités du commerce."
    }

    return 'Retrait possible dans les deux prochains jours maximum.'
  }, [maxPickupOffset])

  const isMobileMoney = useMemo(
    () => MOBILE_MONEY_METHODS.includes(selectedPaymentMethod),
    [selectedPaymentMethod]
  )

  const requiresWalletPin = selectedPaymentMethod === 'wallet'

  const hasItems = Boolean(cart && cart.items.length > 0)
  const cartTotal = cart?.total_amount ?? 0
  const totalItems = cart?.items_count ?? 0

  const activeError = checkoutError || error

  const parseTimeString = useCallback((time: string) => {
    const [hours, minutes] = time.split(':').map(segment => parseInt(segment, 10))
    const date = new Date()
    date.setHours(Number.isFinite(hours) ? hours : 12, Number.isFinite(minutes) ? minutes : 0, 0, 0)
    return date
  }, [])

  const handleTimeChange = useCallback(
    (event: any, date?: Date) => {
      if (Platform.OS !== 'ios') {
        setShowTimePicker(false)
      }

      if (event?.type === 'dismissed') {
        return
      }

      if (!date) {
        return
      }

      const hours = date.getHours().toString().padStart(2, '0')
      const minutes = date.getMinutes().toString().padStart(2, '0')
      setSelectedPickupTime(`${hours}:${minutes}`)
    },
    []
  )

  const handleRemoveItem = async (itemId: number) => {
    try {
      await dispatch(removeCartItem(itemId)).unwrap()
      showSuccess('Article supprimé du panier')
    } catch (err: any) {
      const message = typeof err === 'string' ? err : err?.message
      showError(message || 'Impossible de supprimer cet article')
    }
  }

  const updateQuantity = async (item: CartItemType, newQuantity: number) => {
    if (newQuantity <= 0) {
      await handleRemoveItem(item.id)
      return
    }

    const available = item.product?.available_quantity
    if (typeof available === 'number' && newQuantity > available) {
      showError(`Stock insuffisant. Maximum disponible: ${available}`)
      return
    }

    try {
      await dispatch(updateCartItem({ itemId: item.id, quantity: newQuantity })).unwrap()
    } catch (err: any) {
      const message = typeof err === 'string' ? err : err?.message
      showError(message || "Impossible de mettre à jour la quantité")
    }
  }

  const handleClearCart = () => {
    if (!cart) {
      return
    }

    showWarning(
      'Vider le panier',
      'Voulez-vous supprimer tous les articles de votre panier ?',
      [
        { text: 'Annuler', onPress: hideAlert },
        {
          text: 'Vider',
          style: 'destructive',
          onPress: async () => {
            hideAlert()
            try {
              await dispatch(clearCart()).unwrap()
              showSuccess('Panier vidé')
            } catch (err: any) {
              const message = typeof err === 'string' ? err : err?.message
              showError(message || 'Impossible de vider le panier')
            }
          },
        },
      ]
    )
  }

  const handleCheckout = async () => {
    if (!cart || cart.items.length === 0) {
      showError('Votre panier est vide.')
      return
    }

    if (!selectedPickupDate) {
      showError('Veuillez sélectionner une date de retrait.')
      return
    }

    if (!selectedPickupTime) {
      showError('Veuillez sélectionner une heure de retrait.')
      return
    }

    // Validate that pickup datetime is not in the past
    const today = new Date().toISOString().split('T')[0]
    if (selectedPickupDate === today) {
      const now = new Date()
      const [pickupHours, pickupMinutes] = selectedPickupTime.split(':').map(Number)
      const pickupDateTime = new Date()
      pickupDateTime.setHours(pickupHours, pickupMinutes, 0, 0)

      // Add 15 minutes buffer to allow for processing time
      const minimumPickupTime = new Date(now.getTime() + 15 * 60 * 1000)

      if (pickupDateTime < minimumPickupTime) {
        showError('L\'heure de retrait doit être au moins 15 minutes dans le futur.')
        return
      }
    }

    if (isMobileMoney && !customerPhone.trim()) {
      showError('Le numéro de téléphone est requis pour le paiement Mobile Money.')
      return
    }

    if (requiresWalletPin && walletPin.trim().length < 4) {
      showError('Veuillez saisir votre code PIN portefeuille (4 à 6 chiffres).')
      return
    }

    // 🐛 BUG FIX #MOB-C-003: Validate stock availability before checkout
    try {
      // Reload cart to get latest stock information
      await dispatch(fetchCart()).unwrap()
    } catch (error) {
      showError('Impossible de vérifier le stock disponible. Veuillez réessayer.')
      return
    }

    // Check all items have sufficient stock
    const insufficientStockItems = cart.items.filter(item => {
      const available = item.product?.available_quantity ?? 0
      return item.quantity > available
    })

    if (insufficientStockItems.length > 0) {
      const itemNames = insufficientStockItems.map(i => i.product?.name).join(', ')
      showError(`Stock insuffisant pour: ${itemNames}. Veuillez mettre à jour votre panier.`)
      return
    }

    // Show confirmation modal
    setShowConfirmation(true)
  }

  const handleConfirmCheckout = async () => {
    setShowConfirmation(false)

    try {
      // Haptic feedback on checkout initiation
      await haptics.mediumTap()

      // For Mobile Money payments, backup cart data for potential retry
      if (isMobileMoney && cart) {
        try {
          await AsyncStorage.setItem(CART_BACKUP_KEY, JSON.stringify({
            items: cart.items,
            merchantId: cart.merchant?.id,
            total: cart.total_amount,
            timestamp: Date.now(),
          }))
        } catch {
          // Ignore backup errors - non-critical
        }
      }

      const response = await dispatch(
        checkoutCart({
          paymentMethod: selectedPaymentMethod,
          pickupDate: selectedPickupDate ?? new Date().toISOString().split('T')[0],
          pickupTime: selectedPickupTime,
          notes: notes.trim() ? notes.trim() : undefined,
          customerPhone: customerPhone.trim() ? customerPhone.trim() : undefined,
          customerEmail: customerEmail.trim() ? customerEmail.trim() : undefined,
          walletPin: requiresWalletPin ? walletPin.trim() : undefined,
        })
      ).unwrap() as CheckoutResultWithPayment

      // Safety measure: immediately reset cart state (synchronous)
      // This ensures UI shows empty cart instantly without waiting for API
      dispatch(resetCartState())

      // Also call API to clear cart from backend (belt and suspenders)
      try {
        await dispatch(clearCart()).unwrap()
      } catch {
        // Ignore errors as checkout already succeeded
      }

      // Check if this is a Mobile Money payment that requires confirmation
      if (response.requiresPaymentConfirmation && response.payment) {
        // Navigate to PaymentStatusScreen for polling
        // Cart backup is preserved for potential retry if payment fails
        const firstReservation = response.data?.[0]
        navigation.replace('PaymentStatus', {
          paymentId: response.payment.id,
          reservationId: firstReservation?.id ?? 0,
          provider: selectedPaymentMethod as MobileMoneyProvider,
          amount: response.totalAmount ?? cartTotal,
          reservationCode: firstReservation?.reservation_code ?? response.orderNumber ?? '',
          hasCartBackup: true, // Signal that cart backup exists for retry
        })
        return
      }

      // Non-Mobile Money success: clear any cart backup
      try {
        await AsyncStorage.removeItem(CART_BACKUP_KEY)
      } catch {
        // Ignore
      }

      // Success haptic feedback for instant payments
      await haptics.success()
      showSuccess(response.message || 'Réservations confirmées !')

      const firstReservation = response.data?.[0]
      if (firstReservation) {
        // Naviguer vers les détails de la réservation (remplace Cart dans la pile)
        navigation.replace('ReservationDetails', { reservationId: firstReservation.id })
      } else {
        // Retourner à la liste des réservations
        navigation.navigate('OrdersMain')
      }
    } catch (err: any) {
      // Error haptic feedback
      await haptics.error()
      const message = typeof err === 'string' ? err : err?.message
      showError(message || 'Impossible de finaliser votre panier')
    }
  }

  const goToDiscover = () => {
    navigation.getParent()?.navigate('Discover')
  }

  const goToReservations = () => {
    // Utiliser goBack() pour retourner à ReservationsScreen (OrdersMain)
    if (navigation.canGoBack()) {
      navigation.goBack()
    } else {
      // Fallback: naviguer explicitement vers OrdersMain
      navigation.navigate('OrdersMain')
    }
  }

  const goToMerchantProducts = () => {
    if (cart?.merchant?.id) {
      navigation.navigate('MerchantDetail', {
        merchantId: cart.merchant.id,
      })
    }
  }

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      testID={TEST_IDS.cartScreen}
    >
      <StatusBar barStyle={theme.isDark ? 'light-content' : 'dark-content'} />

      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        {/* Back button */}
        <TouchableOpacity
          onPress={goToReservations}
          style={styles.backButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          accessibilityLabel="Retour aux réservations"
          accessibilityRole="button"
        >
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>

        <Typography variant="h2" weight="bold" style={{ flexShrink: 1, marginLeft: 12 }}>
          Mon panier
        </Typography>
        <View style={styles.headerActions}>
          {hasItems && (
            <TouchableOpacity
              onPress={handleClearCart}
              disabled={updating}
              style={[styles.headerButton, { borderColor: theme.colors.border }]}
              testID={TEST_IDS.cartClearButton}
            >
              <Typography variant="caption" weight="semibold" color="secondary">
                Vider
              </Typography>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {loading && !cart ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary[500]} />
        </View>
      ) : (
        <KeyboardAwareContainer
          contentContainerStyle={styles.scrollContent}
          extraScrollHeight={60}
        >
            {activeError && (
              <Card style={[styles.errorCard, { borderColor: theme.colors.error }]}> 
                <Typography variant="body" style={{ color: theme.colors.error }}>
                  {activeError}
                </Typography>
              </Card>
            )}

            {hasItems && cart ? (
              <>
                <Card style={styles.merchantCard}>
                  <Typography variant="body" weight="semibold">
                    Commerce
                  </Typography>
                  <Typography variant="h3" weight="bold" style={{ marginTop: 6 }}>
                    {cart.merchant?.name ?? 'Commerce partenaire'}
                  </Typography>
                  <Typography
                    variant="caption"
                    color="secondary"
                    style={{ marginTop: 8, lineHeight: 18 }}
                  >
                    {pickupWindowMessage}
                  </Typography>

                  {/* Continue Shopping Button */}
                  <TouchableOpacity
                    style={[styles.continueShoppingButton, { backgroundColor: theme.colors.primary[50], borderColor: theme.colors.primary[200] }]}
                    onPress={goToMerchantProducts}
                    accessibilityRole="button"
                    accessibilityLabel={`Continuer mes achats chez ${cart.merchant?.name || 'ce commerce'}`}
                  >
                    <Ionicons name="add-circle-outline" size={20} color={theme.colors.primary[600]} />
                    <Typography variant="body" weight="semibold" style={{ color: theme.colors.primary[700], flex: 1 }}>
                      Ajouter d'autres produits
                    </Typography>
                    <Ionicons name="chevron-forward" size={20} color={theme.colors.primary[600]} />
                  </TouchableOpacity>
                </Card>

                {cart.items.map(item => (
                  <Card key={item.id} style={styles.cartItemCard} testID={TEST_IDS.cartItem(item.id)}>
                    <View style={styles.cartItemHeader}>
                      <View style={styles.cartItemInfo}>
                        <Image
                          source={{ uri: getImageUrl(item.product?.image_url, item.product?.category?.name) }}
                          style={styles.cartItemImage}
                          contentFit="cover"
                        />
                        <View style={{ flex: 1 }}>
                          <Typography variant="body" weight="semibold">
                            {item.product?.name ?? 'Produit'}
                          </Typography>
                          <Typography variant="caption" color="secondary" style={{ marginTop: 4 }}>
                            {formatCurrency(item.unit_price)} / unité
                          </Typography>
                        </View>
                      </View>

                      <TouchableOpacity
                        onPress={() => handleRemoveItem(item.id)}
                        accessibilityRole="button"
                        disabled={updating}
                      >
                        <Ionicons name="trash-outline" size={20} color={theme.colors.error} />
                      </TouchableOpacity>
                    </View>

                    <View style={styles.cartItemFooter}>
                      <QuantityStepperInline
                        value={item.quantity}
                        onChange={(newQuantity) => updateQuantity(item, newQuantity)}
                        min={1}
                        max={item.product?.available_quantity ?? 99}
                        disabled={updating}
                      />

                      <Typography variant="body" weight="semibold">
                        {formatCurrency(item.total_price)}
                      </Typography>
                    </View>

                    {typeof item.product?.available_quantity === 'number' && (
                      <Typography variant="caption" color="secondary" style={{ marginTop: 8 }}>
                        Stock disponible: {item.product.available_quantity}
                      </Typography>
                    )}
                  </Card>
                ))}

                <Card style={styles.summaryCard}>
                  <View style={styles.summaryRow}>
                    <Typography variant="body" color="secondary">
                      Articles
                    </Typography>
                    <Typography variant="body" weight="semibold">
                      {totalItems}
                    </Typography>
                  </View>
                  <View style={styles.summaryRow}>
                    <Typography variant="h3" weight="bold">
                      Total
                    </Typography>
                    <Typography variant="h3" weight="bold" color="primary">
                      {formatCurrency(cartTotal)}
                    </Typography>
                  </View>
                </Card>

                <Card style={styles.sectionCard}>
                  <Typography variant="body" weight="semibold" style={{ marginBottom: 12 }}>
                    Choisissez votre jour de retrait
                  </Typography>
                  <View style={styles.dateOptions}>
                    {dateOptions.map(option => {
                      const isSelected = option.value === selectedPickupDate
                      return (
                        <TouchableOpacity
                          key={option.value}
                          onPress={() => setSelectedPickupDate(option.value)}
                          style={[
                            styles.dateOption,
                            {
                              borderColor: isSelected
                                ? theme.colors.primary[500]
                                : theme.colors.borderLight,
                              backgroundColor: isSelected
                                ? theme.colors.primary[50]
                                : theme.colors.surface.light,
                            },
                          ]}
                          accessibilityRole="radio"
                          accessibilityState={{ selected: isSelected }}
                        >
                          <Typography
                            variant="body"
                            weight={isSelected ? 'semibold' : 'regular'}
                            style={{ color: isSelected ? theme.colors.primary[700] : theme.colors.text }}
                          >
                            {option.label}
                          </Typography>
                        </TouchableOpacity>
                      )
                    })}
                  </View>

                  <Typography variant="body" weight="semibold" style={{ marginTop: 16, marginBottom: 8 }}>
                    Heure de retrait
                  </Typography>

                  {Platform.OS === 'web' ? (
                    <TextInput
                      value={selectedPickupTime}
                      onChangeText={setSelectedPickupTime}
                      placeholder="HH:MM"
                      placeholderTextColor={theme.colors.neutral[400]}
                      style={[styles.input, { borderColor: theme.colors.borderLight }]}
                      keyboardType="default"
                      maxLength={5}
                    />
                  ) : (
                    <View>
                      <TouchableOpacity
                        style={[styles.timeButton, { borderColor: theme.colors.borderLight }]}
                        onPress={() => setShowTimePicker(true)}
                      >
                        <Ionicons name="time-outline" size={20} color={theme.colors.primary[600]} />
                        <Typography variant="body" weight="semibold">
                          {selectedPickupTime}
                        </Typography>
                      </TouchableOpacity>
                      {showTimePicker && (
                        <DateTimePicker
                          mode="time"
                          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                          value={parseTimeString(selectedPickupTime)}
                          onChange={handleTimeChange}
                          minimumDate={
                            selectedPickupDate === new Date().toISOString().split('T')[0]
                              ? new Date(Date.now() + 15 * 60 * 1000) // 15 minutes from now
                              : undefined
                          }
                        />
                      )}
                    </View>
                  )}
                </Card>

                <Card style={styles.sectionCard}>
                  <Typography variant="body" weight="semibold" style={{ marginBottom: 12 }}>
                    Méthode de paiement
                  </Typography>
                  <View style={{ gap: 12 }}>
                    {PAYMENT_OPTIONS.map(option => {
                      const isSelected = option.value === selectedPaymentMethod
                      return (
                        <TouchableOpacity
                          key={option.value}
                          onPress={() => setSelectedPaymentMethod(option.value)}
                          style={[
                            styles.paymentOption,
                            {
                              borderColor: isSelected
                                ? theme.colors.primary[500]
                                : theme.colors.borderLight,
                              backgroundColor: isSelected
                                ? theme.colors.primary[50]
                                : theme.colors.surface.light,
                            },
                          ]}
                          accessibilityRole="radio"
                          accessibilityState={{ selected: isSelected }}
                        >
                          <View style={styles.paymentOptionHeader}>
                            <Ionicons
                              name={option.icon}
                              size={20}
                              color={isSelected ? theme.colors.primary[600] : theme.colors.neutral[500]}
                            />
                            <View style={{ flex: 1 }}>
                              <Typography
                                variant="body"
                                weight={isSelected ? 'semibold' : 'medium'}
                                style={{ color: isSelected ? theme.colors.primary[700] : theme.colors.text }}
                              >
                                {option.label}
                              </Typography>
                              <Typography variant="caption" color="secondary" style={{ marginTop: 4 }}>
                                {option.description}
                              </Typography>
                            </View>
                          </View>
                        </TouchableOpacity>
                      )
                    })}
                  </View>

                  {isMobileMoney && (
                    <View style={{ marginTop: 16 }}>
                      <Typography variant="body" weight="semibold" style={{ marginBottom: 8 }}>
                        Numéro Mobile Money
                      </Typography>
                      <PhoneInput
                        value={customerPhone}
                        onChangeText={setCustomerPhone}
                        placeholder="90 12 34 56"
                        defaultCountryCode="+228"
                        testID="checkout-phone-input"
                      />
                    </View>
                  )}

                  {requiresWalletPin && (
                    <View style={{ marginTop: 16 }}>
                      <Typography variant="body" weight="semibold" style={{ marginBottom: 8 }}>
                        Code PIN portefeuille
                      </Typography>
                      <TextInput
                        value={walletPin}
                        onChangeText={setWalletPin}
                        placeholder="****"
                        placeholderTextColor={theme.colors.neutral[400]}
                        keyboardType="number-pad"
                        secureTextEntry
                        maxLength={6}
                        style={[styles.input, { borderColor: theme.colors.borderLight }]}
                      />
                    </View>
                  )}

                  <View style={{ marginTop: 16 }}>
                    <Typography variant="body" weight="semibold" style={{ marginBottom: 8 }}>
                      Email de contact (optionnel)
                    </Typography>
                    <TextInput
                      value={customerEmail}
                      onChangeText={setCustomerEmail}
                      placeholder="contact@email.com"
                      placeholderTextColor={theme.colors.neutral[400]}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      style={[styles.input, { borderColor: theme.colors.borderLight }]}
                    />
                  </View>

                  <View style={{ marginTop: 16 }}>
                    <Typography variant="body" weight="semibold" style={{ marginBottom: 8 }}>
                      Notes pour le commerce (optionnel)
                    </Typography>
                    <TextInput
                      value={notes}
                      onChangeText={setNotes}
                      placeholder="Ex: Merci de préparer sans arachide."
                      placeholderTextColor={theme.colors.neutral[400]}
                      multiline
                      numberOfLines={3}
                      style={[styles.textArea, { borderColor: theme.colors.borderLight }]}
                    />
                  </View>
                </Card>

                <Button
                  variant="primary"
                  size="lg"
                  fullWidth
                  onPress={handleCheckout}
                  loading={checkoutLoading}
                  disabled={checkoutLoading || updating}
                  testID={TEST_IDS.cartCheckoutButton}
                  style={{ marginTop: 16, marginBottom: 32 }}
                >
                  Valider mes réservations
                </Button>
              </>
            ) : (
              <View style={styles.emptyState} testID={TEST_IDS.emptyState}>
                <Ionicons name="cart-outline" size={56} color={theme.colors.primary[400]} />
                <Typography variant="h3" weight="bold" style={{ marginTop: 16 }}>
                  Votre panier est vide
                </Typography>
                <Typography
                  variant="body"
                  color="secondary"
                  style={{ textAlign: 'center', marginTop: 8 }}
                >
                  Ajoutez des produits depuis la liste des commerces pour les réserver ensemble.
                </Typography>
                <Button
                  variant="primary"
                  size="md"
                  onPress={goToDiscover}
                  style={{ marginTop: 24 }}
                >
                  Découvrir les offres
                </Button>
              </View>
            )}
        </KeyboardAwareContainer>
      )}

      <AlertModal {...alertProps} />
      <CheckoutConfirmationModal
        visible={showConfirmation}
        onClose={() => setShowConfirmation(false)}
        onConfirm={handleConfirmCheckout}
        cart={cart}
        paymentMethod={selectedPaymentMethod}
        pickupDate={selectedPickupDate}
        pickupTime={selectedPickupTime}
        customerPhone={customerPhone}
        notes={notes}
        loading={checkoutLoading}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  backButton: {
    padding: 4,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
    flexShrink: 0,
  },
  headerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  headerButtonPrimary: {
    borderWidth: 0,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 80,
    gap: 16,
  },
  errorCard: {
    borderWidth: 1,
    padding: 16,
    borderRadius: 12,
  },
  merchantCard: {
    padding: 16,
    borderRadius: 16,
    gap: 4,
  },
  continueShoppingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 16,
  },
  cartItemCard: {
    padding: 16,
    borderRadius: 16,
    gap: 12,
  },
  cartItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 16,
  },
  cartItemInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    flex: 1,
  },
  cartItemImage: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: '#f3f4f6',
  },
  cartItemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryCard: {
    padding: 16,
    borderRadius: 16,
    gap: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionCard: {
    padding: 16,
    borderRadius: 16,
    gap: 12,
  },
  dateOptions: {
    flexDirection: 'column',
    gap: 12,
  },
  dateOption: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  timeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  paymentOption: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  paymentOptionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1f2937', // Fix: text color for visibility (dark gray)
    backgroundColor: '#ffffff',
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    minHeight: 100,
    textAlignVertical: 'top',
    fontSize: 16,
    color: '#1f2937', // Fix: text color for visibility
    backgroundColor: '#ffffff',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 60,
    paddingHorizontal: 24,
    gap: 12,
  },
})

export default CartScreen
