import React from 'react'
import { TouchableOpacity, StyleSheet, ActivityIndicator, ViewStyle } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useTheme } from '../theme'
import { useFavorite } from '../hooks/useFavorite'

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

  const handlePress = async () => {
    await toggleFavorite()
    onToggle?.(isFavorite)
  }

  const color = iconColor || theme.colors.primary[600]

  return (
    <TouchableOpacity
      style={[styles.button, style]}
      onPress={handlePress}
      disabled={loading}
      activeOpacity={0.7}
    >
      {loading ? (
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
