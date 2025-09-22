import React, { useEffect, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  FlatList,
  RefreshControl,
  Modal,
  Alert,
  Dimensions,
} from 'react-native'
import { useDispatch, useSelector } from 'react-redux'
import { AppDispatch, RootState } from '../../store'
import {
  fetchMyReservations,
  cancelReservation,
  markReservationSyncPending,
} from '../../store/slices/reservationsSlice'
import { Ionicons } from '@expo/vector-icons'
import { Image } from 'expo-image'
import QRCode from 'react-native-qrcode-svg'
import { Reservation } from '../../types'
import offlineService from '../../services/offlineService'
import analyticsService from '../../services/analyticsService'

interface Props {
  navigation: any
}

const { width } = Dimensions.get('window')

const ReservationsScreen: React.FC<Props> = ({ navigation }) => {
  const dispatch = useDispatch<AppDispatch>()
  const { reservations, loading } = useSelector((state: RootState) => state.reservations)
  const { user } = useSelector((state: RootState) => state.auth)
  const { isOnline } = useSelector((state: RootState) => state.connectivity)

  const [refreshing, setRefreshing] = useState(false)
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null)
  const [showQRModal, setShowQRModal] = useState(false)
  const [activeTab, setActiveTab] = useState<'active' | 'completed' | 'cancelled'>('active')

  useEffect(() => {
    void loadReservations('initial')
  }, [])

  const loadReservations = async (
    source: 'initial' | 'refresh' | 'reload' = 'initial'
  ) => {
    const result = await dispatch(fetchMyReservations())

    if (fetchMyReservations.fulfilled.match(result)) {
      void analyticsService.track('Reservations Loaded', 'Reservation', {
        total: result.payload.length,
        source,
      })
    } else if (fetchMyReservations.rejected.match(result)) {
      Alert.alert('Erreur', 'Impossible de charger les réservations')
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
    Alert.alert(
      'Annuler la réservation',
      `Êtes-vous sûr de vouloir annuler la réservation ${reservation.reservation_code} ?`,
      [
        { text: 'Non', style: 'cancel' },
        {
          text: 'Oui, annuler',
          style: 'destructive',
          onPress: async () => {
            if (!isOnline) {
              try {
                await offlineService.queueSyncAction('update', '/reservations/cancel', {
                  action: 'cancelReservation',
                  reservationId: reservation.id,
                })
                dispatch(
                  markReservationSyncPending({
                    id: reservation.id,
                    pendingAction: 'delete',
                  })
                )
                Alert.alert(
                  'Annulation hors ligne',
                  'La demande sera synchronisée dès que la connexion sera de retour.'
                )
                void analyticsService.track('Reservation Cancel Queued', 'Reservation', {
                  reservationCode: reservation.reservation_code,
                  offline: true,
                })
              } catch (error) {
                Alert.alert('Erreur', 'Impossible de mettre en attente cette annulation.')
                if (error instanceof Error) {
                  void analyticsService.trackError(error, 'cancelReservationOffline')
                }
              }
              return
            }

            try {
              await dispatch(cancelReservation(reservation.id))
              Alert.alert('Succès', 'Réservation annulée avec succès')
              void analyticsService.track('Reservation Cancelled', 'Reservation', {
                reservationCode: reservation.reservation_code,
                status: 'success',
              })
              await loadReservations('reload')
            } catch (error) {
              Alert.alert('Erreur', 'Impossible d\'annuler la réservation')
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

  const getStatusColor = (reservation: Reservation) => {
    if (reservation.pendingSync) {
      return reservation.pendingAction === 'delete' ? '#F59E0B' : '#0EA5E9'
    }

    switch (reservation.status) {
      case 'pending': return '#F59E0B'
      case 'confirmed': return '#3B82F6'
      case 'ready': return '#10B981'
      case 'completed': return '#059669'
      case 'cancelled': return '#EF4444'
      case 'expired': return '#9CA3AF'
      default: return '#6B7280'
    }
  }

  const getStatusText = (reservation: Reservation) => {
    if (reservation.pendingSync) {
      if (reservation.pendingAction === 'delete') {
        return 'Annulation en attente'
      }
      return 'Synchronisation en attente'
    }

    switch (reservation.status) {
      case 'pending': return 'En attente'
      case 'confirmed': return 'Confirmée'
      case 'ready': return 'Prête'
      case 'completed': return 'Terminée'
      case 'cancelled': return 'Annulée'
      case 'expired': return 'Expirée'
      default: return reservation.status
    }
  }

  const getPaymentStatusColor = (status?: string) => {
    switch (status) {
      case 'pending': return '#F59E0B'
      case 'completed':
      case 'success': return '#10B981'
      case 'failed': return '#EF4444'
      case 'refunded': return '#9CA3AF'
      default: return '#6B7280'
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
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

  const renderReservation = ({ item }: { item: Reservation }) => (
    <View style={styles.reservationCard}>
      {/* Header de la réservation */}
      <View style={styles.reservationHeader}>
        <View>
          <Text style={styles.reservationCode}>#{item.reservation_code}</Text>
          <Text style={styles.reservationDate}>
            {formatDate(item.created_at || '')}
          </Text>
        </View>
        <View style={styles.statusContainer}>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item) }]}>
            <Text style={styles.statusText}>{getStatusText(item)}</Text>
          </View>
          {item.payment_status && !item.pendingSync && (
            <View style={[styles.paymentBadge, { backgroundColor: getPaymentStatusColor(item.payment_status) }]}>
              <Text style={styles.paymentText}>{getPaymentStatusText(item.payment_status)}</Text>
            </View>
          )}
        </View>
      </View>

      {item.pendingSync && (
        <Text
          style={[
            styles.syncInfo,
            item.pendingAction === 'delete' && { color: '#F59E0B' },
          ]}
        >
          {item.pendingAction === 'delete'
            ? 'Annulation en attente de synchronisation'
            : 'Créée hors ligne - envoi automatique dès connexion'}
        </Text>
      )}

      {/* Produit */}
      <View style={styles.productSection}>
        <View style={styles.productImage}>
          <Image
            source={{ uri: item.product.image_url || 'https://via.placeholder.com/80x80?text=Produit' }}
            style={styles.image}
            contentFit="cover"
          />
        </View>
        <View style={styles.productInfo}>
          <Text style={styles.productName}>{item.product.name}</Text>
          <Text style={styles.merchantName}>{item.product.merchant.name}</Text>
          <View style={styles.quantityPriceContainer}>
            <Text style={styles.quantity}>Quantité: {item.quantity}</Text>
            <Text style={styles.totalAmount}>
              {Math.round(item.total_amount || 0).toLocaleString()} F CFA
            </Text>
          </View>
        </View>
      </View>

      {/* Informations de retrait */}
      {(item.pickup_date || item.pickup_time) && (
        <View style={styles.pickupSection}>
          <Ionicons name="calendar-outline" size={16} color="#6B7280" />
          <Text style={styles.pickupText}>
            Retrait: {item.pickup_date && new Date(item.pickup_date).toLocaleDateString('fr-FR')}
            {item.pickup_time && ` à ${item.pickup_time}`}
          </Text>
        </View>
      )}

      {/* Notes */}
      {item.notes && (
        <View style={styles.notesSection}>
          <Ionicons name="document-text-outline" size={16} color="#6B7280" />
          <Text style={styles.notesText}>{item.notes}</Text>
        </View>
      )}

      {/* Actions */}
      <View style={styles.actionsContainer}>
        {canShowQR(item) && (
          <TouchableOpacity
            style={styles.qrButton}
            onPress={() => showQRCode(item)}
          >
            <Ionicons name="qr-code-outline" size={18} color="#ffffff" />
            <Text style={styles.qrButtonText}>QR Code</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.detailsButton}
          onPress={() => navigation.navigate('ProductDetails', { productId: item.product.id })}
        >
          <Ionicons name="eye-outline" size={18} color="#10B981" />
          <Text style={styles.detailsButtonText}>Voir produit</Text>
        </TouchableOpacity>

        {canCancel(item) && (
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => handleCancelReservation(item)}
          >
            <Ionicons name="close-outline" size={18} color="#EF4444" />
            <Text style={styles.cancelButtonText}>Annuler</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  )

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="bookmark-outline" size={64} color="#D1D5DB" />
      <Text style={styles.emptyTitle}>Aucune réservation</Text>
      <Text style={styles.emptySubtitle}>
        {activeTab === 'active' && 'Vous n\'avez aucune réservation active'}
        {activeTab === 'completed' && 'Vous n\'avez aucune réservation terminée'}
        {activeTab === 'cancelled' && 'Vous n\'avez aucune réservation annulée'}
      </Text>
      <TouchableOpacity
        style={styles.browseButton}
        onPress={() => navigation.navigate('Products')}
      >
        <Text style={styles.browseButtonText}>Parcourir les produits</Text>
      </TouchableOpacity>
    </View>
  )

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#10B981" barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mes réservations</Text>
        <Text style={styles.headerSubtitle}>
          {reservations.length} réservation(s) au total
        </Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        {[
          { key: 'active', label: 'Actives', count: reservations.filter(r => ['pending', 'confirmed', 'ready'].includes(r.status)).length },
          { key: 'completed', label: 'Terminées', count: reservations.filter(r => r.status === 'completed').length },
          { key: 'cancelled', label: 'Annulées', count: reservations.filter(r => ['cancelled', 'expired'].includes(r.status)).length },
        ].map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.activeTab]}
            onPress={() => handleTabChange(tab.key as any)}
          >
            <Text style={[styles.tabText, activeTab === tab.key && styles.activeTabText]}>
              {tab.label}
            </Text>
            <Text style={[styles.tabCount, activeTab === tab.key && styles.activeTabCount]}>
              {tab.count}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Liste des réservations */}
      <FlatList
        data={filteredReservations}
        renderItem={renderReservation}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#10B981']}
            tintColor="#10B981"
          />
        }
        ListEmptyComponent={renderEmpty}
      />

      {/* Modal QR Code */}
      <Modal
        visible={showQRModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowQRModal(false)}
      >
        <View style={styles.qrModalOverlay}>
          <View style={styles.qrModalContent}>
            <View style={styles.qrModalHeader}>
              <Text style={styles.qrModalTitle}>QR Code de retrait</Text>
              <TouchableOpacity onPress={() => setShowQRModal(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {selectedReservation && (
              <View style={styles.qrModalBody}>
                <Text style={styles.qrModalSubtitle}>
                  Réservation #{selectedReservation.reservation_code}
                </Text>

                <View style={styles.qrCodeContainer}>
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
                    color="#1F2937"
                    backgroundColor="#ffffff"
                  />
                </View>

                <View style={styles.qrInfo}>
                  <Text style={styles.qrInfoText}>
                    Présentez ce QR code au marchand pour récupérer votre commande
                  </Text>

                  <View style={styles.reservationSummary}>
                    <Text style={styles.summaryText}>
                      📦 {selectedReservation.product.name}
                    </Text>
                    <Text style={styles.summaryText}>
                      🏪 {selectedReservation.product.merchant.name}
                    </Text>
                    <Text style={styles.summaryText}>
                      📊 Quantité: {selectedReservation.quantity}
                    </Text>
                    <Text style={styles.summaryText}>
                      💰 Total: {Math.round(selectedReservation.total_amount || 0).toLocaleString()} F CFA
                    </Text>
                  </View>
                </View>
              </View>
            )}
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
  header: {
    backgroundColor: '#10B981',
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#ffffff',
    opacity: 0.9,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: '#10B981',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  activeTabText: {
    color: '#ffffff',
  },
  tabCount: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
  activeTabCount: {
    color: '#ffffff',
    opacity: 0.9,
  },
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
  reservationCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  reservationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  syncInfo: {
    fontSize: 12,
    color: '#0EA5E9',
    fontWeight: '500',
    marginBottom: 8,
  },
  reservationCode: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  reservationDate: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  statusContainer: {
    alignItems: 'flex-end',
    gap: 4,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  paymentBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  paymentText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '600',
  },
  productSection: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  productImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    overflow: 'hidden',
    marginRight: 12,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  merchantName: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  quantityPriceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  quantity: {
    fontSize: 14,
    color: '#6B7280',
  },
  totalAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#10B981',
  },
  pickupSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  pickupText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 8,
  },
  notesSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  notesText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 8,
    flex: 1,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  qrButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10B981',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  qrButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  detailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  detailsButtonText: {
    color: '#10B981',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  cancelButtonText: {
    color: '#EF4444',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 40,
  },
  browseButton: {
    backgroundColor: '#10B981',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  browseButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  qrModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  qrModalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    width: '100%',
    maxWidth: 350,
  },
  qrModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  qrModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  qrModalBody: {
    padding: 20,
    alignItems: 'center',
  },
  qrModalSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 20,
    textAlign: 'center',
  },
  qrCodeContainer: {
    padding: 20,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 20,
  },
  qrInfo: {
    width: '100%',
  },
  qrInfoText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 20,
  },
  reservationSummary: {
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 8,
    gap: 8,
  },
  summaryText: {
    fontSize: 14,
    color: '#374151',
  },
})

export default ReservationsScreen