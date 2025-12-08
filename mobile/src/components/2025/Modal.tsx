/**
 * Modal 2025 - Composant modal avec Design System 2025
 * Variantes: center, bottom, fullscreen
 * Support: animations, backdrop, header, footer
 */

import React, { useEffect, useRef, useMemo } from 'react'
import {
  Modal as RNModal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  ViewStyle,
  Dimensions,
  ScrollView,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useTheme } from '../../theme'

export type ModalVariant = 'center' | 'bottom' | 'fullscreen'

export interface ModalProps {
  // Visibility
  visible: boolean
  onClose: () => void

  // Content
  children: React.ReactNode
  title?: string
  header?: React.ReactNode
  footer?: React.ReactNode

  // Appearance
  variant?: ModalVariant
  maxHeight?: number | string
  scrollable?: boolean

  // Behavior
  dismissable?: boolean
  showCloseButton?: boolean

  // Testing
  testID?: string

  // Style overrides
  style?: ViewStyle
  contentStyle?: ViewStyle
  headerStyle?: ViewStyle
  footerStyle?: ViewStyle
}

const { height: SCREEN_HEIGHT } = Dimensions.get('window')

export const Modal: React.FC<ModalProps> = ({
  visible,
  onClose,
  children,
  title,
  header,
  footer,
  variant = 'bottom',
  maxHeight = '80%',
  scrollable = true,
  dismissable = true,
  showCloseButton = true,
  testID,
  style,
  contentStyle,
  headerStyle,
  footerStyle,
}) => {
  const theme = useTheme()
  const slideAnim = useRef(new Animated.Value(0)).current
  const fadeAnim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: theme.animations.duration.fast,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 1,
          tension: 65,
          friction: 11,
          useNativeDriver: true,
        }),
      ]).start()
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: theme.animations.duration.fast,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: theme.animations.duration.fast,
          useNativeDriver: true,
        }),
      ]).start()
    }
  }, [visible, fadeAnim, slideAnim, theme.animations.duration.fast])

  const getModalStyles = useMemo((): ViewStyle => {
    switch (variant) {
      case 'center':
        return {
          justifyContent: 'center',
          alignItems: 'center',
          padding: theme.spacing.lg,
        }

      case 'bottom':
        return {
          justifyContent: 'flex-end',
        }

      case 'fullscreen':
        return {
          justifyContent: 'flex-start',
        }

      default:
        return {}
    }
  }, [variant, theme.spacing.lg])

  const getContentStyles = useMemo((): ViewStyle => {
    const baseStyle: ViewStyle = {
      backgroundColor: theme.colors.background,
      overflow: 'hidden',
    }

    switch (variant) {
      case 'center':
        // Pour les modals center, ne pas forcer maxHeight si scrollable=false
        // Cela permet au contenu de déterminer la taille du modal
        const centerMaxHeight = scrollable
          ? (typeof maxHeight === 'number' ? maxHeight : SCREEN_HEIGHT * 0.8)
          : (typeof maxHeight === 'number' ? maxHeight : undefined)
        return {
          ...baseStyle,
          borderRadius: theme.radius['2xl'],
          maxWidth: '90%',
          ...(centerMaxHeight !== undefined && { maxHeight: centerMaxHeight }),
          ...theme.shadows.xl,
        }

      case 'bottom':
        return {
          ...baseStyle,
          borderTopLeftRadius: theme.radius['2xl'],
          borderTopRightRadius: theme.radius['2xl'],
          maxHeight: typeof maxHeight === 'number' ? maxHeight : SCREEN_HEIGHT * 0.8,
          width: '100%',
        }

      case 'fullscreen':
        return {
          ...baseStyle,
          width: '100%',
          height: '100%',
        }

      default:
        return baseStyle
    }
  }, [variant, theme, maxHeight, scrollable])

  const overlayStyle: ViewStyle = useMemo(() => ({
    flex: 1,
    backgroundColor: theme.colors.overlay,
    ...getModalStyles,
  }), [theme.colors.overlay, getModalStyles])

  const contentContainerStyle: ViewStyle = useMemo(() => ({
    ...getContentStyles,
    ...style,
  }), [getContentStyles, style])

  const headerContainerStyle: ViewStyle = useMemo(() => ({
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.divider,
    ...headerStyle,
  }), [theme.spacing.lg, theme.colors.divider, headerStyle])

  const footerContainerStyle: ViewStyle = useMemo(() => ({
    padding: theme.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: theme.colors.divider,
    ...footerStyle,
  }), [theme.spacing.lg, theme.colors.divider, footerStyle])

  const contentPadding: ViewStyle = useMemo(() => ({
    padding: theme.spacing.lg,
    ...contentStyle,
  }), [theme.spacing.lg, contentStyle])

  // Animation transforms
  const getAnimationTransform = (): object => {
    switch (variant) {
      case 'bottom':
        return {
          transform: [
            {
              translateY: slideAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [SCREEN_HEIGHT, 0],
              }),
            },
          ],
        }

      case 'center':
        return {
          transform: [
            {
              scale: slideAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0.8, 1],
              }),
            },
          ],
        }

      case 'fullscreen':
        return {
          opacity: slideAnim,
        }

      default:
        return {}
    }
  }

  const renderHeader = () => {
    if (header) {
      return <View style={headerContainerStyle}>{header}</View>
    }

    if (title || showCloseButton) {
      return (
        <View style={headerContainerStyle}>
          {title && (
            <Text
              style={{
                ...theme.getTypography('h3'),
                color: theme.colors.text,
                flex: 1,
              }}
            >
              {title}
            </Text>
          )}
          {showCloseButton && (
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="close" size={24} color={theme.colors.text} />
            </TouchableOpacity>
          )}
        </View>
      )
    }

    return null
  }

  const renderContent = () => {
    if (scrollable) {
      return (
        <ScrollView
          style={contentPadding}
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      )
    }

    return <View style={contentPadding}>{children}</View>
  }

  return (
    <RNModal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={dismissable ? onClose : undefined}
      accessibilityViewIsModal={true}
      accessible={true}
    >
      <Animated.View style={[overlayStyle, { opacity: fadeAnim }]}>
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={dismissable ? onClose : undefined}
        />
        <Animated.View
          style={[contentContainerStyle, getAnimationTransform()]}
          testID={testID}
        >
          {renderHeader()}
          {renderContent()}
          {footer && <View style={footerContainerStyle}>{footer}</View>}
        </Animated.View>
      </Animated.View>
    </RNModal>
  )
}

const styles = StyleSheet.create({
  closeButton: {
    padding: 4,
  },
})

export default Modal
