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

const MerchantReservationsScreen: React.FC = () => {
  const theme = useTheme()
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [refreshing, setRefreshing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'pending' | 'confirmed' | 'completed' | 'cancelled'>('all')

  useEffect(() => {
    loadReservations()
  }, [])

  const loadReservations = async () => {
    try {
      setLoading(true)
      console.log('📥 [MerchantReservations] Chargement réservations merchant...')

      // ✅ VERIFIED: Endpoint matches backend route (api.php:132)
      const response = await apiService.get('/reservations/merchant/list')

      // 🐛 BUG FIX #36: Log full response to debug structure
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

      // 🐛 BUG FIX #34: apiService.get() returns response.data directly, not wrapped
      // So we access response.data, not response.data.data
      // 🐛 BUG FIX #35: Only update state if we have valid data to prevent clearing on error
      if (response?.success && response?.data) {
        console.log('✅ [MerchantReservations] Mise à jour avec', response.data.length, 'réservations')
        setReservations(response.data)
      } else if (Array.isArray(response)) {
        // 🐛 BUG FIX #36: Sometimes API returns array directly
        console.log('⚠️ [MerchantReservations] Réponse est un tableau direct, utilisation directe')
        setReservations(response)
      } else {
        console.warn('⚠️ [MerchantReservations] Réponse invalide, conservation des données actuelles')
        console.warn('⚠️ [MerchantReservations] Réponse reçue:', response)
      }
    } catch (error: any) {
      console.error('❌ [MerchantReservations] Erreur chargement réservations:', error)
      console.error('❌ [MerchantReservations] Message erreur:', error?.message)
      console.error('❌ [MerchantReservations] Stack:', error?.stack)
      console.error('❌ [MerchantReservations] Status code:', error?.statusCode)
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

  const handleConfirm = (reservation: Reservation) => {
    const customerName = reservation.consumer
      ? `${reservation.consumer.first_name} ${reservation.consumer.last_name}`
      : 'Client'

    Alert.alert(
      'Confirmer la réservation',
      `Confirmer la réservation de ${customerName} ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Confirmer',
          onPress: async () => {
            try {
              console.log('📤 [MerchantReservations] Confirmation réservation:', reservation.id)
              await apiService.post(`/reservations/${reservation.id}/confirm`)
              console.log('✅ [MerchantReservations] Réservation confirmée, rechargement...')
              // 🐛 BUG FIX #35: Add await to ensure errors are caught
              await loadReservations()
            } catch (error) {
              console.error('❌ [MerchantReservations] Erreur confirmation:', error)
              Alert.alert('Erreur', 'Impossible de confirmer la réservation')
            }
          },
        },
      ]
    )
  }

  const handleMarkReady = (reservation: Reservation) => {
    Alert.alert(
      'Marquer comme prête',
      `La commande est-elle prête à être récupérée ?`,
      [
        { text: 'Non', style: 'cancel' },
        {
          text: 'Oui, prête',
          onPress: async () => {
            try {
              console.log('📤 [MerchantReservations] Marquage prêt réservation:', reservation.id)
              await apiService.post(`/reservations/${reservation.id}/ready`)
              console.log('✅ [MerchantReservations] Réservation marquée prête, rechargement...')
              // 🐛 BUG FIX #35: Add await to ensure errors are caught
              await loadReservations()
            } catch (error) {
              console.error('❌ [MerchantReservations] Erreur marquage prêt:', error)
              Alert.alert('Erreur', 'Impossible de marquer la réservation comme prête')
            }
          },
        },
      ]
    )
  }

  const handleComplete = (reservation: Reservation) => {
    Alert.alert(
      'Marquer comme terminée',
      `Le client a-t-il récupéré sa commande ?`,
      [
        { text: 'Non', style: 'cancel' },
        {
          text: 'Oui, terminée',
          onPress: async () => {
            try {
              console.log('📤 [MerchantReservations] Finalisation réservation:', reservation.id)
              await apiService.post(`/reservations/${reservation.id}/complete`)
              console.log('✅ [MerchantReservations] Réservation finalisée, rechargement...')
              // 🐛 BUG FIX #35: Add await to ensure errors are caught
              await loadReservations()
            } catch (error) {
              console.error('❌ [MerchantReservations] Erreur finalisation:', error)
              Alert.alert('Erreur', 'Impossible de marquer la réservation comme terminée')
            }
          },
        },
      ]
    )
  }

  const handleCancel = (reservation: Reservation) => {
    Alert.alert(
      'Annuler la réservation',
      `Êtes-vous sûr de vouloir annuler cette réservation ?`,
      [
        { text: 'Non', style: 'cancel' },
        {
          text: 'Annuler',
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('📤 [MerchantReservations] Annulation réservation:', reservation.id)
              await apiService.post(`/reservations/${reservation.id}/cancel`)
              console.log('✅ [MerchantReservations] Réservation annulée, rechargement...')
              // 🐛 BUG FIX #35: Add await to ensure errors are caught
              await loadReservations()
            } catch (error) {
              console.error('❌ [MerchantReservations] Erreur annulation:', error)
              Alert.alert('Erreur', 'Impossible d\'annuler la réservation')
            }
          },
        },
      ]
    )
  }

  const getStatusColor = (status: string) => {
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
      <View style={[styles.reservationCard, { backgroundColor: theme.colors.surface.light }]}>
        {/* Header */}
        <View style={styles.cardHeader}>
          <View style={styles.customerInfo}>
            <Ionicons name="person-circle" size={48} color={theme.colors.primary[500]} />
            <View style={styles.customerDetails}>
              <Text style={[styles.customerName, { color: theme.colors.text }]}>
                {customerName}
              </Text>
              <Text style={[styles.customerContact, { color: theme.colors.textSecondary }]}>
                {customerPhone}
              </Text>
            </View>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: theme.withOpacity(getStatusColor(item.status), 0.1) }]}>
            <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
              {getStatusText(item.status)}
            </Text>
          </View>
        </View>

        {/* Product Info */}
        <View style={styles.productInfo}>
          <Text style={[styles.productName, { color: theme.colors.text }]}>
            {item.product.name}
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
            style={[styles.actionButton, styles.confirmButton, { backgroundColor: theme.colors.semantic.success }]}
            onPress={() => handleConfirm(item)}
          >
            <Ionicons name="checkmark-circle" size={20} color="white" />
            <Text style={styles.actionButtonText}>Confirmer</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.cancelButton, { backgroundColor: theme.colors.semantic.error }]}
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
            style={[styles.actionButton, { backgroundColor: theme.colors.semantic.info || '#3B82F6' }]}
            onPress={() => handleMarkReady(item)}
          >
            <Ionicons name="cube" size={20} color="white" />
            <Text style={styles.actionButtonText}>Prête</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.completeButton, { backgroundColor: theme.colors.primary[500] }]}
            onPress={() => handleComplete(item)}
          >
            <Ionicons name="checkmark-done-circle" size={20} color="white" />
            <Text style={styles.actionButtonText}>Terminée</Text>
          </TouchableOpacity>
        </View>
      )}

      {item.status === 'ready' && (
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.actionButton, styles.completeButton, { backgroundColor: theme.colors.primary[500] }]}
            onPress={() => handleComplete(item)}
          >
            <Ionicons name="checkmark-done-circle" size={20} color="white" />
            <Text style={styles.actionButtonText}>Marquer terminée</Text>
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
      <StatusBar barStyle="dark-content" backgroundColor={theme.colors.background} />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.colors.primary[500] }]}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Réservations</Text>
          <View style={styles.headerActions}>
            <TouchableOpacity onPress={loadReservations} style={styles.iconButton}>
              <Ionicons name="refresh" size={24} color="white" />
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
            { value: 'completed', label: 'Terminées' },
            { value: 'cancelled', label: 'Annulées' },
          ].map((filterOption) => (
            <TouchableOpacity
              key={filterOption.value}
              style={[
                styles.filterChip,
                {
                  backgroundColor: filter === filterOption.value
                    ? 'white'
                    : 'rgba(255, 255, 255, 0.2)',
                }
              ]}
              onPress={() => setFilter(filterOption.value as any)}
            >
              <Text style={[
                styles.filterText,
                {
                  color: filter === filterOption.value
                    ? theme.colors.primary[500]
                    : 'white'
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
          <View style={[styles.emptyState, { backgroundColor: theme.colors.surface.light }]}>
            <Ionicons name="receipt-outline" size={64} color={theme.colors.neutral[300]} />
            <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
              Aucune réservation {filter !== 'all' && getStatusText(filter).toLowerCase()}
            </Text>
          </View>
        }
      />
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
})

export default MerchantReservationsScreen
