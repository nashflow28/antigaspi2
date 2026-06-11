import React, { useEffect, useCallback, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { FlashList } from '@shopify/flash-list'
import { Ionicons } from '@expo/vector-icons'
import { useNavigation } from '@react-navigation/native'
import { useDispatch, useSelector } from 'react-redux'
import { useTheme } from '../../theme'
import { RootState, AppDispatch } from '../../store'
import { fetchDeliveryHistory } from '../../store/slices/deliverySlice'
import { Delivery } from '../../types'
import LoadingSpinner from '../../components/LoadingSpinner'

const DeliveryHistoryScreen: React.FC = () => {
  const theme = useTheme()
  const navigation = useNavigation<any>()
  const dispatch = useDispatch<AppDispatch>()

  const [refreshing, setRefreshing] = useState(false)

  const { deliveryHistory, historyLoading } = useSelector(
    (state: RootState) => state.delivery
  )

  const loadData = useCallback(async () => {
    await dispatch(fetchDeliveryHistory({ page: 1, perPage: 50 }))
  }, [dispatch])

  useEffect(() => {
    loadData()
  }, [loadData])

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await loadData()
    setRefreshing(false)
  }, [loadData])

  const getStatusInfo = (status: string) => {
    const statusMap: Record<string, { label: string; color: string; icon: string }> = {
      pending: { label: 'En attente', color: theme.colors.warning, icon: 'time' },
      searching: { label: 'Recherche livreur', color: theme.colors.info, icon: 'search' },
      assigned: { label: 'Livreur assigné', color: theme.colors.info, icon: 'person' },
      picking_up: { label: 'En récupération', color: theme.colors.primary[500], icon: 'bicycle' },
      picked_up: { label: 'Récupérée', color: theme.colors.primary[500], icon: 'bag-check' },
      delivering: { label: 'En livraison', color: theme.colors.success, icon: 'bicycle' },
      delivered: { label: 'Livrée', color: theme.colors.success, icon: 'checkmark-circle' },
      cancelled: { label: 'Annulée', color: theme.colors.error, icon: 'close-circle' },
      failed: { label: 'Échouée', color: theme.colors.error, icon: 'alert-circle' },
    }
    return statusMap[status] || { label: status, color: theme.colors.neutral[400], icon: 'help' }
  }

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString)
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'decimal',
      maximumFractionDigits: 0,
    }).format(amount) + ' XOF'
  }

  const renderDeliveryItem = ({ item }: { item: Delivery }) => {
    const statusInfo = getStatusInfo(item.status)
    const isCompleted = item.status === 'delivered'
    const isOngoing = ['pending', 'searching', 'assigned', 'picking_up', 'picked_up', 'delivering'].includes(item.status)

    return (
      <TouchableOpacity
        style={[styles.deliveryCard, { backgroundColor: theme.colors.cardBackground }]}
        onPress={() => {
          if (isOngoing) {
            navigation.navigate('DeliveryTracking', { deliveryId: item.id })
          }
        }}
        disabled={!isOngoing}
      >
        <View style={styles.cardHeader}>
          <Text style={[styles.deliveryCode, { color: theme.colors.text }]}>
            #{item.delivery_code}
          </Text>
          <View style={[styles.statusBadge, { backgroundColor: statusInfo.color + '20' }]}>
            <Ionicons name={statusInfo.icon as any} size={14} color={statusInfo.color} />
            <Text style={[styles.statusText, { color: statusInfo.color }]}>
              {statusInfo.label}
            </Text>
          </View>
        </View>

        {/* Address */}
        <View style={styles.addressRow}>
          <Ionicons name="location" size={16} color={theme.colors.textSecondary} />
          <Text style={[styles.address, { color: theme.colors.textSecondary }]} numberOfLines={1}>
            {item.delivery_address}
          </Text>
        </View>

        {/* Info row */}
        <View style={styles.infoRow}>
          <View style={styles.infoItem}>
            <Ionicons name="calendar-outline" size={14} color={theme.colors.textTertiary} />
            <Text style={[styles.infoText, { color: theme.colors.textTertiary }]}>
              {formatDate(item.created_at)}
            </Text>
          </View>
          <View style={styles.infoItem}>
            <Ionicons name="cash-outline" size={14} color={theme.colors.textTertiary} />
            <Text style={[styles.infoText, { color: theme.colors.textTertiary }]}>
              {formatCurrency(item.delivery_fee)}
            </Text>
          </View>
        </View>

        {/* Driver info if assigned */}
        {item.driver && (
          <View style={[styles.driverRow, { borderTopColor: theme.colors.border }]}>
            <View style={[styles.driverAvatar, { backgroundColor: theme.colors.primary[100] }]}>
              <Text style={[styles.driverAvatarText, { color: theme.colors.primary[500] }]}>
                {item.driver.user?.first_name?.charAt(0) || 'L'}
              </Text>
            </View>
            <View style={styles.driverInfo}>
              <Text style={[styles.driverName, { color: theme.colors.text }]}>
                {item.driver.user?.first_name} {item.driver.user?.last_name}
              </Text>
              {item.driver.rating && (
                <View style={styles.ratingRow}>
                  <Ionicons name="star" size={12} color={theme.colors.warning} />
                  <Text style={[styles.ratingText, { color: theme.colors.textSecondary }]}>
                    {item.driver.rating.toFixed(1)}
                  </Text>
                </View>
              )}
            </View>
            {isOngoing && (
              <View style={[styles.trackBadge, { backgroundColor: theme.colors.primary[500] }]}>
                <Text style={styles.trackBadgeText}>Suivre</Text>
              </View>
            )}
          </View>
        )}

        {/* Rating if completed */}
        {isCompleted && item.consumer_rating && (
          <View style={[styles.yourRatingRow, { borderTopColor: theme.colors.border }]}>
            <Text style={[styles.yourRatingLabel, { color: theme.colors.textSecondary }]}>
              Votre note:
            </Text>
            <View style={styles.starsRow}>
              {[1, 2, 3, 4, 5].map((star) => (
                <Ionicons
                  key={star}
                  name={star <= item.consumer_rating! ? 'star' : 'star-outline'}
                  size={14}
                  color={theme.colors.warning}
                />
              ))}
            </View>
          </View>
        )}

        {/* Rate button if completed but not rated */}
        {isCompleted && !item.consumer_rating && (
          <TouchableOpacity
            style={[styles.rateButton, { borderColor: theme.colors.primary[500] }]}
            onPress={() => navigation.navigate('DeliveryRating', { deliveryId: item.id })}
          >
            <Ionicons name="star-outline" size={16} color={theme.colors.primary[500]} />
            <Text style={[styles.rateButtonText, { color: theme.colors.primary[500] }]}>
              Noter cette livraison
            </Text>
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    )
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.colors.cardBackground }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
          Mes livraisons
        </Text>
        <View style={{ width: 24 }} />
      </View>

      {historyLoading && (!deliveryHistory || deliveryHistory.length === 0) ? (
        <LoadingSpinner />
      ) : (
        <FlashList
          data={deliveryHistory}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderDeliveryItem}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={theme.colors.primary[500]}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="bicycle-outline" size={64} color={theme.colors.neutral[300]} />
              <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>
                Aucune livraison
              </Text>
              <Text style={[styles.emptySubtitle, { color: theme.colors.textSecondary }]}>
                Vos livraisons apparaîtront ici
              </Text>
            </View>
          }
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
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
    padding: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  listContent: {
    padding: 16,
  },
  deliveryCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  deliveryCode: {
    fontSize: 16,
    fontWeight: '600',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  address: {
    flex: 1,
    fontSize: 13,
    marginLeft: 6,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoText: {
    fontSize: 12,
    marginLeft: 4,
  },
  driverRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  driverAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  driverAvatarText: {
    fontSize: 14,
    fontWeight: '600',
  },
  driverInfo: {
    flex: 1,
    marginLeft: 10,
  },
  driverName: {
    fontSize: 14,
    fontWeight: '500',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  ratingText: {
    fontSize: 12,
    marginLeft: 3,
  },
  trackBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  trackBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  yourRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  yourRatingLabel: {
    fontSize: 13,
  },
  starsRow: {
    flexDirection: 'row',
  },
  rateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 12,
  },
  rateButtonText: {
    fontSize: 13,
    fontWeight: '500',
    marginLeft: 6,
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 80,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    marginTop: 8,
  },
})

export default DeliveryHistoryScreen
