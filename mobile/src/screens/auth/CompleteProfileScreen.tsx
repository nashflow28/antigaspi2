/**
 * CompleteProfileScreen - Profile completion for new phone-authenticated users
 */

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
import { useDispatch } from 'react-redux'
import { AppDispatch } from '../../store'
import { registerWithFirebase } from '../../store/slices/authSlice'
import { Card, Typography, Button } from '../../components/2025'
import BrandLogo from '../../components/BrandLogo'
import { useTheme } from '../../theme'
import { TEST_IDS } from '../../utils/testIds'
import { useAlert } from '../../contexts/AlertContext'

type UserRole = 'consumer' | 'merchant'

const CompleteProfileScreen = ({ navigation, route }: any) => {
  const { firebaseIdToken, phoneNumber } = route.params as { firebaseIdToken: string; phoneNumber: string }
  const theme = useTheme()
  const dispatch = useDispatch<AppDispatch>()
  const { showSuccess, showError } = useAlert()

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    // Merchant fields
    businessName: '',
    businessType: '',
  })
  const [selectedRole, setSelectedRole] = useState<UserRole>('consumer')
  const [loading, setLoading] = useState(false)

  const validateForm = (): boolean => {
    if (!formData.firstName.trim()) {
      showError('Erreur', 'Le prenom est requis')
      return false
    }
    if (!formData.lastName.trim()) {
      showError('Erreur', 'Le nom est requis')
      return false
    }
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      showError('Erreur', 'Adresse email invalide')
      return false
    }
    // Merchant validation
    if (selectedRole === 'merchant' && !formData.businessName.trim()) {
      showError('Erreur', 'Le nom de commerce est requis pour les commercants')
      return false
    }
    return true
  }

  const handleSubmit = async () => {
    if (!validateForm()) return

    setLoading(true)
    try {
      const result = await dispatch(
        registerWithFirebase({
          firebase_token: firebaseIdToken, // SECURITY: Token re-verified by backend
          first_name: formData.firstName.trim(),
          last_name: formData.lastName.trim(),
          email: formData.email.trim() || undefined,
          role: selectedRole,
          // Merchant fields (only sent if merchant)
          ...(selectedRole === 'merchant' && {
            business_name: formData.businessName.trim(),
            business_type: formData.businessType.trim() || 'general',
          }),
        })
      )

      if (registerWithFirebase.fulfilled.match(result)) {
        showSuccess('Succes', 'Compte cree avec succes!')
        // Navigation handled by AppNavigator
      } else {
        showError('Erreur', (result.payload as string) || 'Erreur lors de la creation du compte')
      }
    } catch (error: any) {
      showError('Erreur', error.message || 'Une erreur est survenue')
    } finally {
      setLoading(false)
    }
  }

  const RoleButton = ({ role, label, icon }: { role: UserRole; label: string; icon: string }) => (
    <TouchableOpacity
      style={[
        styles.roleButton,
        {
          flex: 1,
          padding: theme.spacing.md,
          borderRadius: theme.radius.md,
          borderWidth: 2,
          borderColor: selectedRole === role ? theme.colors.primary[500] : theme.colors.inputBorder,
          backgroundColor: selectedRole === role ? theme.colors.primary[50] : theme.colors.inputBackground,
        },
      ]}
      onPress={() => setSelectedRole(role)}
    >
      <Typography variant="h3" style={{ textAlign: 'center', marginBottom: theme.spacing.xs }}>
        {icon}
      </Typography>
      <Typography
        variant="body"
        weight={selectedRole === role ? 'semibold' : 'regular'}
        style={{ textAlign: 'center', color: selectedRole === role ? theme.colors.primary[500] : theme.colors.text }}
      >
        {label}
      </Typography>
    </TouchableOpacity>
  )

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
        <View style={[styles.header, { alignItems: 'center', marginBottom: theme.spacing.xl }]}>
          <BrandLogo color={theme.colors.primary[500]} style={{ marginBottom: theme.spacing.sm }} />
          <Typography variant="h2" weight="bold" style={{ marginBottom: theme.spacing.xs }}>
            Completez votre profil
          </Typography>
          <Typography variant="body" color="secondary" style={{ textAlign: 'center' }}>
            Quelques informations pour finaliser votre inscription
          </Typography>
        </View>

        {/* Form */}
        <Card variant="elevated" style={{ padding: theme.spacing.lg, marginBottom: theme.spacing.lg }}>
          {/* First Name */}
          <View style={{ marginBottom: theme.spacing.md }}>
            <Typography variant="body" weight="semibold" style={{ marginBottom: theme.spacing.sm }}>
              Prenom *
            </Typography>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: theme.colors.inputBackground,
                  paddingHorizontal: theme.spacing.md,
                  paddingVertical: theme.spacing.sm,
                  borderRadius: theme.radius.md,
                  borderWidth: 1,
                  borderColor: theme.colors.inputBorder,
                  fontSize: 16,
                  color: theme.colors.text,
                },
              ]}
              placeholder="Votre prenom"
              placeholderTextColor={theme.colors.textSecondary}
              value={formData.firstName}
              onChangeText={(text) => setFormData({ ...formData, firstName: text })}
              autoCapitalize="words"
              testID={TEST_IDS.firstNameInput || 'first-name-input'}
            />
          </View>

          {/* Last Name */}
          <View style={{ marginBottom: theme.spacing.md }}>
            <Typography variant="body" weight="semibold" style={{ marginBottom: theme.spacing.sm }}>
              Nom *
            </Typography>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: theme.colors.inputBackground,
                  paddingHorizontal: theme.spacing.md,
                  paddingVertical: theme.spacing.sm,
                  borderRadius: theme.radius.md,
                  borderWidth: 1,
                  borderColor: theme.colors.inputBorder,
                  fontSize: 16,
                  color: theme.colors.text,
                },
              ]}
              placeholder="Votre nom"
              placeholderTextColor={theme.colors.textSecondary}
              value={formData.lastName}
              onChangeText={(text) => setFormData({ ...formData, lastName: text })}
              autoCapitalize="words"
              testID={TEST_IDS.lastNameInput || 'last-name-input'}
            />
          </View>

          {/* Email (Optional) */}
          <View style={{ marginBottom: theme.spacing.lg }}>
            <Typography variant="body" weight="semibold" style={{ marginBottom: theme.spacing.sm }}>
              Email (optionnel)
            </Typography>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: theme.colors.inputBackground,
                  paddingHorizontal: theme.spacing.md,
                  paddingVertical: theme.spacing.sm,
                  borderRadius: theme.radius.md,
                  borderWidth: 1,
                  borderColor: theme.colors.inputBorder,
                  fontSize: 16,
                  color: theme.colors.text,
                },
              ]}
              placeholder="votre@email.com"
              placeholderTextColor={theme.colors.textSecondary}
              value={formData.email}
              onChangeText={(text) => setFormData({ ...formData, email: text })}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              testID={TEST_IDS.emailInput || 'email-input'}
            />
            <Typography variant="caption" color="secondary" style={{ marginTop: theme.spacing.xs }}>
              L'email permet de recuperer votre compte si vous changez de numero
            </Typography>
          </View>

          {/* Role Selection */}
          <View style={{ marginBottom: theme.spacing.lg }}>
            <Typography variant="body" weight="semibold" style={{ marginBottom: theme.spacing.sm }}>
              Je suis un(e)
            </Typography>
            <View style={[styles.roleContainer, { gap: theme.spacing.md }]}>
              <RoleButton role="consumer" label="Consommateur" icon="🛒" />
              <RoleButton role="merchant" label="Commercant" icon="🏪" />
            </View>
          </View>

          {/* Merchant Fields (conditional) */}
          {selectedRole === 'merchant' && (
            <>
              <View style={{ marginBottom: theme.spacing.md }}>
                <Typography variant="body" weight="semibold" style={{ marginBottom: theme.spacing.sm }}>
                  Nom du commerce *
                </Typography>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: theme.colors.inputBackground,
                      paddingHorizontal: theme.spacing.md,
                      paddingVertical: theme.spacing.sm,
                      borderRadius: theme.radius.md,
                      borderWidth: 1,
                      borderColor: theme.colors.inputBorder,
                      fontSize: 16,
                      color: theme.colors.text,
                    },
                  ]}
                  placeholder="Ex: Boulangerie Chez Marie"
                  placeholderTextColor={theme.colors.textSecondary}
                  value={formData.businessName}
                  onChangeText={(text) => setFormData({ ...formData, businessName: text })}
                  autoCapitalize="words"
                />
              </View>

              <View style={{ marginBottom: theme.spacing.lg }}>
                <Typography variant="body" weight="semibold" style={{ marginBottom: theme.spacing.sm }}>
                  Type de commerce
                </Typography>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: theme.colors.inputBackground,
                      paddingHorizontal: theme.spacing.md,
                      paddingVertical: theme.spacing.sm,
                      borderRadius: theme.radius.md,
                      borderWidth: 1,
                      borderColor: theme.colors.inputBorder,
                      fontSize: 16,
                      color: theme.colors.text,
                    },
                  ]}
                  placeholder="Ex: Boulangerie, Restaurant, Epicerie..."
                  placeholderTextColor={theme.colors.textSecondary}
                  value={formData.businessType}
                  onChangeText={(text) => setFormData({ ...formData, businessType: text })}
                  autoCapitalize="words"
                />
              </View>
            </>
          )}

          {/* Submit Button */}
          <Button
            variant="primary"
            size="lg"
            fullWidth
            onPress={handleSubmit}
            disabled={loading}
            loading={loading}
            testID={TEST_IDS.completeProfileButton || 'complete-profile-button'}
          >
            {loading ? 'Creation...' : 'Creer mon compte'}
          </Button>
        </Card>

        {/* Phone number display */}
        <View style={[styles.footer, { alignItems: 'center' }]}>
          <Typography variant="caption" color="secondary">
            Numero verifie: {phoneNumber}
          </Typography>
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
    paddingVertical: 40,
  },
  header: {},
  input: {},
  roleContainer: {
    flexDirection: 'row',
  },
  roleButton: {},
  footer: {},
})

export default CompleteProfileScreen
