import React, { useState } from 'react'
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
import { useDispatch, useSelector } from 'react-redux'
import { registerUser, clearError } from '../../store/slices/authSlice'
import { AppDispatch, RootState } from '../../store'
import { RegisterData } from '../../types'
import { Button, Card, Typography, Modal } from '../../components/2025'
import { useTheme } from '../../theme'
import { Ionicons } from '@expo/vector-icons'
import { useToast } from '../../contexts/ToastContext'

interface Props {
  navigation: any
}

const RegisterScreen: React.FC<Props> = ({ navigation }) => {
  const theme = useTheme()
  const dispatch = useDispatch<AppDispatch>()
  const { loading } = useSelector((state: RootState) => state.auth)
  const { showSuccess } = useToast()

  const [formData, setFormData] = useState<RegisterData>({
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    password_confirmation: '',
    phone: '',
    city: '',
    role: 'consumer',
    business_name: '',
    business_type: '',
  })

  // Error modal state
  const [errorModalVisible, setErrorModalVisible] = useState(false)
  const [errorTitle, setErrorTitle] = useState('')
  const [errorMessages, setErrorMessages] = useState<string[]>([])

  const showErrorModal = (title: string, messages: string[]) => {
    setErrorTitle(title)
    setErrorMessages(messages)
    setErrorModalVisible(true)
  }

  const handleRegister = async () => {
    // Clear previous errors
    dispatch(clearError())

    // Frontend validation
    const validationErrors: string[] = []

    if (!formData.first_name.trim()) {
      validationErrors.push('Le prénom est requis')
    }
    if (!formData.last_name.trim()) {
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
    if (!formData.password) {
      validationErrors.push('Le mot de passe est requis')
    } else if (formData.password.length < 8) {
      validationErrors.push('Le mot de passe doit contenir au moins 8 caractères')
    }
    if (formData.password !== formData.password_confirmation) {
      validationErrors.push('Les mots de passe ne correspondent pas')
    }

    if (validationErrors.length > 0) {
      showErrorModal('Champs manquants', validationErrors)
      return
    }

    try {
      const result = await dispatch(registerUser(formData))
      if (registerUser.fulfilled.match(result)) {
        showSuccess('Compte créé avec succès ! 🎉')
      } else {
        // Parse validation errors from backend
        const payload = result.payload as any
        if (typeof payload === 'object' && payload.errors) {
          // Detailed validation errors from backend
          const backendErrors: string[] = []
          Object.values(payload.errors).forEach((fieldErrors: any) => {
            if (Array.isArray(fieldErrors)) {
              fieldErrors.forEach(err => backendErrors.push(err))
            } else {
              backendErrors.push(String(fieldErrors))
            }
          })
          showErrorModal('Erreurs de validation', backendErrors)
        } else {
          // Simple error message
          const errorMsg = typeof payload === 'string' ? payload : 'Erreur lors de la création du compte'
          showErrorModal('Erreur', [errorMsg])
        }
      }
    } catch (error: any) {
      showErrorModal('Erreur', [error?.message || 'Une erreur est survenue'])
    }
  }

  const renderInput = (label: string, value: string, field: keyof RegisterData, placeholder: string, options?: { keyboardType?: any, secureTextEntry?: boolean }) => (
    <View style={{ marginBottom: theme.spacing.lg }}>
      <Typography variant="body" weight="semibold" style={{ marginBottom: theme.spacing.sm }}>
        {label}
      </Typography>
      <TextInput
        style={{
          backgroundColor: theme.colors.inputBackground,
          paddingHorizontal: theme.spacing.md,
          paddingVertical: theme.spacing.sm,
          borderRadius: theme.radius.md,
          borderWidth: 1,
          borderColor: theme.colors.inputBorder,
          fontSize: 16,
          color: theme.colors.text,
        }}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.textSecondary}
        value={value}
        onChangeText={(text) => setFormData({ ...formData, [field]: text })}
        keyboardType={options?.keyboardType}
        secureTextEntry={options?.secureTextEntry}
        autoCapitalize={options?.secureTextEntry ? 'none' : undefined}
        autoCorrect={false}
      />
    </View>
  )

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar backgroundColor={theme.colors.primary[500]} barStyle="light-content" />

      <ScrollView contentContainerStyle={{ flexGrow: 1, paddingHorizontal: theme.spacing.lg, paddingVertical: theme.spacing.xl }} keyboardShouldPersistTaps="handled">
        <View style={{ alignItems: 'center', marginBottom: theme.spacing.xl }}>
          <Typography variant="displayMd" weight="bold" style={{ color: theme.colors.primary[500], marginBottom: theme.spacing.sm }}>
            Créer un compte
          </Typography>
          <Typography variant="body" color="secondary" style={{ textAlign: 'center' }}>
            Rejoignez la communauté Antigaspi
          </Typography>
        </View>

        <Card variant="elevated" style={{ padding: theme.spacing.lg, marginBottom: theme.spacing.lg }}>
          {renderInput('Prénom *', formData.first_name, 'first_name', 'Votre prénom')}
          {renderInput('Nom *', formData.last_name, 'last_name', 'Votre nom')}
          {renderInput('Email *', formData.email, 'email', 'votre@email.com', { keyboardType: 'email-address' })}
          {renderInput('Téléphone', formData.phone || '', 'phone', '+228 XX XX XX XX', { keyboardType: 'phone-pad' })}
          {renderInput('Ville *', formData.city, 'city', 'Lomé')}
          {renderInput('Mot de passe *', formData.password, 'password', 'Mot de passe sécurisé', { secureTextEntry: true })}
          {renderInput('Confirmer le mot de passe *', formData.password_confirmation, 'password_confirmation', 'Confirmer le mot de passe', { secureTextEntry: true })}

          <Button
            variant="primary"
            size="lg"
            fullWidth
            onPress={handleRegister}
            disabled={loading}
            loading={loading}
          >
            {loading ? 'Création...' : 'Créer mon compte'}
          </Button>
        </Card>

        <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }}>
          <Typography variant="caption" color="secondary" style={{ marginRight: theme.spacing.xs }}>
            Déjà un compte ?
          </Typography>
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Typography variant="caption" weight="semibold" style={{ color: theme.colors.primary[500] }}>
              Se connecter
            </Typography>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Error Modal */}
      <Modal
        visible={errorModalVisible}
        onClose={() => setErrorModalVisible(false)}
        variant="center"
        showCloseButton={false}
      >
        <View style={styles.errorModalContent}>
          {/* Error Icon */}
          <View style={[styles.errorIconContainer, { backgroundColor: `${theme.colors.error}15` }]}>
            <Ionicons name="alert-circle" size={48} color={theme.colors.error} />
          </View>

          {/* Title */}
          <Typography variant="h3" weight="bold" style={styles.errorModalTitle}>
            {errorTitle}
          </Typography>

          {/* Error Messages */}
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

          {/* Close Button */}
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
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
