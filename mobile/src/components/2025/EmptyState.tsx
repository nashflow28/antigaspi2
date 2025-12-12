/**
 * EmptyState - Beautiful empty state illustrations
 *
 * Provides consistent empty state handling across the app:
 * - Different variants for different contexts
 * - Custom icons and illustrations
 * - Action buttons
 * - Animated entry
 */

import React, { useEffect, useRef } from 'react'
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Platform,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { useTheme } from '../../theme'

type EmptyStateVariant =
  | 'no-results'
  | 'no-favorites'
  | 'no-reservations'
  | 'no-products'
  | 'no-notifications'
  | 'error'
  | 'offline'
  | 'empty-cart'
  | 'no-reviews'
  | 'custom'

interface EmptyStateAction {
  label: string
  onPress: () => void
  variant?: 'primary' | 'secondary'
  icon?: string
}

interface EmptyStateProps {
  variant?: EmptyStateVariant
  title?: string
  description?: string
  icon?: string
  iconColor?: string
  actions?: EmptyStateAction[]
  animated?: boolean
  compact?: boolean
}

const VARIANT_CONFIG: Record<EmptyStateVariant, {
  icon: string
  title: string
  description: string
  iconColor?: string
}> = {
  'no-results': {
    icon: 'search-outline',
    title: 'Aucun résultat',
    description: 'Essayez de modifier vos critères de recherche.',
  },
  'no-favorites': {
    icon: 'heart-outline',
    title: 'Pas encore de favoris',
    description: 'Ajoutez des produits à vos favoris pour les retrouver facilement.',
  },
  'no-reservations': {
    icon: 'calendar-outline',
    title: 'Aucune réservation',
    description: 'Vous n\'avez pas encore de réservation. Explorez les offres disponibles !',
  },
  'no-products': {
    icon: 'basket-outline',
    title: 'Aucun produit disponible',
    description: 'De nouveaux produits seront bientôt disponibles.',
  },
  'no-notifications': {
    icon: 'notifications-outline',
    title: 'Pas de notifications',
    description: 'Vous êtes à jour ! Revenez plus tard pour les nouveautés.',
  },
  'error': {
    icon: 'alert-circle-outline',
    title: 'Une erreur est survenue',
    description: 'Impossible de charger les données. Veuillez réessayer.',
    iconColor: '#EF4444',
  },
  'offline': {
    icon: 'cloud-offline-outline',
    title: 'Vous êtes hors ligne',
    description: 'Vérifiez votre connexion internet et réessayez.',
    iconColor: '#F59E0B',
  },
  'empty-cart': {
    icon: 'cart-outline',
    title: 'Votre panier est vide',
    description: 'Ajoutez des produits pour commencer votre commande.',
  },
  'no-reviews': {
    icon: 'star-outline',
    title: 'Pas encore d\'avis',
    description: 'Soyez le premier à donner votre avis !',
  },
  'custom': {
    icon: 'information-circle-outline',
    title: '',
    description: '',
  },
}

const EmptyState: React.FC<EmptyStateProps> = ({
  variant = 'no-results',
  title,
  description,
  icon,
  iconColor,
  actions = [],
  animated = true,
  compact = false,
}) => {
  const theme = useTheme()
  const config = VARIANT_CONFIG[variant]

  const fadeAnim = useRef(new Animated.Value(0)).current
  const scaleAnim = useRef(new Animated.Value(0.8)).current
  const slideAnim = useRef(new Animated.Value(20)).current

  useEffect(() => {
    if (animated) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
      ]).start()
    } else {
      fadeAnim.setValue(1)
      scaleAnim.setValue(1)
      slideAnim.setValue(0)
    }
  }, [animated])

  const triggerHaptic = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    }
  }

  const handleActionPress = (action: EmptyStateAction) => {
    triggerHaptic()
    action.onPress()
  }

  const displayIcon = icon || config.icon
  const displayTitle = title || config.title
  const displayDescription = description || config.description
  const displayIconColor = iconColor || config.iconColor || theme.colors.neutral[300]

  return (
    <Animated.View
      style={[
        styles.container,
        compact && styles.containerCompact,
        {
          opacity: fadeAnim,
          transform: [
            { scale: scaleAnim },
            { translateY: slideAnim },
          ],
        },
      ]}
      accessibilityRole="text"
      accessibilityLabel={`${displayTitle}. ${displayDescription}`}
    >
      {/* Icon with decorative circle */}
      <View
        style={[
          styles.iconContainer,
          compact && styles.iconContainerCompact,
          { backgroundColor: `${displayIconColor}15` },
        ]}
      >
        <Ionicons
          name={displayIcon as any}
          size={compact ? 40 : 64}
          color={displayIconColor}
        />
      </View>

      {/* Title */}
      {displayTitle && (
        <Text
          style={[
            styles.title,
            compact && styles.titleCompact,
            { color: theme.colors.text },
          ]}
        >
          {displayTitle}
        </Text>
      )}

      {/* Description */}
      {displayDescription && (
        <Text
          style={[
            styles.description,
            compact && styles.descriptionCompact,
            { color: theme.colors.textSecondary },
          ]}
        >
          {displayDescription}
        </Text>
      )}

      {/* Actions */}
      {actions.length > 0 && (
        <View style={[styles.actions, compact && styles.actionsCompact]}>
          {actions.map((action, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.actionButton,
                action.variant === 'secondary'
                  ? [styles.actionButtonSecondary, { borderColor: theme.colors.border }]
                  : [styles.actionButtonPrimary, { backgroundColor: theme.colors.primary[500] }],
              ]}
              onPress={() => handleActionPress(action)}
              accessibilityRole="button"
              accessibilityLabel={action.label}
            >
              {action.icon && (
                <Ionicons
                  name={action.icon as any}
                  size={18}
                  color={action.variant === 'secondary' ? theme.colors.primary[600] : '#FFFFFF'}
                  style={styles.actionIcon}
                />
              )}
              <Text
                style={[
                  styles.actionText,
                  action.variant === 'secondary'
                    ? { color: theme.colors.primary[600] }
                    : styles.actionTextPrimary,
                ]}
              >
                {action.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </Animated.View>
  )
}

/**
 * Inline empty state for smaller contexts (within lists, etc.)
 */
export const InlineEmptyState: React.FC<{
  message: string
  icon?: string
  action?: { label: string; onPress: () => void }
}> = ({ message, icon = 'information-circle-outline', action }) => {
  const theme = useTheme()

  return (
    <View style={[styles.inlineContainer, { backgroundColor: theme.colors.surface.light }]}>
      <Ionicons name={icon as any} size={20} color={theme.colors.neutral[400]} />
      <Text style={[styles.inlineText, { color: theme.colors.textSecondary }]}>
        {message}
      </Text>
      {action && (
        <TouchableOpacity onPress={action.onPress}>
          <Text style={[styles.inlineAction, { color: theme.colors.primary[600] }]}>
            {action.label}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 48,
  },
  containerCompact: {
    paddingVertical: 24,
    paddingHorizontal: 20,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  iconContainerCompact: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  titleCompact: {
    fontSize: 16,
    marginBottom: 4,
  },
  description: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 280,
  },
  descriptionCompact: {
    fontSize: 13,
    lineHeight: 18,
    maxWidth: 240,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
    marginTop: 24,
  },
  actionsCompact: {
    marginTop: 16,
    gap: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    minWidth: 140,
    justifyContent: 'center',
  },
  actionButtonPrimary: {},
  actionButtonSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 1,
  },
  actionIcon: {
    marginRight: 8,
  },
  actionText: {
    fontSize: 15,
    fontWeight: '600',
  },
  actionTextPrimary: {
    color: '#FFFFFF',
  },
  // Inline styles
  inlineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  inlineText: {
    flex: 1,
    fontSize: 13,
  },
  inlineAction: {
    fontSize: 13,
    fontWeight: '600',
  },
})

export default EmptyState
