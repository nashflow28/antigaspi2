/**
 * CompleteProfilePhoneScreen - Complete profile after phone OTP verification
 * Final step of phone-based registration: enter user details
 */

import React, { useState } from 'react'
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  ScrollView,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useDispatch } from 'react-redux'
import { AppDispatch } from '../../store'
import { registerWithPhone, PhoneRegisterData } from '../../store/slices/authSlice'
import { Card, Typography, Button } from '../../components/2025'
import BrandLogo from '../../components/BrandLogo'
import KeyboardAwareContainer from '../../components/KeyboardAwareContainer'
import { useTheme } from '../../theme'
import { useAlert } from '../../contexts/AlertContext'

type UserRole = 'consumer' | 'merchant'

// Business types for merchants
const BUSINESS_TYPES = [
  { value: 'boulangerie', label: 'Boulangerie / Patisserie' },
  { value: 'restaurant', label: 'Restaurant' },
  { value: 'epicerie', label: 'Epicerie / Supermarche' },
  { value: 'boucherie', label: 'Boucherie / Charcuterie' },
  { value: 'primeur', label: 'Primeur / Fruits & Legumes' },
  { value: 'traiteur', label: 'Traiteur' },
  { value: 'autre', label: 'Autre' },
]

// Cities in Togo
const CITIES = [
  'Lome',
  'Kara',
  'Sokode',
  'Kpalime',
  'Atakpame',
  'Dapaong',
  'Tsevie',
  'Autre',
]

const CompleteProfilePhoneScreen = ({ navigation, route }: any) => {
  const { phoneNumber, phoneVerified } = route.params as { phoneNumber: string; phoneVerified?: boolean }

  const theme = useTheme()
  const insets = useSafeAreaInsets()
  const dispatch = useDispatch<AppDispatch>()
  const { showSuccess, showError } = useAlert()

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<UserRole>('consumer')
  const [city, setCity] = useState('Lome')
  const [businessName, setBusinessName] = useState('')
  const [businessType, setBusinessType] = useState('')
  const [loading, setLoading] = useState(false)
  const [showCityPicker, setShowCityPicker] = useState(false)
  const [showBusinessTypePicker, setShowBusinessTypePicker] = useState(false)

  const validateForm = (): boolean => {
    if (!firstName.trim()) {
      showError('Erreur', 'Le prenom est requis')
      return false
    }
    if (!lastName.trim()) {
      showError('Erreur', 'Le nom est requis')
      return false
    }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showError('Erreur', "L'adresse email n'est pas valide")
      return false
    }
    if (role === 'merchant') {
      if (!businessName.trim()) {
        showError('Erreur', 'Le nom du commerce est requis')
        return false
      }
      if (!businessType) {
        showError('Erreur', 'Le type de commerce est requis')
        return false
      }
    }
    return true
  }

  const handleSubmit = async () => {
    if (!validateForm()) return

    setLoading(true)
    try {
      const registrationData: PhoneRegisterData = {
        phone: phoneNumber,
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        email: email.trim() || undefined,
        role,
        city,
      }

      if (role === 'merchant') {
        registrationData.business_name = businessName.trim()
        registrationData.business_type = businessType
      }

      // Dispatch Redux action to register and update auth state
      const result = await dispatch(registerWithPhone(registrationData)).unwrap()

      if (result.success) {
        showSuccess('Bienvenue!', 'Votre compte a ete cree avec succes')
        // Fermer le modal Auth et retourner à l'écran principal
        navigation.getParent()?.getParent()?.goBack()
      }
    } catch (error: any) {
      console.error('Registration error:', error)
      if (typeof error === 'object' && error.errors) {
        // Show first validation error
        const firstField = Object.keys(error.errors)[0]
        const firstError = error.errors[firstField][0]
        showError('Erreur de validation', firstError)
      } else if (typeof error === 'string') {
        showError('Erreur', error)
      } else {
        showError('Erreur', error.message || "Erreur lors de l'inscription")
      }
    } finally {
      setLoading(false)
    }
  }

  const renderInput = (
    label: string,
    value: string,
    onChangeText: (text: string) => void,
    options?: {
      placeholder?: string
      keyboardType?: 'default' | 'email-address'
      autoCapitalize?: 'none' | 'words'
      testID?: string
    }
  ) => (
    <View style={{ marginBottom: theme.spacing.md }}>
      <Typography variant="body" weight="semibold" style={{ marginBottom: theme.spacing.xs }}>
        {label}
      </Typography>
      <TextInput
        style={[
          styles.input,
          {
            backgroundColor: theme.colors.inputBackground,
            borderColor: theme.colors.inputBorder,
            borderRadius: theme.radius.md,
            padding: theme.spacing.md,
            color: theme.colors.text,
          },
        ]}
        value={value}
        onChangeText={onChangeText}
        placeholder={options?.placeholder}
        placeholderTextColor={theme.colors.textSecondary}
        keyboardType={options?.keyboardType || 'default'}
        autoCapitalize={options?.autoCapitalize || 'words'}
        testID={options?.testID}
      />
    </View>
  )

  const renderPicker = (
    label: string,
    value: string,
    options: { value: string; label: string }[],
    onSelect: (value: string) => void,
    isOpen: boolean,
    setIsOpen: (open: boolean) => void
  ) => (
    <View style={{ marginBottom: theme.spacing.md }}>
      <Typography variant="body" weight="semibold" style={{ marginBottom: theme.spacing.xs }}>
        {label}
      </Typography>
      <TouchableOpacity
        style={[
          styles.picker,
          {
            backgroundColor: theme.colors.inputBackground,
            borderColor: theme.colors.inputBorder,
            borderRadius: theme.radius.md,
            padding: theme.spacing.md,
          },
        ]}
        onPress={() => setIsOpen(!isOpen)}
      >
        <Typography variant="body" style={{ color: value ? theme.colors.text : theme.colors.textSecondary }}>
          {value ? options.find((o) => o.value === value)?.label || value : 'Selectionner...'}
        </Typography>
        <Ionicons
          name={isOpen ? 'chevron-up' : 'chevron-down'}
          size={20}
          color={theme.colors.textSecondary}
        />
      </TouchableOpacity>
      {isOpen && (
        <View
          style={[
            styles.pickerList,
            {
              backgroundColor: theme.colors.surface.light,
              borderColor: theme.colors.inputBorder,
              borderRadius: theme.radius.md,
              marginTop: theme.spacing.xs,
            },
          ]}
        >
          <ScrollView style={{ maxHeight: 200 }} nestedScrollEnabled>
            {options.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.pickerItem,
                  {
                    padding: theme.spacing.sm,
                    borderBottomColor: theme.colors.inputBorder,
                    backgroundColor:
                      value === option.value ? `${theme.colors.primary[500]}10` : 'transparent',
                  },
                ]}
                onPress={() => {
                  onSelect(option.value)
                  setIsOpen(false)
                }}
              >
                <Typography
                  variant="body"
                  weight={value === option.value ? 'semibold' : 'regular'}
                >
                  {option.label}
                </Typography>
                {value === option.value && (
                  <Ionicons name="checkmark" size={20} color={theme.colors.primary[500]} />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  )

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar
        backgroundColor={theme.colors.background}
        barStyle={theme.isDark ? 'light-content' : 'dark-content'}
      />

      {/* Back Button */}
      <View
        style={[
          styles.backButtonContainer,
          { paddingTop: insets.top + 8, paddingHorizontal: theme.spacing.md },
        ]}
      >
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={[styles.backButton, { padding: theme.spacing.sm }]}
          accessibilityLabel="Retour"
        >
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
      </View>

      <KeyboardAwareContainer
        contentContainerStyle={[styles.scrollContent, { paddingHorizontal: theme.spacing.lg }]}
        extraScrollHeight={100}
      >
        {/* Header */}
        <View style={[styles.header, { marginBottom: theme.spacing.xl }]}>
          <BrandLogo
            color={theme.colors.primary[500]}
            style={{ marginBottom: theme.spacing.sm, alignSelf: 'center' }}
          />
          <Typography variant="h2" weight="bold" style={{ textAlign: 'center', marginBottom: theme.spacing.xs }}>
            Completez votre profil
          </Typography>
          <Typography variant="body" color="secondary" style={{ textAlign: 'center' }}>
            Quelques informations pour finaliser votre inscription
          </Typography>
        </View>

        {/* Verified Phone Badge */}
        <View
          style={[
            styles.phoneBadge,
            {
              backgroundColor: `${theme.colors.success}15`,
              borderColor: theme.colors.success,
              borderRadius: theme.radius.md,
              padding: theme.spacing.sm,
              marginBottom: theme.spacing.lg,
            },
          ]}
        >
          <Ionicons name="checkmark-circle" size={20} color={theme.colors.success} />
          <Typography
            variant="body"
            weight="semibold"
            style={{ color: theme.colors.success, marginLeft: theme.spacing.xs }}
          >
            {phoneNumber}
          </Typography>
          <Typography variant="caption" style={{ color: theme.colors.success, marginLeft: theme.spacing.xs }}>
            (verifie)
          </Typography>
        </View>

        {/* Form */}
        <Card variant="elevated" style={{ padding: theme.spacing.lg, marginBottom: theme.spacing.lg }}>
          {/* Role Selection */}
          <View style={{ marginBottom: theme.spacing.lg }}>
            <Typography variant="body" weight="semibold" style={{ marginBottom: theme.spacing.sm }}>
              Je suis
            </Typography>
            <View style={styles.roleContainer}>
              <TouchableOpacity
                style={[
                  styles.roleButton,
                  {
                    flex: 1,
                    padding: theme.spacing.md,
                    borderRadius: theme.radius.md,
                    borderWidth: 2,
                    borderColor: role === 'consumer' ? theme.colors.primary[500] : theme.colors.inputBorder,
                    backgroundColor:
                      role === 'consumer' ? `${theme.colors.primary[500]}10` : 'transparent',
                    marginRight: theme.spacing.sm,
                  },
                ]}
                onPress={() => setRole('consumer')}
                testID="role-consumer-button"
              >
                <Ionicons
                  name="person"
                  size={24}
                  color={role === 'consumer' ? theme.colors.primary[500] : theme.colors.textSecondary}
                />
                <Typography
                  variant="body"
                  weight={role === 'consumer' ? 'bold' : 'regular'}
                  style={{
                    color: role === 'consumer' ? theme.colors.primary[500] : theme.colors.text,
                    marginTop: theme.spacing.xs,
                  }}
                >
                  Consommateur
                </Typography>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.roleButton,
                  {
                    flex: 1,
                    padding: theme.spacing.md,
                    borderRadius: theme.radius.md,
                    borderWidth: 2,
                    borderColor: role === 'merchant' ? theme.colors.primary[500] : theme.colors.inputBorder,
                    backgroundColor:
                      role === 'merchant' ? `${theme.colors.primary[500]}10` : 'transparent',
                  },
                ]}
                onPress={() => setRole('merchant')}
                testID="role-merchant-button"
              >
                <Ionicons
                  name="storefront"
                  size={24}
                  color={role === 'merchant' ? theme.colors.primary[500] : theme.colors.textSecondary}
                />
                <Typography
                  variant="body"
                  weight={role === 'merchant' ? 'bold' : 'regular'}
                  style={{
                    color: role === 'merchant' ? theme.colors.primary[500] : theme.colors.text,
                    marginTop: theme.spacing.xs,
                  }}
                >
                  Commercant
                </Typography>
              </TouchableOpacity>
            </View>
          </View>

          {/* Personal Info */}
          {renderInput('Prenom *', firstName, setFirstName, {
            placeholder: 'Votre prenom',
            testID: 'first-name-input',
          })}
          {renderInput('Nom *', lastName, setLastName, {
            placeholder: 'Votre nom',
            testID: 'last-name-input',
          })}
          {renderInput('Email (optionnel)', email, setEmail, {
            placeholder: 'votre@email.com',
            keyboardType: 'email-address',
            autoCapitalize: 'none',
            testID: 'email-input',
          })}

          {/* City Picker */}
          {renderPicker(
            'Ville',
            city,
            CITIES.map((c) => ({ value: c, label: c })),
            setCity,
            showCityPicker,
            setShowCityPicker
          )}

          {/* Merchant-specific fields */}
          {role === 'merchant' && (
            <>
              {renderInput('Nom du commerce *', businessName, setBusinessName, {
                placeholder: 'Ex: Boulangerie du Coin',
                testID: 'business-name-input',
              })}
              {renderPicker(
                'Type de commerce *',
                businessType,
                BUSINESS_TYPES,
                setBusinessType,
                showBusinessTypePicker,
                setShowBusinessTypePicker
              )}
            </>
          )}
        </Card>

        {/* Submit Button */}
        <Button
          variant="primary"
          size="lg"
          fullWidth
          onPress={handleSubmit}
          disabled={loading}
          loading={loading}
          testID="complete-profile-button"
        >
          {loading ? 'Creation du compte...' : 'Creer mon compte'}
        </Button>

        {/* Terms */}
        <View style={{ marginTop: theme.spacing.lg, marginBottom: theme.spacing['2xl'] }}>
          <Typography variant="caption" color="secondary" style={{ textAlign: 'center' }}>
            En creant un compte, vous acceptez nos{' '}
            <Typography variant="caption" style={{ color: theme.colors.primary[500] }}>
              Conditions d'utilisation
            </Typography>{' '}
            et notre{' '}
            <Typography variant="caption" style={{ color: theme.colors.primary[500] }}>
              Politique de confidentialite
            </Typography>
          </Typography>
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
    paddingTop: 60,
  },
  header: {},
  phoneBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  roleContainer: {
    flexDirection: 'row',
  },
  roleButton: {
    alignItems: 'center',
  },
  input: {
    borderWidth: 1,
    fontSize: 16,
  },
  picker: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
  },
  pickerList: {
    borderWidth: 1,
  },
  pickerItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
  },
})

export default CompleteProfilePhoneScreen
