/**
 * OTPVerificationScreen - 6-digit OTP verification for Firebase Phone Auth
 */

import React, { useState, useRef, useEffect } from 'react'
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  ScrollView,
} from 'react-native'
import { useDispatch } from 'react-redux'
import { AppDispatch } from '../../store'
import { loginWithFirebase } from '../../store/slices/authSlice'
import { firebaseService } from '../../services/firebaseService'
import { Card, Typography, Button } from '../../components/2025'
import BrandLogo from '../../components/BrandLogo'
import { useTheme } from '../../theme'
import { TEST_IDS } from '../../utils/testIds'
import { useAlert } from '../../contexts/AlertContext'

interface Props {
  navigation: any
  route: {
    params: {
      verificationId: string
      phoneNumber: string
    }
  }
}

const OTP_LENGTH = 6
const RESEND_COOLDOWN = 60 // seconds

const OTPVerificationScreen: React.FC<Props> = ({ navigation, route }) => {
  const { verificationId, phoneNumber } = route.params
  const theme = useTheme()
  const dispatch = useDispatch<AppDispatch>()
  const { showSuccess, showError } = useAlert()

  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(''))
  const [loading, setLoading] = useState(false)
  const [resendTimer, setResendTimer] = useState(RESEND_COOLDOWN)
  const [currentVerificationId, setCurrentVerificationId] = useState(verificationId)

  const inputRefs = useRef<(TextInput | null)[]>([])

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
      // Verify OTP with Firebase
      const idToken = await firebaseService.verifyOTP(currentVerificationId, code)

      // Send token to backend
      const result = await dispatch(loginWithFirebase(idToken))

      if (loginWithFirebase.fulfilled.match(result)) {
        const payload = result.payload as any

        if (payload.status === 'new_user') {
          // New user - navigate to complete profile
          navigation.replace('CompleteProfile', {
            firebaseUid: payload.firebase_uid,
            phoneNumber: payload.phone,
          })
        } else {
          // Existing user - logged in successfully
          showSuccess('Succes', 'Connexion reussie!')
          // Navigation handled by AppNavigator
        }
      } else {
        showError('Erreur', (result.payload as string) || 'Erreur de connexion')
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
      // This would require the recaptcha verifier again
      // For now, navigate back to phone auth screen
      showError('Info', 'Veuillez redemander un code depuis l\'ecran precedent')
      navigation.goBack()
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
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar backgroundColor={theme.colors.primary[500]} barStyle="light-content" />

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingHorizontal: theme.spacing.lg }]}
        keyboardShouldPersistTaps="handled"
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

        {/* Back Button */}
        <View style={[styles.footer, { alignItems: 'center' }]}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Typography variant="caption" weight="semibold" style={{ color: theme.colors.primary[500] }}>
              Changer de numero
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
