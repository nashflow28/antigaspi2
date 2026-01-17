/**
 * OTPVerificationScreen - 6-digit OTP verification for device authentication
 * Uses backend device auth service for phone verification
 */

import React, { useState, useRef, useEffect } from 'react'
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useDispatch } from 'react-redux'
import { AppDispatch } from '../../store'
import { setAuthFromDeviceLogin } from '../../store/slices/authSlice'
import { deviceService } from '../../services/deviceService'
import { secureStorage } from '../../services/secureStorage'
import { Card, Typography, Button } from '../../components/2025'
import BrandLogo from '../../components/BrandLogo'
import KeyboardAwareContainer from '../../components/KeyboardAwareContainer'
import { useTheme } from '../../theme'
import { TEST_IDS } from '../../utils/testIds'
import { useAlert } from '../../contexts/AlertContext'

const OTP_LENGTH = 6
const RESEND_COOLDOWN = 60 // seconds

interface RouteParams {
  phoneNumber: string
  isNewUser?: boolean
  fromForgotPin?: boolean
  otpAlreadySent?: boolean // Flag to skip sending OTP on mount if already sent by previous screen
}

const OTPVerificationScreen = ({ navigation, route }: any) => {
  const params = route.params as RouteParams
  const { phoneNumber, isNewUser = false, fromForgotPin = false, otpAlreadySent = false } = params

  const theme = useTheme()
  const insets = useSafeAreaInsets()
  const dispatch = useDispatch<AppDispatch>()
  const { showSuccess, showError } = useAlert()

  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(''))
  const [loading, setLoading] = useState(false)
  const [sendingOtp, setSendingOtp] = useState(false)
  const [otpSent, setOtpSent] = useState(false)
  const [resendTimer, setResendTimer] = useState(0)

  const inputRefs = useRef<(TextInput | null)[]>([])

  // Send OTP on mount ONLY if not already sent by previous screen
  // This prevents double SMS sends which can trigger cooldown errors
  useEffect(() => {
    if (otpAlreadySent) {
      // OTP was already sent by the previous screen (LoginScreen)
      // Just start the countdown and focus input
      setOtpSent(true)
      setResendTimer(RESEND_COOLDOWN)
      setTimeout(() => inputRefs.current[0]?.focus(), 100)
    } else {
      // No OTP sent yet - send it now
      sendOtp()
    }
  }, [])  

  // Countdown timer for resend
  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [resendTimer])

  // Auto-verify when all digits entered
  useEffect(() => {
    const code = otp.join('')
    if (code.length === OTP_LENGTH && !loading && otpSent) {
      const timer = setTimeout(() => {
        handleVerifyOTP()
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [otp, loading, otpSent])  

  const sendOtp = async () => {
    setSendingOtp(true)
    try {
      const result = await deviceService.sendOtp(phoneNumber)

      if (result.success) {
        setOtpSent(true)
        setResendTimer(RESEND_COOLDOWN)
        // Focus first input after OTP sent
        setTimeout(() => inputRefs.current[0]?.focus(), 100)
      } else {
        showError('Erreur', result.message || "Impossible d'envoyer le code")
      }
    } catch (error: any) {
      showError('Erreur', error.message || "Impossible d'envoyer le code")
    } finally {
      setSendingOtp(false)
    }
  }

  const handleOtpChange = (text: string, index: number) => {
    // Only allow digits
    const digit = text.replace(/\D/g, '').slice(-1)

    const newOtp = [...otp]
    newOtp[index] = digit
    setOtp(newOtp)

    // Auto-focus next input
    if (digit && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handleKeyPress = (e: any, index: number) => {
    // Handle backspace to go to previous input
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handleVerifyOTP = async () => {
    const code = otp.join('')
    if (code.length !== OTP_LENGTH) {
      showError('Erreur', 'Veuillez entrer le code complet')
      return
    }

    setLoading(true)
    try {
      // Verify OTP via device auth service
      const result = await deviceService.verifyOtpAndLogin(phoneNumber, code)

      if (!result.success) {
        showError('Erreur', result.message || 'Code de vérification incorrect')
        setOtp(Array(OTP_LENGTH).fill(''))
        inputRefs.current[0]?.focus()
        return
      }

      const data = result.data!

      if (data.status === 'new_user' || data.requires_registration) {
        // New user - navigate to phone-based profile completion
        navigation.replace('CompleteProfilePhone', {
          phoneNumber: data.phone || phoneNumber,
          phoneVerified: true,
        })
      } else if (data.status === 'success' && data.user && data.token) {
        // Existing user - store token and user data
        await secureStorage.setToken(data.token)
        await secureStorage.setUserData(data.user)

        // Update Redux state
        dispatch(setAuthFromDeviceLogin({
          user: data.user,
          token: data.token,
        }))

        // Check if user needs to set up PIN
        if (data.requires_pin_setup || !data.has_pin) {
          // Navigate to PIN setup
          navigation.replace('PinSetup', {
            phoneNumber,
          })
        } else if (fromForgotPin) {
          // User forgot PIN - let them set a new one
          navigation.replace('PinSetup', {
            phoneNumber,
          })
        } else {
          // All good - close auth modal
          showSuccess('Succes', 'Connexion reussie!')
          navigation.getParent()?.getParent()?.goBack()
        }
      } else {
        showError('Erreur', 'Réponse inattendue du serveur')
        setOtp(Array(OTP_LENGTH).fill(''))
        inputRefs.current[0]?.focus()
      }
    } catch (error: any) {
      showError('Erreur', error.message || 'Code de vérification incorrect')
      setOtp(Array(OTP_LENGTH).fill(''))
      inputRefs.current[0]?.focus()
    } finally {
      setLoading(false)
    }
  }

  const handleResendOTP = async () => {
    if (resendTimer > 0) return
    await sendOtp()
    setOtp(Array(OTP_LENGTH).fill(''))
    showSuccess('Code envoyé', 'Un nouveau code a été envoyé')
  }

  const formatPhoneNumber = (phone: string): string => {
    return deviceService.formatPhoneForDisplay(phone)
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar backgroundColor={theme.colors.background} barStyle={theme.isDark ? 'light-content' : 'dark-content'} />

      {/* Back Button */}
      <View style={[styles.backButtonContainer, { paddingTop: insets.top + 8, paddingHorizontal: theme.spacing.md }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={[styles.backButton, { padding: theme.spacing.sm }]}
          accessibilityLabel="Retour"
          accessibilityRole="button"
        >
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
      </View>

      <KeyboardAwareContainer
        contentContainerStyle={[styles.scrollContent, { paddingHorizontal: theme.spacing.lg }]}
        extraScrollHeight={60}
      >
        {/* Header */}
        <View style={[styles.header, { alignItems: 'center', marginBottom: theme.spacing['2xl'] }]}>
          <BrandLogo color={theme.colors.primary[500]} style={{ marginBottom: theme.spacing.sm }} />
          <Typography variant="h2" weight="bold" style={{ marginBottom: theme.spacing.xs }}>
            Vérification
          </Typography>
          <Typography variant="body" color="secondary" style={{ textAlign: 'center' }}>
            {sendingOtp ? (
              'Envoi du code en cours...'
            ) : (
              <>
                Entrez le code envoyé au{'\n'}
                <Typography variant="body" weight="semibold">
                  {formatPhoneNumber(phoneNumber)}
                </Typography>
              </>
            )}
          </Typography>
        </View>

        {/* OTP Form */}
        <Card variant="elevated" style={{ padding: theme.spacing.lg, marginBottom: theme.spacing.lg }}>
          {/* OTP Inputs */}
          <View style={[styles.otpContainer, { marginBottom: theme.spacing.xl }]}>
            {otp.map((digit, index) => (
              <TextInput
                key={index}
                ref={(ref) => { inputRefs.current[index] = ref }}
                style={[
                  styles.otpInput,
                  {
                    backgroundColor: theme.colors.inputBackground,
                    borderColor: digit ? theme.colors.primary[500] : theme.colors.inputBorder,
                    borderRadius: theme.radius.md,
                    color: theme.colors.text,
                    borderWidth: 2,
                  },
                ]}
                value={digit}
                onChangeText={(text) => handleOtpChange(text, index)}
                onKeyPress={(e) => handleKeyPress(e, index)}
                keyboardType="number-pad"
                maxLength={1}
                selectTextOnFocus
                editable={!loading && !sendingOtp && otpSent}
                testID={`${TEST_IDS.otpInput || 'otp-input'}-${index}`}
              />
            ))}
          </View>

          {/* Verify Button */}
          <Button
            variant="primary"
            size="lg"
            fullWidth
            onPress={handleVerifyOTP}
            disabled={loading || sendingOtp || otp.join('').length !== OTP_LENGTH}
            loading={loading}
            testID={TEST_IDS.verifyOtpButton || 'verify-otp-button'}
          >
            {loading ? 'Vérification...' : 'Vérifier'}
          </Button>

          {/* Resend Timer */}
          <View style={[styles.resendContainer, { marginTop: theme.spacing.lg }]}>
            {resendTimer > 0 ? (
              <Typography variant="caption" color="secondary" style={{ textAlign: 'center' }}>
                Renvoyer le code dans {resendTimer}s
              </Typography>
            ) : (
              <TouchableOpacity onPress={handleResendOTP} disabled={loading || sendingOtp}>
                <Typography
                  variant="caption"
                  weight="semibold"
                  style={{ color: theme.colors.primary[500], textAlign: 'center' }}
                >
                  Renvoyer le code
                </Typography>
              </TouchableOpacity>
            )}
          </View>
        </Card>

        {/* Info message for new users */}
        {isNewUser && (
          <View style={[styles.infoCard, { backgroundColor: `${theme.colors.info}15`, padding: theme.spacing.md, borderRadius: theme.radius.md, marginBottom: theme.spacing.lg }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="information-circle" size={20} color={theme.colors.info} />
              <Typography variant="caption" color="secondary" style={{ marginLeft: theme.spacing.sm, flex: 1 }}>
                Après vérification, vous pourrez créer votre compte.
              </Typography>
            </View>
          </View>
        )}

        {/* Change number link */}
        <View style={[styles.footer, { alignItems: 'center' }]}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Typography variant="caption" weight="semibold" style={{ color: theme.colors.primary[500] }}>
              Changer de numéro
            </Typography>
          </TouchableOpacity>
        </View>
      </KeyboardAwareContainer>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backButtonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    borderRadius: 20,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  header: {},
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  otpInput: {
    width: 45,
    height: 55,
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  resendContainer: {
    alignItems: 'center',
  },
  infoCard: {},
  footer: {},
})

export default OTPVerificationScreen
