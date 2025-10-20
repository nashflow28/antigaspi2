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
import { useTheme } from '../../theme'
import apiService from '../../services/api'

interface AdminStats {
  total_users: number
  total_merchants: number
  total_products: number
  active_products: number
  total_reservations: number
  total_revenue: number
}

const AdminDashboardScreen: React.FC = () => {
  const theme = useTheme()
  const [stats, setStats] = useState<AdminStats>({
    total_users: 0,
    total_merchants: 0,
    total_products: 0,
    active_products: 0,
    total_reservations: 0,
    total_revenue: 0,
  })
  const [refreshing, setRefreshing] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      const response = await apiService.get('/admin/stats')
      setStats(response.data || {
        total_users: 0,
        total_merchants: 0,
        total_products: 0,
        active_products: 0,
        total_reservations: 0,
        total_revenue: 0,
      })
    } catch (error) {
      console.error('Erreur chargement stats admin:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const onRefresh = () => {
    setRefreshing(true)
    loadDashboardData()
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar barStyle="dark-content" backgroundColor={theme.colors.background} />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.colors.primary[500] }]}>
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.headerSubtitle}>Administrateur</Text>
            <Text style={styles.headerTitle}>Dashboard</Text>
          </View>
          <TouchableOpacity onPress={loadDashboardData} style={styles.refreshButton}>
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
        {/* Statistiques principales */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Vue d'ensemble
          </Text>

          <View style={styles.statsGrid}>
            {/* Utilisateurs */}
            <View style={[styles.statCard, { backgroundColor: theme.colors.surface.light }]}>
              <View style={[styles.statIcon, { backgroundColor: theme.withOpacity(theme.colors.primary[500], 0.1) }]}>
                <Ionicons name="people" size={28} color={theme.colors.primary[500]} />
              </View>
              <Text style={[styles.statValue, { color: theme.colors.text }]}>
                {stats.total_users.toLocaleString()}
              </Text>
              <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
                Utilisateurs
              </Text>
            </View>

            {/* Commerçants */}
            <View style={[styles.statCard, { backgroundColor: theme.colors.surface.light }]}>
              <View style={[styles.statIcon, { backgroundColor: theme.withOpacity(theme.colors.semantic.info, 0.1) }]}>
                <Ionicons name="storefront" size={28} color={theme.colors.semantic.info} />
              </View>
              <Text style={[styles.statValue, { color: theme.colors.text }]}>
                {stats.total_merchants.toLocaleString()}
              </Text>
              <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
                Commerçants
              </Text>
            </View>

            {/* Produits */}
            <View style={[styles.statCard, { backgroundColor: theme.colors.surface.light }]}>
              <View style={[styles.statIcon, { backgroundColor: theme.withOpacity(theme.colors.semantic.warning, 0.1) }]}>
                <Ionicons name="cube" size={28} color={theme.colors.semantic.warning} />
              </View>
              <Text style={[styles.statValue, { color: theme.colors.text }]}>
                {stats.total_products.toLocaleString()}
              </Text>
              <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
                Produits
              </Text>
              <Text style={[styles.statSubLabel, { color: theme.colors.semantic.success }]}>
                {stats.active_products} actifs
              </Text>
            </View>

            {/* Réservations */}
            <View style={[styles.statCard, { backgroundColor: theme.colors.surface.light }]}>
              <View style={[styles.statIcon, { backgroundColor: theme.withOpacity(theme.colors.semantic.success, 0.1) }]}>
                <Ionicons name="receipt" size={28} color={theme.colors.semantic.success} />
              </View>
              <Text style={[styles.statValue, { color: theme.colors.text }]}>
                {stats.total_reservations.toLocaleString()}
              </Text>
              <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
                Réservations
              </Text>
            </View>
          </View>
        </View>

        {/* Revenus */}
        <View style={styles.section}>
          <View style={[styles.revenueCard, { backgroundColor: theme.colors.primary[500] }]}>
            <View style={styles.revenueHeader}>
              <Ionicons name="cash" size={32} color="white" />
              <Text style={styles.revenueLabel}>Revenus totaux</Text>
            </View>
            <Text style={styles.revenueValue}>
              {stats.total_revenue.toLocaleString()} F CFA
            </Text>
          </View>
        </View>

        {/* Actions rapides */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Actions rapides
          </Text>

          <View style={styles.actionsGrid}>
            <TouchableOpacity
              style={[styles.actionCard, { backgroundColor: theme.colors.surface.light }]}
            >
              <Ionicons name="people-outline" size={32} color={theme.colors.primary[500]} />
              <Text style={[styles.actionText, { color: theme.colors.text }]}>
                Gérer utilisateurs
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionCard, { backgroundColor: theme.colors.surface.light }]}
            >
              <Ionicons name="cube-outline" size={32} color={theme.colors.primary[500]} />
              <Text style={[styles.actionText, { color: theme.colors.text }]}>
                Gérer produits
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionCard, { backgroundColor: theme.colors.surface.light }]}
            >
              <Ionicons name="storefront-outline" size={32} color={theme.colors.primary[500]} />
              <Text style={[styles.actionText, { color: theme.colors.text }]}>
                Gérer commerçants
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionCard, { backgroundColor: theme.colors.surface.light }]}
            >
              <Ionicons name="grid-outline" size={32} color={theme.colors.primary[500]} />
              <Text style={[styles.actionText, { color: theme.colors.text }]}>
                Gérer catégories
              </Text>
            </TouchableOpacity>
          </View>
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
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '47%',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  statIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    textAlign: 'center',
  },
  statSubLabel: {
    fontSize: 12,
    marginTop: 4,
    fontWeight: '600',
  },
  revenueCard: {
    padding: 24,
    borderRadius: 16,
  },
  revenueHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  revenueLabel: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 16,
    fontWeight: '600',
  },
  revenueValue: {
    color: 'white',
    fontSize: 32,
    fontWeight: 'bold',
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionCard: {
    flex: 1,
    minWidth: '47%',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    gap: 12,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
})

export default AdminDashboardScreen
