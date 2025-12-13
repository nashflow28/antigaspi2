/**
 * PhoneAuthScreen - Phone number input for Firebase Phone Authentication
 */

import React, { useState, useRef } from 'react'
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  ScrollView,
  ActivityIndicator,
} from 'react-native'
import { FirebaseRecaptchaVerifierModal } from 'expo-firebase-recaptcha'
import { app } from '../../config/firebase'
import { firebaseService } from '../../services/firebaseService'
import { Card, Typography, Button } from '../../components/2025'
import BrandLogo from '../../components/BrandLogo'
import { useTheme } from '../../theme'
import { TEST_IDS } from '../../utils/testIds'
import { useAlert } from '../../contexts/AlertContext'

interface Props {
  navigation: any
}

// Country codes for West Africa
const COUNTRY_CODES = [
  { code: '+228', country: 'TG', name: 'Togo' },
  { code: '+229', country: 'BJ', name: 'Benin' },
  { code: '+233', country: 'GH', name: 'Ghana' },
  { code: '+234', country: 'NG', name: 'Nigeria' },
  { code: '+225', country: 'CI', name: "Cote d'Ivoire" },
  { code: '+221', country: 'SN', name: 'Senegal' },
]

const PhoneAuthScreen: React.FC<Props> = ({ navigation }) => {
  const theme = useTheme()
  const { showError } = useAlert()
  const recaptchaVerifier = useRef<FirebaseRecaptchaVerifierModal>(null)

  const [phoneNumber, setPhoneNumber] = useState('')
  const [selectedCountryCode, setSelectedCountryCode] = useState('+228')
  const [loading, setLoading] = useState(false)
  const [showCountryPicker, setShowCountryPicker] = useState(false)

  const formatPhoneNumber = (text: string): string => {
    // Remove non-digits
    const cleaned = text.replace(/\D/g, '')
    // Limit to 8 digits (standard for Togo)
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
      const confirmation = await firebaseService.sendOTP(
        fullPhoneNumber,
        recaptchaVerifier.current!
      )

      // Navigate to OTP verification screen
      navigation.navigate('OTPVerification', {
        verificationId: confirmation.verificationId,
        phoneNumber: fullPhoneNumber,
      })
    } catch (error: any) {
      showError('Erreur', error.message || "Impossible d'envoyer le code SMS")
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar backgroundColor={theme.colors.primary[500]} barStyle="light-content" />

      {/* Firebase reCAPTCHA verifier (invisible) */}
      <FirebaseRecaptchaVerifierModal
        ref={recaptchaVerifier}
        firebaseConfig={app.options}
        attemptInvisibleVerification={true}
      />

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingHorizontal: theme.spacing.lg }]}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={[styles.header, { alignItems: 'center', marginBottom: theme.spacing['2xl'] }]}>
          <BrandLogo color={theme.colors.primary[500]} style={{ marginBottom: theme.spacing.sm }} />
          <Typography variant="h2" weight="bold" style={{ marginBottom: theme.spacing.xs }}>
            Connexion par telephone
          </Typography>
          <Typography variant="body" color="secondary" style={{ textAlign: 'center' }}>
            Entrez votre numero de telephone pour recevoir un code de verification
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
                      },
                    ]}
                    onPress={() => {
                      setSelectedCountryCode(country.code)
                      setShowCountryPicker(false)
                    }}
                  >
                    <Typography variant="body">
                      {country.name} ({country.code})
                    </Typography>
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
                testID={TEST_IDS.phoneInput || 'phone-input'}
              />
            </View>
          </View>

          {/* Send OTP Button */}
          <Button
            variant="primary"
            size="lg"
            fullWidth
            onPress={handleSendOTP}
            disabled={loading || phoneNumber.length < 8}
            loading={loading}
            testID={TEST_IDS.sendOtpButton || 'send-otp-button'}
          >
            {loading ? 'Envoi en cours...' : 'Envoyer le code'}
          </Button>
        </Card>

        {/* Back to Login */}
        <View style={[styles.footer, { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }]}>
          <Typography variant="caption" color="secondary" style={{ marginRight: theme.spacing.xs }}>
            Vous avez un compte email ?
          </Typography>
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Typography variant="caption" weight="semibold" style={{ color: theme.colors.primary[500] }}>
              Se connecter avec email
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
  countrySelector: {
    borderWidth: 1,
  },
  countryList: {
    borderWidth: 1,
    maxHeight: 200,
  },
  countryItem: {
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
  footer: {},
})

export default PhoneAuthScreen
