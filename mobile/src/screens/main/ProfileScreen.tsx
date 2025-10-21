import React from 'react'
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Switch,
  Platform,
  Linking,
  ActivityIndicator,
} from 'react-native'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigation } from '@react-navigation/native'
import { logoutUser } from '../../store/slices/authSlice'
import { AppDispatch, RootState } from '../../store'
import { Ionicons } from '@expo/vector-icons'
import { Card, Badge, Typography } from '../../components/2025'
import { useTheme } from '../../theme'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { TEST_IDS } from '../../utils/testIds'

const ProfileScreen: React.FC = () => {
  const theme = useTheme()
  const navigation = useNavigation()
  const { mode, setThemeMode } = theme
  const dispatch = useDispatch<AppDispatch>()
  const { user, loading } = useSelector((state: RootState) => state.auth)
  const isMerchant = user?.role === 'merchant'

  const contactItems: Array<{
    icon: keyof typeof Ionicons.glyphMap
    label: string
    value: string
    testID?: string
  }> = [
    {
      icon: 'mail-outline',
      label: 'Email',
      value: user?.email ?? 'Non renseigné',
    },
    {
      icon: 'call-outline',
      label: 'Téléphone',
      value: user?.phone ?? 'Non renseigné',
      testID: TEST_IDS.profilePhone,
    },
    {
      icon: 'location-outline',
      label: 'Adresse',
      value: user?.address ?? 'Non renseignée',
      testID: TEST_IDS.profileAddress,
    },
    {
      icon: 'business-outline',
      label: 'Ville',
      value: user?.city ?? 'Non renseignée',
      testID: TEST_IDS.profileCity,
    },
  ]

  const handleLogout = () => {
    console.log('🔴 handleLogout clicked!')
    // Sur le web, Alert peut ne pas afficher correctement les boutons => bypass
    if (Platform.OS === 'web') {
      confirmLogout()
      return
    }

    try {
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
    } catch (_) {
      // Fallback ultime si Alert échoue
      confirmLogout()
    }
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

  const handleHelpPress = async () => {
    const helpUrl = 'https://antigaspi.support/help'
    try {
      const supported = await Linking.canOpenURL(helpUrl)
      if (supported) {
        await Linking.openURL(helpUrl)
        return
      }

      const fallback = 'mailto:support@antigaspi.app'
      const fallbackSupported = await Linking.canOpenURL(fallback)
      if (fallbackSupported) {
        await Linking.openURL(fallback)
      } else {
        Alert.alert('Support indisponible', 'Impossible d\'ouvrir le centre d\'aide pour le moment.')
      }
    } catch (error) {
      Alert.alert('Support indisponible', 'Impossible d\'ouvrir le centre d\'aide pour le moment.')
    }
  }

  if (loading && !user) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary[500]} testID={TEST_IDS.loadingSpinner} />
      </View>
    )
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]} testID={TEST_IDS.profileScreen}>
      <Card variant="elevated" style={{ alignItems: 'center', paddingVertical: theme.spacing['2xl'], paddingTop: theme.spacing['3xl'], marginBottom: theme.spacing.lg }}>
        <View style={[styles.avatar, { backgroundColor: theme.colors.neutral[100], marginBottom: theme.spacing.md }]}>
          <Ionicons name="person" size={40} color={theme.colors.primary[500]} />
        </View>
        <Typography variant="h2" weight="bold" style={{ marginBottom: theme.spacing.xs }} testID={TEST_IDS.profileName}>
          {user?.first_name} {user?.last_name}
        </Typography>
        <Typography variant="body" color="secondary" style={{ marginBottom: theme.spacing.sm }} testID={TEST_IDS.profileEmail}>
          {user?.email}
        </Typography>
        <Badge variant={user?.role === 'consumer' ? 'primary' : 'promo'} size="md">
          {user?.role === 'consumer' ? 'Consommateur' : 'Commerçant'}
        </Badge>
      </Card>

      <Card
        variant="elevated"
        style={{
          marginHorizontal: theme.spacing.lg,
          marginBottom: theme.spacing.lg,
          paddingHorizontal: theme.spacing.lg,
          paddingVertical: theme.spacing.lg,
          gap: theme.spacing.md,
        }}
      >
        {contactItems.map((item, index) => (
          <View
            key={item.label}
            style={[
              styles.infoRow,
              {
                borderBottomWidth: index === contactItems.length - 1 ? 0 : StyleSheet.hairlineWidth,
                borderBottomColor: theme.colors.border,
              },
            ]}
          >
            <View style={[styles.infoIcon, { backgroundColor: theme.withOpacity(theme.colors.primary[500], 0.08) }]}>
              <Ionicons name={item.icon} size={18} color={theme.colors.primary[600]} />
            </View>
            <View style={styles.infoContent}>
              <Typography variant="caption" color="secondary" style={styles.infoLabel}>
                {item.label}
              </Typography>
              <Typography variant="body" testID={item.testID} style={styles.infoValue}>
                {item.value}
              </Typography>
            </View>
          </View>
        ))}
      </Card>

      <Card variant="elevated" style={{ marginHorizontal: theme.spacing.lg, overflow: 'hidden' }}>
        <TouchableOpacity
          style={[styles.menuItem, { paddingHorizontal: theme.spacing.lg, paddingVertical: theme.spacing.md, borderBottomWidth: 1, borderBottomColor: theme.colors.border }]}
          onPress={() => (navigation as any).navigate('ProfileEdit')}
          testID={TEST_IDS.editProfileButton}
          accessibilityLabel="Modifier le profil"
        >
          <Ionicons name="person-outline" size={24} color={theme.colors.text} />
          <Typography variant="body" style={{ flex: 1, marginLeft: theme.spacing.md }}>
            Modifier le profil
          </Typography>
          <Ionicons name="chevron-forward" size={20} color={theme.colors.neutral[400]} />
        </TouchableOpacity>

        {isMerchant && (
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
          onPress={() => (navigation as any).navigate('Notifications')}
          testID={TEST_IDS.notificationSettingsButton}
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

        <TouchableOpacity
          style={[styles.menuItem, { paddingHorizontal: theme.spacing.lg, paddingVertical: theme.spacing.md, borderBottomWidth: 1, borderBottomColor: theme.colors.border }]}
          onPress={handleHelpPress}
        >
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
        testID={TEST_IDS.logoutButton}
        accessibilityLabel="Se déconnecter"
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  infoIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    marginBottom: 2,
  },
  infoValue: {
    fontWeight: '600',
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
