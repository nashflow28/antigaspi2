import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  View,
  TouchableOpacity,
} from 'react-native'
import { Image } from 'expo-image'
import { Ionicons } from '@expo/vector-icons'

import { useTheme } from '../../theme'
import { useToast } from '../../contexts/ToastContext'
import { useAppDispatch, useAppSelector } from '../../store/hooks'
import {
  clearSelectedBasket,
  fetchSurpriseBasketById,
  setSelectedBasket,
} from '../../store/slices/surpriseBasketsSlice'
import { createReservation } from '../../store/slices/reservationsSlice'
import { SurpriseBasket } from '../../types'
import { Button, Badge, Card, Typography, Modal } from '../../components/2025'
import { formatCurrency } from '../../utils/currencyHelpers'
import { getImageUrl } from '../../utils/imageHelpers'
import { TEST_IDS } from '../../utils/testIds'

interface Props {
  route: any
  navigation: any
}

const SurpriseBasketDetailsScreen: React.FC<Props> = ({ route, navigation }) => {
  const { basketId } = route.params
  const theme = useTheme()
  const dispatch = useAppDispatch()
  const { showError, showSuccess } = useToast()
  const { baskets, selectedBasket, loading } = useAppSelector(state => state.surpriseBaskets)

  const [basket, setBasket] = useState<SurpriseBasket | null>(null)
  const [selectedQuantity, setSelectedQuantity] = useState(1)
  const [reserving, setReserving] = useState(false)
  const [confirmVisible, setConfirmVisible] = useState(false)
  const navigationTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const findBasketInStore = useCallback(() => {
    if (selectedBasket && selectedBasket.id === basketId) {
      return selectedBasket
    }

    return baskets.find(item => item.id === basketId) ?? null
  }, [basketId, baskets, selectedBasket])

  const loadBasket = useCallback(async () => {
    const basketFromStore = findBasketInStore()
    if (basketFromStore) {
      setBasket(basketFromStore)
      dispatch(setSelectedBasket(basketFromStore))
      return
    }

    try {
      const result = await dispatch(fetchSurpriseBasketById(basketId)).unwrap()
      setBasket(result)
    } catch (error: any) {
      const message = typeof error === 'string' ? error : error?.message
      showError(message ?? "Impossible de charger ce panier surprise")
      navigation.goBack()
    }
  }, [basketId, dispatch, findBasketInStore, navigation, showError])

  useEffect(() => {
    loadBasket()
  }, [loadBasket])

  useEffect(() => {
    return () => {
      if (navigationTimeoutRef.current) {
        clearTimeout(navigationTimeoutRef.current)
      }
      dispatch(clearSelectedBasket())
    }
  }, [dispatch])

  useEffect(() => {
    if (basket) {
      setSelectedQuantity(1)
    }
  }, [basket?.id])

  const discountedPrice = useMemo(() => {
    if (!basket) return 0
    return Math.round(Number(basket.discounted_price) || 0)
  }, [basket])

  const originalPrice = useMemo(() => {
    if (!basket) return 0
    return Math.round(Number(basket.total_original_value ?? basket.original_price) || 0)
  }, [basket])

  const discountPercentage = useMemo(() => {
    if (!basket || !originalPrice) return basket?.basket_discount_percentage ?? 0
    if (originalPrice === 0) return 0
    return Math.round(((originalPrice - discountedPrice) / originalPrice) * 100)
  }, [basket, discountedPrice, originalPrice])

  const totalPrice = discountedPrice * selectedQuantity

  const basketItems = basket?.surprise_basket_items ?? []

  const handleReserve = async () => {
    if (!basket || reserving) {
      return
    }

    if (basket.quantity_available === 0) {
      showError('Ce panier surprise n\'est plus disponible.')
      return
    }

    setReserving(true)
    try {
      const result = await dispatch(
        createReservation({
          productId: basket.id,
          quantity: selectedQuantity,
          paymentMethod: 'on_site',
          notes: null,
        })
      )

      if (createReservation.fulfilled.match(result)) {
        const reservation = result.payload
        showSuccess('Panier surprise réservé avec succès ! 🎉')

        navigationTimeoutRef.current = setTimeout(() => {
          navigation.navigate('ReservationDetails', {
            reservationId: reservation.data.id,
          })
        }, 1200)
      } else if (createReservation.rejected.match(result)) {
        const message = typeof result.payload === 'string'
          ? result.payload
          : result.error.message
        showError(message ?? 'Impossible de réserver ce panier surprise.')
      }
    } catch (error: any) {
      const message = typeof error === 'string' ? error : error?.message
      showError(message ?? 'Impossible de réserver ce panier surprise.')
    } finally {
      setReserving(false)
      setConfirmVisible(false)
    }
  }

  const confirmReservation = () => {
    if (!basket) {
      return
    }

    if (selectedQuantity > basket.quantity_available) {
      Alert.alert('Quantité indisponible', 'Il ne reste pas assez de paniers disponibles.')
      return
    }

    setConfirmVisible(true)
  }

  if (loading && !basket) {
    return (
      <View style={[styles.center, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator color={theme.colors.primary[500]} />
      </View>
    )
  }

  if (!basket) {
    return (
      <View style={[styles.center, { backgroundColor: theme.colors.background }]}>
        <Typography variant="body">Panier surprise introuvable.</Typography>
      </View>
    )
  }

  const canIncreaseQuantity = selectedQuantity < basket.quantity_available
  const canDecreaseQuantity = selectedQuantity > 1

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}
      testID={TEST_IDS.surpriseBasketDetailsScreen}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Card style={styles.headerCard}>
          <Image
            source={{ uri: getImageUrl(basket.image_url, basket.category?.name) }}
            style={styles.image}
            contentFit="cover"
            transition={200}
          />
          <View style={styles.headerContent}>
            <Typography variant="h2" weight="bold" style={styles.title}>
              {basket.name}
            </Typography>
            {basket.merchant?.business_name ? (
              <Typography variant="body" color="secondary">
                {basket.merchant.business_name}
              </Typography>
            ) : null}
            <View style={styles.priceRow}>
              <Typography variant="h2" weight="bold" color="primary">
                {formatCurrency(discountedPrice)}
              </Typography>
              {discountPercentage ? (
                <Badge variant="success" style={styles.discountBadge}>
                  -{discountPercentage}%
                </Badge>
              ) : null}
            </View>
            <Typography variant="caption" color="secondary">
              Valeur estimée : {formatCurrency(originalPrice)}
            </Typography>
            <Typography variant="caption" color="secondary">
              {basket.quantity_available > 1
                ? `${basket.quantity_available} paniers restants`
                : 'Dernier panier disponible'}
            </Typography>
          </View>
        </Card>

        {basket.surprise_description ? (
          <Card style={styles.sectionCard}>
            <Typography variant="h3" weight="semibold" style={styles.sectionTitle}>
              Ce que vous pourriez découvrir
            </Typography>
            <Typography variant="body" color="secondary">
              {basket.surprise_description}
            </Typography>
          </Card>
        ) : null}

        {basket.description ? (
          <Card style={styles.sectionCard}>
            <Typography variant="h3" weight="semibold" style={styles.sectionTitle}>
              Description du commerçant
            </Typography>
            <Typography variant="body" color="secondary">
              {basket.description}
            </Typography>
          </Card>
        ) : null}

        {basketItems.length > 0 ? (
          <Card style={styles.sectionCard}>
            <Typography variant="h3" weight="semibold" style={styles.sectionTitle}>
              Produits potentiels
            </Typography>
            <View style={styles.itemsList}>
              {basketItems.map(item => (
                <View key={item.id} style={styles.itemRow}>
                  <View style={styles.itemInfo}>
                    <Typography variant="body" weight="medium">
                      {item.product?.name ?? 'Produit mystère'}
                    </Typography>
                    {item.product?.category?.name ? (
                      <Typography variant="caption" color="secondary">
                        {item.product.category.name}
                      </Typography>
                    ) : null}
                  </View>
                  <Typography variant="body" color="secondary">
                    × {item.quantity}
                  </Typography>
                </View>
              ))}
            </View>
          </Card>
        ) : null}

        <Card style={styles.sectionCard}>
          <Typography variant="h3" weight="semibold" style={styles.sectionTitle}>
            Quantité
          </Typography>
          <View style={styles.quantityRow}>
            <TouchableOpacity
              style={[styles.quantityButton, !canDecreaseQuantity && styles.quantityButtonDisabled]}
              disabled={!canDecreaseQuantity}
              onPress={() => setSelectedQuantity(Math.max(1, selectedQuantity - 1))}
            >
              <Ionicons
                name="remove"
                size={20}
                color={canDecreaseQuantity ? theme.colors.primary[600] : theme.colors.neutral[400]}
              />
            </TouchableOpacity>
            <Typography variant="h3" weight="semibold" style={styles.quantityValue}>
              {selectedQuantity}
            </Typography>
            <TouchableOpacity
              style={[styles.quantityButton, !canIncreaseQuantity && styles.quantityButtonDisabled]}
              disabled={!canIncreaseQuantity}
              onPress={() =>
                setSelectedQuantity(prev => Math.min(basket.quantity_available, prev + 1))
              }
            >
              <Ionicons
                name="add"
                size={20}
                color={canIncreaseQuantity ? theme.colors.primary[600] : theme.colors.neutral[400]}
              />
            </TouchableOpacity>
          </View>
        </Card>
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: theme.colors.surface.light }]}
        testID={TEST_IDS.surpriseBasketDetailsFooter}
      >
        <View>
          <Typography variant="caption" color="secondary">
            Total
          </Typography>
          <Typography variant="h2" weight="bold">
            {formatCurrency(totalPrice)}
          </Typography>
        </View>
        <Button
          onPress={confirmReservation}
          disabled={basket.quantity_available === 0 || reserving}
          loading={reserving}
        >
          Réserver
        </Button>
      </View>

      <Modal visible={confirmVisible} onClose={() => setConfirmVisible(false)}>
        <View style={styles.modalContent}>
          <Typography variant="h3" weight="semibold" style={styles.modalTitle}>
            Confirmer la réservation
          </Typography>
          <Typography variant="body" color="secondary" style={styles.modalDescription}>
            {`Voulez-vous réserver ${selectedQuantity} panier${selectedQuantity > 1 ? 's' : ''} pour ${formatCurrency(totalPrice)} ?`}
          </Typography>
          <View style={styles.modalActions}>
            <Button variant="secondary" onPress={() => setConfirmVisible(false)}>
              Annuler
            </Button>
            <Button onPress={handleReserve} loading={reserving}>
              Confirmer
            </Button>
          </View>
        </View>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 120,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCard: {
    marginBottom: 16,
  },
  headerContent: {
    marginTop: 16,
  },
  title: {
    marginBottom: 8,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
  },
  discountBadge: {
    marginLeft: 8,
  },
  sectionCard: {
    marginBottom: 16,
  },
  sectionTitle: {
    marginBottom: 8,
  },
  itemsList: {
    gap: 12,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  itemInfo: {
    flex: 1,
    marginRight: 12,
  },
  quantityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    gap: 16,
  },
  quantityButton: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1F5F9',
  },
  quantityButtonDisabled: {
    opacity: 0.5,
  },
  quantityValue: {
    minWidth: 40,
    textAlign: 'center',
  },
  image: {
    width: '100%',
    height: 220,
    borderRadius: 24,
    backgroundColor: '#f5f5f5',
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalContent: {
    padding: 20,
    gap: 16,
  },
  modalTitle: {
    textAlign: 'center',
  },
  modalDescription: {
    textAlign: 'center',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
})

export default SurpriseBasketDetailsScreen

