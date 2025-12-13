import React, { useEffect, useState } from 'react'
import {
  View,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  FlatList,
  RefreshControl,
  Dimensions,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useDispatch, useSelector } from 'react-redux'
import { AppDispatch, RootState } from '../../store'
import {
  fetchMyReservations,
  cancelReservation,
  // markReservationSyncPending retiré - reducer offline désactivé (Bug #24)
} from '../../store/slices/reservationsSlice'
import { Ionicons } from '@expo/vector-icons'
import { Image } from 'expo-image'
import QRCode from 'react-native-qrcode-svg'
import { Reservation } from '../../types'
// import offlineService from '../../services/offlineService'
import analyticsService from '../../services/analyticsService'
import { Button, Card, Badge, Typography, Modal as Modal2025, ReservationListSkeleton, EmptyState } from '../../components/2025'
import { useTheme } from '../../theme'
import { TEST_IDS } from '../../utils/testIds'
import { getImageUrl } from '../../utils/imageHelpers'
import AlertModal from '../../components/AlertModal'
import { useAlert } from '../../hooks/useAlert'

interface Props {
  navigation: any
}

const { width } = Dimensions.get('window')

const ReservationsScreen: React.FC<Props> = ({ navigation }) => {
  const theme = useTheme()
  const insets = useSafeAreaInsets()
  const dispatch = useDispatch<AppDispatch>()
  const { reservations, loading } = useSelector((state: RootState) => state.reservations)
  const { user } = useSelector((state: RootState) => state.auth)
  const { alertProps, showError, showSuccess, showWarning, hideAlert } = useAlert()

  console.log('🔍 [ReservationsScreen] Current state:', {
    reservationsCount: reservations.length,
    loading,
    userId: user?.id,
    userEmail: user?.email,
    reservationIds: reservations.map(r => r.id)
  })

  const [refreshing, setRefreshing] = useState(false)
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null)
  const [showQRModal, setShowQRModal] = useState(false)
  const [activeTab, setActiveTab] = useState<'active' | 'completed' | 'cancelled'>('active')

  useEffect(() => {
    console.log('🔵 [ReservationsScreen] Component mounted - loading reservations...')
    void loadReservations('initial')
  }, [])

  const loadReservations = async (
    source: 'initial' | 'refresh' | 'reload' = 'initial'
  ) => {
    console.log(`📤 [ReservationsScreen] Loading reservations (source: ${source})...`)
    const result = await dispatch(fetchMyReservations())

    console.log('📥 [ReservationsScreen] Dispatch result:', {
      type: result.type,
      isFullfilled: fetchMyReservations.fulfilled.match(result),
      isRejected: fetchMyReservations.rejected.match(result),
    })

    if (fetchMyReservations.fulfilled.match(result)) {
      console.log('✅ [ReservationsScreen] Reservations loaded successfully:', {
        total: result.payload.length,
        items: result.payload.map(r => ({ id: r.id, code: r.reservation_code, status: r.status }))
      })
      void analyticsService.track('Reservations Loaded', 'Reservation', {
        total: result.payload.length,
        source,
      })
    } else if (fetchMyReservations.rejected.match(result)) {
      console.error('❌ [ReservationsScreen] Failed to load reservations:', result.payload ?? result.error?.message)
      showError('Erreur', 'Impossible de charger les réservations')
      void analyticsService.track('Reservations Load Failed', 'Reservation', {
        source,
        reason: result.payload ?? result.error?.message ?? 'unknown',
      })
    }
  }

  const onRefresh = async () => {
    setRefreshing(true)
    await loadReservations('refresh')
    void analyticsService.track('Reservations Refreshed', 'Reservation')
    setRefreshing(false)
  }

  const handleTabChange = (tab: 'active' | 'completed' | 'cancelled') => {
    setActiveTab(tab)
    void analyticsService.track('Reservations Tab Changed', 'Reservation', {
      tab,
    })
  }

  const handleCancelReservation = (reservation: Reservation) => {
    showWarning(
      'Annuler la réservation',
      `Êtes-vous sûr de vouloir annuler la réservation ${reservation.reservation_code} ?`,
      [
        { text: 'Non', style: 'cancel', onPress: hideAlert },
        {
          text: 'Oui, annuler',
          style: 'destructive',
          onPress: async () => {
            hideAlert()
            try {
              await dispatch(cancelReservation(reservation.id))
              showSuccess('Succès', 'Réservation annulée avec succès')
              void analyticsService.track('Reservation Cancelled', 'Reservation', {
                reservationCode: reservation.reservation_code,
                status: 'success',
              })
              await loadReservations('reload')
            } catch (error) {
              showError('Erreur', 'Impossible d\'annuler la réservation')
              if (error instanceof Error) {
                void analyticsService.trackError(error, 'cancelReservation')
              }
            }
          }
        }
      ]
    )
  }

  const showQRCode = (reservation: Reservation) => {
    setSelectedReservation(reservation)
    setShowQRModal(true)
    void analyticsService.track('Reservation QR Viewed', 'Reservation', {
      reservationCode: reservation.reservation_code,
      status: reservation.status,
    })
  }

  const getStatusText = (reservation: Reservation) => {
    if (reservation.pendingSync) {
      if (reservation.pendingAction === 'delete') {
        return 'Annulation en attente'
      }
      return 'Synchronisation en attente'
    }

    switch (reservation.status) {
      case 'pending': return '⏳ En attente'
      case 'confirmed': return '✓ Confirmée'
      case 'ready': return '✓ Prête'
      case 'completed': return '✓ Terminée'
      case 'cancelled': return '✗ Annulée'
      case 'expired': return '✗ Expirée'
      default: return reservation.status
    }
  }

  const getPaymentStatusText = (status?: string) => {
    switch (status) {
      case 'pending': return 'En attente'
      case 'completed':
      case 'success': return 'Payé'
      case 'failed': return 'Échec'
      case 'refunded': return 'Remboursé'
      default: return 'Non payé'
    }
  }

  const filteredReservations = reservations.filter(reservation => {
    switch (activeTab) {
      case 'active':
        return ['pending', 'confirmed', 'ready'].includes(reservation.status)
      case 'completed':
        return reservation.status === 'completed'
      case 'cancelled':
        return ['cancelled', 'expired'].includes(reservation.status)
      default:
        return true
    }
  })

  // Format de date standardisé pour l'Afrique francophone
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatPickupDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    })
  }

  const formatPickupTime = (timeString: string) => {
    // Gère les formats ISO (2025-12-08T10:00:00.000000Z) ou simples (10:00)
    if (timeString.includes('T')) {
      const date = new Date(timeString)
      const hours = date.getHours().toString().padStart(2, '0')
      const minutes = date.getMinutes().toString().padStart(2, '0')
      return `${hours}h${minutes}`
    }
    // Format simple HH:MM
    const [hours, minutes] = timeString.split(':')
    return `${hours}h${minutes || '00'}`
  }

  const isPickupCompleted = (reservation: Reservation) => {
    return reservation.status === 'completed'
  }

  const canCancel = (reservation: Reservation) => {
    if (reservation.pendingSync) {
      return false
    }
    return ['pending', 'confirmed'].includes(reservation.status)
  }

  const canShowQR = (reservation: Reservation) => {
    return ['confirmed', 'ready'].includes(reservation.status)
  }

  const getStatusVariant = (reservation: Reservation): 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'neutral' => {
    if (reservation.pendingSync) return 'warning'
    switch (reservation.status) {
      case 'pending': return 'warning'
      case 'confirmed': case 'ready': return 'primary'
      case 'completed': return 'success'
      case 'cancelled': case 'expired': return 'error'
      default: return 'neutral'
    }
  }

  const getPaymentVariant = (status?: string): 'success' | 'warning' | 'error' | 'neutral' => {
    switch (status) {
      case 'pending': return 'warning'
      case 'completed': case 'success': return 'success'
      case 'failed': return 'error'
      case 'refunded': return 'neutral'
      default: return 'neutral'
    }
  }

  const renderReservation = ({ item, index }: { item: Reservation; index: number }) => (
    <Card
      variant="elevated"
      style={{ marginBottom: theme.spacing.sm, padding: theme.spacing.md }}
      testID={TEST_IDS.reservationCard(index)}
      accessibilityLabel={`Réservation ${item.reservation_code}`}
    >
      {/* Header de la réservation */}
      <View style={styles.reservationHeader}>
        <View>
          <Typography variant="body" weight="semibold">
            #{item.reservation_code}
          </Typography>
          <Typography variant="caption" color="secondary" style={{ marginTop: theme.spacing.xs }}>
            {formatDate(item.created_at || '')}
          </Typography>
        </View>
        <View style={styles.statusContainer}>
          <Badge variant={getStatusVariant(item)} size="sm">
            {getStatusText(item)}
          </Badge>
          {item.payment_status && !item.pendingSync && (
            <Badge variant={getPaymentVariant(item.payment_status)} size="sm" style={{ marginTop: theme.spacing.xs }}>
              {getPaymentStatusText(item.payment_status)}
            </Badge>
          )}
        </View>
      </View>

      {item.pendingSync && (
        <Typography
          variant="caption"
          style={{ color: item.pendingAction === 'delete' ? theme.colors.warning : theme.colors.info, marginBottom: theme.spacing.sm }}
        >
          {item.pendingAction === 'delete'
            ? 'Annulation en attente de synchronisation'
            : 'Créée hors ligne - envoi automatique dès connexion'}
        </Typography>
      )}

      {/* Produit */}
      <View style={[styles.productSection, { marginBottom: theme.spacing.sm }]}>
        <View style={[styles.productImage, { marginRight: theme.spacing.sm }]}>
          <Image
            source={{ uri: getImageUrl(item.product.image_url) }}
            style={styles.image}
            contentFit="cover"
          />
        </View>
        <View style={styles.productInfo}>
          <Typography variant="body" weight="semibold" style={{ marginBottom: theme.spacing.xs }}>
            {item.product?.name || 'Produit inconnu'}
          </Typography>
          <Typography variant="caption" color="secondary" style={{ marginBottom: theme.spacing.sm }}>
            {item.product?.merchant?.name || 'Commerçant'}
          </Typography>
          <View style={styles.quantityPriceContainer}>
            <Typography variant="caption" color="secondary">
              Quantité: {item.quantity}
            </Typography>
            <Typography variant="body" weight="bold" color="primary">
              {Math.round(item.total_amount || 0).toLocaleString()} F CFA
            </Typography>
          </View>
        </View>
      </View>

      {/* Informations de retrait */}
      {(item.pickup_date || item.pickup_time) && (
        <View style={[styles.pickupSection, { paddingTop: theme.spacing.sm, borderTopWidth: 1, borderTopColor: theme.colors.border, marginBottom: theme.spacing.sm }]}>
          <Ionicons name="calendar-outline" size={16} color={theme.colors.neutral[500]} />
          <Typography variant="caption" color="secondary" style={{ marginLeft: theme.spacing.sm }}>
            {isPickupCompleted(item) ? 'Retrait:' : 'Retrait prévu:'} {item.pickup_date && formatPickupDate(item.pickup_date)}
            {item.pickup_time && ` à ${formatPickupTime(item.pickup_time)}`}
          </Typography>
        </View>
      )}

      {/* Notes */}
      {item.notes && (
        <View style={[styles.notesSection, { marginBottom: theme.spacing.sm }]}>
          <Ionicons name="document-text-outline" size={16} color={theme.colors.neutral[500]} />
          <Typography variant="caption" color="secondary" style={{ marginLeft: theme.spacing.sm, flex: 1 }}>
            {item.notes}
          </Typography>
        </View>
      )}

      {/* Actions */}
      <View style={[styles.actionsContainer, { gap: theme.spacing.sm, marginTop: theme.spacing.sm, paddingTop: theme.spacing.sm, borderTopWidth: 1, borderTopColor: theme.colors.border }]}>
        {canShowQR(item) && (
          <Button
            variant="primary"
            size="sm"
            onPress={() => showQRCode(item)}
            leftIcon={<Ionicons name="qr-code-outline" size={16} color={theme.colors.textInverse} />}
            testID={`show-qr-${item.id}`}
            accessibilityLabel={`Afficher QR code pour ${item.reservation_code}`}
          >
            QR Code
          </Button>
        )}

        <Button
          variant="secondary"
          size="sm"
          onPress={() => navigation.navigate('ReservationDetails', { reservationId: item.id })}
          leftIcon={<Ionicons name="eye-outline" size={16} color={theme.colors.primary[500]} />}
          testID={`view-reservation-${item.id}`}
          accessibilityLabel={`Voir détails réservation ${item.reservation_code}`}
        >
          Voir
        </Button>

        {canCancel(item) && (
          <Button
            variant="destructive"
            size="sm"
            onPress={() => handleCancelReservation(item)}
            leftIcon={<Ionicons name="close-outline" size={16} color={theme.colors.textInverse} />}
            testID={TEST_IDS.cancelReservationButton(item.id)}
            accessibilityLabel={`Annuler réservation ${item.reservation_code}`}
          >
            Annuler
          </Button>
        )}
      </View>
    </Card>
  )

  const renderEmpty = () => {
    const getEmptyDescription = () => {
      switch (activeTab) {
        case 'active': return 'Vous n\'avez aucune réservation active. Découvrez les offres disponibles !'
        case 'completed': return 'Vous n\'avez aucune réservation terminée pour le moment.'
        case 'cancelled': return 'Vous n\'avez aucune réservation annulée.'
        default: return 'Aucune réservation trouvée.'
      }
    }

    return (
      <View testID={TEST_IDS.emptyState}>
        <EmptyState
          variant="no-reservations"
          description={getEmptyDescription()}
          compact
          actions={activeTab === 'active' ? [
            {
              label: 'Parcourir les produits',
              icon: 'basket-outline',
              onPress: () => navigation.getParent()?.navigate('Discover'),
            },
          ] : []}
        />
      </View>
    )
  }

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      testID={TEST_IDS.reservationsScreen}
    >
      <StatusBar backgroundColor={theme.colors.primary[500]} barStyle="light-content" />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.colors.primary[500], paddingHorizontal: theme.spacing.lg, paddingTop: insets.top + 16, paddingBottom: theme.spacing.lg }]}>
        <Typography variant="h2" weight="bold" style={{ color: theme.colors.textInverse, marginBottom: theme.spacing.xs }}>
          Mes réservations
        </Typography>
        <Typography variant="caption" style={{ color: theme.colors.textInverse, opacity: 0.9 }}>
          {/* 🐛 BUG FIX #67: Show filtered count instead of total unfiltered count */}
          {filteredReservations.length} réservation(s){filteredReservations.length !== reservations.length && ` (${reservations.length} au total)`}
        </Typography>
      </View>

      {/* Tabs */}
      <Card variant="elevated" style={{ marginHorizontal: theme.spacing.md, marginTop: theme.spacing.md, padding: theme.spacing.xs }}>
        <View style={styles.tabsContainer}>
          {[
            { key: 'active', label: 'Actives', count: reservations.filter(r => ['pending', 'confirmed', 'ready'].includes(r.status)).length },
            { key: 'completed', label: 'Terminées', count: reservations.filter(r => r.status === 'completed').length },
            { key: 'cancelled', label: 'Annulées', count: reservations.filter(r => ['cancelled', 'expired'].includes(r.status)).length },
          ].map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[
                styles.tab,
                { flex: 1, paddingVertical: theme.spacing.sm, alignItems: 'center', borderRadius: theme.radius.md },
                activeTab === tab.key && { backgroundColor: theme.colors.primary[500] }
              ]}
              onPress={() => handleTabChange(tab.key as any)}
              testID={`tab-${tab.key}`}
              accessibilityLabel={`${tab.label} (${tab.count})`}
            >
              <Typography variant="caption" weight="medium" style={{ color: activeTab === tab.key ? theme.colors.textInverse : theme.colors.neutral[600] }}>
                {tab.label}
              </Typography>
              <Typography variant="caption" style={{ color: activeTab === tab.key ? theme.colors.textInverse : theme.colors.neutral[400], opacity: activeTab === tab.key ? 0.9 : 1, marginTop: theme.spacing.xs }}>
                {tab.count}
              </Typography>
            </TouchableOpacity>
          ))}
        </View>
      </Card>

      {/* Liste des réservations */}
      {loading && reservations.length === 0 ? (
        <View style={styles.listContent}>
          <ReservationListSkeleton count={4} />
        </View>
      ) : (
        <FlatList
          data={filteredReservations}
          renderItem={renderReservation}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          testID={TEST_IDS.reservationsList}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[theme.colors.primary[500]]}
              tintColor={theme.colors.primary[500]}
            />
          }
          ListEmptyComponent={renderEmpty}
        />
      )}

      {/* Modal QR Code */}
      <Modal2025
        visible={showQRModal}
        variant="center"
        dismissable
        onClose={() => setShowQRModal(false)}
        title="QR Code de retrait"
        testID="qr-code-modal"
      >
        {selectedReservation && (
          <View style={{ padding: theme.spacing.lg, alignItems: 'center' }}>
            <Typography variant="body" color="secondary" style={{ marginBottom: theme.spacing.lg, textAlign: 'center' }}>
              Réservation #{selectedReservation.reservation_code}
            </Typography>

            <View style={[styles.qrCodeContainer, { padding: theme.spacing.lg, backgroundColor: theme.colors.surface.light, borderRadius: theme.radius.lg, marginBottom: theme.spacing.lg }]}>
              <QRCode
                value={JSON.stringify({
                  reservation_id: selectedReservation.id,
                  reservation_code: selectedReservation.reservation_code,
                  customer_id: user?.id,
                  product_id: selectedReservation.product.id,
                  quantity: selectedReservation.quantity,
                  total_amount: selectedReservation.total_amount
                })}
                size={200}
                color={theme.colors.text}
                backgroundColor={theme.colors.surface.light}
              />
            </View>

            <View style={{ width: '100%' }}>
              <Typography variant="caption" color="secondary" style={{ textAlign: 'center', marginBottom: theme.spacing.md }}>
                Présentez ce QR code au marchand pour récupérer votre commande
              </Typography>

              <View style={{ backgroundColor: theme.colors.neutral[50], padding: theme.spacing.md, borderRadius: theme.radius.md, gap: theme.spacing.sm }}>
                <Typography variant="caption">
                  📦 {selectedReservation.product?.name || 'Produit inconnu'}
                </Typography>
                <Typography variant="caption">
                  🏪 {selectedReservation.product?.merchant?.name || 'Commerçant'}
                </Typography>
                <Typography variant="caption">
                  📊 Quantité: {selectedReservation.quantity}
                </Typography>
                <Typography variant="caption" weight="semibold">
                  💰 Total: {Math.round(selectedReservation.total_amount || 0).toLocaleString()} F CFA
                </Typography>
              </View>
            </View>
          </View>
        )}
      </Modal2025>

      <AlertModal {...alertProps} />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {},
  tabsContainer: {
    flexDirection: 'row',
  },
  tab: {},
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
  reservationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  statusContainer: {
    alignItems: 'flex-end',
  },
  productSection: {
    flexDirection: 'row',
  },
  productImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  productInfo: {
    flex: 1,
  },
  quantityPriceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pickupSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  notesSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qrCodeContainer: {},
})

export default ReservationsScreen