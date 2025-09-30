import React, { useState } from 'react'
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  ScrollView,
} from 'react-native'
import { useDispatch, useSelector } from 'react-redux'
import { registerUser } from '../../store/slices/authSlice'
import { AppDispatch, RootState } from '../../store'
import { RegisterData } from '../../types'
import { Button, Card, Typography } from '../../components/2025'
import { useTheme } from '../../theme'

interface Props {
  navigation: any
}

const RegisterScreen: React.FC<Props> = ({ navigation }) => {
  const theme = useTheme()
  const dispatch = useDispatch<AppDispatch>()
  const { loading, error } = useSelector((state: RootState) => state.auth)

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

  const handleRegister = async () => {
    if (!formData.first_name || !formData.last_name || !formData.email || !formData.password) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs obligatoires')
      return
    }

    if (formData.password !== formData.password_confirmation) {
      Alert.alert('Erreur', 'Les mots de passe ne correspondent pas')
      return
    }

    try {
      const result = await dispatch(registerUser(formData))
      if (registerUser.fulfilled.match(result)) {
        Alert.alert('Succès', 'Compte créé avec succès!')
      } else {
        Alert.alert('Erreur', result.payload as string || 'Erreur lors de la création du compte')
      }
    } catch (error) {
      Alert.alert('Erreur', 'Une erreur est survenue')
    }
  }

  const renderInput = (label: string, value: string, field: keyof RegisterData, placeholder: string, options?: { keyboardType?: any, secureTextEntry?: boolean }) => (
    <View style={{ marginBottom: theme.spacing.lg }}>
      <Typography variant="body" weight="semibold" style={{ marginBottom: theme.spacing.sm }}>
        {label}
      </Typography>
      <TextInput
        style={{
          backgroundColor: theme.colors.surface.light,
          paddingHorizontal: theme.spacing.md,
          paddingVertical: theme.spacing.sm,
          borderRadius: theme.radius.md,
          borderWidth: 1,
          borderColor: theme.colors.border,
          fontSize: 16
        }}
        placeholder={placeholder}
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

          {error && (
            <View style={{ backgroundColor: theme.colors.error[50], padding: theme.spacing.sm, borderRadius: theme.radius.md, marginBottom: theme.spacing.lg }}>
              <Typography variant="caption" style={{ color: theme.colors.error[600], textAlign: 'center' }}>
                {error}
              </Typography>
            </View>
          )}

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
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
})

export default RegisterScreen
