/**
 * AlertModal - Composant d'alerte stylisé remplaçant Alert.alert natif
 * Types: success, error, warning, info
 * Design cohérent avec le système 2025
 */

import React from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Animated,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useTheme } from '../theme'

export type AlertType = 'success' | 'error' | 'warning' | 'info'

export interface AlertButton {
  text: string
  onPress?: () => void
  style?: 'default' | 'cancel' | 'destructive'
}

export interface AlertModalProps {
  visible: boolean
  onClose: () => void
  title: string
  message?: string
  type?: AlertType
  buttons?: AlertButton[]
}

const AlertModal: React.FC<AlertModalProps> = ({
  visible,
  onClose,
  title,
  message,
  type = 'info',
  buttons = [{ text: 'OK', onPress: onClose }],
}) => {
  const theme = useTheme()
  const fadeAnim = React.useRef(new Animated.Value(0)).current
  const scaleAnim = React.useRef(new Animated.Value(0.8)).current

  React.useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start()
    } else {
      fadeAnim.setValue(0)
      scaleAnim.setValue(0.8)
    }
  }, [visible])

  const getIconConfig = () => {
    switch (type) {
      case 'success':
        return {
          name: 'checkmark-circle' as const,
          color: theme.colors.semantic.success,
          bgColor: theme.withOpacity(theme.colors.semantic.success, 0.15),
        }
      case 'error':
        return {
          name: 'close-circle' as const,
          color: theme.colors.semantic.error,
          bgColor: theme.withOpacity(theme.colors.semantic.error, 0.15),
        }
      case 'warning':
        return {
          name: 'warning' as const,
          color: theme.colors.semantic.warning,
          bgColor: theme.withOpacity(theme.colors.semantic.warning, 0.15),
        }
      case 'info':
      default:
        return {
          name: 'information-circle' as const,
          color: theme.colors.primary[500],
          bgColor: theme.withOpacity(theme.colors.primary[500], 0.15),
        }
    }
  }

  const iconConfig = getIconConfig()

  const getButtonStyle = (buttonStyle?: string) => {
    switch (buttonStyle) {
      case 'destructive':
        return {
          backgroundColor: theme.colors.semantic.error,
          textColor: '#FFFFFF',
        }
      case 'cancel':
        return {
          // En mode sombre, utiliser un fond plus foncé avec texte clair
          // En mode clair, utiliser un fond gris clair avec texte foncé
          backgroundColor: theme.isDark ? theme.colors.neutral[700] : theme.colors.neutral[200],
          textColor: theme.isDark ? theme.colors.neutral[100] : theme.colors.neutral[700],
        }
      default:
        return {
          backgroundColor: theme.colors.primary[500],
          textColor: '#FFFFFF',
        }
    }
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      accessibilityViewIsModal={true}
    >
      <Animated.View
        style={[
          styles.overlay,
          {
            backgroundColor: theme.colors.overlay,
            opacity: fadeAnim,
          },
        ]}
      >
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={onClose}
        />
        <Animated.View
          style={[
            styles.container,
            {
              backgroundColor: theme.colors.background,
              transform: [{ scale: scaleAnim }],
              ...theme.shadows.xl,
            },
          ]}
        >
          {/* Icon */}
          <View
            style={[
              styles.iconContainer,
              { backgroundColor: iconConfig.bgColor },
            ]}
          >
            <Ionicons
              name={iconConfig.name}
              size={40}
              color={iconConfig.color}
            />
          </View>

          {/* Title */}
          <Text
            style={[
              styles.title,
              {
                color: theme.colors.text,
                ...theme.getTypography('h3'),
              },
            ]}
          >
            {title}
          </Text>

          {/* Message */}
          {message && (
            <Text
              style={[
                styles.message,
                {
                  color: theme.colors.textSecondary,
                  ...theme.getTypography('body'),
                },
              ]}
            >
              {message}
            </Text>
          )}

          {/* Buttons */}
          <View style={styles.buttonsContainer}>
            {buttons.map((button, index) => {
              const btnStyle = getButtonStyle(button.style)
              return (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.button,
                    {
                      backgroundColor: btnStyle.backgroundColor,
                      flex: buttons.length > 1 ? 1 : undefined,
                      marginLeft: index > 0 ? 12 : 0,
                    },
                  ]}
                  onPress={() => {
                    button.onPress?.()
                    onClose()
                  }}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.buttonText,
                      {
                        color: btnStyle.textColor,
                        fontSize: 14,
                        fontWeight: '600',
                      },
                    ]}
                    numberOfLines={1}
                  >
                    {button.text}
                  </Text>
                </TouchableOpacity>
              )
            })}
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  container: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
  },
  iconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    textAlign: 'center',
    marginBottom: 8,
    fontWeight: '600',
  },
  message: {
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  buttonsContainer: {
    flexDirection: 'row',
    width: '100%',
  },
  button: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    minWidth: 110,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontWeight: '600',
  },
})

export default AlertModal
