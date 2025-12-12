/**
 * QuantityStepper - Intuitive quantity selector with +/- buttons
 *
 * Replaces basic TextInput for quantity selection with
 * easy-to-use increment/decrement buttons.
 *
 * Features:
 * - Large touch targets (44x44 minimum)
 * - Visual feedback on press
 * - Haptic feedback on change
 * - Min/max boundaries
 * - Stock indicator
 * - Disabled state
 */

import React, { useCallback } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { useTheme } from '../../theme'

type StepperSize = 'sm' | 'md' | 'lg'

interface QuantityStepperProps {
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  step?: number
  disabled?: boolean
  size?: StepperSize
  showStock?: boolean
  stockAvailable?: number
  label?: string
}

const SIZE_CONFIG = {
  sm: {
    buttonSize: 32,
    iconSize: 16,
    fontSize: 14,
    valueFontSize: 16,
    valueWidth: 40,
    gap: 4,
  },
  md: {
    buttonSize: 44,
    iconSize: 20,
    fontSize: 14,
    valueFontSize: 20,
    valueWidth: 56,
    gap: 8,
  },
  lg: {
    buttonSize: 52,
    iconSize: 24,
    fontSize: 16,
    valueFontSize: 24,
    valueWidth: 72,
    gap: 12,
  },
}

const QuantityStepper: React.FC<QuantityStepperProps> = ({
  value,
  onChange,
  min = 1,
  max = 99,
  step = 1,
  disabled = false,
  size = 'md',
  showStock = false,
  stockAvailable,
  label,
}) => {
  const theme = useTheme()
  const config = SIZE_CONFIG[size]

  const effectiveMax = stockAvailable !== undefined ? Math.min(max, stockAvailable) : max
  const canDecrement = value > min && !disabled
  const canIncrement = value < effectiveMax && !disabled

  const triggerHaptic = useCallback(() => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    }
  }, [])

  const handleDecrement = useCallback(() => {
    if (canDecrement) {
      triggerHaptic()
      onChange(Math.max(min, value - step))
    }
  }, [canDecrement, value, min, step, onChange, triggerHaptic])

  const handleIncrement = useCallback(() => {
    if (canIncrement) {
      triggerHaptic()
      onChange(Math.min(effectiveMax, value + step))
    }
  }, [canIncrement, value, effectiveMax, step, onChange, triggerHaptic])

  const buttonStyle = (enabled: boolean) => [
    styles.button,
    {
      width: config.buttonSize,
      height: config.buttonSize,
      borderRadius: config.buttonSize / 2,
      backgroundColor: enabled
        ? theme.isDark
          ? theme.colors.primary[600]
          : theme.colors.primary[500]
        : theme.isDark
          ? '#2A3441'
          : '#E5E7EB',
    },
  ]

  const iconColor = (enabled: boolean) =>
    enabled
      ? '#FFFFFF'
      : theme.isDark
        ? '#6B7280'
        : '#9CA3AF'

  return (
    <View style={styles.container}>
      {label && (
        <Text
          style={[
            styles.label,
            { fontSize: config.fontSize, color: theme.colors.textSecondary },
          ]}
        >
          {label}
        </Text>
      )}

      <View style={[styles.stepperRow, { gap: config.gap }]}>
        {/* Decrement button */}
        <TouchableOpacity
          style={buttonStyle(canDecrement)}
          onPress={handleDecrement}
          disabled={!canDecrement}
          activeOpacity={0.7}
          accessibilityLabel="Diminuer la quantité"
          accessibilityRole="button"
          accessibilityState={{ disabled: !canDecrement }}
        >
          <Ionicons
            name="remove"
            size={config.iconSize}
            color={iconColor(canDecrement)}
          />
        </TouchableOpacity>

        {/* Value display */}
        <View
          style={[
            styles.valueContainer,
            {
              width: config.valueWidth,
              height: config.buttonSize,
              backgroundColor: theme.isDark ? '#1F2937' : '#F9FAFB',
              borderColor: theme.colors.border,
            },
          ]}
        >
          <Text
            style={[
              styles.value,
              {
                fontSize: config.valueFontSize,
                color: disabled ? theme.colors.textSecondary : theme.colors.text,
              },
            ]}
          >
            {value}
          </Text>
        </View>

        {/* Increment button */}
        <TouchableOpacity
          style={buttonStyle(canIncrement)}
          onPress={handleIncrement}
          disabled={!canIncrement}
          activeOpacity={0.7}
          accessibilityLabel="Augmenter la quantité"
          accessibilityRole="button"
          accessibilityState={{ disabled: !canIncrement }}
        >
          <Ionicons
            name="add"
            size={config.iconSize}
            color={iconColor(canIncrement)}
          />
        </TouchableOpacity>
      </View>

      {/* Stock indicator */}
      {showStock && stockAvailable !== undefined && (
        <Text
          style={[
            styles.stockText,
            {
              fontSize: config.fontSize - 2,
              color:
                stockAvailable <= 3
                  ? theme.colors.error
                  : stockAvailable <= 10
                    ? theme.colors.warning
                    : theme.colors.textSecondary,
            },
          ]}
        >
          {stockAvailable === 0
            ? 'Rupture de stock'
            : stockAvailable <= 3
              ? `Plus que ${stockAvailable} en stock !`
              : `${stockAvailable} disponibles`}
        </Text>
      )}
    </View>
  )
}

/**
 * Compact inline version for cart items
 */
export const QuantityStepperInline: React.FC<{
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  disabled?: boolean
}> = ({ value, onChange, min = 1, max = 99, disabled = false }) => {
  const theme = useTheme()

  const canDecrement = value > min && !disabled
  const canIncrement = value < max && !disabled

  const triggerHaptic = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    }
  }

  return (
    <View style={styles.inlineContainer}>
      <TouchableOpacity
        style={[
          styles.inlineButton,
          {
            backgroundColor: canDecrement
              ? theme.isDark ? '#374151' : '#E5E7EB'
              : theme.isDark ? '#1F2937' : '#F3F4F6',
          },
        ]}
        onPress={() => {
          if (canDecrement) {
            triggerHaptic()
            onChange(value - 1)
          }
        }}
        disabled={!canDecrement}
        activeOpacity={0.7}
      >
        <Ionicons
          name="remove"
          size={16}
          color={canDecrement ? theme.colors.text : theme.colors.textSecondary}
        />
      </TouchableOpacity>

      <Text style={[styles.inlineValue, { color: theme.colors.text }]}>
        {value}
      </Text>

      <TouchableOpacity
        style={[
          styles.inlineButton,
          {
            backgroundColor: canIncrement
              ? theme.isDark ? '#374151' : '#E5E7EB'
              : theme.isDark ? '#1F2937' : '#F3F4F6',
          },
        ]}
        onPress={() => {
          if (canIncrement) {
            triggerHaptic()
            onChange(value + 1)
          }
        }}
        disabled={!canIncrement}
        activeOpacity={0.7}
      >
        <Ionicons
          name="add"
          size={16}
          color={canIncrement ? theme.colors.text : theme.colors.textSecondary}
        />
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  label: {
    fontWeight: '500',
    marginBottom: 8,
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  button: {
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  valueContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
  },
  value: {
    fontWeight: '600',
  },
  stockText: {
    marginTop: 8,
    fontWeight: '500',
  },
  // Inline styles
  inlineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  inlineButton: {
    width: 28,
    height: 28,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inlineValue: {
    fontSize: 16,
    fontWeight: '600',
    minWidth: 24,
    textAlign: 'center',
  },
})

export default QuantityStepper
