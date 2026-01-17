import React, { useEffect, useCallback, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useNavigation } from '@react-navigation/native'
import { useDispatch, useSelector } from 'react-redux'
import { useTheme } from '../../theme'
import { RootState, AppDispatch } from '../../store'
import { fetchDriverDeliveryHistory } from '../../store/slices/driverSlice'
import { Delivery } from '../../types'
import LoadingSpinner from '../../components/LoadingSpinner'

const DriverHistoryScreen: React.FC = () => {
  const theme = useTheme()
  const navigation = useNavigation<any>()
  const dispatch = useDispatch<AppDispatch>()

  const [refreshing, setRefreshing] = useState(false)

  const { deliveryHistory, deliveriesLoading } = useSelector((state: RootState) => state.driver)

  const loadData = useCallback(async () => {
    await dispatch(fetchDriverDeliveryHistory({ page: 1, perPage: 50 }))
  }, [dispatch])

  useEffect(() => {
    loadData()
  }, [loadData])

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await loadData()
    setRefreshing(false)
  }, [loadData])

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      delivered: theme.colors.success,
      cancelled: theme.colors.error,
      failed: theme.colors.error,
    }
    return colors[status] || theme.colors.neutral[400]
  }

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      delivered: 'Livrée',
      cancelled: 'Annulée',
      failed: 'Échouée',
    }
    return labels[status] || status
  }

  const renderDeliveryItem = ({ item }: { item: Delivery }) => (
    <TouchableOpacity
      style={[styles.deliveryCard, { backgroundColor: theme.colors.cardBackground }]}
      onPress={() => navigation.navigate('DeliveryDetails', { deliveryId: item.id })}
    >
      <View style={styles.cardHeader}>
        <Text style={[styles.deliveryCode, { color: theme.colors.text }]}>
          #{item.delivery_code}
        </Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
          <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
            {getStatusLabel(item.status)}
          </Text>
        </View>
      </View>

      <View style={styles.addressRow}>
        <Ionicons name="location" size={16} color={theme.colors.textSecondary} />
        <Text style={[styles.address, { color: theme.colors.textSecondary }]} numberOfLines={1}>
          {item.delivery_address}
        </Text>
      </View>

      <View style={styles.footer}>
        <Text style={[styles.date, { color: theme.colors.textTertiary }]}>
          {formatDate(item.delivered_at || item.created_at)}
        </Text>
        {item.status === 'delivered' && (
          <Text style={[styles.earnings, { color: theme.colors.success }]}>
            +{formatCurrency(item.driver_commission)}
          </Text>
        )}
      </View>

      {item.consumer_rating && (
        <View style={styles.ratingRow}>
          {[1, 2, 3, 4, 5].map((star) => (
            <Ionicons
              key={star}
              name={star <= item.consumer_rating! ? 'star' : 'star-outline'}
              size={14}
              color={theme.colors.warning}
            />
          ))}
        </View>
      )}
    </TouchableOpacity>
  )

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.colors.cardBackground }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
          Historique
        </Text>
        <View style={{ width: 24 }} />
      </View>

      {deliveriesLoading && deliveryHistory.length === 0 ? (
        <LoadingSpinner />
      ) : (
        <FlatList
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
              <Ionicons name="time-outline" size={64} color={theme.colors.neutral[300]} />
              <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>
                Aucun historique
              </Text>
              <Text style={[styles.emptySubtitle, { color: theme.colors.textSecondary }]}>
                Vos livraisons terminées apparaîtront ici
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

const formatCurrency = (amount: number): string => {
  if (!amount) return '0 XOF'
  return new Intl.NumberFormat('fr-FR', {
    style: 'decimal',
    maximumFractionDigits: 0,
  }).format(amount) + ' XOF'
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
    marginBottom: 8,
  },
  deliveryCode: {
    fontSize: 16,
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  address: {
    flex: 1,
    fontSize: 13,
    marginLeft: 6,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  date: {
    fontSize: 12,
  },
  earnings: {
    fontSize: 14,
    fontWeight: '600',
  },
  ratingRow: {
    flexDirection: 'row',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
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

export default DriverHistoryScreen
