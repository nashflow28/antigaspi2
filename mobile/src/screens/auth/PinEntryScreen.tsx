/**
 * PinEntryScreen - Enter 4-digit PIN for quick login on known devices
 */

import React, { useState, useRef, useEffect } from 'react'
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Vibration,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useDispatch } from 'react-redux'
import { AppDispatch } from '../../store'
import { setAuthFromDeviceLogin } from '../../store/slices/authSlice'
import { Card, Typography } from '../../components/2025'
import BrandLogo from '../../components/BrandLogo'
import { useTheme } from '../../theme'
import { useAlert } from '../../contexts/AlertContext'
import { deviceService } from '../../services/deviceService'
import { secureStorage } from '../../services/secureStorage'

const PIN_LENGTH = 4

interface Props {
  navigation: any
  route: any
}

const PinEntryScreen: React.FC<Props> = ({ navigation, route }) => {
  const { phoneNumber } = route.params as { phoneNumber: string }

  const theme = useTheme()
  const insets = useSafeAreaInsets()
  const dispatch = useDispatch<AppDispatch>()
  const { showError } = useAlert()

  const [pin, setPin] = useState<string[]>(Array(PIN_LENGTH).fill(''))
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const inputRefs = useRef<(TextInput | null)[]>([])

  // Focus first input on mount
  useEffect(() => {
    setTimeout(() => {
      inputRefs.current[0]?.focus()
    }, 100)
  }, [])

  const handlePinChange = (text: string, index: number) => {
    const digit = text.replace(/\D/g, '').slice(-1)

    const newPin = [...pin]
    newPin[index] = digit
    setPin(newPin)
    setError(null)

    // Auto-focus next input
    if (digit && index < PIN_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus()
    }

    // Auto-submit when complete
    if (digit && index === PIN_LENGTH - 1) {
      const fullPin = newPin.join('')
      if (fullPin.length === PIN_LENGTH) {
        handleSubmit(fullPin)
      }
    }
  }

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !pin[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
      const newPin = [...pin]
      newPin[index - 1] = ''
      setPin(newPin)
    }
  }

  const handleSubmit = async (pinCode: string) => {
    if (pinCode.length !== PIN_LENGTH) return

    setLoading(true)
    setError(null)

    try {
      const result = await deviceService.loginWithPin(phoneNumber, pinCode)

      if (result.success && result.data) {
        // Store token and user data
        if (result.data.token) {
          await secureStorage.setToken(result.data.token)
        }
        if (result.data.user) {
          await secureStorage.setUserData(result.data.user)
        }

        // Update Redux state
        dispatch(setAuthFromDeviceLogin({
          user: result.data.user,
          token: result.data.token,
        }))

        // Close auth modal
        navigation.getParent()?.getParent()?.goBack()
      } else {
        // Wrong PIN
        Vibration.vibrate(200)
        setError(result.message || 'Code PIN incorrect')
        setPin(Array(PIN_LENGTH).fill(''))
        inputRefs.current[0]?.focus()
      }
    } catch (error: any) {
      Vibration.vibrate(200)
      setError(error.message || 'Erreur de connexion')
      setPin(Array(PIN_LENGTH).fill(''))
      inputRefs.current[0]?.focus()
    } finally {
      setLoading(false)
    }
  }

  const handleForgotPin = () => {
    // Navigate back to OTP verification
    navigation.navigate('OTPVerification', {
      phoneNumber,
      fromForgotPin: true,
    })
  }

  const handleUseOtp = () => {
    // Navigate to OTPVerification directly - it will send OTP on mount
    // Don't go back to PhoneAuth to avoid extra navigation step
    navigation.navigate('OTPVerification', {
      phoneNumber,
      isNewUser: false,
      otpAlreadySent: false, // OTP not sent yet - let OTPVerificationScreen send it
    })
  }

  const formatPhone = (phone: string): string => {
    return deviceService.formatPhoneForDisplay(phone)
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar
        backgroundColor={theme.colors.background}
        barStyle={theme.isDark ? 'light-content' : 'dark-content'}
      />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 16, paddingHorizontal: theme.spacing.md }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={[styles.backButton, { padding: theme.spacing.sm }]}
        >
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
      </View>

      <View style={[styles.content, { paddingHorizontal: theme.spacing.lg }]}>
        {/* Logo and Title */}
        <View style={[styles.logoContainer, { marginBottom: theme.spacing['2xl'] }]}>
          <BrandLogo color={theme.colors.primary[500]} style={{ marginBottom: theme.spacing.md }} />
          <Typography variant="h2" weight="bold" style={{ textAlign: 'center', marginBottom: theme.spacing.sm }}>
            Entrez votre code PIN
          </Typography>
          <Typography variant="body" color="secondary" style={{ textAlign: 'center' }}>
            {formatPhone(phoneNumber)}
          </Typography>
        </View>

        {/* PIN Card */}
        <Card variant="elevated" style={{ padding: theme.spacing.xl, marginBottom: theme.spacing.lg }}>
          {/* PIN Inputs */}
          <View style={styles.pinContainer}>
            {pin.map((digit, index) => (
              <TextInput
                key={index}
                ref={(ref) => { inputRefs.current[index] = ref }}
                style={[
                  styles.pinInput,
                  {
                    backgroundColor: theme.colors.inputBackground,
                    borderColor: error
                      ? theme.colors.error
                      : digit
                        ? theme.colors.primary[500]
                        : theme.colors.inputBorder,
                    borderRadius: theme.radius.md,
                    color: theme.colors.text,
                  },
                ]}
                value={digit ? '●' : ''}
                onChangeText={(text) => handlePinChange(text, index)}
                onKeyPress={(e) => handleKeyPress(e, index)}
                keyboardType="number-pad"
                maxLength={1}
                secureTextEntry
                selectTextOnFocus
                editable={!loading}
              />
            ))}
          </View>

          {/* Error Message */}
          {error && (
            <View style={[styles.errorContainer, { marginTop: theme.spacing.md }]}>
              <Ionicons name="alert-circle" size={16} color={theme.colors.error} />
              <Typography
                variant="caption"
                style={{ color: theme.colors.error, marginLeft: theme.spacing.xs }}
              >
                {error}
              </Typography>
            </View>
          )}

          {/* Loading indicator */}
          {loading && (
            <Typography
              variant="caption"
              color="secondary"
              style={{ textAlign: 'center', marginTop: theme.spacing.md }}
            >
              Connexion en cours...
            </Typography>
          )}
        </Card>

        {/* Forgot PIN Link */}
        <TouchableOpacity
          onPress={handleForgotPin}
          style={{ alignItems: 'center', marginTop: theme.spacing.md }}
          disabled={loading}
        >
          <Typography variant="body" style={{ color: theme.colors.primary[500] }}>
            Code PIN oublie ?
          </Typography>
        </TouchableOpacity>

        {/* Use OTP instead */}
        <TouchableOpacity
          onPress={handleUseOtp}
          style={{ alignItems: 'center', marginTop: theme.spacing.lg }}
          disabled={loading}
        >
          <Typography variant="caption" color="secondary">
            Se connecter avec un code SMS
          </Typography>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    borderRadius: 20,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
  },
  pinContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
  },
  pinInput: {
    width: 55,
    height: 65,
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    borderWidth: 2,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
})

export default PinEntryScreen
