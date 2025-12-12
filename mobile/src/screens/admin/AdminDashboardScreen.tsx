import React, { useEffect, useState, useRef } from 'react'
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  Alert,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useTheme } from '../../theme'
import { useAppDispatch } from '../../store/hooks'
import { logoutUser } from '../../store/slices/authSlice'
import apiService from '../../services/api'
import { Typography, Card } from '../../components/2025'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'

interface AdminStats {
  total_users: number
  total_merchants: number
  total_products: number
  active_products: number
  total_reservations: number
  total_revenue: number
  pending_merchants?: number
  pending_products?: number
  recent_activity?: Array<{
    id: number
    type: string
    description: string
    created_at: string
  }>
}

type AdminDashboardScreenProps = {
  navigation: NativeStackNavigationProp<any>
}

const AdminDashboardScreen: React.FC<AdminDashboardScreenProps> = ({ navigation }) => {
  const theme = useTheme()
  const insets = useSafeAreaInsets()
  const dispatch = useAppDispatch()
  const isMountedRef = useRef(true)
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [loading, setLoading] = useState(true)

  // Logout handlers
  const handleLogout = () => {
    Alert.alert(
      'Déconnexion',
      'Êtes-vous sûr de vouloir vous déconnecter ?',
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Déconnexion', style: 'destructive', onPress: confirmLogout },
      ]
    )
  }

  const confirmLogout = async () => {
    try {
      await dispatch(logoutUser())
      // Navigation will be handled by MainNavigator when auth state changes
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error)
      Alert.alert('Erreur', 'Une erreur est survenue lors de la déconnexion')
    }
  }

  useEffect(() => {
    isMountedRef.current = true
    loadDashboardData()

    return () => {
      isMountedRef.current = false
    }
  }, [])

  const loadDashboardData = async () => {
    try {
      if (isMountedRef.current) {
        setLoading(true)
      }

      // API endpoint: GET /admin/dashboard
      // Expected response: { data: AdminStats }
      const response = await apiService.get('/admin/dashboard')

      if (isMountedRef.current && response.data) {
        setStats(response.data)
      }
    } catch (error: any) {
      console.error('Erreur chargement stats admin:', error)

      // Gestion des erreurs d'autorisation
      if (error.response?.status === 401 || error.response?.status === 403) {
        if (isMountedRef.current) {
          Alert.alert(
            'Session expirée',
            'Votre session a expiré. Veuillez vous reconnecter.',
            [
              {
                text: 'OK',
                onPress: () => navigation.replace('Login'),
              },
            ]
          )
        }
        return
      }

      if (isMountedRef.current) {
        Alert.alert('Erreur', 'Impossible de charger les statistiques')
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false)
        setRefreshing(false)
      }
    }
  }

  const onRefresh = () => {
    setRefreshing(true)
    loadDashboardData()
  }

  if (loading) {
    return (
      <View
        style={[styles.container, styles.centered, { backgroundColor: theme.colors.background }]}
      >
        <ActivityIndicator size="large" color={theme.colors.primary[500]} />
        <Typography variant="body" color="secondary" style={{ marginTop: 12 }}>
          Chargement du tableau de bord...
        </Typography>
      </View>
    )
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.primary[500]} />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.colors.primary[500], paddingTop: insets.top + 10 }]}>
        <View style={styles.headerContent}>
          <View>
            <Typography variant="caption" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
              Administrateur
            </Typography>
            <Typography variant="h2" weight="bold" style={{ color: 'white' }}>
              Dashboard
            </Typography>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity
              onPress={loadDashboardData}
              style={styles.headerButton}
              accessibilityLabel="Rafraîchir le dashboard"
              testID="refresh-dashboard-button"
            >
              <Ionicons name="refresh" size={24} color="white" testID="refresh-icon" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleLogout}
              style={styles.headerButton}
              accessibilityLabel="Se déconnecter"
              testID="logout-button"
            >
              <Ionicons name="log-out-outline" size={24} color="white" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <ScrollView
        testID="dashboard-scroll"
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.colors.primary[500]]}
          />
        }
      >
        {/* Alertes */}
        {stats && ((stats.pending_merchants ?? 0) > 0 || (stats.pending_products ?? 0) > 0) && (
          <View style={styles.section}>
            <Card
              variant="elevated"
              style={[styles.alertCard, { backgroundColor: theme.colors.warning }]}
            >
              <View style={styles.alertContent}>
                <Ionicons name="alert-circle" size={32} color={theme.colors.warning} />
                <View style={{ flex: 1 }}>
                  <Typography variant="h4" weight="semibold" style={{ marginBottom: 4 }}>
                    Actions requises
                  </Typography>
                  {(stats.pending_merchants ?? 0) > 0 && (
                    <Typography variant="body" color="secondary">
                      • {stats.pending_merchants} commerçant{(stats.pending_merchants ?? 0) > 1 ? 's' : ''} à valider
                    </Typography>
                  )}
                  {(stats.pending_products ?? 0) > 0 && (
                    <Typography variant="body" color="secondary">
                      • {stats.pending_products} produit{(stats.pending_products ?? 0) > 1 ? 's' : ''} à modérer
                    </Typography>
                  )}
                </View>
              </View>
            </Card>
          </View>
        )}

        {/* Statistiques principales */}
        <View style={styles.section}>
          <Typography variant="h3" weight="bold" style={{ marginBottom: 16 }}>
            Vue d'ensemble
          </Typography>

          <View style={styles.statsGrid}>
            {/* Utilisateurs */}
            <Card variant="elevated" style={styles.statCard}>
              <View
                style={[
                  styles.statIcon,
                  { backgroundColor: theme.withOpacity(theme.colors.primary[500], 0.1) },
                ]}
              >
                <Ionicons name="people" size={28} color={theme.colors.primary[500]} />
              </View>
              <Typography variant="h2" weight="bold" style={{ marginTop: 12 }}>
                {(stats?.total_users ?? 0).toLocaleString()}
              </Typography>
              <Typography variant="caption" color="secondary">
                Utilisateurs
              </Typography>
            </Card>

            {/* Commerçants */}
            <Card variant="elevated" style={styles.statCard}>
              <View
                style={[
                  styles.statIcon,
                  { backgroundColor: theme.withOpacity(theme.colors.success, 0.1) },
                ]}
              >
                <Ionicons name="storefront" size={28} color={theme.colors.success} />
              </View>
              <Typography variant="h2" weight="bold" style={{ marginTop: 12 }}>
                {(stats?.total_merchants ?? 0).toLocaleString()}
              </Typography>
              <Typography variant="caption" color="secondary">
                Commerçants
              </Typography>
            </Card>

            {/* Produits */}
            <Card variant="elevated" style={styles.statCard}>
              <View
                style={[
                  styles.statIcon,
                  { backgroundColor: theme.withOpacity(theme.colors.warning, 0.1) },
                ]}
              >
                <Ionicons name="cube" size={28} color={theme.colors.warning} />
              </View>
              <Typography variant="h2" weight="bold" style={{ marginTop: 12 }}>
                {(stats?.total_products ?? 0).toLocaleString()}
              </Typography>
              <Typography variant="caption" color="secondary">
                Produits
              </Typography>
              <Typography
                variant="caption"
                style={{ color: theme.colors.success, marginTop: 4 }}
              >
                {stats?.active_products ?? 0} actifs
              </Typography>
            </Card>

            {/* Réservations */}
            <Card variant="elevated" style={styles.statCard}>
              <View
                style={[
                  styles.statIcon,
                  { backgroundColor: theme.withOpacity(theme.colors.error, 0.1) },
                ]}
              >
                <Ionicons name="receipt" size={28} color={theme.colors.error} />
              </View>
              <Typography variant="h2" weight="bold" style={{ marginTop: 12 }}>
                {(stats?.total_reservations ?? 0).toLocaleString()}
              </Typography>
              <Typography variant="caption" color="secondary">
                Réservations
              </Typography>
            </Card>
          </View>
        </View>

        {/* Revenus */}
        <View style={styles.section}>
          <Card
            variant="elevated"
            style={[styles.revenueCard, { backgroundColor: theme.colors.primary[500] }]}
          >
            <View style={styles.revenueHeader}>
              <Ionicons name="cash" size={32} color="white" />
              <Typography variant="body" weight="medium" style={{ color: 'rgba(255, 255, 255, 0.9)' }}>
                Revenus totaux
              </Typography>
            </View>
            <Typography variant="h1" weight="bold" style={{ color: 'white' }}>
              {(stats?.total_revenue ?? 0).toLocaleString()} XOF
            </Typography>
          </Card>
        </View>

        {/* Actions rapides */}
        <View style={styles.section}>
          <Typography variant="h3" weight="bold" style={{ marginBottom: 16 }}>
            Actions rapides
          </Typography>

          <View style={styles.actionsGrid}>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => navigation.navigate('Users')}
              testID="action-users-button"
            >
              <Card variant="elevated" style={styles.actionCard}>
                <Ionicons name="people-outline" size={32} color={theme.colors.primary[500]} />
                <Typography
                  variant="body"
                  weight="semibold"
                  style={{ marginTop: 12, textAlign: 'center' }}
                >
                  Gérer utilisateurs
                </Typography>
              </Card>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => navigation.navigate('Products')}
              testID="action-products-button"
            >
              <Card variant="elevated" style={styles.actionCard}>
                <Ionicons name="cube-outline" size={32} color={theme.colors.primary[500]} />
                <Typography
                  variant="body"
                  weight="semibold"
                  style={{ marginTop: 12, textAlign: 'center' }}
                >
                  Gérer produits
                </Typography>
              </Card>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => navigation.navigate('Merchants')}
              testID="action-merchants-button"
            >
              <Card variant="elevated" style={styles.actionCard}>
                <Ionicons name="storefront-outline" size={32} color={theme.colors.primary[500]} />
                <Typography
                  variant="body"
                  weight="semibold"
                  style={{ marginTop: 12, textAlign: 'center' }}
                >
                  Gérer commerçants
                </Typography>
              </Card>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => navigation.navigate('Categories')}
              testID="action-categories-button"
            >
              <Card variant="elevated" style={styles.actionCard}>
                <Ionicons name="grid-outline" size={32} color={theme.colors.primary[500]} />
                <Typography
                  variant="body"
                  weight="semibold"
                  style={{ marginTop: 12, textAlign: 'center' }}
                >
                  Gérer catégories
                </Typography>
              </Card>
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
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerButton: {
    padding: 8,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  section: {
    marginBottom: 24,
  },
  alertCard: {
    padding: 16,
  },
  alertContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
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
    alignItems: 'center',
  },
  statIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  revenueCard: {
    padding: 24,
  },
  revenueHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionCard: {
    minWidth: 160,
    padding: 20,
    alignItems: 'center',
  },
})

export default AdminDashboardScreen
