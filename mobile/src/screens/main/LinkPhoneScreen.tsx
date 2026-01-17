/**
 * LinkPhoneScreen - Link phone number to existing account
 * For users who registered with email and want to enable phone/PIN login
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
import { useDispatch, useSelector } from 'react-redux'
import { Card, Typography, Button } from '../../components/2025'
import KeyboardAwareContainer from '../../components/KeyboardAwareContainer'
import { useTheme } from '../../theme'
import { useAlert } from '../../contexts/AlertContext'
import { deviceService } from '../../services/deviceService'
import { setUser } from '../../store/slices/authSlice'
import { AppDispatch, RootState } from '../../store'

const OTP_LENGTH = 6
const DEFAULT_RESEND_COOLDOWN = 60

// Country codes for West Africa
const COUNTRY_CODES = [
  { code: '+228', country: 'TG', name: 'Togo' },
  { code: '+229', country: 'BJ', name: 'Benin' },
  { code: '+233', country: 'GH', name: 'Ghana' },
  { code: '+234', country: 'NG', name: 'Nigeria' },
  { code: '+225', country: 'CI', name: "Cote d'Ivoire" },
  { code: '+221', country: 'SN', name: 'Senegal' },
]

type Step = 'phone' | 'otp' | 'success'

const LinkPhoneScreen = ({ navigation }: any) => {
  const theme = useTheme()
  const insets = useSafeAreaInsets()
  const dispatch = useDispatch<AppDispatch>()
  const { showSuccess, showError, showInfo } = useAlert()
  const { user } = useSelector((state: RootState) => state.auth)

  // State
  const [step, setStep] = useState<Step>('phone')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [selectedCountryCode, setSelectedCountryCode] = useState('+228')
  const [showCountryPicker, setShowCountryPicker] = useState(false)
  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(''))
  const [loading, setLoading] = useState(false)
  const [resendTimer, setResendTimer] = useState(0)

  const inputRefs = useRef<(TextInput | null)[]>([])

  // Already has verified phone - redirect
  useEffect(() => {
    if (user?.phone && user?.phone_verified_at) {
      showInfo('Telephone deja lie', 'Votre compte a deja un numero de telephone verifie.')
      navigation.goBack()
    }
  }, [user])

  // Countdown timer for resend
  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [resendTimer])

  // Auto-verify when all OTP digits entered
  useEffect(() => {
    const code = otp.join('')
    if (code.length === OTP_LENGTH && !loading && step === 'otp') {
      handleVerifyOTP()
    }
  }, [otp, step])

  const formatPhoneNumber = (text: string): string => {
    const cleaned = text.replace(/\D/g, '')
    return cleaned.slice(0, 8)
  }

  const handlePhoneChange = (text: string) => {
    setPhoneNumber(formatPhoneNumber(text))
  }

  const getFullPhoneNumber = (): string => {
    return `${selectedCountryCode}${phoneNumber}`
  }

  const validatePhoneNumber = (): boolean => {
    if (phoneNumber.length < 8) {
      showError('Erreur', 'Le numero de telephone doit contenir au moins 8 chiffres')
      return false
    }
    return true
  }

  const handleSendOTP = async () => {
    if (!validatePhoneNumber()) return

    setLoading(true)
    try {
      const fullPhoneNumber = getFullPhoneNumber()
      const result = await deviceService.sendLinkPhoneOtp(fullPhoneNumber)

      if (result.success) {
        showInfo('Code envoye', `Un code de verification a ete envoye au ${deviceService.formatPhoneForDisplay(fullPhoneNumber)}`)
        setStep('otp')
        setResendTimer(DEFAULT_RESEND_COOLDOWN)
        // Focus first OTP input
        setTimeout(() => inputRefs.current[0]?.focus(), 100)
      } else {
        showError('Erreur', result.message || "Impossible d'envoyer le code SMS")
      }
    } catch (error: any) {
      showError('Erreur', error.message || "Impossible d'envoyer le code SMS")
    } finally {
      setLoading(false)
    }
  }

  const handleOtpChange = (text: string, index: number) => {
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
      const fullPhoneNumber = getFullPhoneNumber()
      const result = await deviceService.verifyAndLinkPhone(fullPhoneNumber, code)

      if (result.success && result.data) {
        // Update user in Redux store
        dispatch(setUser(result.data.user))

        showSuccess('Succes', 'Numero de telephone lie avec succes!')
        setStep('success')

        // If user needs to set PIN, navigate to PIN setup
        if (result.data.requires_pin_setup) {
          setTimeout(() => {
            navigation.replace('PinSetup', { isFirstSetup: true })
          }, 1500)
        } else {
          // Go back to profile after short delay
          setTimeout(() => {
            navigation.goBack()
          }, 1500)
        }
      } else {
        showError('Erreur', result.message || 'Code de verification incorrect')
        setOtp(Array(OTP_LENGTH).fill(''))
        inputRefs.current[0]?.focus()
      }
    } catch (error: any) {
      showError('Erreur', error.message || 'Erreur lors de la verification')
      setOtp(Array(OTP_LENGTH).fill(''))
      inputRefs.current[0]?.focus()
    } finally {
      setLoading(false)
    }
  }

  const handleResendOTP = async () => {
    if (resendTimer > 0 || loading) return

    setLoading(true)
    try {
      const fullPhoneNumber = getFullPhoneNumber()
      const result = await deviceService.sendLinkPhoneOtp(fullPhoneNumber)

      if (result.success) {
        showSuccess('Code envoye', 'Un nouveau code a ete envoye')
        setResendTimer(DEFAULT_RESEND_COOLDOWN)
        setOtp(Array(OTP_LENGTH).fill(''))
        inputRefs.current[0]?.focus()
      } else {
        showError('Erreur', result.message)
      }
    } catch (error: any) {
      showError('Erreur', error.message || 'Impossible de renvoyer le code')
    } finally {
      setLoading(false)
    }
  }

  const handleBack = () => {
    if (step === 'otp') {
      setStep('phone')
      setOtp(Array(OTP_LENGTH).fill(''))
    } else {
      navigation.goBack()
    }
  }

  // Render phone input step
  const renderPhoneStep = () => (
    <>
      {/* Header */}
      <View style={[styles.header, { alignItems: 'center', marginBottom: theme.spacing['2xl'] }]}>
        <View style={[styles.iconContainer, { backgroundColor: theme.withOpacity(theme.colors.primary[500], 0.15), marginBottom: theme.spacing.lg }]}>
          <Ionicons name="phone-portrait-outline" size={40} color={theme.colors.primary[500]} />
        </View>
        <Typography variant="h2" weight="bold" style={{ marginBottom: theme.spacing.xs }}>
          Lier mon telephone
        </Typography>
        <Typography variant="body" color="secondary" style={{ textAlign: 'center' }}>
          Ajoutez votre numero de telephone pour activer la connexion rapide par code PIN
        </Typography>
      </View>

      {/* Form */}
      <Card variant="elevated" style={{ padding: theme.spacing.lg, marginBottom: theme.spacing.lg }}>
        {/* Country Code Selector */}
        <View style={{ marginBottom: theme.spacing.lg }}>
          <Typography variant="body" weight="semibold" style={{ marginBottom: theme.spacing.sm }}>
            Indicatif pays
          </Typography>
          <TouchableOpacity
            style={[
              styles.countrySelector,
              {
                backgroundColor: theme.colors.inputBackground,
                borderColor: theme.colors.inputBorder,
                borderRadius: theme.radius.md,
                padding: theme.spacing.md,
              },
            ]}
            onPress={() => setShowCountryPicker(!showCountryPicker)}
          >
            <Typography variant="body">
              {COUNTRY_CODES.find((c) => c.code === selectedCountryCode)?.name} ({selectedCountryCode})
            </Typography>
            <Ionicons
              name={showCountryPicker ? 'chevron-up' : 'chevron-down'}
              size={20}
              color={theme.colors.textSecondary}
            />
          </TouchableOpacity>

          {showCountryPicker && (
            <View
              style={[
                styles.countryList,
                {
                  backgroundColor: theme.colors.surface.light,
                  borderColor: theme.colors.inputBorder,
                  borderRadius: theme.radius.md,
                  marginTop: theme.spacing.xs,
                },
              ]}
            >
              {COUNTRY_CODES.map((country) => (
                <TouchableOpacity
                  key={country.code}
                  style={[
                    styles.countryItem,
                    {
                      padding: theme.spacing.sm,
                      borderBottomColor: theme.colors.inputBorder,
                      backgroundColor: selectedCountryCode === country.code
                        ? `${theme.colors.primary[500]}10`
                        : 'transparent',
                    },
                  ]}
                  onPress={() => {
                    setSelectedCountryCode(country.code)
                    setShowCountryPicker(false)
                  }}
                >
                  <Typography
                    variant="body"
                    weight={selectedCountryCode === country.code ? 'semibold' : 'regular'}
                  >
                    {country.name} ({country.code})
                  </Typography>
                  {selectedCountryCode === country.code && (
                    <Ionicons name="checkmark" size={20} color={theme.colors.primary[500]} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Phone Number Input */}
        <View style={{ marginBottom: theme.spacing.lg }}>
          <Typography variant="body" weight="semibold" style={{ marginBottom: theme.spacing.sm }}>
            Numero de telephone
          </Typography>
          <View style={styles.phoneInputContainer}>
            <View
              style={[
                styles.countryCodeDisplay,
                {
                  backgroundColor: theme.colors.surface.light,
                  borderColor: theme.colors.inputBorder,
                  borderRadius: theme.radius.md,
                  padding: theme.spacing.md,
                  marginRight: theme.spacing.sm,
                },
              ]}
            >
              <Typography variant="body" weight="semibold">
                {selectedCountryCode}
              </Typography>
            </View>
            <TextInput
              style={[
                styles.phoneInput,
                {
                  flex: 1,
                  backgroundColor: theme.colors.inputBackground,
                  paddingHorizontal: theme.spacing.md,
                  paddingVertical: theme.spacing.md,
                  borderRadius: theme.radius.md,
                  borderWidth: 1,
                  borderColor: theme.colors.inputBorder,
                  fontSize: 18,
                  color: theme.colors.text,
                  letterSpacing: 2,
                },
              ]}
              placeholder="90 12 34 56"
              placeholderTextColor={theme.colors.textSecondary}
              value={phoneNumber}
              onChangeText={handlePhoneChange}
              keyboardType="phone-pad"
              maxLength={8}
              testID="link-phone-input"
            />
          </View>
        </View>

        {/* Info Box */}
        <View style={[styles.infoBox, { backgroundColor: `${theme.colors.info}10`, borderColor: theme.colors.info }]}>
          <Ionicons name="shield-checkmark" size={20} color={theme.colors.info} />
          <Typography variant="caption" style={{ flex: 1, marginLeft: theme.spacing.sm, color: theme.colors.info }}>
            Nous vous enverrons un code de verification par SMS pour securiser votre compte.
          </Typography>
        </View>
      </Card>

      {/* Continue Button */}
      <Button
        variant="primary"
        size="lg"
        fullWidth
        onPress={handleSendOTP}
        disabled={loading || phoneNumber.length < 8}
        loading={loading}
        testID="send-otp-button"
      >
        {loading ? 'Envoi en cours...' : 'Envoyer le code'}
      </Button>
    </>
  )

  // Render OTP verification step
  const renderOtpStep = () => (
    <>
      {/* Header */}
      <View style={[styles.header, { alignItems: 'center', marginBottom: theme.spacing['2xl'] }]}>
        <View style={[styles.iconContainer, { backgroundColor: theme.withOpacity(theme.colors.semantic.success, 0.15), marginBottom: theme.spacing.lg }]}>
          <Ionicons name="shield-checkmark-outline" size={40} color={theme.colors.semantic.success} />
        </View>
        <Typography variant="h2" weight="bold" style={{ marginBottom: theme.spacing.xs }}>
          Verification SMS
        </Typography>
        <Typography variant="body" color="secondary" style={{ textAlign: 'center' }}>
          Entrez le code a 6 chiffres envoye au{'\n'}
          <Typography variant="body" weight="semibold">
            {deviceService.formatPhoneForDisplay(getFullPhoneNumber())}
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
              testID={`link-otp-input-${index}`}
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
          testID="verify-link-otp-button"
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
                style={{
                  color: loading ? theme.colors.textSecondary : theme.colors.primary[500],
                  textAlign: 'center',
                }}
              >
                {loading ? 'Envoi en cours...' : 'Renvoyer le code'}
              </Typography>
            </TouchableOpacity>
          )}
        </View>
      </Card>

      {/* Change number link */}
      <View style={[styles.footer, { alignItems: 'center' }]}>
        <TouchableOpacity onPress={() => setStep('phone')}>
          <Typography variant="caption" weight="semibold" style={{ color: theme.colors.primary[500] }}>
            Changer de numero
          </Typography>
        </TouchableOpacity>
      </View>
    </>
  )

  // Render success step
  const renderSuccessStep = () => (
    <View style={[styles.successContainer, { alignItems: 'center', justifyContent: 'center', flex: 1 }]}>
      <View style={[styles.successIcon, { backgroundColor: theme.withOpacity(theme.colors.semantic.success, 0.15), marginBottom: theme.spacing.xl }]}>
        <Ionicons name="checkmark-circle" size={64} color={theme.colors.semantic.success} />
      </View>
      <Typography variant="h2" weight="bold" style={{ marginBottom: theme.spacing.sm, textAlign: 'center' }}>
        Telephone lie!
      </Typography>
      <Typography variant="body" color="secondary" style={{ textAlign: 'center' }}>
        Votre numero de telephone a ete lie avec succes. Vous pouvez maintenant utiliser la connexion rapide par PIN.
      </Typography>
    </View>
  )

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar backgroundColor={theme.colors.background} barStyle={theme.isDark ? 'light-content' : 'dark-content'} />

      {/* Back Button */}
      <View style={[styles.backButtonContainer, { paddingTop: insets.top + 8, paddingHorizontal: theme.spacing.md }]}>
        <TouchableOpacity
          onPress={handleBack}
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
        {step === 'phone' && renderPhoneStep()}
        {step === 'otp' && renderOtpStep()}
        {step === 'success' && renderSuccessStep()}
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
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  countrySelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
  },
  countryList: {
    borderWidth: 1,
    maxHeight: 200,
  },
  countryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
  },
  phoneInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  countryCodeDisplay: {
    borderWidth: 1,
  },
  phoneInput: {},
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
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
  successContainer: {},
  successIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
})

export default LinkPhoneScreen
