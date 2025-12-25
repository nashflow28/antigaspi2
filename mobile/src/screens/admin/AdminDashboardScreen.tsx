import React, { useEffect, useState, useRef } from 'react'
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useTheme } from '../../theme'
import { useAppDispatch } from '../../store/hooks'
import { logoutUser } from '../../store/slices/authSlice'
import apiService from '../../services/api'
import { Typography, Card, Badge } from '../../components/2025'
import AlertModal from '../../components/AlertModal'
import { useAlert } from '../../hooks/useAlert'
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

// Helper functions pour l'activité récente
const getActivityIcon = (type: string): any => {
  switch (type) {
    case 'reservation':
    case 'new_reservation':
      return 'receipt-outline'
    case 'user':
    case 'new_user':
      return 'person-add-outline'
    case 'product':
    case 'new_product':
      return 'cube-outline'
    case 'merchant':
    case 'new_merchant':
      return 'storefront-outline'
    case 'review':
      return 'star-outline'
    case 'payment':
      return 'cash-outline'
    default:
      return 'information-circle-outline'
  }
}

const getActivityColor = (type: string, theme: any): string => {
  switch (type) {
    case 'reservation':
    case 'new_reservation':
      return theme.colors.primary[500]
    case 'user':
    case 'new_user':
      return '#06B6D4'
    case 'product':
    case 'new_product':
      return theme.colors.warning
    case 'merchant':
    case 'new_merchant':
      return theme.colors.success
    case 'review':
      return '#F59E0B'
    case 'payment':
      return '#10B981'
    default:
      return theme.colors.neutral[400]
  }
}

const formatActivityDate = (dateString: string): string => {
  if (!dateString) return '--'
  const date = new Date(dateString)
  if (isNaN(date.getTime())) return '--'

  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const minutes = Math.floor(diff / (1000 * 60))
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))

  if (minutes < 1) return "À l'instant"
  if (minutes < 60) return `Il y a ${minutes} min`
  if (hours < 24) return `Il y a ${hours}h`
  if (days === 1) return 'Hier'
  if (days < 7) return `Il y a ${days} jours`
  return date.toLocaleDateString('fr-FR')
}

const AdminDashboardScreen: React.FC<AdminDashboardScreenProps> = ({ navigation }) => {
  const theme = useTheme()
  const insets = useSafeAreaInsets()
  const dispatch = useAppDispatch()
  const { alertProps, showError, showWarning, hideAlert } = useAlert()
  const isMountedRef = useRef(true)
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [loading, setLoading] = useState(true)

  // Logout handlers
  const handleLogout = () => {
    showWarning(
      'Déconnexion',
      'Êtes-vous sûr de vouloir vous déconnecter ?',
      [
        { text: 'Annuler', style: 'cancel', onPress: hideAlert },
        {
          text: 'Déconnexion',
          style: 'destructive',
          onPress: () => {
            hideAlert()
            void confirmLogout()
          },
        },
      ]
    )
  }

  const confirmLogout = async () => {
    try {
      await dispatch(logoutUser())
      // Navigation will be handled by MainNavigator when auth state changes
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error)
      showError('Erreur', 'Une erreur est survenue lors de la déconnexion')
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
      // apiService retourne directement response.data d'axios
      // Backend retourne: { success, stats: {...}, topMerchants, popularCategories, recentActivities, environmentalImpact }
      const response = await apiService.get('/admin/dashboard')
      console.log('🟢 [AdminDashboard] Response keys:', Object.keys(response || {}))

      // response EST directement l'objet {success, stats, ...}
      const backendData = response.stats ? response : response.data
      if (isMountedRef.current && backendData?.stats) {
        console.log('🟢 [AdminDashboard] Stats:', backendData.stats)

        // Calculer le total des produits depuis les catégories
        const totalProducts = backendData.popularCategories?.reduce(
          (acc: number, cat: any) => acc + (cat.productCount || 0), 0
        ) ?? 0

        // Transform backend camelCase to expected snake_case format
        const transformedStats: AdminStats = {
          total_users: backendData.stats?.totalUsers ?? 0,
          total_merchants: backendData.stats?.activeMerchants ?? 0,
          total_products: totalProducts,
          active_products: totalProducts, // Tous les produits listés sont actifs
          total_reservations: backendData.stats?.totalReservations ?? backendData.stats?.productsSaved ?? 0,
          total_revenue: backendData.stats?.totalRevenue ?? 0,
          pending_merchants: backendData.stats?.pendingMerchants ?? 0, // Maintenant récupéré du backend
          pending_products: backendData.stats?.pendingProducts ?? 0,
          recent_activity: backendData.recentActivities?.map((activity: any) => ({
            id: activity.id,
            type: activity.type,
            description: activity.description,
            created_at: activity.timestamp || activity.created_at,
          })) ?? [],
        }
        setStats(transformedStats)
      }
    } catch (error: any) {
      console.error('Erreur chargement stats admin:', error)

      // Gestion des erreurs d'autorisation
      if (error.response?.status === 401 || error.response?.status === 403) {
        if (isMountedRef.current) {
          showWarning(
            'Session expirée',
            'Votre session a expiré. Veuillez vous reconnecter.',
	            [
	              {
	                text: 'OK',
	                onPress: () => {
	                  hideAlert()
	                  navigation.replace('Login')
	                },
	              },
	            ]
	          )
        }
        return
      }

      if (isMountedRef.current) {
        showError('Erreur', 'Impossible de charger les statistiques')
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
        {/* Alertes - Améliorées avec meilleur contraste */}
        {stats && ((stats.pending_merchants ?? 0) > 0 || (stats.pending_products ?? 0) > 0) && (
          <View style={styles.section}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => navigation.navigate('Merchants')}
            >
              <Card
                variant="elevated"
                style={[styles.alertCard, {
                  backgroundColor: theme.isDark ? '#78350F' : '#FEF3C7',
                  borderLeftWidth: 4,
                  borderLeftColor: theme.colors.warning
                }]}
              >
                <View style={styles.alertContent}>
                  <View style={[styles.alertIconContainer, { backgroundColor: theme.colors.warning }]}>
                    <Ionicons name="alert-circle" size={24} color="white" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Typography variant="h4" weight="bold" style={{ marginBottom: 8, color: theme.isDark ? '#FEF3C7' : '#92400E' }}>
                      Actions requises
                    </Typography>
                    {(stats.pending_merchants ?? 0) > 0 && (
                      <View style={styles.alertItem}>
                        <View style={[styles.alertDot, { backgroundColor: theme.colors.warning }]} />
                        <Typography variant="body" style={{ color: theme.isDark ? '#FDE68A' : '#92400E' }}>
                          {stats.pending_merchants} commerçant{(stats.pending_merchants ?? 0) > 1 ? 's' : ''} en attente de validation
                        </Typography>
                      </View>
                    )}
                    {(stats.pending_products ?? 0) > 0 && (
                      <View style={styles.alertItem}>
                        <View style={[styles.alertDot, { backgroundColor: theme.colors.warning }]} />
                        <Typography variant="body" style={{ color: theme.isDark ? '#FDE68A' : '#92400E' }}>
                          {stats.pending_products} produit{(stats.pending_products ?? 0) > 1 ? 's' : ''} à modérer
                        </Typography>
                      </View>
                    )}
                    <Typography variant="caption" style={{ color: theme.isDark ? '#FBBF24' : '#B45309', marginTop: 8 }}>
                      Appuyez pour voir les détails →
                    </Typography>
                  </View>
                </View>
              </Card>
            </TouchableOpacity>
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

        {/* Actions rapides - Grille améliorée */}
        <View style={styles.section}>
          <Typography variant="h3" weight="bold" style={{ marginBottom: 16 }}>
            Actions rapides
          </Typography>

          <View style={styles.actionsGrid}>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => navigation.navigate('Users')}
              testID="action-users-button"
              style={styles.actionButton}
            >
              <Card variant="elevated" style={styles.actionCard}>
                <View style={[styles.actionIconContainer, { backgroundColor: theme.withOpacity(theme.colors.primary[500], 0.1) }]}>
                  <Ionicons name="people-outline" size={28} color={theme.colors.primary[500]} />
                </View>
                <Typography variant="small" weight="semibold" style={{ marginTop: 8, textAlign: 'center' }}>
                  Utilisateurs
                </Typography>
              </Card>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => navigation.navigate('Products')}
              testID="action-products-button"
              style={styles.actionButton}
            >
              <Card variant="elevated" style={styles.actionCard}>
                <View style={[styles.actionIconContainer, { backgroundColor: theme.withOpacity(theme.colors.warning, 0.1) }]}>
                  <Ionicons name="cube-outline" size={28} color={theme.colors.warning} />
                </View>
                <Typography variant="small" weight="semibold" style={{ marginTop: 8, textAlign: 'center' }}>
                  Produits
                </Typography>
              </Card>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => navigation.navigate('Merchants')}
              testID="action-merchants-button"
              style={styles.actionButton}
            >
              <Card variant="elevated" style={styles.actionCard}>
                <View style={[styles.actionIconContainer, { backgroundColor: theme.withOpacity(theme.colors.success, 0.1) }]}>
                  <Ionicons name="storefront-outline" size={28} color={theme.colors.success} />
                </View>
                <Typography variant="small" weight="semibold" style={{ marginTop: 8, textAlign: 'center' }}>
                  Commerçants
                </Typography>
                {(stats?.pending_merchants ?? 0) > 0 && (
                  <Badge variant="error" size="sm" style={{ position: 'absolute', top: 8, right: 8 }}>
                    {stats?.pending_merchants}
                  </Badge>
                )}
              </Card>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => navigation.navigate('Categories')}
              testID="action-categories-button"
              style={styles.actionButton}
            >
              <Card variant="elevated" style={styles.actionCard}>
                <View style={[styles.actionIconContainer, { backgroundColor: theme.withOpacity('#8B5CF6', 0.1) }]}>
                  <Ionicons name="grid-outline" size={28} color="#8B5CF6" />
                </View>
                <Typography variant="small" weight="semibold" style={{ marginTop: 8, textAlign: 'center' }}>
                  Catégories
                </Typography>
              </Card>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => navigation.navigate('Analytics')}
              testID="action-analytics-button"
              style={styles.actionButton}
            >
              <Card variant="elevated" style={styles.actionCard}>
                <View style={[styles.actionIconContainer, { backgroundColor: theme.withOpacity('#06B6D4', 0.1) }]}>
                  <Ionicons name="analytics-outline" size={28} color="#06B6D4" />
                </View>
                <Typography variant="small" weight="semibold" style={{ marginTop: 8, textAlign: 'center' }}>
                  Analytics
                </Typography>
              </Card>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => navigation.navigate('Reviews')}
              testID="action-moderation-button"
              style={styles.actionButton}
            >
              <Card variant="elevated" style={styles.actionCard}>
                <View style={[styles.actionIconContainer, { backgroundColor: theme.withOpacity(theme.colors.error, 0.1) }]}>
                  <Ionicons name="shield-checkmark-outline" size={28} color={theme.colors.error} />
                </View>
                <Typography variant="small" weight="semibold" style={{ marginTop: 8, textAlign: 'center' }}>
                  Modération
                </Typography>
              </Card>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => navigation.navigate('Notifications')}
              testID="action-broadcast-button"
              style={styles.actionButton}
            >
              <Card variant="elevated" style={styles.actionCard}>
                <View style={[styles.actionIconContainer, { backgroundColor: theme.withOpacity('#EC4899', 0.1) }]}>
                  <Ionicons name="megaphone-outline" size={28} color="#EC4899" />
                </View>
                <Typography variant="small" weight="semibold" style={{ marginTop: 8, textAlign: 'center' }}>
                  Diffusion
                </Typography>
              </Card>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => navigation.navigate('Payments')}
              testID="action-payments-button"
              style={styles.actionButton}
            >
              <Card variant="elevated" style={styles.actionCard}>
                <View style={[styles.actionIconContainer, { backgroundColor: theme.withOpacity('#10B981', 0.1) }]}>
                  <Ionicons name="card-outline" size={28} color="#10B981" />
                </View>
                <Typography variant="small" weight="semibold" style={{ marginTop: 8, textAlign: 'center' }}>
                  Paiements
                </Typography>
              </Card>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => navigation.navigate('Settings')}
              testID="action-settings-button"
              style={styles.actionButton}
            >
              <Card variant="elevated" style={styles.actionCard}>
                <View style={[styles.actionIconContainer, { backgroundColor: theme.withOpacity('#6B7280', 0.1) }]}>
                  <Ionicons name="settings-outline" size={28} color="#6B7280" />
                </View>
                <Typography variant="small" weight="semibold" style={{ marginTop: 8, textAlign: 'center' }}>
                  Paramètres
                </Typography>
              </Card>
            </TouchableOpacity>
          </View>
        </View>

        {/* Activité récente */}
        {stats?.recent_activity && stats.recent_activity.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Typography variant="h3" weight="bold">
                Activité récente
              </Typography>
              <TouchableOpacity onPress={() => navigation.navigate('Analytics')}>
                <Typography variant="small" color="primary">
                  Voir tout →
                </Typography>
              </TouchableOpacity>
            </View>

            <Card variant="elevated" style={{ padding: 0, overflow: 'hidden' }}>
              {stats.recent_activity.slice(0, 5).map((activity, index) => (
                <View
                  key={activity.id}
                  style={[
                    styles.activityItem,
                    index !== stats.recent_activity!.length - 1 && index < 4 && {
                      borderBottomWidth: 1,
                      borderBottomColor: theme.colors.border,
                    },
                  ]}
                >
                  <View style={[styles.activityIcon, { backgroundColor: getActivityColor(activity.type, theme) }]}>
                    <Ionicons
                      name={getActivityIcon(activity.type)}
                      size={18}
                      color="white"
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Typography variant="body" weight="medium" numberOfLines={1}>
                      {activity.description}
                    </Typography>
                    <Typography variant="caption" color="secondary">
                      {formatActivityDate(activity.created_at)}
                    </Typography>
                  </View>
                </View>
              ))}
            </Card>
          </View>
        )}

        {/* Message si pas d'activité récente */}
        {(!stats?.recent_activity || stats.recent_activity.length === 0) && (
          <View style={styles.section}>
            <Typography variant="h3" weight="bold" style={{ marginBottom: 16 }}>
              Activité récente
            </Typography>
            <Card variant="elevated" style={styles.emptyActivityCard}>
              <Ionicons name="time-outline" size={48} color={theme.colors.neutral[300]} />
              <Typography variant="body" color="secondary" style={{ marginTop: 12, textAlign: 'center' }}>
                Aucune activité récente à afficher
              </Typography>
            </Card>
          </View>
        )}
      </ScrollView>

      <AlertModal {...alertProps} />
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  alertCard: {
    padding: 16,
  },
  alertContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  alertIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  alertDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 8,
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
    justifyContent: 'space-between',
  },
  actionButton: {
    width: '23%',
    minWidth: 75,
  },
  actionCard: {
    padding: 12,
    alignItems: 'center',
    position: 'relative',
  },
  actionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  activityIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyActivityCard: {
    padding: 32,
    alignItems: 'center',
  },
})

export default AdminDashboardScreen
