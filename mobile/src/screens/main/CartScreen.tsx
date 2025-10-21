import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Platform,
  StatusBar,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
} from 'react-native'
import DateTimePicker from '@react-native-community/datetimepicker'
import { useDispatch, useSelector } from 'react-redux'
import { useFocusEffect } from '@react-navigation/native'
import { Image } from 'expo-image'
import { Ionicons } from '@expo/vector-icons'

import { AppDispatch, RootState } from '../../store'
import { useTheme } from '../../theme'
import { Button, Card, Typography } from '../../components/2025'
import { formatCurrency } from '../../utils/currencyHelpers'
import { TEST_IDS } from '../../utils/testIds'
import { PAYMENT_OPTIONS } from '../../constants/paymentOptions'
import { PaymentMethod, CartItem as CartItemType } from '../../types'
import {
  fetchCart,
  updateCartItem,
  removeCartItem,
  clearCart,
  checkoutCart,
} from '../../store/slices/cartSlice'
import { useToast } from '../../contexts/ToastContext'

type Props = {
  navigation: any
}

const MOBILE_MONEY_METHODS: PaymentMethod[] = ['flooz', 'tmoney', 'orange_money', 'mtn_momo']

const CartScreen: React.FC<Props> = ({ navigation }) => {
  const dispatch = useDispatch<AppDispatch>()
  const theme = useTheme()
  const { showSuccess, showError } = useToast()
  const {
    cart,
    loading,
    updating,
    checkoutLoading,
    error,
    checkoutError,
  } = useSelector((state: RootState) => state.cart)

  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod>('on_site')
  const [selectedPickupDate, setSelectedPickupDate] = useState<string | null>(null)
  const [selectedPickupTime, setSelectedPickupTime] = useState('12:00')
  const [notes, setNotes] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [customerEmail, setCustomerEmail] = useState('')
  const [walletPin, setWalletPin] = useState('')
  const [showTimePicker, setShowTimePicker] = useState(false)

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
      setSelectedPaymentMethod('on_site')
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

    Alert.alert(
      'Vider le panier',
      'Voulez-vous supprimer tous les articles de votre panier ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Vider',
          style: 'destructive',
          onPress: async () => {
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

    if (isMobileMoney && !customerPhone.trim()) {
      showError('Le numéro de téléphone est requis pour le paiement Mobile Money.')
      return
    }

    if (requiresWalletPin && walletPin.trim().length < 4) {
      showError('Veuillez saisir votre code PIN portefeuille (4 à 6 chiffres).')
      return
    }

    try {
      const response = await dispatch(
        checkoutCart({
          paymentMethod: selectedPaymentMethod,
          pickupDate: selectedPickupDate,
          pickupTime: selectedPickupTime,
          notes: notes.trim() ? notes.trim() : undefined,
          customerPhone: customerPhone.trim() ? customerPhone.trim() : undefined,
          customerEmail: customerEmail.trim() ? customerEmail.trim() : undefined,
          walletPin: requiresWalletPin ? walletPin.trim() : undefined,
        })
      ).unwrap()

      showSuccess(response.message || 'Réservations confirmées !')

      const firstReservation = response.data?.[0]
      if (firstReservation) {
        navigation.navigate('ReservationDetails', { reservationId: firstReservation.id })
      } else {
        navigation.navigate('ReservationsList')
      }
    } catch (err: any) {
      const message = typeof err === 'string' ? err : err?.message
      showError(message || 'Impossible de finaliser votre panier')
    }
  }

  const goToDiscover = () => {
    navigation.getParent()?.navigate('Discover')
  }

  const goToReservations = () => {
    navigation.navigate('ReservationsList')
  }

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      testID={TEST_IDS.cartScreen}
    >
      <StatusBar barStyle={theme.isDark ? 'light-content' : 'dark-content'} />

      <View style={styles.header}>
        <Typography variant="h2" weight="bold">
          Mon panier
        </Typography>
        <View style={styles.headerActions}>
          {hasItems && (
            <Button
              variant="ghost"
              size="sm"
              onPress={handleClearCart}
              disabled={updating}
              testID={TEST_IDS.cartClearButton}
            >
              Vider
            </Button>
          )}
          <Button
            variant="secondary"
            size="sm"
            onPress={goToReservations}
            leftIcon={<Ionicons name="receipt-outline" size={18} color={theme.colors.textInverse} />}
            testID={TEST_IDS.cartReservationsButton}
          >
            Mes réservations
          </Button>
        </View>
      </View>

      {loading && !cart ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary[500]} />
        </View>
      ) : (
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1 }}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            {activeError && (
              <Card style={[styles.errorCard, { borderColor: theme.colors.error[500] }]}> 
                <Typography variant="body" style={{ color: theme.colors.error[600] }}>
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
                </Card>

                {cart.items.map(item => (
                  <Card key={item.id} style={styles.cartItemCard} testID={TEST_IDS.cartItem(item.id)}>
                    <View style={styles.cartItemHeader}>
                      <View style={styles.cartItemInfo}>
                        <Image
                          source={{ uri: item.product?.image_url || undefined }}
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
                        <Ionicons name="trash-outline" size={20} color={theme.colors.error[500]} />
                      </TouchableOpacity>
                    </View>

                    <View style={styles.cartItemFooter}>
                      <View style={styles.quantityControls}>
                        <TouchableOpacity
                          style={[styles.quantityButton, (updating || item.quantity <= 1) && styles.quantityButtonDisabled]}
                          disabled={updating || item.quantity <= 1}
                          onPress={() => updateQuantity(item, item.quantity - 1)}
                        >
                          <Ionicons name="remove" size={18} color={theme.colors.text} />
                        </TouchableOpacity>
                        <Typography variant="h3" weight="bold" style={{ minWidth: 40, textAlign: 'center' }}>
                          {item.quantity}
                        </Typography>
                        <TouchableOpacity
                          style={[styles.quantityButton, updating && styles.quantityButtonDisabled]}
                          disabled={updating}
                          onPress={() => updateQuantity(item, item.quantity + 1)}
                        >
                          <Ionicons name="add" size={18} color={theme.colors.text} />
                        </TouchableOpacity>
                      </View>

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
                      <TextInput
                        value={customerPhone}
                        onChangeText={setCustomerPhone}
                        placeholder="Ex: +22890000000"
                        placeholderTextColor={theme.colors.neutral[400]}
                        keyboardType="phone-pad"
                        style={[styles.input, { borderColor: theme.colors.borderLight }]}
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
          </ScrollView>
        </KeyboardAvoidingView>
      )}
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
  headerActions: {
    flexDirection: 'row',
    gap: 12,
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
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  quantityButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  quantityButtonDisabled: {
    opacity: 0.5,
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
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    minHeight: 100,
    textAlignVertical: 'top',
    fontSize: 16,
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
