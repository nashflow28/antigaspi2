/**
 * MerchantsEmptyState - Composant pour afficher l'état vide de la liste des marchands
 */

import React from 'react'
import {
  View,
  StyleSheet,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useTheme } from '../../theme'
import { Typography, Button } from '../2025'

export interface MerchantsEmptyStateProps {
  searchQuery?: string
  onRetry?: () => void
}

const MerchantsEmptyState: React.FC<MerchantsEmptyStateProps> = ({
  searchQuery,
  onRetry,
}) => {
  const theme = useTheme()
  const styles = createStyles(theme)

  const isEmpty = !searchQuery || searchQuery.trim().length === 0

  return (
    <View style={styles.container}>
      <Ionicons
        name="storefront-outline"
        size={64}
        color={theme.colors.neutral[300]}
      />

      <Typography
        variant="h3"
        weight="bold"
        style={styles.title}
      >
        {isEmpty ? 'Aucune boutique' : 'Aucun résultat'}
      </Typography>

      <Typography
        variant="body"
        color="secondary"
        style={styles.subtitle}
      >
        {isEmpty
          ? 'Il n\'y a aucune boutique disponible pour le moment.'
          : `Aucun résultat pour "${searchQuery}".`}
      </Typography>

      {onRetry && (
        <Button
          variant="primary"
          size="md"
          onPress={onRetry}
          style={styles.button}
        >
          {isEmpty ? 'Réessayer' : 'Réinitialiser la recherche'}
        </Button>
      )}
    </View>
  )
}

const createStyles = (theme: ReturnType<typeof useTheme>) =>
  StyleSheet.create({
    container: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: theme.spacing.xl,
      paddingVertical: theme.spacing['3xl'],
    },
    title: {
      marginTop: theme.spacing.lg,
      marginBottom: theme.spacing.sm,
    },
    subtitle: {
      textAlign: 'center',
      lineHeight: 20,
      marginBottom: theme.spacing.lg,
    },
    button: {
      marginTop: theme.spacing.md,
    },
  })

export default MerchantsEmptyState
