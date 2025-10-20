/**
 * Toast Component - Design System 2025
 * Auto-dismissing notification toast with multiple variants
 */
import React, { useEffect, useRef } from 'react'
import { View, Text, StyleSheet, Animated, TouchableOpacity } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useTheme } from '../../theme'

export type ToastVariant = 'success' | 'error' | 'warning' | 'info'

export interface ToastProps {
  message: string
  variant?: ToastVariant
  duration?: number // Duration in milliseconds (default: 3000ms)
  onDismiss?: () => void
  visible: boolean
}

const Toast: React.FC<ToastProps> = ({
  message,
  variant = 'info',
  duration = 3000,
  onDismiss,
  visible,
}) => {
  const theme = useTheme()
  const styles = createStyles(theme)
  const fadeAnim = useRef(new Animated.Value(0)).current
  const slideAnim = useRef(new Animated.Value(-100)).current

  useEffect(() => {
    if (visible) {
      // Animate in
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
      ]).start()

      // Auto-dismiss after duration
      const timer = setTimeout(() => {
        handleDismiss()
      }, duration)

      return () => clearTimeout(timer)
    } else {
      // Animate out
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: -100,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start()
    }
  }, [visible])

  const handleDismiss = () => {
    // Animate out first
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: -100,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onDismiss?.()
    })
  }

  if (!visible) return null

  const getIconName = (): keyof typeof Ionicons.glyphMap => {
    switch (variant) {
      case 'success':
        return 'checkmark-circle'
      case 'error':
        return 'close-circle'
      case 'warning':
        return 'warning'
      case 'info':
      default:
        return 'information-circle'
    }
  }

  const getBackgroundColor = () => {
    switch (variant) {
      case 'success':
        return theme.colors.semantic.success
      case 'error':
        return theme.colors.semantic.error
      case 'warning':
        return theme.colors.semantic.warning
      case 'info':
      default:
        return theme.colors.semantic.info
    }
  }

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: getBackgroundColor(),
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <TouchableOpacity
        style={styles.content}
        activeOpacity={0.9}
        onPress={handleDismiss}
      >
        <Ionicons
          name={getIconName()}
          size={24}
          color={theme.colors.surface.light}
          style={styles.icon}
        />
        <Text style={styles.message}>{message}</Text>
        <TouchableOpacity onPress={handleDismiss} style={styles.closeButton}>
          <Ionicons name="close" size={20} color={theme.colors.surface.light} />
        </TouchableOpacity>
      </TouchableOpacity>
    </Animated.View>
  )
}

const createStyles = (theme: ReturnType<typeof useTheme>) =>
  StyleSheet.create({
    container: {
      position: 'absolute',
      top: 50,
      left: theme.spacing.md,
      right: theme.spacing.md,
      borderRadius: theme.radius.lg,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 8,
      zIndex: 9999,
    },
    content: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: theme.spacing.md,
      paddingHorizontal: theme.spacing.lg,
    },
    icon: {
      marginRight: theme.spacing.sm,
    },
    message: {
      flex: 1,
      color: theme.colors.surface.light,
      fontSize: 14,
      fontWeight: '600',
      lineHeight: 20,
    },
    closeButton: {
      marginLeft: theme.spacing.sm,
      padding: theme.spacing.xs,
    },
  })

export default Toast
