import React from 'react'
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Switch,
} from 'react-native'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigation } from '@react-navigation/native'
import { logoutUser } from '../../store/slices/authSlice'
import { AppDispatch, RootState } from '../../store'
import { Ionicons } from '@expo/vector-icons'
import { Card, Badge, Typography } from '../../components/2025'
import { useTheme } from '../../theme'
import AsyncStorage from '@react-native-async-storage/async-storage'

const ProfileScreen: React.FC = () => {
  const theme = useTheme()
  const navigation = useNavigation()
  const { mode, setThemeMode } = theme
  const dispatch = useDispatch<AppDispatch>()
  const { user, loading } = useSelector((state: RootState) => state.auth)

  const handleLogout = () => {
    console.log('🔴 handleLogout clicked!')
    Alert.alert(
      'Déconnexion',
      'Êtes-vous sûr de vouloir vous déconnecter ?',
      [
        {
          text: 'Annuler',
          style: 'cancel',
          onPress: () => console.log('🟢 Déconnexion annulée')
        },
        {
          text: 'Déconnexion',
          style: 'destructive',
          onPress: confirmLogout
        }
      ],
      { cancelable: true }
    )
  }

  const confirmLogout = async () => {
    console.log('🔴 Confirmation déconnexion')
    try {
      // Nettoyer complètement le cache
      await AsyncStorage.clear()
      // Déconnexion
      await dispatch(logoutUser())
      console.log('✅ Déconnexion réussie')
    } catch (error) {
      console.error('❌ Erreur déconnexion:', error)
    }
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Card variant="elevated" style={{ alignItems: 'center', paddingVertical: theme.spacing['2xl'], paddingTop: theme.spacing['3xl'], marginBottom: theme.spacing.lg }}>
        <View style={[styles.avatar, { backgroundColor: theme.colors.neutral[100], marginBottom: theme.spacing.md }]}>
          <Ionicons name="person" size={40} color={theme.colors.primary[500]} />
        </View>
        <Typography variant="h2" weight="bold" style={{ marginBottom: theme.spacing.xs }}>
          {user?.first_name} {user?.last_name}
        </Typography>
        <Typography variant="body" color="secondary" style={{ marginBottom: theme.spacing.sm }}>
          {user?.email}
        </Typography>
        <Badge variant={user?.role === 'consumer' ? 'primary' : 'promo'} size="md">
          {user?.role === 'consumer' ? 'Consommateur' : 'Commerçant'}
        </Badge>
      </Card>

      <Card variant="elevated" style={{ marginHorizontal: theme.spacing.lg, overflow: 'hidden' }}>
        <TouchableOpacity
          style={[styles.menuItem, { paddingHorizontal: theme.spacing.lg, paddingVertical: theme.spacing.md, borderBottomWidth: 1, borderBottomColor: theme.colors.border }]}
          onPress={() => {
            if (user?.role === 'merchant') {
              (navigation as any).navigate('ProfileEdit')
            } else {
              Alert.alert('Bientôt disponible', 'La modification du profil sera bientôt disponible.')
            }
          }}
        >
          <Ionicons name="person-outline" size={24} color={theme.colors.text} />
          <Typography variant="body" style={{ flex: 1, marginLeft: theme.spacing.md }}>
            Modifier le profil
          </Typography>
          <Ionicons name="chevron-forward" size={20} color={theme.colors.neutral[400]} />
        </TouchableOpacity>

        {user?.role === 'merchant' && (
          <TouchableOpacity
            style={[styles.menuItem, { paddingHorizontal: theme.spacing.lg, paddingVertical: theme.spacing.md, borderBottomWidth: 1, borderBottomColor: theme.colors.border }]}
            onPress={() => (navigation as any).navigate('OpeningHours')}
          >
            <Ionicons name="time-outline" size={24} color={theme.colors.text} />
            <Typography variant="body" style={{ flex: 1, marginLeft: theme.spacing.md }}>
              Heures d'ouverture
            </Typography>
            <Ionicons name="chevron-forward" size={20} color={theme.colors.neutral[400]} />
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[
            styles.menuItem,
            {
              paddingHorizontal: theme.spacing.lg,
              paddingVertical: theme.spacing.md,
              borderBottomWidth: 1,
              borderBottomColor: theme.colors.border,
            },
          ]}
          onPress={() => {
            if (user?.role === 'merchant') {
              (navigation as any).navigate('Notifications')
            } else {
              Alert.alert('Bientôt disponible', 'Les notifications seront bientôt disponibles.')
            }
          }}
        >
          <Ionicons name="notifications-outline" size={24} color={theme.colors.text} />
          <Typography variant="body" style={{ flex: 1, marginLeft: theme.spacing.md }}>
            Notifications
          </Typography>
          <Ionicons name="chevron-forward" size={20} color={theme.colors.neutral[400]} />
        </TouchableOpacity>

        <View
          style={[
            styles.menuItemBlock,
            {
              paddingHorizontal: theme.spacing.lg,
              paddingVertical: theme.spacing.md,
              borderBottomWidth: 1,
              borderBottomColor: theme.colors.border,
              backgroundColor: theme.colors.surface.light,
              gap: theme.spacing.md,
            },
          ]}
        >
          <View style={styles.menuItemHeader}>
            <Ionicons name="moon-outline" size={24} color={theme.colors.text} />
            <View style={{ flex: 1, marginLeft: theme.spacing.md }}>
              <Typography variant="body" weight="medium">
                Thème sombre
              </Typography>
              <Typography variant="caption" color="secondary">
                Activez ou désactivez le mode sombre de l'application
              </Typography>
            </View>
            <Switch
              value={mode === 'dark'}
              onValueChange={(value) => setThemeMode(value ? 'dark' : 'light')}
              trackColor={{ false: theme.colors.neutral[200], true: theme.colors.primary[400] }}
              thumbColor={mode === 'dark' ? theme.colors.primary[600] : theme.colors.neutral[50]}
            />
          </View>
          <View
            style={[
              styles.menuItemFooter,
              {
                marginTop: theme.spacing.md,
                gap: theme.spacing.sm,
              },
            ]}
          >
            <Badge variant={mode === 'auto' ? 'primary' : 'neutral'} size="sm">
              {mode === 'auto'
                ? 'Synchronisé avec le système'
                : mode === 'dark'
                ? 'Mode sombre'
                : 'Mode clair'}
            </Badge>
            <TouchableOpacity
              onPress={() => setThemeMode('auto')}
              style={{ paddingVertical: theme.spacing.xs }}
              disabled={mode === 'auto'}
            >
              <Typography
                variant="caption"
                style={{ color: mode === 'auto' ? theme.colors.neutral[400] : theme.colors.primary[500] }}
              >
                Revenir au mode automatique
              </Typography>
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity style={[styles.menuItem, { paddingHorizontal: theme.spacing.lg, paddingVertical: theme.spacing.md, borderBottomWidth: 1, borderBottomColor: theme.colors.border }]}>
          <Ionicons name="help-circle-outline" size={24} color={theme.colors.text} />
          <Typography variant="body" style={{ flex: 1, marginLeft: theme.spacing.md }}>
            Aide & Support
          </Typography>
          <Ionicons name="chevron-forward" size={20} color={theme.colors.neutral[400]} />
        </TouchableOpacity>
      </Card>

      {/* Bouton déconnexion séparé pour éviter les conflits avec Card */}
      <TouchableOpacity
        style={[
          styles.logoutButton,
          {
            marginHorizontal: theme.spacing.lg,
            marginTop: theme.spacing.md,
            paddingHorizontal: theme.spacing.lg,
            paddingVertical: theme.spacing.md,
            backgroundColor: theme.withOpacity(theme.colors.semantic.error, 0.1),
            borderRadius: theme.radius.lg,
            flexDirection: 'row',
            alignItems: 'center',
          }
        ]}
        onPress={handleLogout}
        activeOpacity={0.7}
      >
        <Ionicons name="log-out-outline" size={24} color={theme.colors.semantic.error} />
        <Typography variant="body" style={{ flex: 1, marginLeft: theme.spacing.md, color: theme.colors.semantic.error, fontWeight: '600' }}>
          Déconnexion
        </Typography>
        <Ionicons name="exit-outline" size={20} color={theme.colors.semantic.error} />
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuItemBlock: {
    flexDirection: 'column',
  },
  menuItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuItemFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
})

export default ProfileScreen
