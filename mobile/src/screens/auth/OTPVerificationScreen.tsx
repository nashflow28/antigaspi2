/**
 * OTPVerificationScreen - 6-digit OTP verification
 * Uses backend OTP service for phone authentication
 */

import React, { useState, useRef, useEffect, useCallback } from 'react'
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
import { loginWithOtp, OtpLoginResponse } from '../../store/slices/authSlice'
import { otpService } from '../../services/otpService'
import { Card, Typography, Button } from '../../components/2025'
import BrandLogo from '../../components/BrandLogo'
import KeyboardAwareContainer from '../../components/KeyboardAwareContainer'
import { useTheme } from '../../theme'
import { TEST_IDS } from '../../utils/testIds'
import { useAlert } from '../../contexts/AlertContext'

const OTP_LENGTH = 6
const RESEND_COOLDOWN = 60 // seconds

const OTPVerificationScreen = ({ navigation, route }: any) => {
  const { phoneNumber } = route.params as { phoneNumber: string }
  const theme = useTheme()
  const insets = useSafeAreaInsets()
  const dispatch = useDispatch<AppDispatch>()
  const { showSuccess, showError } = useAlert()

  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(''))
  const [loading, setLoading] = useState(false)
  const [resendTimer, setResendTimer] = useState(RESEND_COOLDOWN)

  const inputRefs = useRef<(TextInput | null)[]>([])

  // Countdown timer for resend
  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [resendTimer])

  // BUG-006 FIX: Auto-verify when all digits entered with proper dependencies
  useEffect(() => {
    const code = otp.join('')
    if (code.length === OTP_LENGTH && !loading) {
      // Delay slightly to allow state to settle
      const timer = setTimeout(() => {
        handleVerifyOTP()
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [otp, loading]) // eslint-disable-line react-hooks/exhaustive-deps

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
      // Verify OTP via backend service
      const result = await dispatch(loginWithOtp({ phone: phoneNumber, otp: code }))

      if (loginWithOtp.fulfilled.match(result)) {
        const payload = result.payload as OtpLoginResponse

        if (payload.status === 'new_user') {
          // New user - navigate to phone-based profile completion
          navigation.replace('CompleteProfilePhone', {
            phone: payload.phone || phoneNumber,
          })
        } else {
          // Existing user - logged in successfully
          showSuccess('Succes', 'Connexion reussie!')
          // Fermer le modal Auth et retourner à l'écran précédent
          navigation.getParent()?.getParent()?.goBack()
        }
      } else {
        showError('Erreur', (result.payload as string) || 'Erreur de connexion')
        // Clear OTP on error
        setOtp(Array(OTP_LENGTH).fill(''))
        inputRefs.current[0]?.focus()
      }
    } catch (error: any) {
      showError('Erreur', error.message || 'Code de verification incorrect')
      // Clear OTP on error
      setOtp(Array(OTP_LENGTH).fill(''))
      inputRefs.current[0]?.focus()
    } finally {
      setLoading(false)
    }
  }

  const handleResendOTP = async () => {
    if (resendTimer > 0) return

    setLoading(true)
    try {
      // Request a new OTP via backend service
      const result = await otpService.resendOtp(phoneNumber, 'login')

      if (!result.success) {
        showError('Erreur', result.message || 'Impossible de renvoyer le code')
        return
      }

      // Reset timer
      setResendTimer(RESEND_COOLDOWN)
      setOtp(Array(OTP_LENGTH).fill(''))
      inputRefs.current[0]?.focus()

      showSuccess('Code envoye', 'Un nouveau code a ete envoye')
    } catch (error: any) {
      showError('Erreur', error.message || 'Impossible de renvoyer le code')
    } finally {
      setLoading(false)
    }
  }

  const formatPhoneNumber = (phone: string): string => {
    // Format: +228 90 12 34 56
    if (phone.length > 4) {
      const countryCode = phone.slice(0, 4)
      const number = phone.slice(4)
      return `${countryCode} ${number.replace(/(\d{2})(?=\d)/g, '$1 ')}`
    }
    return phone
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
            Verification
          </Typography>
          <Typography variant="body" color="secondary" style={{ textAlign: 'center' }}>
            Entrez le code envoye au{'\n'}
            <Typography variant="body" weight="semibold">
              {formatPhoneNumber(phoneNumber)}
            </Typography>
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
            disabled={loading || otp.join('').length !== OTP_LENGTH}
            loading={loading}
            testID={TEST_IDS.verifyOtpButton || 'verify-otp-button'}
          >
            {loading ? 'Verification...' : 'Verifier'}
          </Button>

          {/* Resend Timer */}
          <View style={[styles.resendContainer, { marginTop: theme.spacing.lg }]}>
            {resendTimer > 0 ? (
              <Typography variant="caption" color="secondary" style={{ textAlign: 'center' }}>
                Renvoyer le code dans {resendTimer}s
              </Typography>
            ) : (
              <TouchableOpacity onPress={handleResendOTP} disabled={loading}>
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

        {/* Change number link */}
        <View style={[styles.footer, { alignItems: 'center' }]}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Typography variant="caption" weight="semibold" style={{ color: theme.colors.primary[500] }}>
              Changer de numero
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
  footer: {},
})

export default OTPVerificationScreen
