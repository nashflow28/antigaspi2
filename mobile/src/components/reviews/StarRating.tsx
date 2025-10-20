import React from 'react'
import { View, TouchableOpacity, StyleSheet, ViewStyle } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useTheme } from '../../theme'

interface StarRatingProps {
  rating: number // 0-5
  size?: number
  interactive?: boolean
  onRatingChange?: (rating: number) => void
  style?: ViewStyle
  color?: string
}

const StarRating: React.FC<StarRatingProps> = ({
  rating,
  size = 24,
  interactive = false,
  onRatingChange,
  style,
  color,
}) => {
  const theme = useTheme()
  const starColor = color || theme.colors.accent.orange

  const handleStarPress = (index: number) => {
    if (interactive && onRatingChange) {
      const newRating = index + 1
      onRatingChange(newRating)
    }
  }

  const renderStar = (index: number) => {
    const isFilled = index < Math.floor(rating)
    const isHalf = !isFilled && index < rating && rating % 1 !== 0

    const StarComponent = interactive ? TouchableOpacity : View

    return (
      <StarComponent
        key={index}
        onPress={() => interactive && handleStarPress(index)}
        activeOpacity={interactive ? 0.7 : 1}
        style={styles.starContainer}
        accessible={interactive}
        accessibilityLabel={`Note ${index + 1} étoile${index > 0 ? 's' : ''}`}
        accessibilityRole={interactive ? 'button' : 'none'}
      >
        <Ionicons
          name={isFilled ? 'star' : isHalf ? 'star-half' : 'star-outline'}
          size={size}
          color={starColor}
        />
      </StarComponent>
    )
  }

  return (
    <View style={[styles.container, style]}>
      {[...Array(5)].map((_, index) => renderStar(index))}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  starContainer: {
    marginHorizontal: 2,
  },
})

export default StarRating
