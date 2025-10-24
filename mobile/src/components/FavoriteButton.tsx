import React, { useState } from 'react'
import { TouchableOpacity, StyleSheet, ActivityIndicator, ViewStyle } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useTheme } from '../theme'
import { useFavorite } from '../hooks/useFavorite'
import { TEST_IDS } from '../utils/testIds'

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
  // BUG FIX #24: Add debounce state to prevent spam/double-tap issues
  const [isToggling, setIsToggling] = useState(false)

  const handlePress = async () => {
    // Prevent multiple simultaneous toggle requests
    if (isToggling || loading) {
      return
    }

    setIsToggling(true)
    try {
      await toggleFavorite()
      onToggle?.(isFavorite)
    } finally {
      // Minimum 300ms delay to prevent accidental double-taps
      setTimeout(() => {
        setIsToggling(false)
      }, 300)
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
      accessibilityLabel={TEST_IDS.favoriteButton}
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
