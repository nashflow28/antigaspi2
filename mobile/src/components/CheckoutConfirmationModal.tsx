/**
 * CheckoutConfirmationModal - Modal de confirmation de commande
 * Affiche un récapitulatif complet avant validation finale
 * Design cohérent avec le système 2025
 */

import React from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Animated,
  ScrollView,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useTheme } from '../theme'
import { formatCurrency } from '../utils/currencyHelpers'
import { PaymentMethod, Cart } from '../types'
import { PAYMENT_OPTIONS } from '../constants/paymentOptions'

export interface CheckoutConfirmationModalProps {
  visible: boolean
  onClose: () => void
  onConfirm: () => void
  cart: Cart | null
  paymentMethod: PaymentMethod
  pickupDate: string | null
  pickupTime: string
  customerPhone?: string
  notes?: string
  loading?: boolean
}

const CheckoutConfirmationModal: React.FC<CheckoutConfirmationModalProps> = ({
  visible,
  onClose,
  onConfirm,
  cart,
  paymentMethod,
  pickupDate,
  pickupTime,
  customerPhone,
  notes,
  loading = false,
}) => {
  const theme = useTheme()
  const insets = useSafeAreaInsets()
  const fadeAnim = React.useRef(new Animated.Value(0)).current
  const slideAnim = React.useRef(new Animated.Value(300)).current

  React.useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 65,
          friction: 11,
          useNativeDriver: true,
        }),
      ]).start()
    } else {
      fadeAnim.setValue(0)
      slideAnim.setValue(300)
    }
  }, [visible, fadeAnim, slideAnim])

  const paymentOption = PAYMENT_OPTIONS.find(opt => opt.value === paymentMethod)
  const totalItems = cart?.items?.reduce((sum, item) => sum + item.quantity, 0) ?? 0
  const cartTotal = cart?.total ?? 0

  const formatPickupDate = (dateStr: string | null) => {
    if (!dateStr) return 'Non définie'
    const date = new Date(dateStr)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    if (date.toDateString() === today.toDateString()) {
      return "Aujourd'hui"
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Demain'
    }
    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    })
  }

  if (!cart) return null

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      accessibilityViewIsModal={true}
    >
      <Animated.View
        style={[
          styles.overlay,
          {
            backgroundColor: theme.colors.overlay,
            opacity: fadeAnim,
          },
        ]}
      >
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={onClose}
        />
        <Animated.View
          style={[
            styles.container,
            {
              backgroundColor: theme.colors.background,
              paddingBottom: insets.bottom + 16,
              transform: [{ translateY: slideAnim }],
              ...theme.shadows.xl,
            },
          ]}
        >
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="close" size={24} color={theme.colors.text} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
              Confirmer la commande
            </Text>
            <View style={{ width: 40 }} />
          </View>

          <ScrollView
            style={styles.content}
            contentContainerStyle={styles.contentContainer}
            showsVerticalScrollIndicator={false}
          >
            {/* Icon */}
            <View
              style={[
                styles.iconContainer,
                { backgroundColor: theme.withOpacity(theme.colors.primary[500], 0.1) },
              ]}
            >
              <Ionicons name="receipt-outline" size={32} color={theme.colors.primary[500]} />
            </View>

            {/* Merchant Info */}
            <View style={[styles.section, { backgroundColor: theme.colors.surface.light }]}>
              <View style={styles.sectionHeader}>
                <Ionicons name="storefront-outline" size={20} color={theme.colors.primary[500]} />
                <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                  Commerce
                </Text>
              </View>
              <Text style={[styles.merchantName, { color: theme.colors.text }]}>
                {cart.merchant?.name ?? 'Commerce partenaire'}
              </Text>
            </View>

            {/* Order Summary */}
            <View style={[styles.section, { backgroundColor: theme.colors.surface.light }]}>
              <View style={styles.sectionHeader}>
                <Ionicons name="bag-outline" size={20} color={theme.colors.primary[500]} />
                <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                  Articles ({totalItems})
                </Text>
              </View>
              {cart.items.map(item => (
                <View key={item.id} style={styles.orderItem}>
                  <Text style={[styles.itemQuantity, { color: theme.colors.textSecondary }]}>
                    {item.quantity}x
                  </Text>
                  <Text
                    style={[styles.itemName, { color: theme.colors.text }]}
                    numberOfLines={1}
                  >
                    {item.product?.name ?? 'Produit'}
                  </Text>
                  <Text style={[styles.itemPrice, { color: theme.colors.text }]}>
                    {formatCurrency(item.total_price)}
                  </Text>
                </View>
              ))}
              <View style={[styles.totalRow, { borderTopColor: theme.colors.border }]}>
                <Text style={[styles.totalLabel, { color: theme.colors.text }]}>Total</Text>
                <Text style={[styles.totalAmount, { color: theme.colors.primary[500] }]}>
                  {formatCurrency(cartTotal)}
                </Text>
              </View>
            </View>

            {/* Pickup Info */}
            <View style={[styles.section, { backgroundColor: theme.colors.surface.light }]}>
              <View style={styles.sectionHeader}>
                <Ionicons name="time-outline" size={20} color={theme.colors.primary[500]} />
                <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                  Retrait
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>
                  Date
                </Text>
                <Text style={[styles.infoValue, { color: theme.colors.text }]}>
                  {formatPickupDate(pickupDate)}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>
                  Heure
                </Text>
                <Text style={[styles.infoValue, { color: theme.colors.text }]}>
                  {pickupTime}
                </Text>
              </View>
            </View>

            {/* Payment Method */}
            <View style={[styles.section, { backgroundColor: theme.colors.surface.light }]}>
              <View style={styles.sectionHeader}>
                <Ionicons
                  name={paymentOption?.icon ?? 'card-outline'}
                  size={20}
                  color={theme.colors.primary[500]}
                />
                <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                  Paiement
                </Text>
              </View>
              <Text style={[styles.paymentMethodName, { color: theme.colors.text }]}>
                {paymentOption?.label ?? paymentMethod}
              </Text>
              {customerPhone && (
                <Text style={[styles.paymentPhone, { color: theme.colors.textSecondary }]}>
                  {customerPhone}
                </Text>
              )}
            </View>

            {/* Notes */}
            {notes && notes.trim() && (
              <View style={[styles.section, { backgroundColor: theme.colors.surface.light }]}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="document-text-outline" size={20} color={theme.colors.primary[500]} />
                  <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                    Notes
                  </Text>
                </View>
                <Text style={[styles.notesText, { color: theme.colors.textSecondary }]}>
                  {notes}
                </Text>
              </View>
            )}
          </ScrollView>

          {/* Footer Buttons */}
          <View style={[styles.footer, { borderTopColor: theme.colors.border }]}>
            <TouchableOpacity
              style={[
                styles.cancelButton,
                {
                  backgroundColor: theme.isDark
                    ? theme.colors.neutral[700]
                    : theme.colors.neutral[200],
                },
              ]}
              onPress={onClose}
              disabled={loading}
            >
              <Text
                style={[
                  styles.cancelButtonText,
                  {
                    color: theme.isDark
                      ? theme.colors.neutral[100]
                      : theme.colors.neutral[700],
                  },
                ]}
              >
                Annuler
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.confirmButton,
                {
                  backgroundColor: loading
                    ? theme.colors.primary[300]
                    : theme.colors.primary[500],
                },
              ]}
              onPress={onConfirm}
              disabled={loading}
            >
              {loading ? (
                <Text style={styles.confirmButtonText}>Validation...</Text>
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
                  <Text style={styles.confirmButtonText}>
                    Confirmer ({formatCurrency(cartTotal)})
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  container: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    gap: 12,
  },
  iconContainer: {
    alignSelf: 'center',
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  section: {
    padding: 16,
    borderRadius: 16,
    gap: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  merchantName: {
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 28,
  },
  orderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginLeft: 28,
    paddingVertical: 4,
  },
  itemQuantity: {
    fontSize: 14,
    fontWeight: '500',
    minWidth: 24,
  },
  itemName: {
    fontSize: 14,
    flex: 1,
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: '500',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    marginLeft: 28,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: '700',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginLeft: 28,
  },
  infoLabel: {
    fontSize: 14,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  paymentMethodName: {
    fontSize: 15,
    fontWeight: '500',
    marginLeft: 28,
  },
  paymentPhone: {
    fontSize: 13,
    marginLeft: 28,
  },
  notesText: {
    fontSize: 14,
    marginLeft: 28,
    fontStyle: 'italic',
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 16,
    borderTopWidth: 1,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  confirmButton: {
    flex: 2,
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
})

export default CheckoutConfirmationModal
