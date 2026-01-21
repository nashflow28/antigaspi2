import React, { useState, useRef } from 'react'
import {
  View,
  StyleSheet,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'
import { Typography, Button, Card } from '../../components/2025'
import { useTheme } from '../../theme'
import { useAlert } from '../../contexts/AlertContext'
import { apiService } from '../../services/api'

const ChangePinScreen: React.FC = () => {
  const theme = useTheme()
  const navigation = useNavigation()
  const { showAlert } = useAlert()

  const [currentPin, setCurrentPin] = useState('')
  const [newPin, setNewPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [loading, setLoading] = useState(false)
  const [showCurrentPin, setShowCurrentPin] = useState(false)
  const [showNewPin, setShowNewPin] = useState(false)
  const [showConfirmPin, setShowConfirmPin] = useState(false)

  const newPinRef = useRef<TextInput>(null)
  const confirmPinRef = useRef<TextInput>(null)

  const validatePin = (pin: string): boolean => {
    return /^[0-9]{4}$/.test(pin)
  }

  const handleChangePin = async () => {
    // Validation
    if (!validatePin(currentPin)) {
      showAlert({
        title: 'Erreur',
        message: 'Le code PIN actuel doit contenir 4 chiffres.',
        type: 'error',
      })
      return
    }

    if (!validatePin(newPin)) {
      showAlert({
        title: 'Erreur',
        message: 'Le nouveau code PIN doit contenir 4 chiffres.',
        type: 'error',
      })
      return
    }

    if (newPin !== confirmPin) {
      showAlert({
        title: 'Erreur',
        message: 'Les codes PIN ne correspondent pas.',
        type: 'error',
      })
      return
    }

    if (currentPin === newPin) {
      showAlert({
        title: 'Erreur',
        message: 'Le nouveau code PIN doit être différent de l\'ancien.',
        type: 'error',
      })
      return
    }

    setLoading(true)
    try {
      const response = await apiService.changePin({
        current_pin: currentPin,
        new_pin: newPin,
        new_pin_confirmation: confirmPin,
      })

      if (response.success) {
        showAlert({
          title: 'Succès',
          message: 'Votre code PIN a été modifié avec succès.',
          type: 'success',
          buttons: [
            {
              text: 'OK',
              onPress: () => navigation.goBack(),
            },
          ],
        })
      } else {
        showAlert({
          title: 'Erreur',
          message: response.message || 'Impossible de modifier le code PIN.',
          type: 'error',
        })
      }
    } catch (error: any) {
      showAlert({
        title: 'Erreur',
        message: error?.response?.data?.message || 'Une erreur est survenue.',
        type: 'error',
      })
    } finally {
      setLoading(false)
    }
  }

  const renderPinInput = (
    label: string,
    value: string,
    onChange: (text: string) => void,
    showPin: boolean,
    toggleShowPin: () => void,
    ref?: React.RefObject<TextInput>,
    onSubmitEditing?: () => void,
    autoFocus?: boolean
  ) => (
    <View style={styles.inputContainer}>
      <Typography variant="body" weight="medium" style={{ marginBottom: theme.spacing.xs }}>
        {label}
      </Typography>
      <View
        style={[
          styles.inputWrapper,
          {
            backgroundColor: theme.isDark ? theme.colors.neutral[800] : theme.colors.neutral[50],
            borderColor: theme.colors.border,
            borderRadius: theme.radius.md,
          },
        ]}
      >
        <TextInput
          ref={ref}
          style={[
            styles.input,
            {
              color: theme.colors.text,
              fontSize: 18,
              letterSpacing: showPin ? 0 : 8,
            },
          ]}
          value={value}
          onChangeText={(text) => {
            const numericText = text.replace(/[^0-9]/g, '').slice(0, 4)
            onChange(numericText)
          }}
          keyboardType="numeric"
          maxLength={4}
          secureTextEntry={!showPin}
          placeholder="••••"
          placeholderTextColor={theme.colors.neutral[400]}
          autoFocus={autoFocus}
          onSubmitEditing={onSubmitEditing}
          returnKeyType={onSubmitEditing ? 'next' : 'done'}
        />
        <Ionicons
          name={showPin ? 'eye-off-outline' : 'eye-outline'}
          size={24}
          color={theme.colors.neutral[400]}
          onPress={toggleShowPin}
          style={styles.eyeIcon}
        />
      </View>
    </View>
  )

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { padding: theme.spacing.lg }]}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={[styles.header, { marginBottom: theme.spacing.xl }]}>
          <Ionicons
            name="arrow-back"
            size={24}
            color={theme.colors.text}
            onPress={() => navigation.goBack()}
            style={{ marginRight: theme.spacing.md }}
          />
          <Typography variant="h2" weight="bold">
            Modifier le code PIN
          </Typography>
        </View>

        {/* Info Card */}
        <Card variant="elevated" style={{ marginBottom: theme.spacing.xl, padding: theme.spacing.lg }}>
          <View style={styles.infoRow}>
            <Ionicons
              name="shield-checkmark-outline"
              size={24}
              color={theme.colors.primary[500]}
              style={{ marginRight: theme.spacing.md }}
            />
            <View style={{ flex: 1 }}>
              <Typography variant="body" weight="medium">
                Sécurisez votre compte
              </Typography>
              <Typography variant="caption" color="secondary">
                Votre code PIN protège l'accès à votre compte et vos paiements.
              </Typography>
            </View>
          </View>
        </Card>

        {/* PIN Inputs */}
        {renderPinInput(
          'Code PIN actuel',
          currentPin,
          setCurrentPin,
          showCurrentPin,
          () => setShowCurrentPin(!showCurrentPin),
          undefined,
          () => newPinRef.current?.focus(),
          true
        )}

        {renderPinInput(
          'Nouveau code PIN',
          newPin,
          setNewPin,
          showNewPin,
          () => setShowNewPin(!showNewPin),
          newPinRef,
          () => confirmPinRef.current?.focus()
        )}

        {renderPinInput(
          'Confirmer le nouveau code PIN',
          confirmPin,
          setConfirmPin,
          showConfirmPin,
          () => setShowConfirmPin(!showConfirmPin),
          confirmPinRef
        )}

        {/* Submit Button */}
        <Button
          variant="primary"
          size="lg"
          fullWidth
          onPress={handleChangePin}
          loading={loading}
          disabled={!currentPin || !newPin || !confirmPin || loading}
          style={{ marginTop: theme.spacing.xl }}
        >
          Modifier le code PIN
        </Button>

        {/* Tips */}
        <View style={[styles.tipsContainer, { marginTop: theme.spacing.xl }]}>
          <Typography variant="caption" color="secondary" style={{ marginBottom: theme.spacing.sm }}>
            Conseils pour un code PIN sécurisé :
          </Typography>
          <View style={styles.tipRow}>
            <Ionicons name="checkmark-circle" size={16} color={theme.colors.semantic.success} />
            <Typography variant="caption" color="secondary" style={{ marginLeft: theme.spacing.xs }}>
              Évitez les suites simples (1234, 0000)
            </Typography>
          </View>
          <View style={styles.tipRow}>
            <Ionicons name="checkmark-circle" size={16} color={theme.colors.semantic.success} />
            <Typography variant="caption" color="secondary" style={{ marginLeft: theme.spacing.xs }}>
              N'utilisez pas votre date de naissance
            </Typography>
          </View>
          <View style={styles.tipRow}>
            <Ionicons name="checkmark-circle" size={16} color={theme.colors.semantic.success} />
            <Typography variant="caption" color="secondary" style={{ marginLeft: theme.spacing.xs }}>
              Ne partagez jamais votre code PIN
            </Typography>
          </View>
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
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    paddingHorizontal: 16,
  },
  input: {
    flex: 1,
    height: 56,
    fontWeight: '600',
  },
  eyeIcon: {
    padding: 8,
  },
  tipsContainer: {
    opacity: 0.8,
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
})

export default ChangePinScreen
