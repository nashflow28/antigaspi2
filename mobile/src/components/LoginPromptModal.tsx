/**
 * LoginPromptModal - Modal incitant l'utilisateur a se connecter
 * Affiche quand une action necessite une authentification
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

export interface LoginPromptModalProps {
  visible: boolean
  onClose: () => void
  onLogin: () => void
  onRegister: () => void
  actionDescription?: string
}

const LoginPromptModal: React.FC<LoginPromptModalProps> = ({
  visible,
  onClose,
  onLogin,
  onRegister,
  actionDescription = 'effectuer cette action',
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
              { backgroundColor: theme.withOpacity(theme.colors.primary[500], 0.15) },
            ]}
          >
            <Ionicons
              name="person-circle-outline"
              size={48}
              color={theme.colors.primary[500]}
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
            Connexion requise
          </Text>

          {/* Message */}
          <Text
            style={[
              styles.message,
              {
                color: theme.colors.textSecondary,
                ...theme.getTypography('body'),
              },
            ]}
          >
            Vous devez etre connecte pour {actionDescription}.
          </Text>

          {/* Buttons */}
          <View style={styles.buttonsContainer}>
            <TouchableOpacity
              style={[
                styles.button,
                styles.primaryButton,
                { backgroundColor: theme.colors.primary[500] },
              ]}
              onPress={() => {
                onClose()
                onLogin()
              }}
              activeOpacity={0.8}
            >
              <Ionicons name="log-in-outline" size={20} color="#FFFFFF" style={styles.buttonIcon} />
              <Text style={[styles.buttonText, { color: '#FFFFFF' }]}>
                Se connecter
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.button,
                styles.secondaryButton,
                {
                  backgroundColor: theme.isDark ? theme.colors.neutral[700] : theme.colors.neutral[100],
                  borderColor: theme.colors.primary[500],
                  borderWidth: 1,
                },
              ]}
              onPress={() => {
                onClose()
                onRegister()
              }}
              activeOpacity={0.8}
            >
              <Ionicons name="person-add-outline" size={20} color={theme.colors.primary[500]} style={styles.buttonIcon} />
              <Text style={[styles.buttonText, { color: theme.colors.primary[500] }]}>
                Creer un compte
              </Text>
            </TouchableOpacity>
          </View>

          {/* Cancel link */}
          <TouchableOpacity onPress={onClose} style={styles.cancelLink}>
            <Text
              style={[
                styles.cancelText,
                { color: theme.colors.textSecondary },
              ]}
            >
              Plus tard
            </Text>
          </TouchableOpacity>
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
    width: 80,
    height: 80,
    borderRadius: 40,
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
    width: '100%',
    gap: 12,
  },
  button: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButton: {},
  secondaryButton: {},
  buttonIcon: {
    marginRight: 8,
  },
  buttonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  cancelLink: {
    marginTop: 16,
    paddingVertical: 8,
  },
  cancelText: {
    fontSize: 14,
  },
})

export default LoginPromptModal
