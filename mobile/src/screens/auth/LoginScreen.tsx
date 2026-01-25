/**
 * LoginScreen - Unified phone-based authentication
 * Primary flow: Phone number → Check device → PIN or OTP
 */

import React, { useState } from 'react'
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  ActivityIndicator,
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
import { deviceService } from '../../services/deviceService'

interface Props {
  navigation: any
}

const LoginScreen: React.FC<Props> = ({ navigation }) => {
  const theme = useTheme()
  const insets = useSafeAreaInsets()
  const dispatch = useDispatch<AppDispatch>()
  const { loading: authLoading, error } = useSelector((state: RootState) => state.auth)
  const { showAlert, showSuccess, showError } = useAlert()

  // Phone-based auth state
  const [phoneNumber, setPhoneNumber] = useState('')
  const [checkingPhone, setCheckingPhone] = useState(false)

  // DEV mode: email/password login
  const [showDevLogin, setShowDevLogin] = useState(false)
  const [credentials, setCredentials] = useState<LoginCredentials>({
    email: '',
    password: '',
  })

  // Close modal and return to exploration
  const handleDismiss = () => {
    navigation.getParent()?.goBack()
  }

  // Format phone number for display
  const formatPhoneInput = (text: string): string => {
    // Remove non-digits except +
    let cleaned = text.replace(/[^\d+]/g, '')

    // Limit length
    if (cleaned.startsWith('+')) {
      cleaned = cleaned.slice(0, 12) // +228 XX XX XX XX
    } else {
      cleaned = cleaned.slice(0, 8) // XX XX XX XX
    }

    return cleaned
  }

  // Format phone for display in dialog
  const formatPhoneForDisplay = (phone: string): string => {
    const cleaned = phone.replace(/\D/g, '')
    if (cleaned.length === 8) {
      return `+228 ${cleaned.slice(0, 2)} ${cleaned.slice(2, 4)} ${cleaned.slice(4, 6)} ${cleaned.slice(6, 8)}`
    }
    return phone.startsWith('+') ? phone : `+228 ${phone}`
  }

  // Handle new user registration after confirmation
  const handleCreateAccount = () => {
    navigation.navigate('OTPVerification', {
      phoneNumber,
      isNewUser: true,
      otpAlreadySent: false, // OTP not sent yet - let OTPVerificationScreen send it
    })
  }

  // Handle phone number submission
  const handlePhoneSubmit = async () => {
    if (!phoneNumber || phoneNumber.length < 8) {
      showError('Erreur', 'Veuillez entrer un numéro de téléphone valide')
      return
    }

    setCheckingPhone(true)
    try {
      const result = await deviceService.checkPhone(phoneNumber)

      if (!result.success) {
        showError('Erreur', result.message || 'Erreur de vérification')
        return
      }

      const data = result.data!

      if (!data.user_exists) {
        // New user - ask for confirmation before creating account
        showAlert({
          title: 'Numéro non reconnu',
          message: `Le numéro ${formatPhoneForDisplay(phoneNumber)} n'est pas encore enregistré.\n\nVoulez-vous créer un nouveau compte ?`,
          type: 'info',
          buttons: [
            {
              text: 'Annuler',
              style: 'cancel',
            },
            {
              text: 'Créer un compte',
              onPress: handleCreateAccount,
            },
          ],
        })
      } else if (data.requires_pin && data.has_pin) {
        // Known device with valid OTP - can use PIN
        navigation.navigate('PinEntry', {
          phoneNumber,
        })
      } else {
        // User exists but needs OTP (new device or expired OTP)
        // OTP will be sent by OTPVerificationScreen (otpAlreadySent: false)
        navigation.navigate('OTPVerification', {
          phoneNumber,
          isNewUser: false,
          otpAlreadySent: false, // OTP not sent yet - let OTPVerificationScreen send it
        })
      }
    } catch (error: any) {
      showError('Erreur', error.message || 'Erreur de connexion')
    } finally {
      setCheckingPhone(false)
    }
  }

  // DEV: Email/password login
  const handleDevLogin = async (creds?: LoginCredentials) => {
    const loginCreds = creds || credentials

    if (!loginCreds.email || !loginCreds.password) {
      showError('Erreur', 'Veuillez remplir tous les champs')
      return
    }

    try {
      const result = await dispatch(loginUser(loginCreds))

      if (loginUser.fulfilled.match(result)) {
        showSuccess('Succès', 'Connexion réussie!')
        navigation.getParent()?.goBack()
      } else {
        showError('Erreur', result.payload as string || 'Erreur de connexion')
      }
    } catch (error) {
      showError('Erreur', 'Une erreur est survenue')
    }
  }

  const loading = authLoading || checkingPhone

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      testID={TEST_IDS.loginScreen}
    >
      <StatusBar backgroundColor={theme.colors.background} barStyle={theme.isDark ? 'light-content' : 'dark-content'} />

      {/* Close Button */}
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
          <BrandLogo color={theme.colors.primary[500]} style={{ marginBottom: theme.spacing.md }} />
          <Typography variant="h2" weight="bold" style={{ textAlign: 'center', marginBottom: theme.spacing.sm }}>
            Bienvenue
          </Typography>
          <Typography variant="body" color="secondary" style={{ textAlign: 'center' }}>
            Entrez votre numéro pour continuer
          </Typography>
        </View>

        {/* Phone Number Form */}
        <Card variant="elevated" style={{ padding: theme.spacing.lg, marginBottom: theme.spacing.lg }}>
          <View style={{ marginBottom: theme.spacing.lg }}>
            <Typography variant="body" weight="semibold" style={{ marginBottom: theme.spacing.sm }}>
              Numéro de téléphone
            </Typography>
            <View style={[
              styles.phoneInputContainer,
              {
                backgroundColor: theme.colors.inputBackground,
                borderRadius: theme.radius.md,
                borderWidth: 1,
                borderColor: theme.colors.inputBorder,
              }
            ]}>
              <View style={[styles.countryCode, { borderRightColor: theme.colors.inputBorder }]}>
                <Typography variant="body" weight="semibold" style={{ color: theme.colors.text }}>
                  +228
                </Typography>
              </View>
              <TextInput
                style={[
                  styles.phoneInput,
                  {
                    paddingHorizontal: theme.spacing.md,
                    paddingVertical: theme.spacing.sm,
                    fontSize: 18,
                    color: theme.colors.text,
                  }
                ]}
                placeholder="90 XX XX XX"
                placeholderTextColor={theme.colors.textSecondary}
                value={phoneNumber}
                onChangeText={(text) => setPhoneNumber(formatPhoneInput(text))}
                keyboardType="phone-pad"
                autoComplete="tel"
                autoFocus
                editable={!loading}
                testID={TEST_IDS.loginEmail}
              />
            </View>
          </View>

          {error && (
            <View style={{ backgroundColor: `${theme.colors.error}15`, padding: theme.spacing.sm, borderRadius: theme.radius.md, marginBottom: theme.spacing.lg, borderWidth: 1, borderColor: theme.colors.error }}>
              <Typography variant="caption" style={{ color: theme.colors.error, textAlign: 'center' }}>
                {error}
              </Typography>
            </View>
          )}

          <Button
            variant="primary"
            size="lg"
            fullWidth
            onPress={handlePhoneSubmit}
            disabled={loading || phoneNumber.length < 8}
            testID={TEST_IDS.loginSubmit}
            accessibilityLabel={TEST_IDS.loginSubmit}
          >
            {checkingPhone ? (
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <ActivityIndicator size="small" color="#fff" style={{ marginRight: 8 }} />
                <Typography variant="body" weight="semibold" style={{ color: '#fff' }}>
                  Vérification...
                </Typography>
              </View>
            ) : (
              'Continuer'
            )}
          </Button>
        </Card>

        {/* Info about the auth flow */}
        <View style={[styles.infoContainer, { marginBottom: theme.spacing.xl }]}>
          <View style={[styles.infoItem, { marginBottom: theme.spacing.sm }]}>
            <Ionicons name="shield-checkmark-outline" size={20} color={theme.colors.primary[500]} />
            <Typography variant="caption" color="secondary" style={{ marginLeft: theme.spacing.sm, flex: 1 }}>
              Connexion sécurisée par code SMS
            </Typography>
          </View>
          <View style={styles.infoItem}>
            <Ionicons name="finger-print-outline" size={20} color={theme.colors.primary[500]} />
            <Typography variant="caption" color="secondary" style={{ marginLeft: theme.spacing.sm, flex: 1 }}>
              Code PIN pour connexion rapide
            </Typography>
          </View>
        </View>

        {/* DEV: Test accounts (only in development mode) */}
        {__DEV__ && (
          <>
            <TouchableOpacity
              onPress={() => setShowDevLogin(!showDevLogin)}
              style={{ alignItems: 'center', marginBottom: theme.spacing.md }}
            >
              <Typography variant="caption" color="secondary">
                {showDevLogin ? 'Masquer connexion dev' : 'Afficher connexion dev'}
              </Typography>
            </TouchableOpacity>

            {showDevLogin && (
              <Card variant="flat" style={{ backgroundColor: `${theme.colors.info}20`, padding: theme.spacing.md, marginBottom: theme.spacing.lg }}>
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
                    handleDevLogin(consumerCreds)
                  }}
                  testID={TEST_IDS.loginConsumerQuick}
                  accessibilityLabel={TEST_IDS.loginConsumerQuick}
                >
                  Consumer
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
                    handleDevLogin(merchantCreds)
                  }}
                  testID={TEST_IDS.loginMerchantQuick}
                  accessibilityLabel={TEST_IDS.loginMerchantQuick}
                >
                  Merchant
                </Button>
              </Card>
            )}
          </>
        )}

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
  phoneInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  countryCode: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRightWidth: 1,
  },
  phoneInput: {
    flex: 1,
    letterSpacing: 1,
  },
  infoContainer: {
    paddingHorizontal: 8,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
})

export default LoginScreen
