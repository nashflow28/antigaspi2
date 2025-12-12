/**
 * StepIndicator - Progress indicator for multi-step processes
 *
 * Visual progress indicator showing:
 * - Current step
 * - Completed steps
 * - Upcoming steps
 * - Step labels
 *
 * Variants: horizontal, vertical
 */

import React from 'react'
import {
  View,
  Text,
  StyleSheet,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useTheme } from '../../theme'

interface Step {
  label: string
  description?: string
  icon?: string
}

interface StepIndicatorProps {
  steps: Step[]
  currentStep: number // 0-indexed
  variant?: 'horizontal' | 'vertical'
  showLabels?: boolean
  showDescriptions?: boolean
  size?: 'sm' | 'md' | 'lg'
}

const SIZE_CONFIG = {
  sm: {
    circleSize: 24,
    iconSize: 12,
    fontSize: 11,
    descFontSize: 10,
    lineWidth: 2,
    gap: 4,
  },
  md: {
    circleSize: 32,
    iconSize: 16,
    fontSize: 13,
    descFontSize: 11,
    lineWidth: 2,
    gap: 8,
  },
  lg: {
    circleSize: 40,
    iconSize: 20,
    fontSize: 14,
    descFontSize: 12,
    lineWidth: 3,
    gap: 12,
  },
}

const StepIndicator: React.FC<StepIndicatorProps> = ({
  steps,
  currentStep,
  variant = 'horizontal',
  showLabels = true,
  showDescriptions = false,
  size = 'md',
}) => {
  const theme = useTheme()
  const config = SIZE_CONFIG[size]

  const getStepStatus = (index: number): 'completed' | 'current' | 'upcoming' => {
    if (index < currentStep) return 'completed'
    if (index === currentStep) return 'current'
    return 'upcoming'
  }

  const getStepColors = (status: 'completed' | 'current' | 'upcoming') => {
    switch (status) {
      case 'completed':
        return {
          circle: theme.colors.success,
          icon: '#FFFFFF',
          text: theme.colors.success,
          line: theme.colors.success,
        }
      case 'current':
        return {
          circle: theme.colors.primary[500],
          icon: '#FFFFFF',
          text: theme.colors.primary[600],
          line: theme.colors.neutral[200],
        }
      case 'upcoming':
        return {
          circle: theme.colors.neutral[200],
          icon: theme.colors.neutral[400],
          text: theme.colors.neutral[400],
          line: theme.colors.neutral[200],
        }
    }
  }

  const renderStep = (step: Step, index: number) => {
    const status = getStepStatus(index)
    const colors = getStepColors(status)
    const isLast = index === steps.length - 1

    const stepContent = (
      <View
        style={[
          styles.stepContent,
          variant === 'horizontal' && styles.stepContentHorizontal,
          variant === 'vertical' && styles.stepContentVertical,
        ]}
      >
        {/* Circle with number or icon */}
        <View
          style={[
            styles.circle,
            {
              width: config.circleSize,
              height: config.circleSize,
              borderRadius: config.circleSize / 2,
              backgroundColor: colors.circle,
            },
          ]}
          accessibilityRole="text"
          accessibilityLabel={`Étape ${index + 1}: ${step.label}, ${status === 'completed' ? 'terminée' : status === 'current' ? 'en cours' : 'à venir'}`}
        >
          {status === 'completed' ? (
            <Ionicons name="checkmark" size={config.iconSize} color={colors.icon} />
          ) : step.icon ? (
            <Ionicons name={step.icon as any} size={config.iconSize} color={colors.icon} />
          ) : (
            <Text style={[styles.stepNumber, { fontSize: config.iconSize, color: colors.icon }]}>
              {index + 1}
            </Text>
          )}
        </View>

        {/* Labels */}
        {(showLabels || showDescriptions) && (
          <View
            style={[
              styles.labels,
              variant === 'horizontal' && styles.labelsHorizontal,
              variant === 'vertical' && styles.labelsVertical,
              { gap: 2 },
            ]}
          >
            {showLabels && (
              <Text
                style={[
                  styles.stepLabel,
                  {
                    fontSize: config.fontSize,
                    color: colors.text,
                    fontWeight: status === 'current' ? '700' : '500',
                  },
                ]}
                numberOfLines={variant === 'horizontal' ? 2 : 1}
              >
                {step.label}
              </Text>
            )}
            {showDescriptions && step.description && (
              <Text
                style={[
                  styles.stepDescription,
                  {
                    fontSize: config.descFontSize,
                    color: theme.colors.textSecondary,
                  },
                ]}
                numberOfLines={2}
              >
                {step.description}
              </Text>
            )}
          </View>
        )}
      </View>
    )

    const connector = !isLast && (
      <View
        style={[
          styles.connector,
          variant === 'horizontal' && [
            styles.connectorHorizontal,
            { height: config.lineWidth },
          ],
          variant === 'vertical' && [
            styles.connectorVertical,
            {
              width: config.lineWidth,
              marginLeft: config.circleSize / 2 - config.lineWidth / 2,
            },
          ],
          { backgroundColor: colors.line },
        ]}
      />
    )

    if (variant === 'horizontal') {
      return (
        <View key={index} style={[styles.stepWrapper, styles.stepWrapperHorizontal]}>
          {stepContent}
          {connector}
        </View>
      )
    }

    return (
      <View key={index} style={[styles.stepWrapper, styles.stepWrapperVertical]}>
        <View style={styles.verticalRow}>
          {stepContent}
        </View>
        {connector}
      </View>
    )
  }

  return (
    <View
      style={[
        styles.container,
        variant === 'horizontal' && styles.containerHorizontal,
        variant === 'vertical' && styles.containerVertical,
      ]}
      accessibilityRole="progressbar"
      accessibilityValue={{
        min: 0,
        max: steps.length - 1,
        now: currentStep,
        text: `Étape ${currentStep + 1} sur ${steps.length}`,
      }}
    >
      {steps.map((step, index) => renderStep(step, index))}
    </View>
  )
}

/**
 * Compact horizontal progress bar (alternative to steps)
 */
export const ProgressBar: React.FC<{
  progress: number // 0-100
  showPercentage?: boolean
  height?: number
  color?: string
}> = ({
  progress,
  showPercentage = false,
  height = 8,
  color,
}) => {
  const theme = useTheme()
  const barColor = color || theme.colors.primary[500]
  const clampedProgress = Math.min(100, Math.max(0, progress))

  return (
    <View style={styles.progressBarContainer}>
      <View
        style={[
          styles.progressBarTrack,
          {
            height,
            backgroundColor: theme.colors.neutral[200],
          },
        ]}
      >
        <View
          style={[
            styles.progressBarFill,
            {
              width: `${clampedProgress}%`,
              backgroundColor: barColor,
            },
          ]}
        />
      </View>
      {showPercentage && (
        <Text style={[styles.progressText, { color: theme.colors.textSecondary }]}>
          {Math.round(clampedProgress)}%
        </Text>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {},
  containerHorizontal: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  containerVertical: {
    flexDirection: 'column',
  },
  stepWrapper: {},
  stepWrapperHorizontal: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  stepWrapperVertical: {
    flexDirection: 'column',
  },
  stepContent: {
    alignItems: 'center',
  },
  stepContentHorizontal: {
    alignItems: 'center',
  },
  stepContentVertical: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  verticalRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  circle: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepNumber: {
    fontWeight: '700',
  },
  labels: {},
  labelsHorizontal: {
    marginTop: 8,
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  labelsVertical: {
    marginLeft: 12,
    flex: 1,
  },
  stepLabel: {
    textAlign: 'center',
  },
  stepDescription: {
    textAlign: 'center',
  },
  connector: {},
  connectorHorizontal: {
    flex: 1,
    marginTop: 16,
    marginHorizontal: 8,
  },
  connectorVertical: {
    height: 24,
    marginVertical: 8,
  },
  // Progress bar styles
  progressBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  progressBarTrack: {
    flex: 1,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '600',
    minWidth: 36,
    textAlign: 'right',
  },
})

export default StepIndicator
