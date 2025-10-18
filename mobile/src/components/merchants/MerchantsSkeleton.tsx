/**
 * MerchantsSkeleton - Composant skeleton pour le chargement de la liste des marchands
 */

import React from 'react'
import {
  View,
  StyleSheet,
  ScrollView,
} from 'react-native'
import { useTheme } from '../../theme'
import { Card } from '../2025'

const MerchantsSkeleton: React.FC = () => {
  const theme = useTheme()

  // Créer 5 skeletons
  const skeletons = Array.from({ length: 5 }, (_, i) => i)

  const styles = createStyles(theme)

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      scrollEnabled={false}
    >
      {skeletons.map((index) => (
        <View key={index} style={styles.skeletonCard}>
          {/* Image skeleton 16:9 */}
          <View style={[styles.imageSkeleton, { backgroundColor: theme.colors.neutral[200] }]} />

          {/* Info skeleton */}
          <View style={styles.infoContainer}>
            {/* Titre skeleton */}
            <View
              style={[
                styles.textSkeleton,
                {
                  width: '70%',
                  height: 16,
                  backgroundColor: theme.colors.neutral[200],
                  marginBottom: 8,
                },
              ]}
            />

            {/* Rating skeleton */}
            <View
              style={[
                styles.textSkeleton,
                {
                  width: '45%',
                  height: 12,
                  backgroundColor: theme.colors.neutral[100],
                  marginBottom: 8,
                },
              ]}
            />

            {/* Location skeleton */}
            <View
              style={[
                styles.textSkeleton,
                {
                  width: '50%',
                  height: 12,
                  backgroundColor: theme.colors.neutral[100],
                },
              ]}
            />
          </View>
        </View>
      ))}
    </ScrollView>
  )
}

const createStyles = (theme: ReturnType<typeof useTheme>) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    content: {
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.lg,
    },
    skeletonCard: {
      marginBottom: 20,
      borderRadius: 16,
      overflow: 'hidden',
      backgroundColor: theme.colors.surface.light,
    },
    imageSkeleton: {
      width: '100%',
      aspectRatio: 16 / 9,
      borderRadius: 16,
    },
    infoContainer: {
      padding: 16,
      paddingTop: 12,
    },
    textSkeleton: {
      borderRadius: 4,
    },
  })

export default MerchantsSkeleton
