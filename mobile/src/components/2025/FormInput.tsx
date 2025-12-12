/**
 * FormInput - Enhanced input with inline validation
 *
 * Advanced TextInput with:
 * - Real-time validation
 * - Visual feedback (success, error, warning states)
 * - Character counter
 * - Password visibility toggle
 * - Clear button
 * - Helper text
 * - Accessibility support
 */

import React, { useState, useCallback, useEffect, useRef } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Platform,
  TextInputProps,
  KeyboardTypeOptions,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { useTheme } from '../../theme'

type ValidationState = 'idle' | 'valid' | 'invalid' | 'warning'

interface ValidationRule {
  test: (value: string) => boolean
  message: string
  type?: 'error' | 'warning'
}

interface FormInputProps extends Omit<TextInputProps, 'style'> {
  value: string
  onChangeText: (text: string) => void
  label?: string
  placeholder?: string
  helper?: string
  error?: string
  disabled?: boolean
  required?: boolean
  secureTextEntry?: boolean
  keyboardType?: KeyboardTypeOptions
  maxLength?: number
  showCharCount?: boolean
  leftIcon?: string
  rightIcon?: string
  onRightIconPress?: () => void
  validationRules?: ValidationRule[]
  validateOnBlur?: boolean
  validateOnChange?: boolean
  autoValidate?: boolean
  size?: 'sm' | 'md' | 'lg'
  multiline?: boolean
  numberOfLines?: number
}

const SIZE_CONFIG = {
  sm: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    fontSize: 14,
    iconSize: 18,
    labelSize: 12,
  },
  md: {
    paddingVertical: 14,
    paddingHorizontal: 14,
    fontSize: 16,
    iconSize: 20,
    labelSize: 14,
  },
  lg: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    fontSize: 18,
    iconSize: 22,
    labelSize: 16,
  },
}

const FormInput: React.FC<FormInputProps> = ({
  value,
  onChangeText,
  label,
  placeholder,
  helper,
  error: externalError,
  disabled = false,
  required = false,
  secureTextEntry = false,
  keyboardType = 'default',
  maxLength,
  showCharCount = false,
  leftIcon,
  rightIcon,
  onRightIconPress,
  validationRules = [],
  validateOnBlur = true,
  validateOnChange = false,
  autoValidate = false,
  size = 'md',
  multiline = false,
  numberOfLines = 1,
  ...textInputProps
}) => {
  const theme = useTheme()
  const config = SIZE_CONFIG[size]

  const [isFocused, setIsFocused] = useState(false)
  const [isPasswordVisible, setIsPasswordVisible] = useState(false)
  const [validationState, setValidationState] = useState<ValidationState>('idle')
  const [validationMessage, setValidationMessage] = useState('')
  const [hasBeenTouched, setHasBeenTouched] = useState(false)

  const shakeAnim = useRef(new Animated.Value(0)).current

  const triggerHaptic = useCallback((type: 'light' | 'error' = 'light') => {
    if (Platform.OS !== 'web') {
      if (type === 'error') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
      } else {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
      }
    }
  }, [])

  const shakeInput = useCallback(() => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start()
  }, [shakeAnim])

  const validate = useCallback((text: string): ValidationState => {
    // Check required first
    if (required && !text.trim()) {
      setValidationMessage('Ce champ est requis')
      return 'invalid'
    }

    // Check validation rules
    for (const rule of validationRules) {
      if (!rule.test(text)) {
        setValidationMessage(rule.message)
        return rule.type === 'warning' ? 'warning' : 'invalid'
      }
    }

    // All passed
    if (text.trim().length > 0) {
      setValidationMessage('')
      return 'valid'
    }

    setValidationMessage('')
    return 'idle'
  }, [required, validationRules])

  // Auto-validate on mount if has value
  useEffect(() => {
    if (autoValidate && value) {
      setValidationState(validate(value))
    }
  }, [])

  // Handle external error
  useEffect(() => {
    if (externalError) {
      setValidationState('invalid')
      setValidationMessage(externalError)
    }
  }, [externalError])

  // FIX HIGH: Add debounce ref for validation
  const validateDebounceRef = useRef<NodeJS.Timeout | null>(null)

  const handleChangeText = (text: string) => {
    onChangeText(text)

    if (validateOnChange && hasBeenTouched) {
      // FIX HIGH: Debounce validation to avoid UX issues while typing
      if (validateDebounceRef.current) {
        clearTimeout(validateDebounceRef.current)
      }
      validateDebounceRef.current = setTimeout(() => {
        const state = validate(text)
        setValidationState(state)

        if (state === 'invalid') {
          triggerHaptic('error')
        }
      }, 300) // 300ms debounce
    }
  }

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (validateDebounceRef.current) {
        clearTimeout(validateDebounceRef.current)
      }
    }
  }, [])

  const handleFocus = () => {
    setIsFocused(true)
  }

  const handleBlur = () => {
    setIsFocused(false)
    setHasBeenTouched(true)

    if (validateOnBlur) {
      const state = validate(value)
      setValidationState(state)

      if (state === 'invalid') {
        triggerHaptic('error')
        shakeInput()
      }
    }
  }

  const handleClear = () => {
    triggerHaptic()
    onChangeText('')
    setValidationState('idle')
    setValidationMessage('')
  }

  const togglePasswordVisibility = () => {
    triggerHaptic()
    setIsPasswordVisible(!isPasswordVisible)
  }

  const getBorderColor = () => {
    if (validationState === 'invalid' || externalError) {
      return theme.colors.error
    }
    if (validationState === 'warning') {
      return '#F59E0B'
    }
    if (validationState === 'valid') {
      return theme.colors.success
    }
    if (isFocused) {
      return theme.colors.primary[500]
    }
    return theme.colors.border
  }

  const getValidationIcon = () => {
    switch (validationState) {
      case 'valid':
        return { name: 'checkmark-circle', color: theme.colors.success }
      case 'invalid':
        return { name: 'alert-circle', color: theme.colors.error }
      case 'warning':
        return { name: 'warning', color: '#F59E0B' }
      default:
        return null
    }
  }

  const validationIcon = getValidationIcon()
  const displayMessage = externalError || validationMessage
  const isSecure = secureTextEntry && !isPasswordVisible

  return (
    <Animated.View
      style={[
        styles.container,
        { transform: [{ translateX: shakeAnim }] },
      ]}
    >
      {/* Label */}
      {label && (
        <View style={styles.labelRow}>
          <Text style={[styles.label, { fontSize: config.labelSize, color: theme.colors.text }]}>
            {label}
            {required && <Text style={{ color: theme.colors.error }}> *</Text>}
          </Text>
          {showCharCount && maxLength && (
            <Text style={[styles.charCount, { color: theme.colors.textSecondary }]}>
              {value.length}/{maxLength}
            </Text>
          )}
        </View>
      )}

      {/* Input container */}
      <View
        style={[
          styles.inputContainer,
          {
            paddingVertical: config.paddingVertical,
            paddingHorizontal: config.paddingHorizontal,
            backgroundColor: disabled ? theme.colors.neutral[100] : theme.colors.surface.light,
            borderColor: getBorderColor(),
            minHeight: multiline ? numberOfLines * 24 + config.paddingVertical * 2 : undefined,
          },
        ]}
      >
        {/* Left icon */}
        {leftIcon && (
          <Ionicons
            name={leftIcon as any}
            size={config.iconSize}
            color={isFocused ? theme.colors.primary[500] : theme.colors.neutral[400]}
            style={styles.leftIcon}
          />
        )}

        {/* Text input */}
        <TextInput
          value={value}
          onChangeText={handleChangeText}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          placeholderTextColor={theme.colors.neutral[400]}
          editable={!disabled}
          secureTextEntry={isSecure}
          keyboardType={keyboardType}
          maxLength={maxLength}
          multiline={multiline}
          numberOfLines={multiline ? numberOfLines : undefined}
          style={[
            styles.input,
            {
              fontSize: config.fontSize,
              color: disabled ? theme.colors.neutral[400] : theme.colors.text,
              textAlignVertical: multiline ? 'top' : 'center',
            },
          ]}
          accessibilityLabel={label}
          accessibilityState={{
            disabled,
            ...(validationState === 'invalid' && { invalid: true }),
          }}
          {...textInputProps}
        />

        {/* Validation icon */}
        {validationIcon && hasBeenTouched && (
          <Ionicons
            name={validationIcon.name as any}
            size={config.iconSize}
            color={validationIcon.color}
            style={styles.validationIcon}
          />
        )}

        {/* Clear button */}
        {value.length > 0 && !disabled && !secureTextEntry && (
          <TouchableOpacity
            onPress={handleClear}
            style={styles.clearButton}
            accessibilityLabel="Effacer"
          >
            <Ionicons
              name="close-circle"
              size={config.iconSize}
              color={theme.colors.neutral[400]}
            />
          </TouchableOpacity>
        )}

        {/* Password toggle */}
        {secureTextEntry && (
          <TouchableOpacity
            onPress={togglePasswordVisibility}
            style={styles.clearButton}
            accessibilityLabel={isPasswordVisible ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
          >
            <Ionicons
              name={isPasswordVisible ? 'eye-off' : 'eye'}
              size={config.iconSize}
              color={theme.colors.neutral[400]}
            />
          </TouchableOpacity>
        )}

        {/* Right icon (custom) */}
        {rightIcon && !secureTextEntry && (
          <TouchableOpacity
            onPress={onRightIconPress}
            disabled={!onRightIconPress}
            style={styles.rightIcon}
          >
            <Ionicons
              name={rightIcon as any}
              size={config.iconSize}
              color={theme.colors.neutral[400]}
            />
          </TouchableOpacity>
        )}
      </View>

      {/* Helper / Error text */}
      {(displayMessage || helper) && (
        <View style={styles.helperRow}>
          {validationState === 'invalid' || validationState === 'warning' ? (
            <View style={styles.messageRow}>
              <Ionicons
                name={validationState === 'invalid' ? 'alert-circle' : 'warning'}
                size={14}
                color={validationState === 'invalid' ? theme.colors.error : '#F59E0B'}
              />
              <Text
                style={[
                  styles.errorText,
                  { color: validationState === 'invalid' ? theme.colors.error : '#F59E0B' },
                ]}
              >
                {displayMessage}
              </Text>
            </View>
          ) : helper ? (
            <Text style={[styles.helperText, { color: theme.colors.textSecondary }]}>
              {helper}
            </Text>
          ) : null}
        </View>
      )}
    </Animated.View>
  )
}

/**
 * Preset validation rules
 */
export const ValidationRules = {
  email: {
    test: (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
    message: 'Adresse email invalide',
  },
  phone: {
    test: (value: string) => /^(\+228)?[0-9]{8,}$/.test(value.replace(/\s/g, '')),
    message: 'Numéro de téléphone invalide',
  },
  minLength: (min: number) => ({
    test: (value: string) => value.length >= min,
    message: `Minimum ${min} caractères requis`,
  }),
  maxLength: (max: number) => ({
    test: (value: string) => value.length <= max,
    message: `Maximum ${max} caractères autorisés`,
  }),
  password: {
    test: (value: string) => value.length >= 8,
    message: 'Le mot de passe doit contenir au moins 8 caractères',
  },
  passwordStrength: {
    test: (value: string) => /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(value),
    message: 'Inclure majuscule, minuscule et chiffre',
    type: 'warning' as const,
  },
  numeric: {
    test: (value: string) => /^\d+$/.test(value),
    message: 'Uniquement des chiffres',
  },
  alphanumeric: {
    test: (value: string) => /^[a-zA-Z0-9]+$/.test(value),
    message: 'Uniquement lettres et chiffres',
  },
  noSpecialChars: {
    test: (value: string) => /^[a-zA-Z0-9\s]+$/.test(value),
    message: 'Les caractères spéciaux ne sont pas autorisés',
  },
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontWeight: '600',
  },
  charCount: {
    fontSize: 12,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1.5,
  },
  leftIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    paddingVertical: 0,
  },
  validationIcon: {
    marginLeft: 8,
  },
  clearButton: {
    marginLeft: 8,
    padding: 2,
  },
  rightIcon: {
    marginLeft: 8,
  },
  helperRow: {
    marginTop: 4,
    minHeight: 18,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  helperText: {
    fontSize: 12,
  },
  errorText: {
    fontSize: 12,
  },
})

export default FormInput
