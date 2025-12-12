/**
 * CategoryPicker - Visual grid category selector
 *
 * Visual grid with icons for category selection.
 *
 * Features:
 * - Grid layout with icons
 * - Single or multi-select mode
 * - Custom icons support
 * - Haptic feedback
 * - Search/filter capability
 */

import React, { useState, useCallback, useMemo } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  TextInput,
  Platform,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { useTheme } from '../../theme'

interface Category {
  id: number | string
  name: string
  icon?: string
  emoji?: string
  color?: string
}

interface CategoryPickerProps {
  value: number | string | (number | string)[] | null
  onChange: (value: number | string | (number | string)[]) => void
  categories: Category[]
  label?: string
  placeholder?: string
  disabled?: boolean
  error?: string
  multiple?: boolean
  columns?: number
  showSearch?: boolean
}

const DEFAULT_CATEGORY_ICONS: Record<string, { emoji: string; color: string }> = {
  'boulangerie': { emoji: '🥐', color: '#F59E0B' },
  'fruits': { emoji: '🍎', color: '#EF4444' },
  'legumes': { emoji: '🥕', color: '#22C55E' },
  'viande': { emoji: '🥩', color: '#DC2626' },
  'poisson': { emoji: '🐟', color: '#3B82F6' },
  'laitier': { emoji: '🧀', color: '#FCD34D' },
  'epicerie': { emoji: '🥫', color: '#A855F7' },
  'plat': { emoji: '🍲', color: '#F97316' },
  'boisson': { emoji: '🥤', color: '#06B6D4' },
  'default': { emoji: '🛍️', color: '#6B7280' },
}

const getCategoryIcon = (category: Category): { emoji: string; color: string } => {
  if (category.emoji && category.color) {
    return { emoji: category.emoji, color: category.color }
  }

  const nameLower = category.name.toLowerCase()
  for (const [key, value] of Object.entries(DEFAULT_CATEGORY_ICONS)) {
    if (nameLower.includes(key)) {
      return value
    }
  }

  return DEFAULT_CATEGORY_ICONS.default
}

const CategoryPicker: React.FC<CategoryPickerProps> = ({
  value,
  onChange,
  categories,
  label,
  placeholder = 'Sélectionner une catégorie',
  disabled = false,
  error,
  multiple = false,
  columns = 3,
  showSearch = false,
}) => {
  const theme = useTheme()
  const [visible, setVisible] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const triggerHaptic = useCallback(() => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    }
  }, [])

  const selectedIds = useMemo(() => {
    if (value === null) return []
    if (Array.isArray(value)) return value
    return [value]
  }, [value])

  const selectedCategories = useMemo(() => {
    return categories.filter(cat => selectedIds.includes(cat.id))
  }, [categories, selectedIds])

  const filteredCategories = useMemo(() => {
    if (!searchQuery) return categories
    const query = searchQuery.toLowerCase()
    return categories.filter(cat =>
      cat.name.toLowerCase().includes(query)
    )
  }, [categories, searchQuery])

  const handleOpen = () => {
    if (!disabled) {
      triggerHaptic()
      setSearchQuery('')
      setVisible(true)
    }
  }

  const handleClose = () => {
    setVisible(false)
  }

  const handleSelectCategory = (categoryId: number | string) => {
    triggerHaptic()

    if (multiple) {
      const currentSelection = Array.isArray(value) ? value : value ? [value] : []
      const isSelected = currentSelection.includes(categoryId)

      if (isSelected) {
        onChange(currentSelection.filter(id => id !== categoryId))
      } else {
        onChange([...currentSelection, categoryId])
      }
    } else {
      onChange(categoryId)
      setVisible(false)
    }
  }

  const handleClearAll = () => {
    triggerHaptic()
    onChange(multiple ? [] : (null as any))
  }

  const displayValue = useMemo(() => {
    if (selectedCategories.length === 0) return placeholder
    if (selectedCategories.length === 1) return selectedCategories[0].name
    return `${selectedCategories.length} catégories`
  }, [selectedCategories, placeholder])

  return (
    <View style={styles.container}>
      {label && (
        <Text style={[styles.label, { color: theme.colors.text }]}>
          {label}
        </Text>
      )}

      <TouchableOpacity
        style={[
          styles.inputButton,
          {
            backgroundColor: disabled ? theme.colors.neutral[100] : theme.colors.surface.light,
            borderColor: error ? theme.colors.error : theme.colors.border,
          },
        ]}
        onPress={handleOpen}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={label || 'Sélecteur de catégorie'}
      >
        {selectedCategories.length > 0 ? (
          <View style={styles.selectedPreview}>
            {selectedCategories.slice(0, 3).map((cat) => {
              const { emoji } = getCategoryIcon(cat)
              return (
                <Text key={cat.id} style={styles.previewEmoji}>
                  {emoji}
                </Text>
              )
            })}
            {selectedCategories.length > 3 && (
              <Text style={[styles.moreText, { color: theme.colors.textSecondary }]}>
                +{selectedCategories.length - 3}
              </Text>
            )}
          </View>
        ) : (
          <Ionicons
            name="grid-outline"
            size={20}
            color={disabled ? theme.colors.neutral[400] : theme.colors.primary[500]}
          />
        )}

        <Text
          style={[
            styles.inputText,
            {
              color: selectedCategories.length > 0
                ? theme.colors.text
                : theme.colors.neutral[400],
            },
          ]}
        >
          {displayValue}
        </Text>

        <Ionicons
          name="chevron-down"
          size={20}
          color={theme.colors.neutral[400]}
        />
      </TouchableOpacity>

      {error && (
        <Text style={[styles.errorText, { color: theme.colors.error }]}>
          {error}
        </Text>
      )}

      <Modal
        visible={visible}
        transparent
        animationType="slide"
        onRequestClose={handleClose}
      >
        <View style={styles.overlay}>
          <View
            style={[
              styles.picker,
              {
                backgroundColor: theme.colors.background,
                ...theme.shadows.lg,
              },
            ]}
          >
            {/* Header */}
            <View style={styles.header}>
              <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
                {multiple ? 'Sélectionner des catégories' : 'Choisir une catégorie'}
              </Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={handleClose}
                accessibilityLabel="Fermer"
              >
                <Ionicons name="close" size={24} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Search */}
            {showSearch && (
              <View style={[styles.searchContainer, { borderColor: theme.colors.border }]}>
                <Ionicons name="search" size={20} color={theme.colors.textSecondary} />
                <TextInput
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholder="Rechercher..."
                  placeholderTextColor={theme.colors.neutral[400]}
                  style={[styles.searchInput, { color: theme.colors.text }]}
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity onPress={() => setSearchQuery('')}>
                    <Ionicons name="close-circle" size={20} color={theme.colors.neutral[400]} />
                  </TouchableOpacity>
                )}
              </View>
            )}

            {/* Selected count */}
            {multiple && selectedIds.length > 0 && (
              <View style={styles.selectionInfo}>
                <Text style={[styles.selectionText, { color: theme.colors.primary[600] }]}>
                  {selectedIds.length} sélectionnée(s)
                </Text>
                <TouchableOpacity onPress={handleClearAll}>
                  <Text style={[styles.clearText, { color: theme.colors.error }]}>
                    Tout effacer
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
              <View style={[styles.grid, { gap: 12 }]}>
                {filteredCategories.map((category) => {
                  const { emoji, color } = getCategoryIcon(category)
                  const isSelected = selectedIds.includes(category.id)

                  return (
                    <TouchableOpacity
                      key={category.id}
                      style={[
                        styles.categoryCard,
                        {
                          // FIX HIGH: Use flexBasis instead of percentage string for better compatibility
                          flexBasis: `${Math.floor(100 / columns) - 2}%`,
                          maxWidth: `${Math.floor(100 / columns) - 2}%`,
                          backgroundColor: isSelected
                            ? `${color}20`
                            : theme.colors.surface.light,
                          borderColor: isSelected ? color : theme.colors.border,
                        },
                      ]}
                      onPress={() => handleSelectCategory(category.id)}
                      accessibilityRole="checkbox"
                      accessibilityState={{ checked: isSelected }}
                      accessibilityLabel={category.name}
                    >
                      {isSelected && (
                        <View style={[styles.checkMark, { backgroundColor: color }]}>
                          <Ionicons name="checkmark" size={12} color="#FFFFFF" />
                        </View>
                      )}
                      <Text style={styles.categoryEmoji}>{emoji}</Text>
                      <Text
                        style={[
                          styles.categoryName,
                          { color: isSelected ? color : theme.colors.text },
                        ]}
                        numberOfLines={2}
                      >
                        {category.name}
                      </Text>
                    </TouchableOpacity>
                  )
                })}
              </View>

              {filteredCategories.length === 0 && (
                <View style={styles.emptyState}>
                  <Ionicons name="search-outline" size={48} color={theme.colors.neutral[300]} />
                  <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
                    Aucune catégorie trouvée
                  </Text>
                </View>
              )}
            </ScrollView>

            {/* Confirm button for multiple selection */}
            {multiple && (
              <View style={[styles.footer, { borderTopColor: theme.colors.border }]}>
                <TouchableOpacity
                  style={[styles.confirmButton, { backgroundColor: theme.colors.primary[500] }]}
                  onPress={handleClose}
                >
                  <Text style={styles.confirmButtonText}>
                    Confirmer ({selectedIds.length})
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  inputButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
  },
  selectedPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  previewEmoji: {
    fontSize: 18,
  },
  moreText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  inputText: {
    flex: 1,
    fontSize: 16,
  },
  errorText: {
    fontSize: 12,
    marginTop: 4,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  picker: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  closeButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 16,
    marginBottom: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  selectionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  selectionText: {
    fontSize: 14,
    fontWeight: '600',
  },
  clearText: {
    fontSize: 14,
    fontWeight: '500',
  },
  scrollView: {
    padding: 16,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
  categoryCard: {
    aspectRatio: 1,
    borderRadius: 16,
    borderWidth: 2,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  checkMark: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  categoryName: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 14,
    marginTop: 12,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
  },
  confirmButton: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
})

export default CategoryPicker
