import React, { useEffect, useCallback, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useNavigation } from '@react-navigation/native'
import { useDispatch, useSelector } from 'react-redux'
import { useTheme } from '../../theme'
import { useHaptics } from '../../hooks/useHaptics'
import { RootState, AppDispatch } from '../../store'
import {
  fetchAvailableDeliveries,
  fetchActiveDelivery,
  acceptDelivery,
} from '../../store/slices/driverSlice'
import { Delivery } from '../../types'
import LoadingSpinner from '../../components/LoadingSpinner'

const AvailableDeliveriesScreen: React.FC = () => {
  const theme = useTheme()
  const haptics = useHaptics()
  const navigation = useNavigation<any>()
  const dispatch = useDispatch<AppDispatch>()

  const [refreshing, setRefreshing] = useState(false)
  const [acceptingId, setAcceptingId] = useState<number | null>(null)

  const {
    profile,
    availableDeliveries,
    activeDelivery,
    deliveriesLoading,
    error,
  } = useSelector((state: RootState) => state.driver)

  const loadData = useCallback(async () => {
    await Promise.all([
      dispatch(fetchAvailableDeliveries()),
      dispatch(fetchActiveDelivery()),
    ])
  }, [dispatch])

  useEffect(() => {
    loadData()
    // Refresh every 30 seconds
    const interval = setInterval(loadData, 30000)
    return () => clearInterval(interval)
  }, [loadData])

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await loadData()
    setRefreshing(false)
  }, [loadData])

  const handleAcceptDelivery = async (delivery: Delivery) => {
    if (activeDelivery) {
      Alert.alert(
        'Livraison en cours',
        'Vous avez déjà une livraison en cours. Terminez-la avant d\'en accepter une nouvelle.'
      )
      return
    }

    Alert.alert(
      'Accepter la livraison',
      `Voulez-vous accepter la livraison vers ${delivery.delivery_address}?\n\nGain: ${formatCurrency(delivery.driver_commission)}`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Accepter',
          onPress: async () => {
            setAcceptingId(delivery.id)
            haptics.mediumTap()
            try {
              await dispatch(acceptDelivery(delivery.id)).unwrap()
              haptics.success()
              navigation.navigate('ActiveDelivery', { deliveryId: delivery.id })
            } catch (err: any) {
              haptics.error()
              Alert.alert('Erreur', err || 'Impossible d\'accepter la livraison')
            }
            setAcceptingId(null)
          },
        },
      ]
    )
  }

  const renderDeliveryItem = ({ item }: { item: Delivery }) => {
    const isAccepting = acceptingId === item.id

    return (
      <TouchableOpacity
        style={[styles.deliveryCard, { backgroundColor: theme.colors.cardBackground }]}
        onPress={() => navigation.navigate('DeliveryDetails', { deliveryId: item.id })}
        disabled={isAccepting}
      >
        <View style={styles.cardHeader}>
          <View style={[styles.statusBadge, { backgroundColor: theme.colors.primary[100] }]}>
            <Text style={[styles.statusText, { color: theme.colors.primary[700] }]}>
              Nouveau
            </Text>
          </View>
          <Text style={[styles.commission, { color: theme.colors.success }]}>
            {formatCurrency(item.driver_commission)}
          </Text>
        </View>

        {/* Pickup */}
        <View style={styles.locationRow}>
          <View style={[styles.locationDot, { backgroundColor: theme.colors.primary[500] }]} />
          <View style={styles.locationInfo}>
            <Text style={[styles.locationLabel, { color: theme.colors.textSecondary }]}>
              Récupération
            </Text>
            <Text style={[styles.locationAddress, { color: theme.colors.text }]} numberOfLines={1}>
              {item.pickup_address}
            </Text>
          </View>
        </View>

        {/* Line connector */}
        <View style={[styles.connector, { borderColor: theme.colors.border }]} />

        {/* Delivery */}
        <View style={styles.locationRow}>
          <View style={[styles.locationDot, { backgroundColor: theme.colors.success }]} />
          <View style={styles.locationInfo}>
            <Text style={[styles.locationLabel, { color: theme.colors.textSecondary }]}>
              Livraison
            </Text>
            <Text style={[styles.locationAddress, { color: theme.colors.text }]} numberOfLines={1}>
              {item.delivery_address}
            </Text>
          </View>
        </View>

        {/* Info row */}
        <View style={styles.infoRow}>
          {item.estimated_distance && (
            <View style={styles.infoItem}>
              <Ionicons name="navigate-outline" size={16} color={theme.colors.textSecondary} />
              <Text style={[styles.infoText, { color: theme.colors.textSecondary }]}>
                {item.estimated_distance.toFixed(1)} km
              </Text>
            </View>
          )}
          {item.estimated_duration && (
            <View style={styles.infoItem}>
              <Ionicons name="time-outline" size={16} color={theme.colors.textSecondary} />
              <Text style={[styles.infoText, { color: theme.colors.textSecondary }]}>
                ~{Math.ceil(item.estimated_duration / 60)} min
              </Text>
            </View>
          )}
        </View>

        {/* Accept Button */}
        <TouchableOpacity
          style={[
            styles.acceptButton,
            { backgroundColor: theme.colors.primary[500] },
            isAccepting && { opacity: 0.7 },
          ]}
          onPress={() => handleAcceptDelivery(item)}
          disabled={isAccepting}
        >
          {isAccepting ? (
            <LoadingSpinner size="small" color="white" />
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={20} color="white" />
              <Text style={styles.acceptButtonText}>Accepter</Text>
            </>
          )}
        </TouchableOpacity>
      </TouchableOpacity>
    )
  }

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="bicycle-outline" size={64} color={theme.colors.neutral[300]} />
      <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>
        Aucune livraison disponible
      </Text>
      <Text style={[styles.emptySubtitle, { color: theme.colors.textSecondary }]}>
        {profile?.is_available
          ? 'Restez en ligne, les nouvelles offres apparaîtront ici.'
          : 'Passez en ligne pour recevoir des offres de livraison.'}
      </Text>
    </View>
  )

  // Show active delivery banner if exists
  const renderActiveDeliveryBanner = () => {
    if (!activeDelivery) return null

    return (
      <TouchableOpacity
        style={[styles.activeBanner, { backgroundColor: theme.colors.primary[500] }]}
        onPress={() => navigation.navigate('ActiveDelivery', { deliveryId: activeDelivery.id })}
      >
        <Ionicons name="bicycle" size={20} color="white" />
        <Text style={styles.activeBannerText}>
          Livraison en cours - Appuyez pour voir
        </Text>
        <Ionicons name="chevron-forward" size={20} color="white" />
      </TouchableOpacity>
    )
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.text }]}>
          Livraisons disponibles
        </Text>
        <TouchableOpacity onPress={onRefresh}>
          <Ionicons name="refresh" size={24} color={theme.colors.primary[500]} />
        </TouchableOpacity>
      </View>

      {renderActiveDeliveryBanner()}

      {deliveriesLoading && availableDeliveries.length === 0 ? (
        <LoadingSpinner />
      ) : (
        <FlatList
          data={availableDeliveries}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderDeliveryItem}
          ListEmptyComponent={renderEmptyState}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={theme.colors.primary[500]}
            />
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  activeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 8,
  },
  activeBannerText: {
    flex: 1,
    color: 'white',
    fontWeight: '600',
    marginLeft: 8,
  },
  listContent: {
    padding: 16,
    paddingTop: 0,
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
    marginBottom: 16,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  commission: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  locationDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginTop: 4,
  },
  locationInfo: {
    flex: 1,
    marginLeft: 12,
  },
  locationLabel: {
    fontSize: 12,
  },
  locationAddress: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 2,
  },
  connector: {
    width: 2,
    height: 20,
    borderLeftWidth: 2,
    borderStyle: 'dashed',
    marginLeft: 5,
    marginVertical: 4,
  },
  infoRow: {
    flexDirection: 'row',
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  infoText: {
    fontSize: 13,
    marginLeft: 4,
  },
  acceptButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 10,
    marginTop: 16,
  },
  acceptButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 32,
  },
})

export default AvailableDeliveriesScreen
