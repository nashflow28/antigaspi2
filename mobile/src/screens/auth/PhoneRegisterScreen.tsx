/**
 * PhoneRegisterScreen - Phone number registration entry point
 * First step of phone-based registration: enter phone number
 */

import React, { useState } from 'react'
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { otpService } from '../../services/otpService'
import { Card, Typography, Button } from '../../components/2025'
import BrandLogo from '../../components/BrandLogo'
import KeyboardAwareContainer from '../../components/KeyboardAwareContainer'
import { useTheme } from '../../theme'
import { useAlert } from '../../contexts/AlertContext'

// Country codes for West Africa
const COUNTRY_CODES = [
  { code: '+228', country: 'TG', name: 'Togo' },
  { code: '+229', country: 'BJ', name: 'Benin' },
  { code: '+233', country: 'GH', name: 'Ghana' },
  { code: '+234', country: 'NG', name: 'Nigeria' },
  { code: '+225', country: 'CI', name: "Cote d'Ivoire" },
  { code: '+221', country: 'SN', name: 'Senegal' },
]

const PhoneRegisterScreen = ({ navigation }: any) => {
  const theme = useTheme()
  const insets = useSafeAreaInsets()
  const { showError } = useAlert()

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

  const handleContinue = async () => {
    if (!validatePhoneNumber()) return

    setLoading(true)
    try {
      const fullPhoneNumber = getFullPhoneNumber()

      // Send OTP for registration purpose
      const result = await otpService.sendOtp(fullPhoneNumber, 'registration')

      if (!result.success) {
        showError('Erreur', result.message || "Impossible d'envoyer le code SMS")
        return
      }

      // Navigate to OTP verification screen with registration purpose
      // Pass otpAlreadySent: true to prevent SmsOtpScreen from sending another OTP
      navigation.navigate('SmsOtp', {
        phoneNumber: fullPhoneNumber,
        purpose: 'registration',
        otpAlreadySent: true,
        nextScreen: 'CompleteProfilePhone',
        nextParams: { phoneNumber: fullPhoneNumber },
      })
    } catch (error: any) {
      showError('Erreur', error.message || "Impossible d'envoyer le code SMS")
    } finally {
      setLoading(false)
    }
  }

  const handleDismiss = () => {
    navigation.getParent()?.goBack()
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar backgroundColor={theme.colors.background} barStyle={theme.isDark ? 'light-content' : 'dark-content'} />

      {/* Close Button */}
      <View style={[styles.closeButtonContainer, { paddingTop: insets.top + 8, paddingHorizontal: theme.spacing.md }]}>
        <TouchableOpacity
          onPress={handleDismiss}
          style={[styles.closeButton, { padding: theme.spacing.sm }]}
          accessibilityLabel="Fermer"
          accessibilityHint="Retourner a l'exploration sans creer de compte"
        >
          <Ionicons name="close" size={28} color={theme.colors.text} />
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
            Creer un compte
          </Typography>
          <Typography variant="body" color="secondary" style={{ textAlign: 'center' }}>
            Entrez votre numero de telephone pour commencer
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
                testID="phone-register-input"
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
          onPress={handleContinue}
          disabled={loading || phoneNumber.length < 8}
          loading={loading}
          testID="continue-register-button"
        >
          {loading ? 'Envoi en cours...' : 'Continuer'}
        </Button>

        {/* Already have account link */}
        <View style={[styles.footer, { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: theme.spacing.xl }]}>
          <Typography variant="body" color="secondary" style={{ marginRight: theme.spacing.xs }}>
            Deja un compte ?
          </Typography>
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Typography variant="body" weight="bold" style={{ color: theme.colors.primary[500] }}>
              Se connecter
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
  footer: {},
})

export default PhoneRegisterScreen
