/**
 * SmsOtpScreen - 6-digit OTP verification via SMS.TG
 * Used for phone verification during registration
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
import { Card, Typography, Button } from '../../components/2025'
import BrandLogo from '../../components/BrandLogo'
import KeyboardAwareContainer from '../../components/KeyboardAwareContainer'
import { useTheme } from '../../theme'
import { useAlert } from '../../contexts/AlertContext'
import { otpService, OtpPurpose } from '../../services/otpService'

const OTP_LENGTH = 6
const DEFAULT_RESEND_COOLDOWN = 60 // seconds

const SmsOtpScreen = ({ navigation, route }: any) => {
  const {
    phoneNumber,
    purpose = 'registration',
    onVerified,
    nextScreen,
    nextParams = {},
    otpAlreadySent = false, // If true, OTP was already sent by previous screen
    resendCooldown, // Cooldown from backend when otpAlreadySent is true
  } = route.params

  const theme = useTheme()
  const insets = useSafeAreaInsets()
  const { showSuccess, showError, showInfo } = useAlert()

  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(''))
  const [loading, setLoading] = useState(false)
  const [resendTimer, setResendTimer] = useState(DEFAULT_RESEND_COOLDOWN)
  const [sendingOtp, setSendingOtp] = useState(false)

  const inputRefs = useRef<(TextInput | null)[]>([])

  // Send OTP on mount only if not already sent by previous screen
  useEffect(() => {
    if (!otpAlreadySent) {
      sendInitialOtp()
    } else {
      // OTP was already sent, just show confirmation and start cooldown
      // Use backend's resend_cooldown if provided, otherwise use default
      showInfo('Code envoye', `Un code de verification a ete envoye au ${otpService.formatPhoneForDisplay(phoneNumber)}`)
      setResendTimer(resendCooldown || DEFAULT_RESEND_COOLDOWN)
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
    if (code.length === OTP_LENGTH && !loading) {
      handleVerifyOTP()
    }
  }, [otp])

  const sendInitialOtp = async () => {
    setSendingOtp(true)
    try {
      const result = await otpService.sendOtp(phoneNumber, purpose)
      if (result.success) {
        showInfo('Code envoye', `Un code de verification a ete envoye au ${otpService.formatPhoneForDisplay(phoneNumber)}`)
        if (result.data?.resend_cooldown) {
          setResendTimer(result.data.resend_cooldown)
        }
      } else {
        showError('Erreur', result.message)
      }
    } catch (error: any) {
      showError('Erreur', 'Impossible d\'envoyer le code de verification')
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
      const result = await otpService.verifyOtp(phoneNumber, code, purpose)

      if (result.success) {
        showSuccess('Succes', 'Numero de telephone verifie!')

        // Call callback if provided
        if (onVerified) {
          onVerified(phoneNumber)
        }

        // Navigate to next screen if specified
        if (nextScreen) {
          navigation.replace(nextScreen, {
            ...nextParams,
            phoneNumber,
            phoneVerified: true,
          })
        } else {
          // Default: go back
          navigation.goBack()
        }
      } else {
        showError('Erreur', result.message)
        // Clear OTP on error
        setOtp(Array(OTP_LENGTH).fill(''))
        inputRefs.current[0]?.focus()
      }
    } catch (error: any) {
      showError('Erreur', error.message || 'Code de verification incorrect')
      setOtp(Array(OTP_LENGTH).fill(''))
      inputRefs.current[0]?.focus()
    } finally {
      setLoading(false)
    }
  }

  const handleResendOTP = async () => {
    if (resendTimer > 0 || sendingOtp) return

    setSendingOtp(true)
    try {
      const result = await otpService.resendOtp(phoneNumber, purpose)

      if (result.success) {
        showSuccess('Code envoye', 'Un nouveau code a ete envoye')
        if (result.data?.resend_cooldown) {
          setResendTimer(result.data.resend_cooldown)
        } else {
          setResendTimer(DEFAULT_RESEND_COOLDOWN)
        }
        setOtp(Array(OTP_LENGTH).fill(''))
        inputRefs.current[0]?.focus()
      } else {
        showError('Erreur', result.message)
      }
    } catch (error: any) {
      showError('Erreur', error.message || 'Impossible de renvoyer le code')
    } finally {
      setSendingOtp(false)
    }
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
            Verification SMS
          </Typography>
          <Typography variant="body" color="secondary" style={{ textAlign: 'center' }}>
            Entrez le code a 6 chiffres envoye au{'\n'}
            <Typography variant="body" weight="semibold">
              {otpService.formatPhoneForDisplay(phoneNumber)}
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
                editable={!loading}
                testID={`sms-otp-input-${index}`}
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
            testID="verify-sms-otp-button"
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
              <TouchableOpacity onPress={handleResendOTP} disabled={sendingOtp}>
                <Typography
                  variant="caption"
                  weight="semibold"
                  style={{
                    color: sendingOtp ? theme.colors.textSecondary : theme.colors.primary[500],
                    textAlign: 'center',
                  }}
                >
                  {sendingOtp ? 'Envoi en cours...' : 'Renvoyer le code'}
                </Typography>
              </TouchableOpacity>
            )}
          </View>
        </Card>

        {/* Info about SMS */}
        <View style={[styles.infoContainer, { marginBottom: theme.spacing.lg }]}>
          <Ionicons name="information-circle-outline" size={20} color={theme.colors.textSecondary} />
          <Typography variant="caption" color="secondary" style={{ marginLeft: theme.spacing.xs, flex: 1 }}>
            Le code est valide pendant 10 minutes. Verifiez vos SMS si vous ne le recevez pas.
          </Typography>
        </View>

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
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 4,
  },
  footer: {},
})

export default SmsOtpScreen
