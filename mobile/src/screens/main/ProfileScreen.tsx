import React from 'react'
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Switch,
  Linking,
  ScrollView,
  Image,
} from 'react-native'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigation } from '@react-navigation/native'
import { logoutUser } from '../../store/slices/authSlice'
import { AppDispatch, RootState } from '../../store'
import { Ionicons } from '@expo/vector-icons'
import { Card, Badge, Typography, Button } from '../../components/2025'
import { useTheme } from '../../theme'
import { useAlert } from '../../contexts/AlertContext'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { secureStorage } from '../../services/secureStorage'
import { TEST_IDS } from '../../utils/testIds'
import { getImageUrl } from '../../utils/imageHelpers'
import { navigationRef } from '../../navigation/NavigationRef'

const ProfileScreen: React.FC = () => {
  const theme = useTheme()
  const navigation = useNavigation()
  const { mode, setThemeMode } = theme
  const dispatch = useDispatch<AppDispatch>()
  const { user, isAuthenticated } = useSelector((state: RootState) => state.auth)
  const { showAlert } = useAlert()

  const handleLogout = () => {
    // Utiliser l'alerte stylisée pour la confirmation de déconnexion
    showAlert({
      title: 'Déconnexion',
      message: 'Êtes-vous sûr de vouloir vous déconnecter ?',
      type: 'warning',
      buttons: [
        {
          text: 'Annuler',
          style: 'cancel',
        },
        {
          text: 'Déconnexion',
          style: 'destructive',
          onPress: confirmLogout
        }
      ]
    })
  }

  const confirmLogout = async () => {
    try {
      // BUG FIX #12: Use secureStorage for sensitive data removal
      // Remove sensitive auth data securely
      await Promise.all([
        secureStorage.removeToken(),
        secureStorage.removeUserData(),
      ])
      // Remove non-sensitive cart data from AsyncStorage
      await AsyncStorage.removeItem('cart_data')
      // Déconnexion
      await dispatch(logoutUser())
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
        showAlert({
          title: 'Support indisponible',
          message: 'Impossible d\'ouvrir le centre d\'aide pour le moment.',
          type: 'info'
        })
      }
    } catch (error) {
      showAlert({
        title: 'Support indisponible',
        message: 'Impossible d\'ouvrir le centre d\'aide pour le moment.',
        type: 'info'
      })
    }
  }

  const handleLogin = () => {
    navigationRef.navigate('Auth', { screen: 'Login' })
  }

  const handleRegister = () => {
    navigationRef.navigate('Auth', { screen: 'Register' })
  }

  // Vue non connectee
  if (!isAuthenticated) {
    return (
      <ScrollView
        style={[styles.container, { backgroundColor: theme.colors.background }]}
        contentContainerStyle={[styles.scrollContent, styles.guestContent]}
        testID={TEST_IDS.profileScreen}
        showsVerticalScrollIndicator={true}
      >
        {/* Hero Card */}
        <Card variant="elevated" style={{ alignItems: 'center', paddingVertical: theme.spacing['3xl'], marginBottom: theme.spacing.lg }}>
          <View style={[styles.guestAvatar, { backgroundColor: theme.withOpacity(theme.colors.primary[500], 0.15), marginBottom: theme.spacing.lg }]}>
            <Ionicons name="person-outline" size={48} color={theme.colors.primary[500]} />
          </View>
          <Typography variant="h2" weight="bold" style={{ marginBottom: theme.spacing.sm, textAlign: 'center' }}>
            Bienvenue sur Antigaspi
          </Typography>
          <Typography variant="body" color="secondary" style={{ textAlign: 'center', paddingHorizontal: theme.spacing.lg, marginBottom: theme.spacing['2xl'] }}>
            Connectez-vous pour acceder a toutes les fonctionnalites et sauvegarder vos favoris
          </Typography>

          <View style={{ width: '100%', paddingHorizontal: theme.spacing.lg, gap: theme.spacing.md }}>
            <Button
              variant="primary"
              size="lg"
              fullWidth
              onPress={handleLogin}
              leftIcon={<Ionicons name="log-in-outline" size={20} color="#FFFFFF" />}
            >
              Se connecter
            </Button>
            <Button
              variant="secondary"
              size="lg"
              fullWidth
              onPress={handleRegister}
              leftIcon={<Ionicons name="person-add-outline" size={20} color={theme.colors.primary[500]} />}
            >
              Creer un compte
            </Button>
          </View>
        </Card>

        {/* Benefits Card */}
        <Card variant="elevated" style={{ marginHorizontal: theme.spacing.lg, marginBottom: theme.spacing.lg }}>
          <Typography variant="h4" weight="semibold" style={{ marginBottom: theme.spacing.md, paddingHorizontal: theme.spacing.lg, paddingTop: theme.spacing.lg }}>
            Pourquoi creer un compte ?
          </Typography>

          <View style={[styles.benefitItem, { paddingHorizontal: theme.spacing.lg, paddingVertical: theme.spacing.sm }]}>
            <View style={[styles.benefitIcon, { backgroundColor: theme.withOpacity(theme.colors.semantic.success, 0.15) }]}>
              <Ionicons name="heart" size={20} color={theme.colors.semantic.success} />
            </View>
            <View style={{ flex: 1 }}>
              <Typography variant="body" weight="medium">Sauvegardez vos favoris</Typography>
              <Typography variant="caption" color="secondary">Retrouvez facilement vos commerces preferes</Typography>
            </View>
          </View>

          <View style={[styles.benefitItem, { paddingHorizontal: theme.spacing.lg, paddingVertical: theme.spacing.sm }]}>
            <View style={[styles.benefitIcon, { backgroundColor: theme.withOpacity(theme.colors.primary[500], 0.15) }]}>
              <Ionicons name="bag-check" size={20} color={theme.colors.primary[500]} />
            </View>
            <View style={{ flex: 1 }}>
              <Typography variant="body" weight="medium">Reservez des paniers</Typography>
              <Typography variant="caption" color="secondary">Recuperez des produits a prix reduit</Typography>
            </View>
          </View>

          <View style={[styles.benefitItem, { paddingHorizontal: theme.spacing.lg, paddingVertical: theme.spacing.sm, paddingBottom: theme.spacing.lg }]}>
            <View style={[styles.benefitIcon, { backgroundColor: theme.withOpacity(theme.colors.semantic.warning, 0.15) }]}>
              <Ionicons name="gift" size={20} color={theme.colors.semantic.warning} />
            </View>
            <View style={{ flex: 1 }}>
              <Typography variant="body" weight="medium">Gagnez des points</Typography>
              <Typography variant="caption" color="secondary">Programme de fidelite avec recompenses</Typography>
            </View>
          </View>
        </Card>

        {/* Settings Card (available without auth) */}
        <Card variant="elevated" style={{ marginHorizontal: theme.spacing.lg, overflow: 'hidden' }}>
          <View
            style={[
              styles.menuItemBlock,
              {
                paddingHorizontal: theme.spacing.lg,
                paddingVertical: theme.spacing.md,
                borderBottomWidth: 1,
                borderBottomColor: theme.colors.border,
                backgroundColor: theme.isDark ? theme.colors.cardBackground : theme.colors.surface.light,
                gap: theme.spacing.md,
              },
            ]}
          >
            <View style={styles.menuItemHeader}>
              <Ionicons name="moon-outline" size={24} color={theme.colors.text} />
              <View style={{ flex: 1, marginLeft: theme.spacing.md }}>
                <Typography variant="body" weight="medium">
                  Theme sombre
                </Typography>
              </View>
              <Switch
                value={mode === 'dark'}
                onValueChange={(value) => setThemeMode(value ? 'dark' : 'light')}
                trackColor={{ false: theme.colors.neutral[200], true: theme.colors.primary[400] }}
                thumbColor={mode === 'dark' ? theme.colors.primary[600] : theme.colors.neutral[50]}
              />
            </View>
          </View>

          <TouchableOpacity
            style={[styles.menuItem, { paddingHorizontal: theme.spacing.lg, paddingVertical: theme.spacing.md }]}
            onPress={handleHelpPress}
          >
            <Ionicons name="help-circle-outline" size={24} color={theme.colors.text} />
            <Typography variant="body" style={{ flex: 1, marginLeft: theme.spacing.md }}>
              Aide & Support
            </Typography>
            <Ionicons name="chevron-forward" size={20} color={theme.colors.neutral[400]} />
          </TouchableOpacity>
        </Card>
      </ScrollView>
    )
  }

  // Vue connectee
  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={styles.scrollContent}
      testID={TEST_IDS.profileScreen}
      showsVerticalScrollIndicator={true}
    >
      <Card variant="elevated" style={{ alignItems: 'center', paddingVertical: theme.spacing['2xl'], paddingTop: theme.spacing['3xl'], marginBottom: theme.spacing.lg }}>
        {/* Afficher la photo du consumer (photo_url) ou du merchant (merchant.photo_url) */}
        {(user?.photo_url || user?.merchant?.photo_url) ? (
          <Image
            source={{ uri: getImageUrl(user.photo_url || user.merchant?.photo_url || '') }}
            style={[styles.avatar, { marginBottom: theme.spacing.md }]}
          />
        ) : (
          <View style={[styles.avatar, { backgroundColor: theme.colors.neutral[100], marginBottom: theme.spacing.md }]}>
            <Ionicons name={user?.role === 'merchant' ? 'storefront' : 'person'} size={40} color={theme.colors.primary[500]} />
          </View>
        )}
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

        {user?.role === 'merchant' && (
          <TouchableOpacity
            style={[styles.menuItem, { paddingHorizontal: theme.spacing.lg, paddingVertical: theme.spacing.md, borderBottomWidth: 1, borderBottomColor: theme.colors.border }]}
            onPress={() => (navigation as any).navigate('Reviews')}
            accessibilityLabel="Voir les avis clients"
          >
            <Ionicons name="star-outline" size={24} color={theme.colors.text} />
            <Typography variant="body" style={{ flex: 1, marginLeft: theme.spacing.md }}>
              Avis clients
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
        >
          <Ionicons name="notifications-outline" size={24} color={theme.colors.text} />
          <Typography variant="body" style={{ flex: 1, marginLeft: theme.spacing.md }}>
            Notifications
          </Typography>
          <Ionicons name="chevron-forward" size={20} color={theme.colors.neutral[400]} />
        </TouchableOpacity>

        {user?.role === 'consumer' && (
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
            onPress={() => (navigation as any).navigate('Wallet')}
            testID={TEST_IDS.walletAccessButton}
            accessibilityLabel="Accéder à mon portefeuille"
          >
            <Ionicons name="wallet-outline" size={24} color={theme.colors.text} />
            <Typography variant="body" style={{ flex: 1, marginLeft: theme.spacing.md }}>
              Portefeuille
            </Typography>
            <Ionicons name="chevron-forward" size={20} color={theme.colors.neutral[400]} />
          </TouchableOpacity>
        )}

        {user?.role === 'consumer' && (
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
            onPress={() => (navigation as any).navigate('Loyalty')}
            testID={TEST_IDS.loyaltyAccessButton}
            accessibilityLabel="Accéder à mes points de fidélité"
          >
            <Ionicons name="gift-outline" size={24} color={theme.colors.text} />
            <Typography variant="body" style={{ flex: 1, marginLeft: theme.spacing.md }}>
              Points de fidélité
            </Typography>
            <Ionicons name="chevron-forward" size={20} color={theme.colors.neutral[400]} />
          </TouchableOpacity>
        )}

        <View
          style={[
            styles.menuItemBlock,
            {
              paddingHorizontal: theme.spacing.lg,
              paddingVertical: theme.spacing.md,
              borderBottomWidth: 1,
              borderBottomColor: theme.colors.border,
              backgroundColor: theme.isDark ? theme.colors.cardBackground : theme.colors.surface.light,
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
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  guestContent: {
    paddingTop: 24,
  },
  guestAvatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  benefitIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
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
    flexWrap: 'wrap',
    gap: 8,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
})

export default ProfileScreen
