import React from 'react'
import { View, TouchableOpacity, StyleSheet } from 'react-native'
import { useTheme } from '../theme'
import { Typography } from './2025'

export type ProductFilterType = 'all' | 'products' | 'baskets'

interface ProductTypeFilterProps {
  selectedType: ProductFilterType
  onTypeChange: (type: ProductFilterType) => void
  counts?: {
    all: number
    products: number
    baskets: number
  }
}

const filterOptions: { key: ProductFilterType; label: string }[] = [
  { key: 'all', label: 'Tous' },
  { key: 'products', label: 'Produits' },
  { key: 'baskets', label: 'Paniers' },
]

const ProductTypeFilter: React.FC<ProductTypeFilterProps> = ({
  selectedType,
  onTypeChange,
  counts,
}) => {
  const theme = useTheme()
  const styles = createStyles(theme)

  return (
    <View style={styles.container}>
      <View style={styles.segmentedControl}>
        {filterOptions.map((option, index) => {
          const isSelected = selectedType === option.key
          const isFirst = index === 0
          const isLast = index === filterOptions.length - 1
          const count = counts?.[option.key]

          return (
            <TouchableOpacity
              key={option.key}
              style={[
                styles.segment,
                isSelected && styles.segmentSelected,
                isFirst && styles.segmentFirst,
                isLast && styles.segmentLast,
              ]}
              onPress={() => onTypeChange(option.key)}
              activeOpacity={0.7}
              accessibilityRole="tab"
              accessibilityState={{ selected: isSelected }}
              accessibilityLabel={`${option.label}${count !== undefined ? `, ${count} elements` : ''}`}
            >
              <Typography
                variant="caption"
                weight={isSelected ? 'semibold' : 'regular'}
                style={[
                  styles.segmentText,
                  isSelected ? styles.segmentTextSelected : styles.segmentTextUnselected,
                ]}
              >
                {option.label}
              </Typography>
              {count !== undefined && count > 0 && (
                <View style={[
                  styles.countBadge,
                  isSelected && styles.countBadgeSelected,
                ]}>
                  <Typography
                    variant="caption"
                    weight="semibold"
                    style={[
                      styles.countText,
                      isSelected && styles.countTextSelected,
                    ]}
                  >
                    {count > 99 ? '99+' : count}
                  </Typography>
                </View>
              )}
            </TouchableOpacity>
          )
        })}
      </View>
    </View>
  )
}

const createStyles = (theme: ReturnType<typeof useTheme>) =>
  StyleSheet.create({
    container: {
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
    },
    segmentedControl: {
      flexDirection: 'row',
      backgroundColor: theme.isDark ? theme.colors.neutral[800] : theme.colors.neutral[100],
      borderRadius: theme.radius.lg,
      padding: 4,
    },
    segment: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: theme.spacing.sm,
      paddingHorizontal: theme.spacing.md,
      borderRadius: theme.radius.md,
      gap: 6,
    },
    segmentSelected: {
      backgroundColor: theme.isDark ? theme.colors.surface.dark : theme.colors.surface.light,
      ...theme.shadows.sm,
    },
    segmentFirst: {
      borderTopLeftRadius: theme.radius.md,
      borderBottomLeftRadius: theme.radius.md,
    },
    segmentLast: {
      borderTopRightRadius: theme.radius.md,
      borderBottomRightRadius: theme.radius.md,
    },
    segmentText: {
      fontSize: 14,
    },
    segmentTextSelected: {
      color: theme.colors.primary[600],
    },
    segmentTextUnselected: {
      color: theme.isDark ? theme.colors.neutral[400] : theme.colors.neutral[600],
    },
    countBadge: {
      backgroundColor: theme.isDark ? theme.colors.neutral[700] : theme.colors.neutral[200],
      borderRadius: 10,
      minWidth: 20,
      height: 20,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 6,
    },
    countBadgeSelected: {
      backgroundColor: theme.isDark ? theme.colors.primary[900] : theme.colors.primary[100],
    },
    countText: {
      fontSize: 11,
      color: theme.isDark ? theme.colors.neutral[400] : theme.colors.neutral[600],
    },
    countTextSelected: {
      color: theme.isDark ? theme.colors.primary[300] : theme.colors.primary[700],
    },
  })

export default ProductTypeFilter
