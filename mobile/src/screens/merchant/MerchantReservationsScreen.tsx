import React, { useEffect, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  RefreshControl,
  Alert,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useTheme } from '../../theme'
import apiService from '../../services/api'
import ExportReservationsButton from '../../components/merchant/ExportReservationsButton'
import { Reservation } from '../../types'
import { Modal as Modal2025 } from '../../components/2025'

interface Props {
  route?: {
    params?: {
      initialFilter?: 'all' | 'pending' | 'confirmed' | 'ready' | 'completed' | 'cancelled'
    }
  }
}

const MerchantReservationsScreen: React.FC<Props> = ({ route }) => {
  const theme = useTheme()
  const initialFilter = route?.params?.initialFilter || 'all'
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [refreshing, setRefreshing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'pending' | 'confirmed' | 'ready' | 'completed' | 'cancelled'>(initialFilter)

  // Modal states pour actions stylisées
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [showReadyModal, setShowReadyModal] = useState(false)
  const [showCompleteModal, setShowCompleteModal] = useState(false)
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    loadReservations()
  }, [])

  const loadReservations = async () => {
    try {
      setLoading(true)
      if (__DEV__) {
        console.log('📥 [MerchantReservations] Chargement réservations merchant...')
      }

      // ✅ VERIFIED: Endpoint matches backend route (api.php:132)
      const response = await apiService.get('/reservations/merchant/list')

      // 🐛 BUG FIX #36: Log full response to debug structure (DEV only)
      if (__DEV__) {
        console.log('✅ [MerchantReservations] Réponse complète:', JSON.stringify(response).substring(0, 500))
        console.log('✅ [MerchantReservations] Type de réponse:', typeof response)
        console.log('✅ [MerchantReservations] Clés de réponse:', Object.keys(response || {}))
        console.log('✅ [MerchantReservations] Réponse reçue:', {
          success: response?.success,
          dataExists: !!response?.data,
          dataLength: response?.data?.length,
          metaExists: !!response?.meta,
          isArray: Array.isArray(response)
        })
      }

      // apiService.get() retourne response.data d'axios
      // Backend retourne {success: true, data: [...]} donc response.data = le tableau
      const allReservations = Array.isArray(response.data) ? response.data : (response.data?.data || response || [])
      console.log('🟢 [MerchantReservations] Nombre réservations:', Array.isArray(allReservations) ? allReservations.length : 0)
      if (Array.isArray(allReservations)) {
        setReservations(allReservations)
      }
    } catch (error: any) {
      console.error('❌ [MerchantReservations] Erreur chargement réservations:', error?.message || error)
      if (__DEV__) {
        console.error('❌ [MerchantReservations] Stack:', error?.stack)
        console.error('❌ [MerchantReservations] Status code:', error?.statusCode)
      }
      // 🐛 BUG FIX #35: Don't clear existing reservations on error
      Alert.alert(
        'Erreur',
        `Impossible de charger les réservations: ${error?.message || 'Erreur inconnue'}`,
        [{ text: 'OK' }]
      )
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const onRefresh = () => {
    setRefreshing(true)
    loadReservations()
  }

  // Ouvre le modal de confirmation
  const handleConfirm = (reservation: Reservation) => {
    setSelectedReservation(reservation)
    setShowConfirmModal(true)
  }

  // Exécute la confirmation
  const executeConfirm = async () => {
    if (!selectedReservation) return
    setActionLoading(true)
    try {
      if (__DEV__) {
        console.log('📤 [MerchantReservations] Confirmation réservation:', selectedReservation.id)
      }
      await apiService.post(`/reservations/${selectedReservation.id}/confirm`)
      if (__DEV__) {
        console.log('✅ [MerchantReservations] Réservation confirmée, rechargement...')
      }
      setShowConfirmModal(false)
      await loadReservations()
    } catch (error: any) {
      console.error('❌ [MerchantReservations] Erreur confirmation:', error?.message || error)
      Alert.alert('Erreur', 'Impossible de confirmer la réservation')
    } finally {
      setActionLoading(false)
    }
  }

  // Ouvre le modal "prête"
  const handleMarkReady = (reservation: Reservation) => {
    setSelectedReservation(reservation)
    setShowReadyModal(true)
  }

  // Exécute le marquage "prête"
  const executeMarkReady = async () => {
    if (!selectedReservation) return
    setActionLoading(true)
    try {
      if (__DEV__) {
        console.log('📤 [MerchantReservations] Marquage prêt réservation:', selectedReservation.id)
      }
      await apiService.post(`/reservations/${selectedReservation.id}/ready`)
      if (__DEV__) {
        console.log('✅ [MerchantReservations] Réservation marquée prête, rechargement...')
      }
      setShowReadyModal(false)
      await loadReservations()
    } catch (error: any) {
      console.error('❌ [MerchantReservations] Erreur marquage prêt:', error?.message || error)
      Alert.alert('Erreur', 'Impossible de marquer la réservation comme prête')
    } finally {
      setActionLoading(false)
    }
  }

  // Ouvre le modal "terminée"
  const handleComplete = (reservation: Reservation) => {
    setSelectedReservation(reservation)
    setShowCompleteModal(true)
  }

  // Exécute le marquage "terminée"
  const executeComplete = async () => {
    if (!selectedReservation) return
    setActionLoading(true)
    try {
      if (__DEV__) {
        console.log('📤 [MerchantReservations] Finalisation réservation:', selectedReservation.id)
      }
      await apiService.post(`/reservations/${selectedReservation.id}/complete`)
      if (__DEV__) {
        console.log('✅ [MerchantReservations] Réservation finalisée, rechargement...')
      }
      setShowCompleteModal(false)
      await loadReservations()
    } catch (error: any) {
      console.error('❌ [MerchantReservations] Erreur finalisation:', error?.message || error)
      Alert.alert('Erreur', 'Impossible de marquer la réservation comme terminée')
    } finally {
      setActionLoading(false)
    }
  }

  // Ouvre le modal d'annulation
  const handleCancel = (reservation: Reservation) => {
    setSelectedReservation(reservation)
    setShowCancelModal(true)
  }

  // Exécute l'annulation
  const executeCancel = async () => {
    if (!selectedReservation) return
    setActionLoading(true)
    try {
      if (__DEV__) {
        console.log('📤 [MerchantReservations] Annulation réservation:', selectedReservation.id)
      }
      await apiService.post(`/reservations/${selectedReservation.id}/cancel`)
      if (__DEV__) {
        console.log('✅ [MerchantReservations] Réservation annulée, rechargement...')
      }
      setShowCancelModal(false)
      await loadReservations()
    } catch (error: any) {
      console.error('❌ [MerchantReservations] Erreur annulation:', error?.message || error)
      Alert.alert('Erreur', 'Impossible d\'annuler la réservation')
    } finally {
      setActionLoading(false)
    }
  }

  // Helper pour obtenir le nom du client
  const getCustomerName = (reservation: Reservation | null) => {
    if (!reservation?.consumer) return 'Client'
    return `${reservation.consumer.first_name} ${reservation.consumer.last_name}`
  }

  const getStatusColor = (status: string) => {
    if (theme.isDark) {
      // Mode sombre : badges pleins avec texte contrasté
      switch (status) {
        case 'pending':
          return { bg: '#F59E0B', text: '#1f1404' }
        case 'confirmed':
          return { bg: '#10B981', text: '#0B140F' }
        case 'ready':
          return { bg: '#2563EB', text: '#0A1A33' }
        case 'completed':
          return { bg: '#F59E0B', text: '#0B0A06' }
        case 'cancelled':
          return { bg: '#DC2626', text: '#FCA5A5' }
        default:
          return { bg: '#4B5563', text: '#E9EDF5' }
      }
    } else {
      // Mode clair : badges avec fond transparent
      const color = (() => {
        switch (status) {
          case 'pending':
            return theme.colors.semantic.warning
          case 'confirmed':
            return theme.colors.semantic.success
          case 'ready':
            return theme.colors.semantic.info || '#3B82F6'
          case 'completed':
            return theme.colors.primary[500]
          case 'cancelled':
            return theme.colors.semantic.error
          default:
            return theme.colors.neutral[400]
        }
      })()
      return { bg: theme.withOpacity(color, 0.1), text: color }
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'En attente'
      case 'confirmed':
        return 'Confirmée'
      case 'ready':
        return 'Prête'
      case 'completed':
        return 'Terminée'
      case 'cancelled':
        return 'Annulée'
      default:
        return status
    }
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return '--'
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return '--'
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const filteredReservations = filter === 'all'
    ? reservations
    : reservations.filter(r => r.status === filter)

  const renderReservation = ({ item }: { item: Reservation }) => {
    const customerName = item.consumer
      ? `${item.consumer.first_name} ${item.consumer.last_name}`
      : 'Client inconnu'
    const customerPhone = item.consumer?.phone || ''

    // 🐛 BUG FIX #MOB-H-002: Protect against NaN in total_amount calculation
    const totalAmount = (() => {
      if (typeof item.total_amount === 'number' && !isNaN(item.total_amount)) {
        return item.total_amount
      }
      const price = parseFloat(String(item.discounted_price || 0))
      const quantity = item.quantity ?? 0
      return (Number.isFinite(price) && Number.isFinite(quantity)) ? price * quantity : 0
    })()

    return (
      <View style={[styles.reservationCard, { backgroundColor: theme.colors.cardBackground, borderColor: theme.colors.cardBorder, borderWidth: 1 }]}>
        {/* Header */}
        <View style={styles.cardHeader}>
          <View style={styles.customerInfo}>
            <Ionicons name="person-circle" size={48} color={theme.isDark ? '#10B981' : theme.colors.primary[500]} />
            <View style={styles.customerDetails}>
              <Text style={[styles.customerName, { color: theme.colors.text }]}>
                {customerName}
              </Text>
              <Text style={[styles.customerContact, { color: theme.colors.textSecondary }]}>
                {customerPhone}
              </Text>
            </View>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status).bg }]}>
            <Text style={[styles.statusText, { color: getStatusColor(item.status).text }]}>
              {getStatusText(item.status)}
            </Text>
          </View>
        </View>

        {/* Product Info */}
        <View style={styles.productInfo}>
          <Text style={[styles.productName, { color: theme.colors.text }]}>
            {item.product?.name || 'Produit inconnu'}
          </Text>
          <View style={styles.detailsRow}>
            <Text style={[styles.detailText, { color: theme.colors.textSecondary }]}>
              Quantité: {item.quantity}
            </Text>
            <Text style={[styles.amount, { color: theme.colors.primary[500] }]}>
              {totalAmount.toLocaleString()} F CFA
            </Text>
          </View>
        </View>

      {/* Actions */}
      {item.status === 'pending' && (
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.actionButton, styles.confirmButton, { backgroundColor: '#10B981' }]}
            onPress={() => handleConfirm(item)}
          >
            <Ionicons name="checkmark-circle" size={20} color={theme.isDark ? '#0B140F' : 'white'} />
            <Text style={[styles.actionButtonText, { color: theme.isDark ? '#0B140F' : 'white' }]}>Confirmer</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.cancelButton, { backgroundColor: '#DC2626' }]}
            onPress={() => handleCancel(item)}
          >
            <Ionicons name="close-circle" size={20} color="white" />
            <Text style={styles.actionButtonText}>Refuser</Text>
          </TouchableOpacity>
        </View>
      )}

      {item.status === 'confirmed' && (
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: '#2563EB' }]}
            onPress={() => handleMarkReady(item)}
          >
            <Ionicons name="cube" size={20} color={theme.isDark ? '#0A1A33' : 'white'} />
            <Text style={[styles.actionButtonText, { color: theme.isDark ? '#0A1A33' : 'white' }]}>Prête</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.completeButton, { backgroundColor: '#10B981' }]}
            onPress={() => handleComplete(item)}
          >
            <Ionicons name="checkmark-done-circle" size={20} color={theme.isDark ? '#0B140F' : 'white'} />
            <Text style={[styles.actionButtonText, { color: theme.isDark ? '#0B140F' : 'white' }]}>Terminée</Text>
          </TouchableOpacity>
        </View>
      )}

      {item.status === 'ready' && (
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.actionButton, styles.completeButton, { backgroundColor: '#10B981' }]}
            onPress={() => handleComplete(item)}
          >
            <Ionicons name="checkmark-done-circle" size={20} color={theme.isDark ? '#0B140F' : 'white'} />
            <Text style={[styles.actionButtonText, { color: theme.isDark ? '#0B140F' : 'white' }]}>Marquer terminée</Text>
          </TouchableOpacity>
        </View>
      )}

        {/* Date */}
        <View style={styles.footer}>
          <Text style={[styles.dateText, { color: theme.colors.textSecondary }]}>
            {formatDate(item.created_at || '')}
          </Text>
        </View>
      </View>
    )
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar barStyle={theme.isDark ? "light-content" : "dark-content"} backgroundColor={theme.colors.background} />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.isDark ? '#0F1622' : theme.colors.primary[500] }]}>
        <View style={styles.headerContent}>
          <Text style={[styles.headerTitle, { color: theme.isDark ? '#F8FAFF' : 'white' }]}>Réservations</Text>
          <View style={styles.headerActions}>
            <TouchableOpacity onPress={loadReservations} style={styles.iconButton}>
              <Ionicons name="refresh" size={24} color={theme.isDark ? '#E9EDF5' : 'white'} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Export Button */}
        {filteredReservations.length > 0 && (
          <View style={styles.exportContainer}>
            <ExportReservationsButton
              reservations={filteredReservations}
            />
          </View>
        )}

        {/* Filters */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filtersContainer}
          contentContainerStyle={styles.filtersContent}
        >
          {[
            { value: 'all', label: 'Toutes' },
            { value: 'pending', label: 'En attente' },
            { value: 'confirmed', label: 'Confirmées' },
            { value: 'ready', label: 'Prêtes' },
            { value: 'completed', label: 'Terminées' },
            { value: 'cancelled', label: 'Annulées' },
          ].map((filterOption) => (
            <TouchableOpacity
              key={filterOption.value}
              style={[
                styles.filterChip,
                {
                  backgroundColor: theme.isDark
                    ? (filter === filterOption.value ? '#10B981' : '#1B2433')
                    : (filter === filterOption.value ? 'white' : 'rgba(255, 255, 255, 0.2)')
                }
              ]}
              onPress={() => setFilter(filterOption.value as any)}
            >
              <Text style={[
                styles.filterText,
                {
                  color: theme.isDark
                    ? (filter === filterOption.value ? '#0B140F' : '#E9EDF5')
                    : (filter === filterOption.value ? theme.colors.primary[500] : 'white')
                }
              ]}>
                {filterOption.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Liste des réservations */}
      <FlatList
        data={filteredReservations}
        renderItem={renderReservation}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={[styles.emptyState, { backgroundColor: theme.colors.cardBackground, borderColor: theme.colors.cardBorder, borderWidth: 1 }]}>
            <Ionicons name="receipt-outline" size={64} color={theme.colors.textTertiary} />
            <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
              Aucune réservation {filter !== 'all' && getStatusText(filter).toLowerCase()}
            </Text>
          </View>
        }
      />

      {/* Modal Confirmer la réservation */}
      <Modal2025
        visible={showConfirmModal}
        variant="center"
        onClose={() => setShowConfirmModal(false)}
        showCloseButton={false}
        dismissable={!actionLoading}
        scrollable={false}
      >
        <View style={styles.modalContent}>
          <View style={[styles.modalIconContainer, { backgroundColor: theme.colors.semantic.success + '20' }]}>
            <Ionicons name="checkmark-circle" size={48} color={theme.colors.semantic.success} />
          </View>
          <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
            Confirmer la réservation
          </Text>
          <Text style={[styles.modalDescription, { color: theme.colors.textSecondary }]}>
            Confirmer la réservation de {getCustomerName(selectedReservation)} ?
          </Text>
          <View style={styles.modalActions}>
            <TouchableOpacity
              style={[styles.modalButton, styles.modalButtonSecondary, { borderColor: theme.colors.border }]}
              onPress={() => setShowConfirmModal(false)}
              disabled={actionLoading}
            >
              <Text style={[styles.modalButtonText, { color: theme.colors.textSecondary }]}>
                ANNULER
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, styles.modalButtonPrimary, { backgroundColor: theme.colors.semantic.success }]}
              onPress={executeConfirm}
              disabled={actionLoading}
            >
              <Text style={[styles.modalButtonText, { color: 'white' }]}>
                {actionLoading ? 'CONFIRMATION...' : 'CONFIRMER'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal2025>

      {/* Modal Marquer comme prête */}
      <Modal2025
        visible={showReadyModal}
        variant="center"
        onClose={() => setShowReadyModal(false)}
        showCloseButton={false}
        dismissable={!actionLoading}
        scrollable={false}
      >
        <View style={styles.modalContent}>
          <View style={[styles.modalIconContainer, { backgroundColor: '#3B82F620' }]}>
            <Ionicons name="cube" size={48} color="#3B82F6" />
          </View>
          <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
            Marquer comme prête
          </Text>
          <Text style={[styles.modalDescription, { color: theme.colors.textSecondary }]}>
            La commande est-elle prête à être récupérée ?
          </Text>
          <View style={styles.modalActions}>
            <TouchableOpacity
              style={[styles.modalButton, styles.modalButtonSecondary, { borderColor: theme.colors.border }]}
              onPress={() => setShowReadyModal(false)}
              disabled={actionLoading}
            >
              <Text style={[styles.modalButtonText, { color: theme.colors.textSecondary }]}>
                NON
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, styles.modalButtonPrimary, { backgroundColor: '#3B82F6' }]}
              onPress={executeMarkReady}
              disabled={actionLoading}
            >
              <Text style={[styles.modalButtonText, { color: 'white' }]}>
                {actionLoading ? 'EN COURS...' : 'OUI, PRÊTE'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal2025>

      {/* Modal Marquer comme terminée */}
      <Modal2025
        visible={showCompleteModal}
        variant="center"
        onClose={() => setShowCompleteModal(false)}
        showCloseButton={false}
        dismissable={!actionLoading}
        scrollable={false}
      >
        <View style={styles.modalContent}>
          <View style={[styles.modalIconContainer, { backgroundColor: theme.colors.semantic.success + '20' }]}>
            <Ionicons name="checkmark-done-circle" size={48} color={theme.colors.semantic.success} />
          </View>
          <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
            Marquer comme terminée
          </Text>
          <Text style={[styles.modalDescription, { color: theme.colors.textSecondary }]}>
            Le client a-t-il récupéré sa commande ?
          </Text>
          <View style={styles.modalActions}>
            <TouchableOpacity
              style={[styles.modalButton, styles.modalButtonSecondary, { borderColor: theme.colors.border }]}
              onPress={() => setShowCompleteModal(false)}
              disabled={actionLoading}
            >
              <Text style={[styles.modalButtonText, { color: theme.colors.textSecondary }]}>
                NON
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, styles.modalButtonPrimary, { backgroundColor: theme.colors.semantic.success }]}
              onPress={executeComplete}
              disabled={actionLoading}
            >
              <Text style={[styles.modalButtonText, { color: 'white' }]}>
                {actionLoading ? 'EN COURS...' : 'OUI, TERMINÉE'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal2025>

      {/* Modal Annuler la réservation */}
      <Modal2025
        visible={showCancelModal}
        variant="center"
        onClose={() => setShowCancelModal(false)}
        showCloseButton={false}
        dismissable={!actionLoading}
        scrollable={false}
      >
        <View style={styles.modalContent}>
          <View style={[styles.modalIconContainer, { backgroundColor: theme.colors.semantic.error + '20' }]}>
            <Ionicons name="close-circle" size={48} color={theme.colors.semantic.error} />
          </View>
          <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
            Annuler la réservation
          </Text>
          <Text style={[styles.modalDescription, { color: theme.colors.textSecondary }]}>
            Êtes-vous sûr de vouloir annuler cette réservation ?
          </Text>
          <View style={styles.modalActions}>
            <TouchableOpacity
              style={[styles.modalButton, styles.modalButtonSecondary, { borderColor: theme.colors.border }]}
              onPress={() => setShowCancelModal(false)}
              disabled={actionLoading}
            >
              <Text style={[styles.modalButtonText, { color: theme.colors.textSecondary }]}>
                NON
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, styles.modalButtonPrimary, { backgroundColor: theme.colors.semantic.error }]}
              onPress={executeCancel}
              disabled={actionLoading}
            >
              <Text style={[styles.modalButtonText, { color: 'white' }]}>
                {actionLoading ? 'ANNULATION...' : 'ANNULER'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal2025>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    color: 'white',
    fontSize: 28,
    fontWeight: 'bold',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconButton: {
    padding: 4,
  },
  exportContainer: {
    marginTop: 12,
    marginBottom: 8,
  },
  filtersContainer: {
    marginTop: 8,
  },
  filtersContent: {
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
  },
  listContent: {
    padding: 16,
    flexGrow: 1,
  },
  reservationCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  customerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  customerDetails: {
    marginLeft: 12,
    flex: 1,
  },
  customerName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  customerContact: {
    fontSize: 12,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  productInfo: {
    marginBottom: 16,
  },
  productName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailText: {
    fontSize: 14,
  },
  amount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    gap: 6,
  },
  confirmButton: {},
  cancelButton: {},
  completeButton: {},
  actionButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  footer: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.05)',
  },
  dateText: {
    fontSize: 12,
  },
  emptyState: {
    flex: 1,
    padding: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 40,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    textAlign: 'center',
  },
  // Styles pour les modals stylisés
  modalContent: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  modalIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },
  modalDescription: {
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
    paddingHorizontal: 8,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    width: '100%',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalButtonSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
  },
  modalButtonPrimary: {
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  modalButtonText: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
})

export default MerchantReservationsScreen
