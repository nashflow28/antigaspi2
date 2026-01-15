/**
 * PinSetupScreen - Set up 4-digit PIN after first OTP verification
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
import { deviceService } from '../../services/deviceService'

const PIN_LENGTH = 4

interface Props {
  navigation: any
  route: any
}

const PinSetupScreen: React.FC<Props> = ({ navigation, route }) => {
  const theme = useTheme()
  const insets = useSafeAreaInsets()
  const { showSuccess, showError } = useAlert()

  const [step, setStep] = useState<'create' | 'confirm'>('create')
  const [pin, setPin] = useState<string[]>(Array(PIN_LENGTH).fill(''))
  const [confirmPin, setConfirmPin] = useState<string[]>(Array(PIN_LENGTH).fill(''))
  const [loading, setLoading] = useState(false)

  const inputRefs = useRef<(TextInput | null)[]>([])
  const confirmInputRefs = useRef<(TextInput | null)[]>([])

  // Focus first input on mount and step change
  useEffect(() => {
    setTimeout(() => {
      if (step === 'create') {
        inputRefs.current[0]?.focus()
      } else {
        confirmInputRefs.current[0]?.focus()
      }
    }, 100)
  }, [step])

  const handlePinChange = (text: string, index: number, isConfirm: boolean) => {
    const digit = text.replace(/\D/g, '').slice(-1)
    const refs = isConfirm ? confirmInputRefs : inputRefs
    const setCurrentPin = isConfirm ? setConfirmPin : setPin
    const currentPin = isConfirm ? confirmPin : pin

    const newPin = [...currentPin]
    newPin[index] = digit
    setCurrentPin(newPin)

    // Auto-focus next input
    if (digit && index < PIN_LENGTH - 1) {
      refs.current[index + 1]?.focus()
    }

    // Auto-advance to confirm step or submit
    if (digit && index === PIN_LENGTH - 1) {
      const fullPin = newPin.join('')
      if (fullPin.length === PIN_LENGTH) {
        if (!isConfirm) {
          // Move to confirm step
          setTimeout(() => setStep('confirm'), 100)
        } else {
          // Submit
          handleSubmit(pin.join(''), fullPin)
        }
      }
    }
  }

  const handleKeyPress = (e: any, index: number, isConfirm: boolean) => {
    const refs = isConfirm ? confirmInputRefs : inputRefs
    const currentPin = isConfirm ? confirmPin : pin
    const setCurrentPin = isConfirm ? setConfirmPin : setPin

    if (e.nativeEvent.key === 'Backspace' && !currentPin[index] && index > 0) {
      refs.current[index - 1]?.focus()
      const newPin = [...currentPin]
      newPin[index - 1] = ''
      setCurrentPin(newPin)
    }
  }

  const handleSubmit = async (createdPin: string, confirmedPin: string) => {
    if (createdPin !== confirmedPin) {
      showError('Erreur', 'Les codes PIN ne correspondent pas')
      setConfirmPin(Array(PIN_LENGTH).fill(''))
      setStep('create')
      setPin(Array(PIN_LENGTH).fill(''))
      return
    }

    setLoading(true)
    try {
      const result = await deviceService.setPin(createdPin, confirmedPin)

      if (result.success) {
        showSuccess('Succes', 'Code PIN configure avec succes!')
        // Close auth modal and return to main app
        navigation.getParent()?.getParent()?.goBack()
      } else {
        showError('Erreur', result.message || 'Erreur lors de la configuration du PIN')
        resetForm()
      }
    } catch (error: any) {
      showError('Erreur', error.message || 'Erreur lors de la configuration du PIN')
      resetForm()
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setPin(Array(PIN_LENGTH).fill(''))
    setConfirmPin(Array(PIN_LENGTH).fill(''))
    setStep('create')
  }

  const renderPinInputs = (isConfirm: boolean) => {
    const currentPin = isConfirm ? confirmPin : pin
    const refs = isConfirm ? confirmInputRefs : inputRefs

    return (
      <View style={styles.pinContainer}>
        {currentPin.map((digit, index) => (
          <TextInput
            key={`${isConfirm ? 'confirm' : 'create'}-${index}`}
            ref={(ref) => { refs.current[index] = ref }}
            style={[
              styles.pinInput,
              {
                backgroundColor: theme.colors.inputBackground,
                borderColor: digit ? theme.colors.primary[500] : theme.colors.inputBorder,
                borderRadius: theme.radius.md,
                color: theme.colors.text,
              },
            ]}
            value={digit ? '●' : ''}
            onChangeText={(text) => handlePinChange(text, index, isConfirm)}
            onKeyPress={(e) => handleKeyPress(e, index, isConfirm)}
            keyboardType="number-pad"
            maxLength={1}
            secureTextEntry
            selectTextOnFocus
          />
        ))}
      </View>
    )
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar
        backgroundColor={theme.colors.background}
        barStyle={theme.isDark ? 'light-content' : 'dark-content'}
      />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 16, paddingHorizontal: theme.spacing.md }]}>
        {step === 'confirm' && (
          <TouchableOpacity
            onPress={() => {
              setStep('create')
              setConfirmPin(Array(PIN_LENGTH).fill(''))
            }}
            style={[styles.backButton, { padding: theme.spacing.sm }]}
          >
            <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
          </TouchableOpacity>
        )}
      </View>

      <KeyboardAwareContainer
        contentContainerStyle={[styles.scrollContent, { paddingHorizontal: theme.spacing.lg }]}
      >
        {/* Logo and Title */}
        <View style={[styles.logoContainer, { marginBottom: theme.spacing['2xl'] }]}>
          <BrandLogo color={theme.colors.primary[500]} style={{ marginBottom: theme.spacing.md }} />
          <Typography variant="h2" weight="bold" style={{ textAlign: 'center', marginBottom: theme.spacing.sm }}>
            {step === 'create' ? 'Creez votre code PIN' : 'Confirmez votre code PIN'}
          </Typography>
          <Typography variant="body" color="secondary" style={{ textAlign: 'center' }}>
            {step === 'create'
              ? 'Ce code vous permettra de vous connecter rapidement'
              : 'Entrez a nouveau votre code PIN pour confirmer'
            }
          </Typography>
        </View>

        {/* PIN Card */}
        <Card variant="elevated" style={{ padding: theme.spacing.xl, marginBottom: theme.spacing.lg }}>
          {/* Security Icon */}
          <View style={[styles.iconContainer, { marginBottom: theme.spacing.xl }]}>
            <View style={[
              styles.iconCircle,
              { backgroundColor: `${theme.colors.primary[500]}15` }
            ]}>
              <Ionicons name="lock-closed" size={40} color={theme.colors.primary[500]} />
            </View>
          </View>

          {/* PIN Inputs */}
          {step === 'create' ? renderPinInputs(false) : renderPinInputs(true)}

          {/* Instructions */}
          <Typography
            variant="caption"
            color="secondary"
            style={{ textAlign: 'center', marginTop: theme.spacing.lg }}
          >
            Choisissez un code a 4 chiffres facile a retenir
          </Typography>
        </Card>

        {/* Skip Button (optional - only shown if user already has PIN from before) */}
        {step === 'create' && (
          <TouchableOpacity
            onPress={() => navigation.getParent()?.getParent()?.goBack()}
            style={{ alignItems: 'center', marginTop: theme.spacing.md }}
            disabled={loading}
          >
            <Typography variant="body" style={{ color: theme.colors.textSecondary }}>
              Configurer plus tard
            </Typography>
          </TouchableOpacity>
        )}
      </KeyboardAwareContainer>

      {/* Loading overlay */}
      {loading && (
        <View style={styles.loadingOverlay}>
          <Typography variant="body" style={{ color: theme.colors.text }}>
            Configuration en cours...
          </Typography>
        </View>
      )}
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
    minHeight: 50,
  },
  backButton: {
    borderRadius: 20,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
  },
  iconContainer: {
    alignItems: 'center',
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
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
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
})

export default PinSetupScreen
