import React, { useState } from 'react'
import { TouchableOpacity, StyleSheet, ActivityIndicator, ViewStyle } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useTheme } from '../theme'
import { useFavorite } from '../hooks/useFavorite'
import { TEST_IDS } from '../utils/testIds'
import { useHaptics } from '../hooks/useHaptics'

interface FavoriteButtonProps {
  productId: number
  size?: number
  style?: ViewStyle
  iconColor?: string
  onToggle?: (isFavorite: boolean) => void
}

const FavoriteButton: React.FC<FavoriteButtonProps> = ({
  productId,
  size = 24,
  style,
  iconColor,
  onToggle,
}) => {
  const theme = useTheme()
  const { isFavorite, toggleFavorite, loading } = useFavorite(productId)
  const haptics = useHaptics()
  // BUG FIX #24: Add debounce state to prevent spam/double-tap issues
  const [isToggling, setIsToggling] = useState(false)

  const handlePress = async () => {
    // Prevent multiple simultaneous toggle requests
    if (isToggling || loading) {
      return
    }

    // Haptic feedback on toggle
    await haptics.mediumTap()

    setIsToggling(true)
    try {
      await toggleFavorite()
      // BUG FIX #H-007: Use inverted value since toggle happened
      onToggle?.(!isFavorite)
    } catch (error) {
      // Error handled by useFavorite hook
    } finally {
      // BUG FIX #H-007: Remove setTimeout - wait for operation to complete naturally
      setIsToggling(false)
    }
  }

  const color = iconColor || theme.colors.primary[600]
  const isDisabled = loading || isToggling

  return (
    <TouchableOpacity
      style={[styles.button, style]}
      onPress={handlePress}
      disabled={isDisabled}
      activeOpacity={0.7}
      testID={TEST_IDS.favoriteButton}
      // BUG FIX #H-010: Proper accessibility labels
      accessibilityRole="button"
      accessibilityLabel={isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
      accessibilityHint={isFavorite ? 'Retire ce produit de vos favoris' : 'Ajoute ce produit à vos favoris'}
      accessibilityState={{ disabled: isDisabled, selected: isFavorite }}
    >
      {(loading || isToggling) ? (
        <ActivityIndicator size="small" color={color} />
      ) : (
        <Ionicons
          name={isFavorite ? 'heart' : 'heart-outline'}
          size={size}
          color={color}
        />
      )}
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  button: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
})

export default FavoriteButton
