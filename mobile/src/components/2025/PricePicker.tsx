/**
 * PricePicker - XOF Currency input with formatting
 *
 * Specialized input for XOF (Franc CFA) currency with:
 * - Automatic thousand separator formatting
 * - Currency suffix display
 * - Discount percentage calculator
 * - Min/max validation
 * - Haptic feedback on quick actions
 */

import React, { useState, useCallback, useEffect, useRef } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { useTheme } from '../../theme'

interface PricePickerProps {
  value: number
  onChange: (value: number) => void
  label?: string
  placeholder?: string
  disabled?: boolean
  error?: string
  min?: number
  max?: number
  originalPrice?: number // For discount calculation
  showDiscount?: boolean
  quickAmounts?: number[] // Quick selection buttons
  currency?: string
}

const formatXOF = (amount: number): string => {
  return amount.toLocaleString('fr-FR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })
}

const parseXOF = (text: string): number => {
  // Remove spaces and non-numeric characters except for the last digit group
  const cleaned = text.replace(/[^\d]/g, '')
  return parseInt(cleaned) || 0
}

const calculateDiscount = (original: number, discounted: number): number => {
  if (original <= 0 || discounted >= original) return 0
  return Math.round(((original - discounted) / original) * 100)
}

const PricePicker: React.FC<PricePickerProps> = ({
  value,
  onChange,
  label,
  placeholder = '0',
  disabled = false,
  error,
  min = 0,
  max,
  originalPrice,
  showDiscount = true,
  quickAmounts = [500, 1000, 2500, 5000],
  currency = 'XOF',
}) => {
  const theme = useTheme()
  const [inputValue, setInputValue] = useState(value > 0 ? formatXOF(value) : '')
  const [isFocused, setIsFocused] = useState(false)
  // FIX CRITICAL: Track internal changes to avoid race condition
  const isInternalChange = useRef(false)
  const lastValueRef = useRef(value)

  // Sync input when value changes externally
  useEffect(() => {
    // Only sync if value changed externally and input is not focused
    if (!isFocused && !isInternalChange.current && value !== lastValueRef.current) {
      setInputValue(value > 0 ? formatXOF(value) : '')
    }
    lastValueRef.current = value
    isInternalChange.current = false
  }, [value, isFocused])

  const triggerHaptic = useCallback(() => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    }
  }, [])

  const handleChangeText = (text: string) => {
    // Only allow digits and spaces
    const cleaned = text.replace(/[^\d\s]/g, '')
    const numericValue = parseXOF(cleaned)

    // Apply max limit if set
    const boundedValue = max ? Math.min(numericValue, max) : numericValue

    setInputValue(boundedValue > 0 ? formatXOF(boundedValue) : '')
    isInternalChange.current = true // FIX: Mark as internal change
    onChange(boundedValue)
  }

  const handleFocus = () => {
    setIsFocused(true)
  }

  const handleBlur = () => {
    setIsFocused(false)
    // Apply min value on blur
    if (value < min) {
      onChange(min)
      setInputValue(min > 0 ? formatXOF(min) : '')
    }
  }

  const handleQuickAmount = (amount: number) => {
    triggerHaptic()
    const newValue = value + amount
    const boundedValue = max ? Math.min(newValue, max) : newValue
    isInternalChange.current = true // FIX: Mark as internal change
    onChange(boundedValue)
    setInputValue(formatXOF(boundedValue))
  }

  const handleClear = () => {
    triggerHaptic()
    isInternalChange.current = true // FIX: Mark as internal change
    onChange(0)
    setInputValue('')
  }

  const discount = originalPrice && showDiscount
    ? calculateDiscount(originalPrice, value)
    : 0

  const suggestedPrice = originalPrice
    ? Math.round(originalPrice * 0.7) // Suggest 30% off
    : null

  return (
    <View style={styles.container}>
      {label && (
        <Text style={[styles.label, { color: theme.colors.text }]}>
          {label}
        </Text>
      )}

      <View
        style={[
          styles.inputContainer,
          {
            backgroundColor: disabled ? theme.colors.neutral[100] : theme.colors.surface.light,
            borderColor: error
              ? theme.colors.error
              : isFocused
                ? theme.colors.primary[500]
                : theme.colors.border,
          },
        ]}
      >
        <TextInput
          value={inputValue}
          onChangeText={handleChangeText}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          placeholderTextColor={theme.colors.neutral[400]}
          keyboardType="numeric"
          editable={!disabled}
          style={[
            styles.input,
            { color: theme.colors.text },
          ]}
          accessibilityLabel={label || 'Prix'}
          accessibilityHint={`Entrez un montant en ${currency}`}
        />

        <View style={[styles.currencyBadge, { backgroundColor: theme.colors.primary[100] }]}>
          <Text style={[styles.currencyText, { color: theme.colors.primary[700] }]}>
            {currency}
          </Text>
        </View>

        {value > 0 && !disabled && (
          <TouchableOpacity
            style={styles.clearButton}
            onPress={handleClear}
            accessibilityLabel="Effacer"
          >
            <Ionicons name="close-circle" size={20} color={theme.colors.neutral[400]} />
          </TouchableOpacity>
        )}
      </View>

      {/* Discount indicator */}
      {discount > 0 && originalPrice && (
        <View style={styles.discountRow}>
          <View style={[styles.discountBadge, { backgroundColor: theme.colors.error }]}>
            <Ionicons name="pricetag" size={12} color="#FFFFFF" />
            <Text style={styles.discountBadgeText}>-{discount}%</Text>
          </View>
          <Text style={[styles.originalPrice, { color: theme.colors.textSecondary }]}>
            Prix original: {formatXOF(originalPrice)} {currency}
          </Text>
        </View>
      )}

      {/* Suggested price */}
      {suggestedPrice && value === 0 && (
        <TouchableOpacity
          style={[styles.suggestionRow, { backgroundColor: theme.colors.primary[50] }]}
          onPress={() => {
            triggerHaptic()
            onChange(suggestedPrice)
            setInputValue(formatXOF(suggestedPrice))
          }}
        >
          <Ionicons name="bulb-outline" size={16} color={theme.colors.primary[600]} />
          <Text style={[styles.suggestionText, { color: theme.colors.primary[700] }]}>
            Prix suggéré (-30%): {formatXOF(suggestedPrice)} {currency}
          </Text>
        </TouchableOpacity>
      )}

      {/* Quick amount buttons */}
      {!disabled && (
        <View style={styles.quickAmounts}>
          {quickAmounts.map((amount) => (
            <TouchableOpacity
              key={amount}
              style={[
                styles.quickButton,
                {
                  backgroundColor: theme.colors.surface.light,
                  borderColor: theme.colors.border,
                },
              ]}
              onPress={() => handleQuickAmount(amount)}
            >
              <Text style={[styles.quickButtonText, { color: theme.colors.primary[600] }]}>
                +{formatXOF(amount)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {error && (
        <Text style={[styles.errorText, { color: theme.colors.error }]}>
          {error}
        </Text>
      )}

      {/* Min/Max info */}
      {(min > 0 || max) && (
        <Text style={[styles.helperText, { color: theme.colors.textSecondary }]}>
          {min > 0 && `Min: ${formatXOF(min)} ${currency}`}
          {min > 0 && max && ' • '}
          {max && `Max: ${formatXOF(max)} ${currency}`}
        </Text>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 4,
  },
  input: {
    flex: 1,
    fontSize: 24,
    fontWeight: '700',
    paddingVertical: 14,
    paddingHorizontal: 12,
  },
  currencyBadge: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginRight: 8,
  },
  currencyText: {
    fontSize: 14,
    fontWeight: '700',
  },
  clearButton: {
    padding: 8,
  },
  discountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  discountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  discountBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  originalPrice: {
    fontSize: 13,
    textDecorationLine: 'line-through',
  },
  suggestionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
    padding: 10,
    borderRadius: 8,
  },
  suggestionText: {
    fontSize: 13,
    fontWeight: '500',
  },
  quickAmounts: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  quickButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  quickButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
  errorText: {
    fontSize: 12,
    marginTop: 4,
  },
  helperText: {
    fontSize: 12,
    marginTop: 4,
  },
})

export default PricePicker
