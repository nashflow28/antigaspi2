import React from 'react'
import {
  View,
  Modal,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  ActivityIndicator,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useTheme } from '../../theme'
import Typography from './Typography'
import Button from './Button'

export type ConfirmModalVariant = 'danger' | 'warning' | 'success' | 'info'

interface ConfirmModalProps {
  visible: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  variant?: ConfirmModalVariant
  loading?: boolean
  icon?: keyof typeof Ionicons.glyphMap
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
  visible,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirmer',
  cancelText = 'Annuler',
  variant = 'info',
  loading = false,
  icon,
}) => {
  const theme = useTheme()

  const getVariantConfig = () => {
    switch (variant) {
      case 'danger':
        return {
          color: theme.colors.error,
          bgColor: '#FEE2E2',
          icon: icon || 'warning',
          buttonVariant: 'destructive' as const,
        }
      case 'warning':
        return {
          color: '#F59E0B',
          bgColor: '#FEF3C7',
          icon: icon || 'alert-circle',
          buttonVariant: 'primary' as const,
        }
      case 'success':
        return {
          color: theme.colors.success,
          bgColor: '#D1FAE5',
          icon: icon || 'checkmark-circle',
          buttonVariant: 'primary' as const,
        }
      case 'info':
      default:
        return {
          color: theme.colors.primary[500],
          bgColor: '#EEF2FF',
          icon: icon || 'information-circle',
          buttonVariant: 'primary' as const,
        }
    }
  }

  const config = getVariantConfig()

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
              {/* Icon */}
              <View style={[styles.iconContainer, { backgroundColor: config.bgColor }]}>
                <Ionicons name={config.icon as any} size={40} color={config.color} />
              </View>

              {/* Title */}
              <Typography variant="h3" weight="bold" style={styles.title}>
                {title}
              </Typography>

              {/* Message */}
              <Typography variant="body" color="secondary" style={styles.message}>
                {message}
              </Typography>

              {/* Actions */}
              <View style={styles.actions}>
                <Button
                  variant="secondary"
                  onPress={onClose}
                  disabled={loading}
                  style={styles.button}
                >
                  {cancelText}
                </Button>
                <Button
                  variant={config.buttonVariant}
                  onPress={onConfirm}
                  disabled={loading}
                  style={styles.button}
                  leftIcon={
                    loading ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : undefined
                  }
                >
                  {loading ? 'Chargement...' : confirmText}
                </Button>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  container: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  title: {
    textAlign: 'center',
    marginBottom: 12,
  },
  message: {
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  button: {
    flex: 1,
  },
})

export default ConfirmModal
