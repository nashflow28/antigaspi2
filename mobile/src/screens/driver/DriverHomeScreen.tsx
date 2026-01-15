import React, { useEffect, useCallback, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Switch,
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
  fetchDriverProfile,
  fetchDriverStats,
  fetchActiveDelivery,
  fetchAvailableDeliveries,
  toggleDriverAvailability,
} from '../../store/slices/driverSlice'
import LoadingSpinner from '../../components/LoadingSpinner'

const DriverHomeScreen: React.FC = () => {
  const theme = useTheme()
  const haptics = useHaptics()
  const navigation = useNavigation<any>()
  const dispatch = useDispatch<AppDispatch>()

  const [refreshing, setRefreshing] = useState(false)
  const [togglingAvailability, setTogglingAvailability] = useState(false)

  const {
    profile,
    stats,
    activeDelivery,
    availableDeliveries,
    profileLoading,
    statsLoading,
    error,
  } = useSelector((state: RootState) => state.driver)

  const loadData = useCallback(async () => {
    await Promise.all([
      dispatch(fetchDriverProfile()),
      dispatch(fetchDriverStats()),
      dispatch(fetchActiveDelivery()),
      dispatch(fetchAvailableDeliveries()),
    ])
  }, [dispatch])

  useEffect(() => {
    loadData()
  }, [loadData])

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await loadData()
    setRefreshing(false)
  }, [loadData])

  const handleToggleAvailability = async () => {
    if (!profile?.is_verified) {
      Alert.alert('Compte non vérifié', 'Votre compte doit être vérifié avant de pouvoir accepter des livraisons.')
      return
    }

    if (activeDelivery && profile?.is_available) {
      Alert.alert('Livraison en cours', 'Terminez votre livraison en cours avant de passer hors ligne.')
      return
    }

    setTogglingAvailability(true)
    haptics.mediumTap()
    try {
      await dispatch(toggleDriverAvailability()).unwrap()
    } catch (err) {
      Alert.alert('Erreur', 'Impossible de changer votre statut.')
    }
    setTogglingAvailability(false)
  }

  const navigateToActiveDelivery = () => {
    if (activeDelivery) {
      haptics.lightTap()
      navigation.navigate('ActiveDelivery', { deliveryId: activeDelivery.id })
    }
  }

  const navigateToAvailableDeliveries = () => {
    haptics.lightTap()
    navigation.navigate('Deliveries')
  }

  if (profileLoading && !profile) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <LoadingSpinner />
      </SafeAreaView>
    )
  }

  const todayStats = stats?.current_status || { is_available: false, is_online: false }
  const statsOverview = stats?.overview || { total_deliveries: 0, total_earnings: 0, rating: 0 }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.primary[500]}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.greeting, { color: theme.colors.textSecondary }]}>
              Bonjour,
            </Text>
            <Text style={[styles.name, { color: theme.colors.text }]}>
              {profile?.user?.first_name || 'Livreur'}
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.notificationButton, { backgroundColor: theme.colors.surface.light }]}
            onPress={() => navigation.navigate('NotificationsInbox')}
          >
            <Ionicons name="notifications-outline" size={24} color={theme.colors.text} />
          </TouchableOpacity>
        </View>

        {/* Availability Toggle */}
        <View style={[styles.availabilityCard, { backgroundColor: theme.colors.cardBackground }]}>
          <View style={styles.availabilityLeft}>
            <View style={[
              styles.statusDot,
              { backgroundColor: profile?.is_available ? theme.colors.success : theme.colors.neutral[400] }
            ]} />
            <View>
              <Text style={[styles.availabilityTitle, { color: theme.colors.text }]}>
                {profile?.is_available ? 'En ligne' : 'Hors ligne'}
              </Text>
              <Text style={[styles.availabilitySubtitle, { color: theme.colors.textSecondary }]}>
                {profile?.is_available
                  ? 'Vous recevez des offres de livraison'
                  : 'Activez pour recevoir des offres'}
              </Text>
            </View>
          </View>
          <Switch
            value={profile?.is_available || false}
            onValueChange={handleToggleAvailability}
            disabled={togglingAvailability || !profile?.is_verified}
            trackColor={{ false: theme.colors.neutral[300], true: theme.colors.primary[300] }}
            thumbColor={profile?.is_available ? theme.colors.primary[500] : theme.colors.neutral[100]}
          />
        </View>

        {/* Verification Warning */}
        {!profile?.is_verified && (
          <View style={[styles.warningCard, { backgroundColor: theme.colors.warning + '20' }]}>
            <Ionicons name="warning-outline" size={24} color={theme.colors.warning} />
            <View style={styles.warningText}>
              <Text style={[styles.warningTitle, { color: theme.colors.warning }]}>
                Compte en attente de vérification
              </Text>
              <Text style={[styles.warningSubtitle, { color: theme.colors.textSecondary }]}>
                Votre profil est en cours de vérification. Vous pourrez accepter des livraisons une fois vérifié.
              </Text>
            </View>
          </View>
        )}

        {/* Active Delivery Card */}
        {activeDelivery && (
          <TouchableOpacity
            style={[styles.activeDeliveryCard, { backgroundColor: theme.colors.primary[500] }]}
            onPress={navigateToActiveDelivery}
          >
            <View style={styles.activeDeliveryHeader}>
              <Ionicons name="bicycle" size={24} color="white" />
              <Text style={styles.activeDeliveryTitle}>Livraison en cours</Text>
              <Ionicons name="chevron-forward" size={24} color="white" />
            </View>
            <View style={styles.activeDeliveryInfo}>
              <Text style={styles.activeDeliveryCode}>
                #{activeDelivery.delivery_code}
              </Text>
              <Text style={styles.activeDeliveryStatus}>
                {getStatusText(activeDelivery.status)}
              </Text>
            </View>
            <Text style={styles.activeDeliveryAddress} numberOfLines={1}>
              {activeDelivery.delivery_address}
            </Text>
          </TouchableOpacity>
        )}

        {/* Available Deliveries Preview */}
        {!activeDelivery && availableDeliveries.length > 0 && (
          <TouchableOpacity
            style={[styles.availableCard, { backgroundColor: theme.colors.success + '20' }]}
            onPress={navigateToAvailableDeliveries}
          >
            <View style={styles.availableHeader}>
              <Ionicons name="flash" size={24} color={theme.colors.success} />
              <Text style={[styles.availableTitle, { color: theme.colors.success }]}>
                {availableDeliveries.length} livraison{availableDeliveries.length > 1 ? 's' : ''} disponible{availableDeliveries.length > 1 ? 's' : ''}
              </Text>
              <Ionicons name="chevron-forward" size={24} color={theme.colors.success} />
            </View>
            <Text style={[styles.availableSubtitle, { color: theme.colors.textSecondary }]}>
              Appuyez pour voir les offres de livraison
            </Text>
          </TouchableOpacity>
        )}

        {/* Stats Cards */}
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: theme.colors.cardBackground }]}>
            <Ionicons name="checkmark-circle" size={28} color={theme.colors.primary[500]} />
            <Text style={[styles.statValue, { color: theme.colors.text }]}>
              {statsOverview.total_deliveries}
            </Text>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
              Livraisons
            </Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: theme.colors.cardBackground }]}>
            <Ionicons name="cash" size={28} color={theme.colors.success} />
            <Text style={[styles.statValue, { color: theme.colors.text }]}>
              {formatCurrency(statsOverview.total_earnings)}
            </Text>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
              Gains totaux
            </Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: theme.colors.cardBackground }]}>
            <Ionicons name="star" size={28} color={theme.colors.warning} />
            <Text style={[styles.statValue, { color: theme.colors.text }]}>
              {statsOverview.rating?.toFixed(1) || '—'}
            </Text>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
              Note moyenne
            </Text>
          </View>
        </View>

        {/* Quick Actions */}
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Actions rapides</Text>
        <View style={styles.actionsGrid}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: theme.colors.cardBackground }]}
            onPress={navigateToAvailableDeliveries}
          >
            <Ionicons name="bicycle-outline" size={28} color={theme.colors.primary[500]} />
            <Text style={[styles.actionLabel, { color: theme.colors.text }]}>Livraisons</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: theme.colors.cardBackground }]}
            onPress={() => navigation.navigate('Earnings')}
          >
            <Ionicons name="wallet-outline" size={28} color={theme.colors.success} />
            <Text style={[styles.actionLabel, { color: theme.colors.text }]}>Mes gains</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: theme.colors.cardBackground }]}
            onPress={() => navigation.navigate('Map')}
          >
            <Ionicons name="map-outline" size={28} color={theme.colors.accent.orange} />
            <Text style={[styles.actionLabel, { color: theme.colors.text }]}>Carte</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: theme.colors.cardBackground }]}
            onPress={() => navigation.navigate('DriverHistory')}
          >
            <Ionicons name="time-outline" size={28} color={theme.colors.info} />
            <Text style={[styles.actionLabel, { color: theme.colors.text }]}>Historique</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const getStatusText = (status: string): string => {
  const statusMap: Record<string, string> = {
    assigned: 'Assignée',
    picking_up: 'En route pickup',
    picked_up: 'Colis récupéré',
    delivering: 'En livraison',
  }
  return statusMap[status] || status
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
    paddingTop: 16,
    paddingBottom: 8,
  },
  greeting: {
    fontSize: 14,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  notificationButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  availabilityCard: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  availabilityLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  availabilityTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  availabilitySubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  warningCard: {
    margin: 16,
    marginTop: 0,
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  warningText: {
    flex: 1,
    marginLeft: 12,
  },
  warningTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  warningSubtitle: {
    fontSize: 12,
    marginTop: 4,
  },
  activeDeliveryCard: {
    margin: 16,
    marginTop: 0,
    padding: 16,
    borderRadius: 12,
  },
  activeDeliveryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  activeDeliveryTitle: {
    flex: 1,
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  activeDeliveryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  activeDeliveryCode: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
    marginRight: 12,
  },
  activeDeliveryStatus: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
  },
  activeDeliveryAddress: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 13,
    marginTop: 8,
  },
  availableCard: {
    margin: 16,
    marginTop: 0,
    padding: 16,
    borderRadius: 12,
  },
  availableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  availableTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  availableSubtitle: {
    fontSize: 12,
    marginTop: 8,
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 11,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    paddingBottom: 24,
  },
  actionButton: {
    width: '46%',
    margin: '2%',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  actionLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 8,
  },
})

export default DriverHomeScreen
