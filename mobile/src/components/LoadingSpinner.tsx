/**
 * LoadingSpinner Component
 * Reusable loading indicator with theme support
 */

import React from 'react'
import { View, ActivityIndicator, StyleSheet, Text, ViewStyle } from 'react-native'
import { useTheme } from '../theme'

interface LoadingSpinnerProps {
  size?: 'small' | 'large'
  color?: string
  text?: string
  fullScreen?: boolean
  style?: ViewStyle
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'large',
  color,
  text,
  fullScreen = false,
  style,
}) => {
  const theme = useTheme()
  const spinnerColor = color || theme.colors.primary[500]

  if (fullScreen) {
    return (
      <View style={[styles.fullScreen, { backgroundColor: theme.colors.background }, style]}>
        <ActivityIndicator size={size} color={spinnerColor} />
        {text && (
          <Text style={[styles.text, { color: theme.colors.textSecondary }]}>{text}</Text>
        )}
      </View>
    )
  }

  return (
    <View style={[styles.container, style]}>
      <ActivityIndicator size={size} color={spinnerColor} />
      {text && (
        <Text style={[styles.text, { color: theme.colors.textSecondary }]}>{text}</Text>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    marginTop: 12,
    fontSize: 14,
  },
})

export default LoadingSpinner
