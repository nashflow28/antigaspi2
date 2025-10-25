import React, { useEffect, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  StatusBar,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useNavigation } from '@react-navigation/native'
import { useTheme } from '../../theme'
import apiService from '../../services/api'
import { TEST_IDS } from '../../utils/testIds'

interface Stats {
  active_products: number
  pending_reservations: number
  todays_revenue: number
  total_products: number
}

interface Reservation {
  id: number
  customer_name: string
  product_name: string
  quantity: number
  status: string
  created_at: string
}

const MerchantDashboardScreen: React.FC = () => {
  const theme = useTheme()
  const navigation = useNavigation()
  const [stats, setStats] = useState<Stats>({
    active_products: 0,
    pending_reservations: 0,
    todays_revenue: 0,
    total_products: 0,
  })
  const [recentReservations, setRecentReservations] = useState<Reservation[]>([])
  const [refreshing, setRefreshing] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      // Charger les stats
      const statsResponse = await apiService.get('/analytics/merchant-stats')
      setStats(statsResponse.data || {
        active_products: 0,
        pending_reservations: 0,
        todays_revenue: 0,
        total_products: 0,
      })

      // Charger les réservations récentes
      const reservationsResponse = await apiService.get('/reservations/merchant/list?limit=5')
      setRecentReservations(reservationsResponse.data.data || [])
    } catch (error) {
      console.error('Erreur chargement dashboard:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const onRefresh = () => {
    setRefreshing(true)
    loadDashboardData()
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return theme.colors.semantic.warning
      case 'confirmed':
        return theme.colors.semantic.success
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
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]} testID={TEST_IDS.merchantDashboard}>
      <StatusBar barStyle="dark-content" backgroundColor={theme.colors.background} />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.colors.primary[500] }]}>
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.headerSubtitle}>Commerçant</Text>
            <Text style={styles.headerTitle}>Tableau de bord</Text>
          </View>
          <TouchableOpacity
            onPress={loadDashboardData}
            style={styles.refreshButton}
            accessibilityRole="button"
            accessibilityLabel="Rafraîchir le tableau de bord"
          >
            <Ionicons name="refresh" size={24} color="white" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Button to Analytics */}
        <TouchableOpacity
          style={[styles.analyticsButton, { backgroundColor: theme.colors.primary[500] }]}
          onPress={() => (navigation as any).navigate('Analytics')}
        >
          <Ionicons name="stats-chart" size={20} color="white" />
          <Text style={styles.analyticsButtonText}>Voir statistiques détaillées</Text>
          <Ionicons name="chevron-forward" size={20} color="white" />
        </TouchableOpacity>

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={[styles.statCard, { backgroundColor: theme.colors.surface.light }]} testID={TEST_IDS.activeProductsCard}>
            <View style={[styles.statIcon, { backgroundColor: theme.withOpacity(theme.colors.primary[500], 0.1) }]}>
              <Ionicons name="cube" size={24} color={theme.colors.primary[500]} />
            </View>
            <Text style={[styles.statValue, { color: theme.colors.text }]}>
              {stats.active_products}
            </Text>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
              Produits actifs
            </Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: theme.colors.surface.light }]}>
            <View style={[styles.statIcon, { backgroundColor: theme.withOpacity(theme.colors.semantic.warning, 0.1) }]}>
              <Ionicons name="hourglass" size={24} color={theme.colors.semantic.warning} />
            </View>
            <Text style={[styles.statValue, { color: theme.colors.text }]}>
              {stats.pending_reservations}
            </Text>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
              En attente
            </Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: theme.colors.surface.light }]} testID={TEST_IDS.totalSalesCard}>
            <View style={[styles.statIcon, { backgroundColor: theme.withOpacity(theme.colors.semantic.success, 0.1) }]}>
              <Ionicons name="cash" size={24} color={theme.colors.semantic.success} />
            </View>
            <Text style={[styles.statValue, { color: theme.colors.text }]}>
              {(stats.todays_revenue || 0).toLocaleString()} F
            </Text>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
              Revenus aujourd'hui
            </Text>
          </View>
        </View>

        {/* Réservations récentes */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              Réservations récentes
            </Text>
            <TouchableOpacity onPress={() => (navigation as any).navigate('Reservations')}>
              <Text style={[styles.sectionLink, { color: theme.colors.primary[500] }]}>
                Voir tout
              </Text>
            </TouchableOpacity>
          </View>

          {recentReservations.length === 0 ? (
            <View style={[styles.emptyState, { backgroundColor: theme.colors.surface.light }]}>
              <Ionicons name="receipt-outline" size={48} color={theme.colors.neutral[300]} />
              <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
                Aucune réservation récente
              </Text>
            </View>
          ) : (
            recentReservations.map((reservation) => (
              <View
                key={reservation.id}
                style={[styles.reservationCard, { backgroundColor: theme.colors.surface.light }]}
              >
                <View style={styles.reservationHeader}>
                  <View style={styles.customerInfo}>
                    <Ionicons name="person-circle" size={40} color={theme.colors.primary[500]} />
                    <View style={styles.customerDetails}>
                      <Text style={[styles.customerName, { color: theme.colors.text }]}>
                        {reservation.customer_name}
                      </Text>
                      <Text style={[styles.productName, { color: theme.colors.textSecondary }]}>
                        {reservation.product_name}
                      </Text>
                    </View>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: theme.withOpacity(getStatusColor(reservation.status), 0.1) }]}>
                    <Text style={[styles.statusText, { color: getStatusColor(reservation.status) }]}>
                      {getStatusText(reservation.status)}
                    </Text>
                  </View>
                </View>
                <View style={styles.reservationFooter}>
                  <Text style={[styles.reservationDate, { color: theme.colors.textSecondary }]}>
                    {formatDate(reservation.created_at)}
                  </Text>
                  <Text style={[styles.quantity, { color: theme.colors.textSecondary }]}>
                    Qté: {reservation.quantity}
                  </Text>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerSubtitle: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    marginBottom: 4,
  },
  headerTitle: {
    color: 'white',
    fontSize: 28,
    fontWeight: 'bold',
  },
  refreshButton: {
    padding: 8,
  },
  content: {
    flex: 1,
  },
  analyticsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 16,
    marginTop: 16,
    padding: 14,
    borderRadius: 12,
    gap: 8,
  },
  analyticsButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '30%',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
  section: {
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  sectionLink: {
    fontSize: 14,
    fontWeight: '600',
  },
  emptyState: {
    padding: 40,
    borderRadius: 12,
    alignItems: 'center',
  },
  emptyText: {
    marginTop: 12,
    fontSize: 14,
  },
  reservationCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  reservationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
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
  productName: {
    fontSize: 14,
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
  reservationFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.05)',
  },
  reservationDate: {
    fontSize: 12,
  },
  quantity: {
    fontSize: 12,
  },
})

export default MerchantDashboardScreen
