import React, { useEffect, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  ImageStyle,
  Platform,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useDispatch, useSelector } from 'react-redux'
import { AppDispatch, RootState } from '../../store'
import { fetchReservation, cancelReservation, updateReservationQuantity } from '../../store/slices/reservationsSlice'
import { useToast } from '../../contexts/ToastContext'
import { Ionicons } from '@expo/vector-icons'
import { Image } from 'expo-image'
import { Reservation } from '../../types'
import { useTheme } from '../../theme'
import { getImageUrl } from '../../utils/imageHelpers'
import { formatCurrency } from '../../utils/currencyHelpers'
import { Button, Card, Badge, Typography, Modal } from '../../components/2025'

interface Props {
  route: any
  navigation: any
}

const ReservationDetailsScreen: React.FC<Props> = ({ route, navigation }) => {
  const dispatch = useDispatch<AppDispatch>()
  const theme = useTheme()
  const insets = useSafeAreaInsets()
  const { reservationId } = route.params
  const { showSuccess, showError } = useToast()

  const [reservation, setReservation] = useState<Reservation | null>(null)
  const [loading, setLoading] = useState(true)
  const [cancelling, setCancelling] = useState(false)
  const [modifyModalVisible, setModifyModalVisible] = useState(false)
  const [cancelModalVisible, setCancelModalVisible] = useState(false)
  const [newQuantity, setNewQuantity] = useState(1)
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    loadReservation()
  }, [reservationId])

  const loadReservation = async () => {
    try {
      setLoading(true)
      const result = await dispatch(fetchReservation(reservationId))
      if (fetchReservation.fulfilled.match(result)) {
        setReservation(result.payload as Reservation)
      }
    } catch (error: any) {
      showError('Impossible de charger la réservation')
      navigation.goBack()
    } finally {
      setLoading(false)
    }
  }

  const handleCancelPress = () => {
    setCancelModalVisible(true)
  }

  const handleConfirmCancel = async () => {
    setCancelling(true)
    try {
      await dispatch(cancelReservation(reservationId)).unwrap()
      setCancelModalVisible(false)
      showSuccess('Réservation annulée avec succès ✓')
      navigation.goBack()
    } catch (error) {
      setCancelModalVisible(false)
      showError('Impossible d\'annuler la réservation')
    } finally {
      setCancelling(false)
    }
  }

  const handleOpenModifyModal = () => {
    if (reservation) {
      setNewQuantity(reservation.quantity)
      setModifyModalVisible(true)
    }
  }

  const handleUpdateQuantity = async () => {
    if (!reservation || newQuantity === reservation.quantity) {
      setModifyModalVisible(false)
      return
    }

    setUpdating(true)
    try {
      const result = await dispatch(updateReservationQuantity({
        id: reservationId,
        quantity: newQuantity
      })).unwrap()

      setReservation(result)
      showSuccess('Quantité mise à jour avec succès')
      setModifyModalVisible(false)
    } catch (error: any) {
      showError(error || 'Impossible de modifier la quantité')
    } finally {
      setUpdating(false)
    }
  }

  const maxQuantity = reservation?.product?.quantity_available
    ? reservation.product.quantity_available + reservation.quantity
    : 10

  if (loading || !reservation) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.colors.background, alignItems: 'center', justifyContent: 'center' }}>
        <Typography variant="body">Chargement...</Typography>
      </View>
    )
  }

  const unitPrice = reservation.product.discounted_price
    ? (typeof reservation.product.discounted_price === 'number'
        ? Math.round(reservation.product.discounted_price || 0)
        : Math.round(parseFloat(reservation.product.discounted_price) || 0))
    : 0
  const totalPrice = unitPrice * reservation.quantity

  const styles = createStyles(theme)

  return (
    <View style={styles.container}>
      <StatusBar barStyle={theme.isDark ? 'light-content' : 'dark-content'} />

      <ScrollView style={styles.scrollView}>
        {/* Header with safe area padding */}
        <View style={[styles.header, { paddingTop: Math.max(insets.top, 16) + 8 }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
          </TouchableOpacity>
          <Typography variant="h3" weight="semibold" style={{ flex: 1, textAlign: 'center' }}>
            Détails de la réservation
          </Typography>
          <View style={{ width: 40 }} />
        </View>

        {/* Product Info */}
        <Card variant="elevated" style={{ margin: 16 }}>
          <View style={styles.productCard}>
            <Image
              source={{ uri: getImageUrl(reservation.product.image_url) }}
              style={styles.productImage as ImageStyle}
              contentFit="cover"
            />
            <View style={styles.productInfo}>
              <Typography variant="body" weight="semibold" numberOfLines={2} style={{ marginBottom: 4 }}>
                {reservation.product.name}
              </Typography>
              <Typography variant="body" color="secondary">
                {reservation.product.merchant?.name}
              </Typography>
            </View>
          </View>
        </Card>

        {/* Reservation Details */}
        <Card variant="elevated" style={{ margin: 16, padding: 16 }}>
          <Typography variant="h4" weight="bold" style={{ marginBottom: 16 }}>
            Informations de réservation
          </Typography>

          <View style={styles.detailRow}>
            <Ionicons name="cube-outline" size={20} color={theme.colors.textSecondary} />
            <Typography variant="body" color="secondary" style={{ flex: 1 }}>
              Quantité :
            </Typography>
            <Typography variant="body" weight="semibold">
              {reservation.quantity}
            </Typography>
          </View>

          <View style={styles.detailRow}>
            <Ionicons name="cash-outline" size={20} color={theme.colors.textSecondary} />
            <Typography variant="body" color="secondary" style={{ flex: 1 }}>
              Prix unitaire :
            </Typography>
            <Typography variant="body" weight="semibold">
              {formatCurrency(unitPrice)}
            </Typography>
          </View>

          <View style={styles.detailRow}>
            <Ionicons name="wallet-outline" size={20} color={theme.colors.textSecondary} />
            <Typography variant="body" color="secondary" style={{ flex: 1 }}>
              Total :
            </Typography>
            <Typography variant="h4" weight="bold" color="primary">
              {formatCurrency(totalPrice)}
            </Typography>
          </View>

          <View style={styles.detailRow}>
            <Ionicons name="card-outline" size={20} color={theme.colors.textSecondary} />
            <Typography variant="body" color="secondary" style={{ flex: 1 }}>
              Paiement :
            </Typography>
            <Typography variant="body" weight="semibold">
              {(() => {
                const method = reservation.latest_payment?.payment_method
                if (!method) return 'Non défini'
                if (method === 'on_site') return 'Sur place' // Legacy
                if (method === 'wallet') return 'Portefeuille'
                if (method === 'flooz') return 'Flooz'
                if (method === 'tmoney') return 'Mixx by Yas'
                if (method === 'orange_money' || method === 'mtn_momo') return 'Mobile Money' // Legacy
                if (method === 'paystack') return 'Carte bancaire'
                return 'En ligne'
              })()}
            </Typography>
          </View>

        </Card>

        {/* Timeline des étapes - NOUVELLE SECTION */}
        <Card variant="elevated" style={{ margin: 16, padding: 16 }}>
          <Typography variant="h4" weight="bold" style={{ marginBottom: 16 }}>
            Suivi de la réservation
          </Typography>

          {/* Étape 1: Réservation créée */}
          <View style={styles.timelineStep}>
            <View style={[styles.timelineDot, { backgroundColor: theme.colors.success }]}>
              <Ionicons name="checkmark" size={16} color={theme.colors.textInverse} />
            </View>
            <View style={styles.timelineContent}>
              <Typography variant="body" weight="semibold">Réservation créée</Typography>
              <Typography variant="caption" color="secondary">
                {new Date(reservation.created_at || new Date()).toLocaleDateString('fr-FR', {
                  day: 'numeric',
                  month: 'long',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </Typography>
            </View>
          </View>

          {/* Ligne de connexion */}
          {['confirmed', 'ready', 'completed'].includes(reservation.status) && (
            <View style={[styles.timelineLine, { backgroundColor: theme.colors.success }]} />
          )}
          {reservation.status === 'pending' && (
            <View style={[styles.timelineLine, { backgroundColor: theme.colors.neutral[200] }]} />
          )}

          {/* Étape 2: Confirmation commerçant */}
          <View style={styles.timelineStep}>
            <View style={[
              styles.timelineDot,
              { backgroundColor: ['confirmed', 'ready', 'completed'].includes(reservation.status) ? theme.colors.success : reservation.status === 'pending' ? theme.colors.warning : theme.colors.neutral[300] }
            ]}>
              {['confirmed', 'ready', 'completed'].includes(reservation.status) ? (
                <Ionicons name="checkmark" size={16} color={theme.colors.textInverse} />
              ) : reservation.status === 'pending' ? (
                <Ionicons name="time" size={16} color={theme.colors.textInverse} />
              ) : (
                <Ionicons name="close" size={16} color={theme.colors.textInverse} />
              )}
            </View>
            <View style={styles.timelineContent}>
              <Typography variant="body" weight="semibold">
                {['confirmed', 'ready', 'completed'].includes(reservation.status) ? '✓ Confirmé par le commerçant' : reservation.status === 'pending' ? '⏳ En attente de confirmation' : '✗ Non confirmé'}
              </Typography>
              {reservation.confirmed_at && (
                <Typography variant="caption" color="secondary">
                  {new Date(reservation.confirmed_at).toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'long',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </Typography>
              )}
              {!reservation.confirmed_at && reservation.status === 'pending' && (
                <Typography variant="caption" style={{ color: theme.colors.warning }}>
                  Le commerçant va confirmer votre réservation sous peu
                </Typography>
              )}
            </View>
          </View>

          {/* Ligne de connexion */}
          {['ready', 'completed'].includes(reservation.status) && (
            <View style={[styles.timelineLine, { backgroundColor: theme.colors.success }]} />
          )}
          {['pending', 'confirmed'].includes(reservation.status) && (
            <View style={[styles.timelineLine, { backgroundColor: theme.colors.neutral[200] }]} />
          )}

          {/* Étape 3: Produit retiré */}
          <View style={styles.timelineStep}>
            <View style={[
              styles.timelineDot,
              { backgroundColor: reservation.status === 'completed' ? theme.colors.success : ['ready'].includes(reservation.status) ? theme.colors.primary[500] : theme.colors.neutral[300] }
            ]}>
              {reservation.status === 'completed' ? (
                <Ionicons name="checkmark" size={16} color={theme.colors.textInverse} />
              ) : ['ready'].includes(reservation.status) ? (
                <Ionicons name="cube" size={16} color={theme.colors.textInverse} />
              ) : (
                <Ionicons name="cube-outline" size={16} color={theme.colors.textInverse} />
              )}
            </View>
            <View style={styles.timelineContent}>
              <Typography variant="body" weight="semibold">
                {reservation.status === 'completed' ? '✓ Produit retiré' : ['ready'].includes(reservation.status) ? '📍 Prêt pour retrait' : 'Retrait en attente'}
              </Typography>
              {reservation.completed_at && (
                <Typography variant="caption" color="secondary">
                  {new Date(reservation.completed_at).toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'long',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </Typography>
              )}
              {reservation.status === 'ready' && (
                <Typography variant="caption" style={{ color: theme.colors.primary[600] }}>
                  Présentez votre code QR au commerçant
                </Typography>
              )}
            </View>
          </View>

          {/* Badge de statut global */}
          <View style={{ marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: theme.colors.border }}>
            <Badge
              variant={
                reservation.status === 'pending' ? 'warning' :
                reservation.status === 'confirmed' ? 'success' :
                reservation.status === 'ready' ? 'primary' :
                reservation.status === 'completed' ? 'success' :
                reservation.status === 'cancelled' ? 'error' :
                reservation.status === 'expired' ? 'error' : 'neutral'
              }
              size="md"
              style={{ alignSelf: 'center' }}
            >
              {reservation.status === 'pending' ? '⏳ Confirmation commerçant' :
                reservation.status === 'confirmed' ? '✓ Confirmée - À retirer' :
                reservation.status === 'ready' ? '✓ Prête pour retrait' :
                reservation.status === 'completed' ? '✓ Produit retiré' :
                reservation.status === 'cancelled' ? '✗ Annulée' :
                reservation.status === 'expired' ? '✗ Expirée' : reservation.status}
            </Badge>
          </View>
        </Card>

        {/* Actions */}
        {(reservation.status === 'pending' || reservation.status === 'confirmed') && (
          <View style={{ margin: 16, gap: 12 }}>
            {/* Modify button - only for pending reservations */}
            {reservation.status === 'pending' && (
              <Button
                variant="secondary"
                size="md"
                onPress={handleOpenModifyModal}
                disabled={updating}
                leftIcon={<Ionicons name="create-outline" size={20} color={theme.colors.primary[600]} />}
                style={{ width: '100%' }}
              >
                Modifier la quantité
              </Button>
            )}

            {/* Delivery button - for confirmed reservations */}
            {reservation.status === 'confirmed' && (
              <Button
                variant="primary"
                size="md"
                onPress={() => navigation.navigate('DeliveryRequest', { reservationId: reservation.id })}
                leftIcon={<Ionicons name="bicycle" size={20} color="#FFFFFF" />}
                style={{ width: '100%' }}
              >
                Demander une livraison
              </Button>
            )}

            <Button
              variant="destructive"
              size="md"
              onPress={handleCancelPress}
              disabled={cancelling}
              leftIcon={<Ionicons name="close-circle-outline" size={20} color={theme.colors.error} />}
              style={{ width: '100%' }}
            >
              Annuler la réservation
            </Button>
          </View>
        )}
      </ScrollView>

      {/* Cancel Confirmation Modal */}
      <Modal
        visible={cancelModalVisible}
        onClose={() => !cancelling && setCancelModalVisible(false)}
        variant="center"
        showCloseButton={false}
        dismissable={!cancelling}
      >
        <View style={styles.cancelModalContent}>
          {/* Warning Icon */}
          <View style={styles.cancelIconContainer}>
            <Ionicons name="warning" size={48} color={theme.colors.error} />
          </View>

          {/* Title */}
          <Typography variant="h3" weight="bold" style={styles.cancelModalTitle}>
            Annuler la réservation ?
          </Typography>

          {/* Message */}
          <Typography variant="body" color="secondary" style={styles.cancelModalMessage}>
            Cette action est irréversible. Le produit sera remis en vente et vous ne pourrez plus récupérer cette réservation.
          </Typography>

          {/* Reservation Info Summary */}
          {reservation && (
            <View style={styles.cancelModalSummary}>
              <View style={styles.cancelModalSummaryRow}>
                <Typography variant="caption" color="secondary">Produit</Typography>
                <Typography variant="caption" weight="semibold" numberOfLines={1} style={{ flex: 1, textAlign: 'right' }}>
                  {reservation.product?.name}
                </Typography>
              </View>
              <View style={styles.cancelModalSummaryRow}>
                <Typography variant="caption" color="secondary">Quantité</Typography>
                <Typography variant="caption" weight="semibold">{reservation.quantity}</Typography>
              </View>
              <View style={styles.cancelModalSummaryRow}>
                <Typography variant="caption" color="secondary">Total</Typography>
                <Typography variant="caption" weight="bold" color="primary">
                  {formatCurrency(unitPrice * reservation.quantity)}
                </Typography>
              </View>
            </View>
          )}

          {/* Action Buttons */}
          <View style={styles.cancelModalActions}>
            <Button
              variant="secondary"
              size="lg"
              onPress={() => setCancelModalVisible(false)}
              disabled={cancelling}
              style={{ flex: 1 }}
            >
              Non
            </Button>
            <Button
              variant="destructive"
              size="lg"
              onPress={handleConfirmCancel}
              disabled={cancelling}
              style={{ flex: 1 }}
              leftIcon={cancelling ? undefined : <Ionicons name="trash-outline" size={18} color="#fff" />}
            >
              {cancelling ? 'Annulation...' : 'Oui'}
            </Button>
          </View>
        </View>
      </Modal>

      {/* Modify Quantity Modal */}
      <Modal
        visible={modifyModalVisible}
        onClose={() => setModifyModalVisible(false)}
        title="Modifier la quantité"
        variant="center"
      >
        {/* Product Info */}
        <View style={styles.modifyModalProduct}>
          <Image
            source={{ uri: getImageUrl(reservation.product?.image_url) }}
            style={styles.modifyModalImage as ImageStyle}
            contentFit="cover"
          />
          <View style={{ flex: 1 }}>
            <Typography variant="body" weight="semibold" numberOfLines={2}>
              {reservation.product?.name}
            </Typography>
            <Typography variant="caption" color="secondary">
              Prix unitaire: {formatCurrency(unitPrice)}
            </Typography>
          </View>
        </View>

        {/* Quantity Selector */}
        <View style={styles.modifyQuantitySection}>
          <Typography variant="body" weight="semibold" style={{ marginBottom: 12, textAlign: 'center' }}>
            Nouvelle quantité
          </Typography>
          <View style={styles.modifyQuantityControls}>
            <TouchableOpacity
              style={[styles.modifyQuantityButton, newQuantity <= 1 && styles.modifyQuantityButtonDisabled]}
              disabled={newQuantity <= 1}
              onPress={() => setNewQuantity(Math.max(1, newQuantity - 1))}
            >
              <Ionicons name="remove" size={24} color={newQuantity <= 1 ? theme.colors.neutral[400] : theme.colors.primary[600]} />
            </TouchableOpacity>

            <View style={styles.modifyQuantityValue}>
              <Typography variant="h2" weight="bold">
                {newQuantity}
              </Typography>
            </View>

            <TouchableOpacity
              style={[styles.modifyQuantityButton, newQuantity >= maxQuantity && styles.modifyQuantityButtonDisabled]}
              disabled={newQuantity >= maxQuantity}
              onPress={() => setNewQuantity(Math.min(maxQuantity, newQuantity + 1))}
            >
              <Ionicons name="add" size={24} color={newQuantity >= maxQuantity ? theme.colors.neutral[400] : theme.colors.primary[600]} />
            </TouchableOpacity>
          </View>
          <Typography variant="caption" color="secondary" style={{ textAlign: 'center', marginTop: 8 }}>
            Quantité actuelle: {reservation.quantity} | Max disponible: {maxQuantity}
          </Typography>
        </View>

        {/* New Total */}
        <View style={styles.modifyTotalSection}>
          <Typography variant="body" color="secondary">
            Nouveau total:
          </Typography>
          <Typography variant="h3" weight="bold" color="primary">
            {formatCurrency(unitPrice * newQuantity)}
          </Typography>
        </View>

        {/* Actions */}
        <View style={styles.modifyActions}>
          <Button
            variant="ghost"
            size="lg"
            onPress={() => setModifyModalVisible(false)}
            style={{ flex: 1 }}
          >
            Non
          </Button>
          <Button
            variant="primary"
            size="lg"
            onPress={handleUpdateQuantity}
            disabled={updating || newQuantity === reservation.quantity}
            style={{ flex: 2 }}
            leftIcon={<Ionicons name="checkmark-circle" size={20} color={theme.colors.textInverse} />}
          >
            {updating ? 'Mise à jour...' : 'Oui'}
          </Button>
        </View>
      </Modal>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  productCard: {
    flexDirection: 'row',
    padding: 12,
  },
  productImage: {
    width: 100,
    height: 100,
    borderRadius: 8,
    marginRight: 12,
  },
  productInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  // Timeline styles
  timelineStep: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  timelineDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  timelineLine: {
    width: 2,
    height: 40,
    marginLeft: 15,
    marginVertical: 4,
  },
  timelineContent: {
    flex: 1,
    paddingBottom: 4,
  },
  // Modify modal styles
  modifyModalProduct: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: theme.isDark ? theme.colors.neutral[800] : theme.colors.surface.muted,
    borderRadius: 12,
    marginBottom: 20,
    gap: 12,
  },
  modifyModalImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  modifyQuantitySection: {
    backgroundColor: theme.isDark ? theme.colors.neutral[800] : theme.colors.surface.muted,
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
  },
  modifyQuantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
  },
  modifyQuantityButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.isDark ? theme.colors.neutral[700] : theme.colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: theme.isDark ? theme.colors.primary[400] : theme.colors.primary[200],
  },
  modifyQuantityButtonDisabled: {
    backgroundColor: theme.isDark ? theme.colors.neutral[800] : theme.colors.neutral[100],
    borderColor: theme.isDark ? theme.colors.neutral[600] : theme.colors.neutral[200],
  },
  modifyQuantityValue: {
    minWidth: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modifyTotalSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: theme.isDark ? theme.colors.neutral[800] : theme.colors.primary[50],
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: theme.isDark ? 1 : 0,
    borderColor: theme.colors.primary[500],
  },
  modifyActions: {
    flexDirection: 'row',
    gap: 12,
  },
  // Cancel modal styles
  cancelModalContent: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  cancelIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: `${theme.colors.error}15`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  cancelModalTitle: {
    textAlign: 'center',
    marginBottom: 8,
  },
  cancelModalMessage: {
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
  },
  cancelModalSummary: {
    width: '100%',
    backgroundColor: theme.isDark ? theme.colors.neutral[800] : theme.colors.surface.muted,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    gap: 12,
  },
  cancelModalSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cancelModalActions: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
})

export default ReservationDetailsScreen
