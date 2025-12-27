import React, { useState } from 'react'
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useDispatch, useSelector } from 'react-redux'
import { loginUser } from '../../store/slices/authSlice'
import { AppDispatch, RootState } from '../../store'
import { LoginCredentials } from '../../types'
import { Button, Card, Typography } from '../../components/2025'
import BrandLogo from '../../components/BrandLogo'
import KeyboardAwareContainer from '../../components/KeyboardAwareContainer'
import { useTheme } from '../../theme'
import { TEST_IDS } from '../../utils/testIds'
import { useAlert } from '../../contexts/AlertContext'

interface Props {
  navigation: any
}

const LoginScreen: React.FC<Props> = ({ navigation }) => {
  const theme = useTheme()
  const insets = useSafeAreaInsets()
  const dispatch = useDispatch<AppDispatch>()
  const { loading, error } = useSelector((state: RootState) => state.auth)
  const { showSuccess, showError } = useAlert()

  // Fermer le modal Auth et retourner à l'exploration
  const handleDismiss = () => {
    navigation.getParent()?.goBack()
  }

  const [credentials, setCredentials] = useState<LoginCredentials>({
    email: '',
    password: '',
  })

  const handleLogin = async (creds?: LoginCredentials) => {
    const loginCreds = creds || credentials

    if (!loginCreds.email || !loginCreds.password) {
      showError('Erreur', 'Veuillez remplir tous les champs')
      return
    }

    try {
      const result = await dispatch(loginUser(loginCreds))

      if (loginUser.fulfilled.match(result)) {
        showSuccess('Succès', 'Connexion réussie!')
        // Fermer le modal Auth et retourner à l'écran précédent
        navigation.getParent()?.goBack()
      } else {
        showError('Erreur', result.payload as string || 'Erreur de connexion')
      }
    } catch (error) {
      showError('Erreur', 'Une erreur est survenue')
    }
  }

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      testID={TEST_IDS.loginScreen}
    >
      <StatusBar backgroundColor={theme.colors.background} barStyle={theme.isDark ? 'light-content' : 'dark-content'} />

      {/* Close Button - pour fermer le modal et retourner à l'exploration */}
      <View style={[styles.closeButtonContainer, { paddingTop: insets.top + 8, paddingHorizontal: theme.spacing.md }]}>
        <TouchableOpacity
          onPress={handleDismiss}
          style={[styles.closeButton, { padding: theme.spacing.sm }]}
          accessibilityLabel="Fermer"
          accessibilityHint="Retourner à l'exploration sans se connecter"
        >
          <Ionicons name="close" size={28} color={theme.colors.text} />
        </TouchableOpacity>
      </View>

      <KeyboardAwareContainer contentContainerStyle={[styles.scrollContent, { paddingHorizontal: theme.spacing.lg }]}>
        {/* Header */}
        <View style={[styles.header, { alignItems: 'center', marginBottom: theme.spacing['2xl'] }]}>
          <BrandLogo color={theme.colors.primary[500]} style={{ marginBottom: theme.spacing.sm }} />
          <Typography variant="body" color="secondary" style={{ textAlign: 'center' }}>
            Connectez-vous à votre compte
          </Typography>
        </View>

        {/* Form */}
        <Card variant="elevated" style={{ padding: theme.spacing.lg, marginBottom: theme.spacing.lg }}>
          <View style={{ marginBottom: theme.spacing.lg }}>
            <Typography variant="body" weight="semibold" style={{ marginBottom: theme.spacing.sm }}>
              Email
            </Typography>
            <TextInput
              style={[styles.input, {
                backgroundColor: theme.colors.inputBackground,
                paddingHorizontal: theme.spacing.md,
                paddingVertical: theme.spacing.sm,
                borderRadius: theme.radius.md,
                borderWidth: 1,
                borderColor: theme.colors.inputBorder,
                fontSize: 16,
                color: theme.colors.text,
              }]}
              placeholder="votre@email.com"
              placeholderTextColor={theme.colors.textSecondary}
              value={credentials.email}
              onChangeText={(text) => setCredentials({ ...credentials, email: text })}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              testID={TEST_IDS.loginEmail}
              accessibilityLabel={TEST_IDS.loginEmail}
            />
          </View>

          <View style={{ marginBottom: theme.spacing.lg }}>
            <Typography variant="body" weight="semibold" style={{ marginBottom: theme.spacing.sm }}>
              Mot de passe
            </Typography>
            <TextInput
              style={[styles.input, {
                backgroundColor: theme.colors.inputBackground,
                paddingHorizontal: theme.spacing.md,
                paddingVertical: theme.spacing.sm,
                borderRadius: theme.radius.md,
                borderWidth: 1,
                borderColor: theme.colors.inputBorder,
                fontSize: 16,
                color: theme.colors.text,
              }]}
              placeholder="Votre mot de passe"
              placeholderTextColor={theme.colors.textSecondary}
              value={credentials.password}
              onChangeText={(text) => setCredentials({ ...credentials, password: text })}
              secureTextEntry
              autoCapitalize="none"
              testID={TEST_IDS.loginPassword}
              accessibilityLabel={TEST_IDS.loginPassword}
            />
          </View>

          {error && (
            <View style={{ backgroundColor: theme.colors.error, padding: theme.spacing.sm, borderRadius: theme.radius.md, marginBottom: theme.spacing.lg }}>
              <Typography variant="caption" style={{ color: theme.colors.error, textAlign: 'center' }}>
                {error}
              </Typography>
            </View>
          )}

          <Button
            variant="primary"
            size="lg"
            fullWidth
            onPress={() => handleLogin()}
            disabled={loading}
            loading={loading}
            testID={TEST_IDS.loginSubmit}
            accessibilityLabel={TEST_IDS.loginSubmit}
          >
            {loading ? 'Connexion...' : 'Se connecter'}
          </Button>
        </Card>

        {/* 🔒 SECURITY FIX: Test accounts only visible in development mode */}
        {__DEV__ && (
          <Card variant="flat" style={{ backgroundColor: theme.colors.info, padding: theme.spacing.md, marginBottom: theme.spacing.lg }}>
            <Typography variant="caption" weight="semibold" style={{ marginBottom: theme.spacing.sm, textAlign: 'center' }}>
              Comptes de test (DEV uniquement) :
            </Typography>

            <Button
              variant="secondary"
              size="md"
              fullWidth
              style={{ marginBottom: theme.spacing.sm }}
              onPress={() => {
                const consumerCreds = {
                  email: 'jean.dupont@email.com',
                  password: 'password'
                }
                setCredentials(consumerCreds)
                handleLogin(consumerCreds)
              }}
              testID={TEST_IDS.loginConsumerQuick}
              accessibilityLabel={TEST_IDS.loginConsumerQuick}
            >
              👤 Consumer
            </Button>

            <Button
              variant="secondary"
              size="md"
              fullWidth
              onPress={() => {
                const merchantCreds = {
                  email: 'boulangerie.martin@email.com',
                  password: 'password'
                }
                setCredentials(merchantCreds)
                handleLogin(merchantCreds)
              }}
              testID={TEST_IDS.loginMerchantQuick}
              accessibilityLabel={TEST_IDS.loginMerchantQuick}
            >
              🏪 Merchant
            </Button>
          </Card>
        )}

        {/* Phone Auth Button */}
        <TouchableOpacity
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: theme.colors.surface.light,
            padding: theme.spacing.md,
            borderRadius: theme.radius.md,
            marginBottom: theme.spacing.lg,
            borderWidth: 1,
            borderColor: theme.colors.inputBorder,
          }}
          onPress={() => navigation.navigate('PhoneAuth')}
        >
          <Typography variant="body" weight="semibold" style={{ color: theme.colors.primary[500] }}>
            Se connecter avec telephone
          </Typography>
        </TouchableOpacity>

        {/* Footer - Register */}
        <View style={[styles.footer, { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: theme.spacing.lg }]}>
          <Typography variant="caption" color="secondary" style={{ marginRight: theme.spacing.xs }}>
            Pas encore de compte ?
          </Typography>
          <TouchableOpacity onPress={() => navigation.navigate('Register')}>
            <Typography variant="caption" weight="semibold" style={{ color: theme.colors.primary[500] }}>
              Créer un compte
            </Typography>
          </TouchableOpacity>
        </View>

        {/* Continue without account */}
        <TouchableOpacity
          onPress={handleDismiss}
          style={{ alignItems: 'center', paddingVertical: theme.spacing.md }}
          accessibilityLabel="Continuer sans compte"
        >
          <Typography variant="body" color="secondary">
            Continuer sans compte
          </Typography>
        </TouchableOpacity>
      </KeyboardAwareContainer>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  closeButtonContainer: {
    position: 'absolute',
    top: 0,
    right: 0,
    zIndex: 10,
  },
  closeButton: {
    borderRadius: 20,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  header: {},
  input: {},
  footer: {},
})

export default LoginScreen
