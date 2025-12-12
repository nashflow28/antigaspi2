/**
 * PhotoPicker - Multi-selection image picker with preview
 *
 * Advanced image picker with:
 * - Camera and gallery options
 * - Multi-selection support
 * - Image preview grid
 * - Drag to reorder
 * - Image compression
 * - Haptic feedback
 */

import React, { useState, useCallback } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Image,
  Platform,
  Alert,
  ScrollView,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import * as ImagePicker from 'expo-image-picker'
import { useTheme } from '../../theme'

interface PhotoPickerProps {
  value: string[]
  onChange: (uris: string[]) => void
  label?: string
  placeholder?: string
  disabled?: boolean
  error?: string
  maxPhotos?: number
  quality?: number // 0-1
  allowsEditing?: boolean
  aspect?: [number, number]
}

const PhotoPicker: React.FC<PhotoPickerProps> = ({
  value = [],
  onChange,
  label,
  placeholder = 'Ajouter des photos',
  disabled = false,
  error,
  maxPhotos = 5,
  quality = 0.8,
  allowsEditing = true,
  aspect = [4, 3],
}) => {
  const theme = useTheme()
  const [modalVisible, setModalVisible] = useState(false)

  const triggerHaptic = useCallback(() => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    }
  }, [])

  const requestPermissions = async (type: 'camera' | 'gallery'): Promise<boolean> => {
    if (type === 'camera') {
      const { status } = await ImagePicker.requestCameraPermissionsAsync()
      if (status !== 'granted') {
        Alert.alert(
          'Permission requise',
          'L\'accès à la caméra est nécessaire pour prendre des photos.',
          [{ text: 'OK' }]
        )
        return false
      }
    } else {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
      if (status !== 'granted') {
        Alert.alert(
          'Permission requise',
          'L\'accès à la galerie est nécessaire pour sélectionner des photos.',
          [{ text: 'OK' }]
        )
        return false
      }
    }
    return true
  }

  const pickFromCamera = async () => {
    const hasPermission = await requestPermissions('camera')
    if (!hasPermission) return

    triggerHaptic()
    setModalVisible(false)

    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing,
        aspect,
        quality,
      })

      if (!result.canceled && result.assets[0]) {
        const newUri = result.assets[0].uri
        if (value.length < maxPhotos) {
          onChange([...value, newUri])
        } else {
          Alert.alert('Limite atteinte', `Vous ne pouvez pas ajouter plus de ${maxPhotos} photos.`)
        }
      }
    } catch (error) {
      console.error('Error taking photo:', error)
      Alert.alert('Erreur', 'Impossible de prendre la photo.')
    }
  }

  const pickFromGallery = async () => {
    const hasPermission = await requestPermissions('gallery')
    if (!hasPermission) return

    triggerHaptic()
    setModalVisible(false)

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        selectionLimit: maxPhotos - value.length,
        allowsEditing: false, // Multi-select doesn't support editing
        quality,
      })

      if (!result.canceled && result.assets.length > 0) {
        const newUris = result.assets.map(asset => asset.uri)
        const availableSlots = maxPhotos - value.length
        const urisToAdd = newUris.slice(0, availableSlots)

        if (urisToAdd.length > 0) {
          onChange([...value, ...urisToAdd])
        }

        if (newUris.length > availableSlots) {
          Alert.alert(
            'Photos limitées',
            `Seulement ${availableSlots} photo(s) ajoutée(s). Limite de ${maxPhotos} atteinte.`
          )
        }
      }
    } catch (error) {
      console.error('Error picking images:', error)
      Alert.alert('Erreur', 'Impossible de sélectionner les photos.')
    }
  }

  const removePhoto = (index: number) => {
    triggerHaptic()
    Alert.alert(
      'Supprimer la photo',
      'Voulez-vous supprimer cette photo ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: () => {
            const newValue = [...value]
            newValue.splice(index, 1)
            onChange(newValue)
          },
        },
      ]
    )
  }

  const movePhoto = (fromIndex: number, direction: 'left' | 'right') => {
    const toIndex = direction === 'left' ? fromIndex - 1 : fromIndex + 1
    if (toIndex < 0 || toIndex >= value.length) return

    triggerHaptic()
    const newValue = [...value]
    const [removed] = newValue.splice(fromIndex, 1)
    newValue.splice(toIndex, 0, removed)
    onChange(newValue)
  }

  const canAddMore = value.length < maxPhotos

  return (
    <View style={styles.container}>
      {label && (
        <View style={styles.labelRow}>
          <Text style={[styles.label, { color: theme.colors.text }]}>
            {label}
          </Text>
          <Text style={[styles.counter, { color: theme.colors.textSecondary }]}>
            {value.length}/{maxPhotos}
          </Text>
        </View>
      )}

      {/* Photo grid */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.photoGrid}
      >
        {value.map((uri, index) => (
          <View key={uri} style={styles.photoWrapper}>
            <Image
              source={{ uri }}
              style={[styles.photoPreview, { borderColor: theme.colors.border }]}
            />

            {/* Photo number badge */}
            <View style={[styles.photoBadge, { backgroundColor: theme.colors.primary[500] }]}>
              <Text style={styles.photoBadgeText}>{index + 1}</Text>
            </View>

            {/* Remove button */}
            {!disabled && (
              <TouchableOpacity
                style={[styles.removeButton, { backgroundColor: theme.colors.error }]}
                onPress={() => removePhoto(index)}
                accessibilityLabel="Supprimer la photo"
              >
                <Ionicons name="close" size={14} color="#FFFFFF" />
              </TouchableOpacity>
            )}

            {/* Reorder buttons */}
            {!disabled && value.length > 1 && (
              <View style={styles.reorderButtons}>
                {index > 0 && (
                  <TouchableOpacity
                    style={[styles.reorderButton, { backgroundColor: theme.colors.neutral[700] }]}
                    onPress={() => movePhoto(index, 'left')}
                    accessibilityLabel="Déplacer vers la gauche"
                  >
                    <Ionicons name="chevron-back" size={12} color="#FFFFFF" />
                  </TouchableOpacity>
                )}
                {index < value.length - 1 && (
                  <TouchableOpacity
                    style={[styles.reorderButton, { backgroundColor: theme.colors.neutral[700] }]}
                    onPress={() => movePhoto(index, 'right')}
                    accessibilityLabel="Déplacer vers la droite"
                  >
                    <Ionicons name="chevron-forward" size={12} color="#FFFFFF" />
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>
        ))}

        {/* Add photo button */}
        {canAddMore && !disabled && (
          <TouchableOpacity
            style={[
              styles.addButton,
              {
                backgroundColor: theme.colors.surface.light,
                borderColor: theme.colors.border,
              },
            ]}
            onPress={() => setModalVisible(true)}
            accessibilityRole="button"
            accessibilityLabel="Ajouter une photo"
          >
            <Ionicons name="add" size={32} color={theme.colors.primary[500]} />
            <Text style={[styles.addButtonText, { color: theme.colors.textSecondary }]}>
              {value.length === 0 ? placeholder : 'Ajouter'}
            </Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* Helper text */}
      {value.length === 0 && (
        <Text style={[styles.helperText, { color: theme.colors.textSecondary }]}>
          La première photo sera utilisée comme image principale
        </Text>
      )}

      {error && (
        <Text style={[styles.errorText, { color: theme.colors.error }]}>
          {error}
        </Text>
      )}

      {/* Source selection modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setModalVisible(false)}
        >
          <View
            style={[
              styles.modalContent,
              {
                backgroundColor: theme.colors.background,
                ...theme.shadows.lg,
              },
            ]}
          >
            <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
              Ajouter une photo
            </Text>

            <TouchableOpacity
              style={[styles.optionButton, { backgroundColor: theme.colors.primary[50] }]}
              onPress={pickFromCamera}
            >
              <View style={[styles.optionIcon, { backgroundColor: theme.colors.primary[500] }]}>
                <Ionicons name="camera" size={24} color="#FFFFFF" />
              </View>
              <View style={styles.optionText}>
                <Text style={[styles.optionTitle, { color: theme.colors.text }]}>
                  Prendre une photo
                </Text>
                <Text style={[styles.optionSubtitle, { color: theme.colors.textSecondary }]}>
                  Utiliser la caméra
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={theme.colors.neutral[400]} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.optionButton, { backgroundColor: theme.colors.surface.light }]}
              onPress={pickFromGallery}
            >
              <View style={[styles.optionIcon, { backgroundColor: theme.colors.success }]}>
                <Ionicons name="images" size={24} color="#FFFFFF" />
              </View>
              <View style={styles.optionText}>
                <Text style={[styles.optionTitle, { color: theme.colors.text }]}>
                  Choisir depuis la galerie
                </Text>
                <Text style={[styles.optionSubtitle, { color: theme.colors.textSecondary }]}>
                  Sélectionner plusieurs photos
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={theme.colors.neutral[400]} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.cancelButton, { borderColor: theme.colors.border }]}
              onPress={() => setModalVisible(false)}
            >
              <Text style={[styles.cancelText, { color: theme.colors.textSecondary }]}>
                Annuler
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
  },
  counter: {
    fontSize: 12,
  },
  photoGrid: {
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 4,
  },
  photoWrapper: {
    position: 'relative',
  },
  photoPreview: {
    width: 100,
    height: 100,
    borderRadius: 12,
    borderWidth: 1,
  },
  photoBadge: {
    position: 'absolute',
    top: 4,
    left: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  removeButton: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reorderButtons: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    right: 4,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  reorderButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButton: {
    width: 100,
    height: 100,
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonText: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 4,
  },
  helperText: {
    fontSize: 12,
    marginTop: 8,
  },
  errorText: {
    fontSize: 12,
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
    textAlign: 'center',
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    gap: 12,
  },
  optionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionText: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  optionSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  cancelButton: {
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    marginTop: 4,
  },
  cancelText: {
    fontSize: 16,
    fontWeight: '500',
  },
})

export default PhotoPicker
