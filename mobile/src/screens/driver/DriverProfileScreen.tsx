import React, { useEffect, useCallback, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Image,
  Alert,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useNavigation } from '@react-navigation/native'
import { useDispatch, useSelector } from 'react-redux'
import { useTheme } from '../../theme'
import { useHaptics } from '../../hooks/useHaptics'
import { RootState, AppDispatch } from '../../store'
import { fetchDriverProfile } from '../../store/slices/driverSlice'
import { logoutUser, deleteAccountUser } from '../../store/slices/authSlice'
import LoadingSpinner from '../../components/LoadingSpinner'

const DriverProfileScreen: React.FC = () => {
  const theme = useTheme()
  const haptics = useHaptics()
  const navigation = useNavigation<any>()
  const dispatch = useDispatch<AppDispatch>()

  const [refreshing, setRefreshing] = useState(false)

  const { user } = useSelector((state: RootState) => state.auth)
  const { profile, profileLoading } = useSelector((state: RootState) => state.driver)

  const loadData = useCallback(async () => {
    await dispatch(fetchDriverProfile())
  }, [dispatch])

  useEffect(() => {
    loadData()
  }, [loadData])

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await loadData()
    setRefreshing(false)
  }, [loadData])

  const handleLogout = () => {
    Alert.alert(
      'Déconnexion',
      'Êtes-vous sûr de vouloir vous déconnecter?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Déconnexion',
          style: 'destructive',
          onPress: () => {
            haptics.mediumTap()
            dispatch(logoutUser())
          },
        },
      ]
    )
  }

  const handleDeleteAccount = () => {
    Alert.alert(
      'Supprimer mon compte',
      'Êtes-vous sûr de vouloir supprimer définitivement votre compte et toutes vos données ? Cette action est irréversible.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            haptics.mediumTap()
            try {
              await dispatch(deleteAccountUser()).unwrap()
            } catch (error) {
              Alert.alert('Erreur', 'Une erreur est survenue lors de la suppression de votre compte.')
            }
          },
        },
      ]
    )
  }

  const MenuItem = ({ icon, label, onPress, color, badge }: {
    icon: string
    label: string
    onPress: () => void
    color?: string
    badge?: string
  }) => (
    <TouchableOpacity
      style={[styles.menuItem, { backgroundColor: theme.colors.cardBackground }]}
      onPress={onPress}
    >
      <View style={[styles.menuIcon, { backgroundColor: (color || theme.colors.primary[500]) + '15' }]}>
        <Ionicons name={icon as any} size={20} color={color || theme.colors.primary[500]} />
      </View>
      <Text style={[styles.menuLabel, { color: color || theme.colors.text }]}>{label}</Text>
      {badge && (
        <View style={[styles.badge, { backgroundColor: theme.colors.error }]}>
          <Text style={styles.badgeText}>{badge}</Text>
        </View>
      )}
      <Ionicons name="chevron-forward" size={20} color={theme.colors.neutral[400]} />
    </TouchableOpacity>
  )

  const getVehicleLabel = (type: string): string => {
    const labels: Record<string, string> = {
      moto: 'Moto',
      velo: 'Vélo',
      voiture: 'Voiture',
      pied: 'À pied',
    }
    return labels[type] || type
  }

  if (profileLoading && !profile) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <LoadingSpinner />
      </SafeAreaView>
    )
  }

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
          <Text style={[styles.title, { color: theme.colors.text }]}>Mon compte</Text>
        </View>

        {/* Profile card */}
        <View style={[styles.profileCard, { backgroundColor: theme.colors.cardBackground }]}>
          <View style={styles.profileHeader}>
            {profile?.photo_url || user?.photo_url ? (
              <Image
                source={{ uri: profile?.photo_url || user?.photo_url || '' }}
                style={styles.avatar}
              />
            ) : (
              <View style={[styles.avatarPlaceholder, { backgroundColor: theme.colors.primary[100] }]}>
                <Text style={[styles.avatarText, { color: theme.colors.primary[500] }]}>
                  {user?.first_name?.charAt(0) || 'L'}
                </Text>
              </View>
            )}
            <View style={styles.profileInfo}>
              <Text style={[styles.profileName, { color: theme.colors.text }]}>
                {user?.first_name} {user?.last_name}
              </Text>
              <View style={styles.statusRow}>
                <View style={[
                  styles.statusBadge,
                  { backgroundColor: profile?.is_verified ? theme.colors.success + '20' : theme.colors.warning + '20' }
                ]}>
                  <Ionicons
                    name={profile?.is_verified ? 'checkmark-circle' : 'time'}
                    size={14}
                    color={profile?.is_verified ? theme.colors.success : theme.colors.warning}
                  />
                  <Text style={[
                    styles.statusText,
                    { color: profile?.is_verified ? theme.colors.success : theme.colors.warning }
                  ]}>
                    {profile?.is_verified ? 'Vérifié' : 'En attente'}
                  </Text>
                </View>
              </View>
            </View>
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => navigation.navigate('DriverProfileEdit')}
            >
              <Ionicons name="pencil" size={20} color={theme.colors.primary[500]} />
            </TouchableOpacity>
          </View>

          {/* Vehicle info */}
          <View style={[styles.vehicleInfo, { borderTopColor: theme.colors.border }]}>
            <Ionicons
              name={profile?.vehicle_type === 'moto' ? 'bicycle' : profile?.vehicle_type === 'voiture' ? 'car' : 'walk'}
              size={20}
              color={theme.colors.textSecondary}
            />
            <Text style={[styles.vehicleText, { color: theme.colors.textSecondary }]}>
              {getVehicleLabel(profile?.vehicle_type || '')}
              {profile?.vehicle_plate && ` - ${profile.vehicle_plate}`}
            </Text>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: theme.colors.cardBackground }]}>
            <Text style={[styles.statValue, { color: theme.colors.text }]}>
              {profile?.total_deliveries || 0}
            </Text>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
              Livraisons
            </Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: theme.colors.cardBackground }]}>
            <Text style={[styles.statValue, { color: theme.colors.text }]}>
              {profile?.rating?.toFixed(1) || '—'}
            </Text>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
              Note
            </Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: theme.colors.cardBackground }]}>
            <Text style={[styles.statValue, { color: theme.colors.success }]}>
              {formatCurrency(profile?.total_earnings || 0)}
            </Text>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
              Gains
            </Text>
          </View>
        </View>

        {/* Menu items */}
        <View style={styles.menuSection}>
          <MenuItem
            icon="wallet-outline"
            label="Mes gains"
            onPress={() => navigation.navigate('Earnings')}
          />
          <MenuItem
            icon="time-outline"
            label="Historique des livraisons"
            onPress={() => navigation.navigate('DriverHistory')}
          />
          <MenuItem
            icon="notifications-outline"
            label="Notifications"
            onPress={() => navigation.navigate('NotificationsInbox')}
          />
          <MenuItem
            icon="settings-outline"
            label="Paramètres de notifications"
            onPress={() => navigation.navigate('NotificationSettings')}
          />
        </View>

        <View style={styles.menuSection}>
          <MenuItem
            icon="help-circle-outline"
            label="Aide et support"
            onPress={() => Alert.alert('Support', 'Contactez-nous à support@geladal.com')}
          />
          <MenuItem
            icon="document-text-outline"
            label="Conditions d'utilisation"
            onPress={() => {}}
          />
        </View>

        <View style={styles.menuSection}>
          <MenuItem
            icon="log-out-outline"
            label="Déconnexion"
            onPress={handleLogout}
            color={theme.colors.error}
          />
          <MenuItem
            icon="trash-outline"
            label="Supprimer mon compte"
            onPress={handleDeleteAccount}
            color={theme.colors.error}
          />
        </View>

        <Text style={[styles.version, { color: theme.colors.textTertiary }]}>
          Version 1.0.0 (Driver)
        </Text>
      </ScrollView>
    </SafeAreaView>
  )
}

const formatCurrency = (amount: number): string => {
  if (!amount) return '0'
  if (amount >= 1000000) {
    return (amount / 1000000).toFixed(1) + 'M'
  }
  if (amount >= 1000) {
    return (amount / 1000).toFixed(0) + 'k'
  }
  return amount.toString()
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  profileCard: {
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  avatarPlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  profileInfo: {
    flex: 1,
    marginLeft: 16,
  },
  profileName: {
    fontSize: 18,
    fontWeight: '600',
  },
  statusRow: {
    flexDirection: 'row',
    marginTop: 4,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  editButton: {
    padding: 8,
  },
  vehicleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
  },
  vehicleText: {
    fontSize: 14,
    marginLeft: 8,
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 11,
    marginTop: 4,
  },
  menuSection: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    marginBottom: 8,
  },
  menuIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuLabel: {
    flex: 1,
    fontSize: 15,
    marginLeft: 12,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginRight: 8,
  },
  badgeText: {
    color: 'white',
    fontSize: 11,
    fontWeight: '600',
  },
  version: {
    textAlign: 'center',
    fontSize: 12,
    marginVertical: 24,
  },
})

export default DriverProfileScreen
