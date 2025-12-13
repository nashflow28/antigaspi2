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
  Animated,
} from 'react-native'
import { useDispatch, useSelector } from 'react-redux'
import { registerUser, clearError } from '../../store/slices/authSlice'
import { AppDispatch, RootState } from '../../store'
import { RegisterData } from '../../types'
import { Button, Card, Typography, Modal } from '../../components/2025'
import { useTheme } from '../../theme'
import { Ionicons } from '@expo/vector-icons'
import { useToast } from '../../contexts/ToastContext'
import { usePersistedForm } from '../../hooks/usePersistedForm'
import PhoneInput from '../../components/PhoneInput'
import AlertModal from '../../components/AlertModal'
import { useAlert } from '../../hooks/useAlert'

interface Props {
  navigation: any
}

type UserRole = 'consumer' | 'merchant'

// Types de commerce disponibles
const BUSINESS_TYPES = [
  { value: 'boulangerie', label: 'Boulangerie / Pâtisserie', icon: 'nutrition' },
  { value: 'restaurant', label: 'Restaurant', icon: 'restaurant' },
  { value: 'supermarche', label: 'Supermarché / Épicerie', icon: 'cart' },
  { value: 'traiteur', label: 'Traiteur', icon: 'fast-food' },
  { value: 'primeur', label: 'Primeur / Fruits & Légumes', icon: 'leaf' },
  { value: 'boucherie', label: 'Boucherie / Charcuterie', icon: 'fitness' },
  { value: 'poissonnerie', label: 'Poissonnerie', icon: 'fish' },
  { value: 'cafe', label: 'Café / Salon de thé', icon: 'cafe' },
  { value: 'hotel', label: 'Hôtel', icon: 'bed' },
  { value: 'autre', label: 'Autre', icon: 'storefront' },
] as const

// Type pour les données de formulaire persistées (sans mots de passe)
interface RegisterFormData {
  role: UserRole
  firstName: string
  lastName: string
  email: string
  phone: string
  city: string
  businessName: string
  businessType: string
}

const INITIAL_FORM_DATA: RegisterFormData = {
  role: 'consumer',
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  city: '',
  businessName: '',
  businessType: '',
}

const RegisterScreen: React.FC<Props> = ({ navigation }) => {
  const theme = useTheme()
  const dispatch = useDispatch<AppDispatch>()
  const { loading } = useSelector((state: RootState) => state.auth)
  const { showSuccess } = useToast()
  const scrollViewRef = useRef<ScrollView>(null)
  const { alertProps, showWarning, hideAlert } = useAlert()

  // Formulaire persisté (sans mots de passe pour la sécurité)
  const {
    formData,
    setFormData,
    setField,
    clearCache: clearFormCache,
    hasUnsavedChanges,
    isRestored,
  } = usePersistedForm<RegisterFormData>({
    formKey: 'register_form',
    initialValues: INITIAL_FORM_DATA,
    expiresIn: 24 * 60 * 60 * 1000, // 24 heures
  })

  // Mots de passe NON persistés pour la sécurité
  const [password, setPassword] = useState('')
  const [passwordConfirmation, setPasswordConfirmation] = useState('')

  // UI state
  const [showBusinessTypePicker, setShowBusinessTypePicker] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false)
  const roleAnimation = useRef(new Animated.Value(0)).current

  // Error modal state
  const [errorModalVisible, setErrorModalVisible] = useState(false)
  const [errorTitle, setErrorTitle] = useState('')
  const [errorMessages, setErrorMessages] = useState<string[]>([])

  // Show draft restoration alert if meaningful data was restored
  useEffect(() => {
    if (isRestored && hasUnsavedChanges) {
      const hasMeaningfulData = formData.firstName || formData.lastName || formData.email
      if (hasMeaningfulData) {
        showWarning(
          'Brouillon récupéré',
          'Nous avons retrouvé vos données d\'inscription précédentes. Voulez-vous les conserver ?',
          [
            {
              text: 'Recommencer',
              style: 'destructive',
              onPress: () => {
                hideAlert()
                setFormData(INITIAL_FORM_DATA)
                clearFormCache()
              },
            },
            {
              text: 'Conserver',
              style: 'default',
              onPress: hideAlert,
            },
          ]
        )
      }
    }
  }, [isRestored])

  const showErrorModal = (title: string, messages: string[]) => {
    setErrorTitle(title)
    setErrorMessages(messages)
    setErrorModalVisible(true)
  }

  // Animation lors du changement de rôle
  const handleRoleChange = (newRole: UserRole) => {
    setField('role', newRole)
    Animated.spring(roleAnimation, {
      toValue: newRole === 'merchant' ? 1 : 0,
      useNativeDriver: false,
      tension: 50,
      friction: 7,
    }).start()

    // Scroll vers le bas pour montrer les nouveaux champs merchant
    if (newRole === 'merchant') {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true })
      }, 300)
    }
  }

  const handleRegister = async () => {
    dispatch(clearError())

    // Validation frontend
    const validationErrors: string[] = []

    if (!formData.firstName.trim()) {
      validationErrors.push('Le prénom est requis')
    }
    if (!formData.lastName.trim()) {
      validationErrors.push('Le nom est requis')
    }
    if (!formData.email.trim()) {
      validationErrors.push('L\'email est requis')
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      validationErrors.push('L\'email n\'est pas valide')
    }
    if (!formData.city.trim()) {
      validationErrors.push('La ville est requise')
    }
    if (!password) {
      validationErrors.push('Le mot de passe est requis')
    } else if (password.length < 8) {
      validationErrors.push('Le mot de passe doit contenir au moins 8 caractères')
    }
    if (password !== passwordConfirmation) {
      validationErrors.push('Les mots de passe ne correspondent pas')
    }

    // Validation spécifique merchant
    if (formData.role === 'merchant') {
      if (!formData.businessName.trim()) {
        validationErrors.push('Le nom de votre commerce est requis')
      }
      if (!formData.businessType) {
        validationErrors.push('Le type de commerce est requis')
      }
    }

    if (validationErrors.length > 0) {
      showErrorModal('Champs manquants', validationErrors)
      return
    }

    // Préparer les données d'inscription
    const registerData: RegisterData = {
      first_name: formData.firstName.trim(),
      last_name: formData.lastName.trim(),
      email: formData.email.trim().toLowerCase(),
      password: password,
      password_confirmation: passwordConfirmation,
      phone: formData.phone.trim() || undefined,
      city: formData.city.trim(),
      role: formData.role,
    }

    // Ajouter les champs merchant seulement si role = merchant
    if (formData.role === 'merchant') {
      registerData.business_name = formData.businessName.trim()
      registerData.business_type = formData.businessType
    }

    try {
      const result = await dispatch(registerUser(registerData))
      if (registerUser.fulfilled.match(result)) {
        // Clear form cache on successful registration
        await clearFormCache()
        showSuccess('Compte créé avec succès ! 🎉')
      } else {
        // Parse validation errors from backend
        const payload = result.payload as any
        if (payload && typeof payload === 'object' && payload.errors) {
          const backendErrors: string[] = []
          Object.values(payload.errors).forEach((fieldErrors: any) => {
            if (Array.isArray(fieldErrors)) {
              fieldErrors.forEach(err => backendErrors.push(String(err)))
            } else if (typeof fieldErrors === 'string') {
              backendErrors.push(fieldErrors)
            }
          })
          showErrorModal('Erreurs de validation', backendErrors)
        } else if (payload && typeof payload === 'object' && payload.message) {
          showErrorModal('Erreur', [payload.message])
        } else if (typeof payload === 'string') {
          showErrorModal('Erreur', [payload])
        } else {
          showErrorModal('Erreur', ['Erreur lors de la création du compte'])
        }
      }
    } catch (error: any) {
      showErrorModal('Erreur', [error?.message || 'Une erreur est survenue'])
    }
  }

  const getSelectedBusinessTypeLabel = () => {
    const selected = BUSINESS_TYPES.find(bt => bt.value === formData.businessType)
    return selected ? selected.label : 'Sélectionner le type'
  }

  const renderInput = (
    label: string,
    value: string,
    onChangeText: (text: string) => void,
    placeholder: string,
    options?: {
      keyboardType?: any
      secureTextEntry?: boolean
      showToggle?: boolean
      toggleValue?: boolean
      onToggle?: () => void
      icon?: keyof typeof Ionicons.glyphMap
      autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters'
    }
  ) => (
    <View style={{ marginBottom: theme.spacing.md }}>
      <Typography variant="caption" weight="semibold" style={{ marginBottom: theme.spacing.xs, color: theme.colors.textSecondary }}>
        {label}
      </Typography>
      <View style={styles.inputContainer}>
        {options?.icon && (
          <View style={[styles.inputIconContainer, { backgroundColor: `${theme.colors.primary[500]}15` }]}>
            <Ionicons name={options.icon} size={18} color={theme.colors.primary[500]} />
          </View>
        )}
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: theme.colors.inputBackground,
              borderColor: theme.colors.inputBorder,
              color: theme.colors.text,
              paddingLeft: options?.icon ? 48 : theme.spacing.md,
              paddingRight: options?.showToggle ? 48 : theme.spacing.md,
            },
          ]}
          placeholder={placeholder}
          placeholderTextColor={theme.colors.textSecondary}
          value={value}
          onChangeText={onChangeText}
          keyboardType={options?.keyboardType}
          secureTextEntry={options?.secureTextEntry && !options?.toggleValue}
          autoCapitalize={options?.autoCapitalize ?? (options?.secureTextEntry ? 'none' : undefined)}
          autoCorrect={false}
        />
        {options?.showToggle && (
          <TouchableOpacity
            style={styles.inputToggle}
            onPress={options.onToggle}
          >
            <Ionicons
              name={options.toggleValue ? 'eye-off' : 'eye'}
              size={20}
              color={theme.colors.textSecondary}
            />
          </TouchableOpacity>
        )}
      </View>
    </View>
  )

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar backgroundColor={theme.colors.primary[500]} barStyle="light-content" />

      <ScrollView
        ref={scrollViewRef}
        contentContainerStyle={{ flexGrow: 1, paddingHorizontal: theme.spacing.lg, paddingVertical: theme.spacing.xl }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={{ alignItems: 'center', marginBottom: theme.spacing.xl }}>
          <View style={[styles.logoContainer, { backgroundColor: `${theme.colors.primary[500]}15` }]}>
            <Ionicons name="leaf" size={40} color={theme.colors.primary[500]} />
          </View>
          <Typography variant="displayMd" weight="bold" style={{ color: theme.colors.primary[500], marginTop: theme.spacing.md, marginBottom: theme.spacing.xs }}>
            Créer un compte
          </Typography>
          <Typography variant="body" color="secondary" style={{ textAlign: 'center' }}>
            Rejoignez la communauté Antigaspi
          </Typography>
        </View>

        {/* Sélection du rôle */}
        <Card variant="elevated" style={{ padding: theme.spacing.md, marginBottom: theme.spacing.lg }}>
          <Typography variant="body" weight="semibold" style={{ marginBottom: theme.spacing.md, textAlign: 'center' }}>
            Je suis...
          </Typography>
          <View style={styles.roleSelector}>
            <TouchableOpacity
              style={[
                styles.roleButton,
                {
                  backgroundColor: formData.role === 'consumer' ? theme.colors.primary[500] : theme.colors.surface.muted,
                  borderColor: formData.role === 'consumer' ? theme.colors.primary[500] : theme.colors.inputBorder,
                },
              ]}
              onPress={() => handleRoleChange('consumer')}
            >
              <Ionicons
                name="person"
                size={24}
                color={formData.role === 'consumer' ? '#fff' : theme.colors.textSecondary}
              />
              <Typography
                variant="body"
                weight="semibold"
                style={{ color: formData.role === 'consumer' ? '#fff' : theme.colors.text, marginTop: 4 }}
              >
                Consommateur
              </Typography>
              <Typography
                variant="caption"
                style={{ color: formData.role === 'consumer' ? 'rgba(255,255,255,0.8)' : theme.colors.textSecondary, textAlign: 'center', marginTop: 2 }}
              >
                Je cherche des bons plans
              </Typography>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.roleButton,
                {
                  backgroundColor: formData.role === 'merchant' ? theme.colors.primary[500] : theme.colors.surface.muted,
                  borderColor: formData.role === 'merchant' ? theme.colors.primary[500] : theme.colors.inputBorder,
                },
              ]}
              onPress={() => handleRoleChange('merchant')}
            >
              <Ionicons
                name="storefront"
                size={24}
                color={formData.role === 'merchant' ? '#fff' : theme.colors.textSecondary}
              />
              <Typography
                variant="body"
                weight="semibold"
                style={{ color: formData.role === 'merchant' ? '#fff' : theme.colors.text, marginTop: 4 }}
              >
                Commerçant
              </Typography>
              <Typography
                variant="caption"
                style={{ color: formData.role === 'merchant' ? 'rgba(255,255,255,0.8)' : theme.colors.textSecondary, textAlign: 'center', marginTop: 2 }}
              >
                Je vends mes invendus
              </Typography>
            </TouchableOpacity>
          </View>
        </Card>

        {/* Informations personnelles */}
        <Card variant="elevated" style={{ padding: theme.spacing.lg, marginBottom: theme.spacing.lg }}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIcon, { backgroundColor: `${theme.colors.primary[500]}15` }]}>
              <Ionicons name="person-circle" size={20} color={theme.colors.primary[500]} />
            </View>
            <Typography variant="body" weight="bold">Informations personnelles</Typography>
          </View>

          <View style={styles.row}>
            <View style={{ flex: 1, marginRight: theme.spacing.sm }}>
              {renderInput('Prénom *', formData.firstName, (v) => setField('firstName', v), 'Jean', { icon: 'person-outline' })}
            </View>
            <View style={{ flex: 1, marginLeft: theme.spacing.sm }}>
              {renderInput('Nom *', formData.lastName, (v) => setField('lastName', v), 'Dupont', { icon: 'person-outline' })}
            </View>
          </View>

          {renderInput('Email *', formData.email, (v) => setField('email', v), 'jean@exemple.com', {
            keyboardType: 'email-address',
            icon: 'mail-outline',
            autoCapitalize: 'none',
          })}

          <PhoneInput
            label="Téléphone"
            value={formData.phone}
            onChangeText={(v) => setField('phone', v)}
            placeholder="90 12 34 56"
          />

          {renderInput('Ville *', formData.city, (v) => setField('city', v), 'Lomé', { icon: 'location-outline' })}
        </Card>

        {/* Champs spécifiques Merchant */}
        {formData.role === 'merchant' && (
          <Animated.View style={{ opacity: roleAnimation }}>
            <Card variant="elevated" style={{ padding: theme.spacing.lg, marginBottom: theme.spacing.lg, borderColor: theme.colors.primary[500], borderWidth: 1 }}>
              <View style={styles.sectionHeader}>
                <View style={[styles.sectionIcon, { backgroundColor: `${theme.colors.accent.orange}15` }]}>
                  <Ionicons name="storefront" size={20} color={theme.colors.accent.orange} />
                </View>
                <Typography variant="body" weight="bold">Informations commerce</Typography>
              </View>

              {renderInput('Nom du commerce *', formData.businessName, (v) => setField('businessName', v), 'Boulangerie Martin', {
                icon: 'business-outline',
              })}

              {/* Type de commerce - Picker personnalisé */}
              <View style={{ marginBottom: theme.spacing.md }}>
                <Typography variant="caption" weight="semibold" style={{ marginBottom: theme.spacing.xs, color: theme.colors.textSecondary }}>
                  Type de commerce *
                </Typography>
                <TouchableOpacity
                  style={[
                    styles.pickerButton,
                    {
                      backgroundColor: theme.colors.inputBackground,
                      borderColor: theme.colors.inputBorder,
                    },
                  ]}
                  onPress={() => setShowBusinessTypePicker(true)}
                >
                  <View style={[styles.inputIconContainer, { backgroundColor: `${theme.colors.primary[500]}15` }]}>
                    <Ionicons
                      name={BUSINESS_TYPES.find(bt => bt.value === formData.businessType)?.icon as any || 'grid-outline'}
                      size={18}
                      color={theme.colors.primary[500]}
                    />
                  </View>
                  <Typography
                    variant="body"
                    style={{
                      flex: 1,
                      marginLeft: 48,
                      color: formData.businessType ? theme.colors.text : theme.colors.textSecondary,
                    }}
                  >
                    {getSelectedBusinessTypeLabel()}
                  </Typography>
                  <Ionicons name="chevron-down" size={20} color={theme.colors.textSecondary} />
                </TouchableOpacity>
              </View>

              <View style={[styles.infoBox, { backgroundColor: `${theme.colors.info}10`, borderColor: theme.colors.info }]}>
                <Ionicons name="information-circle" size={20} color={theme.colors.info} />
                <Typography variant="caption" style={{ flex: 1, marginLeft: theme.spacing.sm, color: theme.colors.info }}>
                  Votre compte sera vérifié par notre équipe avant activation complète.
                </Typography>
              </View>
            </Card>
          </Animated.View>
        )}

        {/* Sécurité */}
        <Card variant="elevated" style={{ padding: theme.spacing.lg, marginBottom: theme.spacing.lg }}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIcon, { backgroundColor: `${theme.colors.error}15` }]}>
              <Ionicons name="lock-closed" size={20} color={theme.colors.error} />
            </View>
            <Typography variant="body" weight="bold">Sécurité</Typography>
          </View>

          {renderInput('Mot de passe *', password, setPassword, 'Min. 8 caractères', {
            secureTextEntry: true,
            icon: 'key-outline',
            showToggle: true,
            toggleValue: showPassword,
            onToggle: () => setShowPassword(!showPassword),
          })}

          {renderInput('Confirmer le mot de passe *', passwordConfirmation, setPasswordConfirmation, 'Répétez le mot de passe', {
            secureTextEntry: true,
            icon: 'key-outline',
            showToggle: true,
            toggleValue: showPasswordConfirm,
            onToggle: () => setShowPasswordConfirm(!showPasswordConfirm),
          })}
        </Card>

        {/* Bouton d'inscription */}
        <Button
          variant="primary"
          size="lg"
          fullWidth
          onPress={handleRegister}
          disabled={loading}
          loading={loading}
          leftIcon={<Ionicons name="person-add" size={20} color="#fff" />}
        >
          {loading ? 'Création en cours...' : `Créer mon compte ${formData.role === 'merchant' ? 'commerçant' : ''}`}
        </Button>

        {/* Lien connexion */}
        <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: theme.spacing.lg, marginBottom: theme.spacing.xl }}>
          <Typography variant="body" color="secondary" style={{ marginRight: theme.spacing.xs }}>
            Déjà un compte ?
          </Typography>
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Typography variant="body" weight="bold" style={{ color: theme.colors.primary[500] }}>
              Se connecter
            </Typography>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Modal de sélection du type de commerce */}
      <Modal
        visible={showBusinessTypePicker}
        onClose={() => setShowBusinessTypePicker(false)}
        variant="bottom"
        showCloseButton
      >
        <View style={styles.businessTypeModalContent}>
          <Typography variant="h3" weight="bold" style={{ marginBottom: theme.spacing.lg, textAlign: 'center' }}>
            Type de commerce
          </Typography>
          <ScrollView style={{ maxHeight: 400 }} showsVerticalScrollIndicator={false}>
            {BUSINESS_TYPES.map((type) => (
              <TouchableOpacity
                key={type.value}
                style={[
                  styles.businessTypeOption,
                  {
                    backgroundColor: formData.businessType === type.value ? `${theme.colors.primary[500]}15` : 'transparent',
                    borderColor: formData.businessType === type.value ? theme.colors.primary[500] : theme.colors.inputBorder,
                  },
                ]}
                onPress={() => {
                  setField('businessType', type.value)
                  setShowBusinessTypePicker(false)
                }}
              >
                <View style={[styles.businessTypeIcon, { backgroundColor: `${theme.colors.primary[500]}15` }]}>
                  <Ionicons name={type.icon as any} size={24} color={theme.colors.primary[500]} />
                </View>
                <Typography
                  variant="body"
                  weight={formData.businessType === type.value ? 'bold' : 'regular'}
                  style={{ flex: 1, marginLeft: theme.spacing.md }}
                >
                  {type.label}
                </Typography>
                {formData.businessType === type.value && (
                  <Ionicons name="checkmark-circle" size={24} color={theme.colors.primary[500]} />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </Modal>

      {/* Modal d'erreur */}
      <Modal
        visible={errorModalVisible}
        onClose={() => setErrorModalVisible(false)}
        variant="center"
        showCloseButton={false}
        scrollable={false}
      >
        <View style={styles.errorModalContent}>
          <View style={[styles.errorIconContainer, { backgroundColor: `${theme.colors.error}15` }]}>
            <Ionicons name="alert-circle" size={48} color={theme.colors.error} />
          </View>

          <Typography variant="h3" weight="bold" style={styles.errorModalTitle}>
            {errorTitle}
          </Typography>

          <View style={[styles.errorMessagesContainer, { backgroundColor: theme.colors.surface.muted }]}>
            {errorMessages.map((message, index) => (
              <View key={index} style={styles.errorMessageRow}>
                <Ionicons name="close-circle" size={16} color={theme.colors.error} style={{ marginRight: 8, marginTop: 2 }} />
                <Typography variant="body" style={{ flex: 1, color: theme.colors.text }}>
                  {message}
                </Typography>
              </View>
            ))}
          </View>

          <Button
            variant="primary"
            size="lg"
            fullWidth
            onPress={() => setErrorModalVisible(false)}
            leftIcon={<Ionicons name="checkmark-circle" size={20} color="#fff" />}
          >
            Compris
          </Button>
        </View>
      </Modal>

      <AlertModal {...alertProps} />
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleSelector: {
    flexDirection: 'row',
    gap: 12,
  },
  roleButton: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  row: {
    flexDirection: 'row',
  },
  inputContainer: {
    position: 'relative',
  },
  inputIconContainer: {
    position: 'absolute',
    left: 10,
    top: 10,
    width: 28,
    height: 28,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  input: {
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    fontSize: 15,
  },
  inputToggle: {
    position: 'absolute',
    right: 12,
    top: 12,
  },
  pickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingRight: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 8,
  },
  businessTypeModalContent: {
    paddingVertical: 8,
  },
  businessTypeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 8,
  },
  businessTypeIcon: {
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorModalContent: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  errorIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  errorModalTitle: {
    textAlign: 'center',
    marginBottom: 16,
  },
  errorMessagesContainer: {
    width: '100%',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    gap: 12,
  },
  errorMessageRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
})

export default RegisterScreen
