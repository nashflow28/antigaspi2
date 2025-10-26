import React, { useState } from 'react'
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  ScrollView,
} from 'react-native'
import { useDispatch, useSelector } from 'react-redux'
import { loginUser } from '../../store/slices/authSlice'
import { AppDispatch, RootState } from '../../store'
import { LoginCredentials } from '../../types'
import { Button, Card, Typography } from '../../components/2025'
import BrandLogo from '../../components/BrandLogo'
import { useTheme } from '../../theme'
import { TEST_IDS } from '../../utils/testIds'

interface Props {
  navigation: any
}

const LoginScreen: React.FC<Props> = ({ navigation }) => {
  const theme = useTheme()
  const dispatch = useDispatch<AppDispatch>()
  const { loading, error } = useSelector((state: RootState) => state.auth)

  const [credentials, setCredentials] = useState<LoginCredentials>({
    email: '',
    password: '',
  })

  const handleLogin = async (creds?: LoginCredentials) => {
    const loginCreds = creds || credentials

    if (!loginCreds.email || !loginCreds.password) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs')
      return
    }

    try {
      const result = await dispatch(loginUser(loginCreds))

      if (loginUser.fulfilled.match(result)) {
        // La navigation sera gérée automatiquement par AppNavigator
        Alert.alert('Succès', 'Connexion réussie!')
      } else {
        Alert.alert('Erreur', result.payload as string || 'Erreur de connexion')
      }
    } catch (error) {
      Alert.alert('Erreur', 'Une erreur est survenue')
    }
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      testID={TEST_IDS.loginScreen}
    >
      <StatusBar backgroundColor={theme.colors.primary[500]} barStyle="light-content" />

      <ScrollView contentContainerStyle={[styles.scrollContent, { paddingHorizontal: theme.spacing.lg }]} keyboardShouldPersistTaps="handled">
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
                backgroundColor: theme.colors.surface.light,
                paddingHorizontal: theme.spacing.md,
                paddingVertical: theme.spacing.sm,
                borderRadius: theme.radius.md,
                borderWidth: 1,
                borderColor: theme.colors.border,
                fontSize: 16
              }]}
              placeholder="votre@email.com"
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
                backgroundColor: theme.colors.surface.light,
                paddingHorizontal: theme.spacing.md,
                paddingVertical: theme.spacing.sm,
                borderRadius: theme.radius.md,
                borderWidth: 1,
                borderColor: theme.colors.border,
                fontSize: 16
              }]}
              placeholder="Votre mot de passe"
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
            onPress={handleLogin}
            disabled={loading}
            loading={loading}
            testID={TEST_IDS.loginSubmit}
            accessibilityLabel={TEST_IDS.loginSubmit}
          >
            {loading ? 'Connexion...' : 'Se connecter'}
          </Button>
        </Card>

        {/* Comptes de test */}
        <Card variant="flat" style={{ backgroundColor: theme.colors.info, padding: theme.spacing.md, marginBottom: theme.spacing.lg }}>
          <Typography variant="caption" weight="semibold" style={{ marginBottom: theme.spacing.sm, textAlign: 'center' }}>
            Comptes de test :
          </Typography>

          <Button
            variant="secondary"
            size="md"
            fullWidth
            style={{ marginBottom: theme.spacing.sm }}
            onPress={() => {
              // 🐛 BUG FIX: Updated to match CLAUDE.md seeder credentials
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
              // 🐛 BUG FIX: Updated to match CLAUDE.md seeder credentials
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

        {/* Footer */}
        <View style={[styles.footer, { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }]}>
          <Typography variant="caption" color="secondary" style={{ marginRight: theme.spacing.xs }}>
            Pas encore de compte ?
          </Typography>
          <TouchableOpacity onPress={() => navigation.navigate('Register')}>
            <Typography variant="caption" weight="semibold" style={{ color: theme.colors.primary[500] }}>
              Créer un compte
            </Typography>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
