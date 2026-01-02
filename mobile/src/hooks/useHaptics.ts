import * as Haptics from 'expo-haptics'
import { Platform } from 'react-native'

/**
 * Hook for haptic feedback on critical interactions
 * Provides consistent haptic patterns across the app
 */
export function useHaptics() {
  const isSupported = Platform.OS === 'ios' || Platform.OS === 'android'

  /**
   * Light haptic for button taps
   */
  const lightTap = async () => {
    if (!isSupported) return
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    } catch {
      // Silently fail on unsupported devices
    }
  }

  /**
   * Medium haptic for important actions (add to cart, toggle favorite)
   */
  const mediumTap = async () => {
    if (!isSupported) return
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    } catch {
      // Silently fail
    }
  }

  /**
   * Heavy haptic for critical actions (confirm payment, complete order)
   */
  const heavyTap = async () => {
    if (!isSupported) return
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy)
    } catch {
      // Silently fail
    }
  }

  /**
   * Success haptic pattern (double light tap)
   */
  const success = async () => {
    if (!isSupported) return
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    } catch {
      // Silently fail
    }
  }

  /**
   * Warning haptic for warnings
   */
  const warning = async () => {
    if (!isSupported) return
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)
    } catch {
      // Silently fail
    }
  }

  /**
   * Error haptic for errors
   */
  const error = async () => {
    if (!isSupported) return
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
    } catch {
      // Silently fail
    }
  }

  /**
   * Selection haptic for picker/selection changes
   */
  const selection = async () => {
    if (!isSupported) return
    try {
      await Haptics.selectionAsync()
    } catch {
      // Silently fail
    }
  }

  return {
    lightTap,
    mediumTap,
    heavyTap,
    success,
    warning,
    error,
    selection,
  }
}

export default useHaptics
