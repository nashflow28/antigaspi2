import React, { useState, useEffect, useCallback } from 'react'
import {
  View,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  StatusBar,
  Platform,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useNavigation } from '@react-navigation/native'
import { useSelector, useDispatch } from 'react-redux'
import { AppDispatch, RootState } from '../../store'
import * as ImagePicker from 'expo-image-picker'
import { useTheme } from '../../theme'
import { Typography } from '../../components/2025'
import apiService from '../../services/api'
import { ApiResponse, User } from '../../types'
import { refreshProfile } from '../../store/slices/authSlice'
import { getImageUrl } from '../../utils/imageHelpers'
import { usePersistedForm } from '../../hooks/usePersistedForm'
import PhoneInput from '../../components/PhoneInput'
import { parsePhoneNumber, validatePhoneNumber } from '../../data/countries'
import AlertModal from '../../components/AlertModal'
import { useAlert } from '../../hooks/useAlert'
import { createLogger } from '../../utils/logger'
import KeyboardAwareContainer from '../../components/KeyboardAwareContainer'

const profileEditLogger = createLogger('ProfileEdit')

interface ProfileFormData {
  first_name: string
  last_name: string
  email: string
  phone: string
  address: string
  city: string
}

// Type pour FormData React Native (upload fichiers)
interface FormDataFile {
  uri: string
  name: string
  type: string
}

const MAX_PHOTO_SIZE_BYTES = 5 * 1024 * 1024
// Support pour tous les pays d'Afrique de l'Ouest: Togo (+228), Bénin (+229), Burkina Faso (+226),
// Côte d'Ivoire (+225), Mali (+223), Niger (+227), Sénégal (+221)
const PHONE_REGEX = /^\+(228|229|226|225|223|227|221) \d{2} \d{2} \d{2} \d{2}$/

/**
 * ProfileEditScreen - Consumer profile editing screen
 * Allows consumers to update their personal information and photo
 */
interface ProfileEditScreenProps {
  navigation?: {
    goBack: () => void
    navigate?: (...args: any[]) => void
    setOptions?: (...args: any[]) => void
  }
}

const INITIAL_FORM_DATA: ProfileFormData = {
  first_name: '',
  last_name: '',
  email: '',
  phone: '',
  address: '',
  city: '',
}

const ProfileEditScreen: React.FC<ProfileEditScreenProps> = ({ navigation: navigationOverride }) => {
  const theme = useTheme()
  const { alertProps, showError, showSuccess, showWarning, hideAlert } = useAlert()
  const defaultNavigation = useNavigation<any>()
  const navigation = navigationOverride ?? defaultNavigation
  const dispatch = useDispatch<AppDispatch>()
  const { user } = useSelector((state: RootState) => state.auth)

  const [isLoadingProfile, setIsLoadingProfile] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [photoUri, setPhotoUri] = useState<string | null>(null)
  const [userDataLoaded, setUserDataLoaded] = useState(false)

  // Formulaire persisté pour conserver les modifications en cas d'interruption
  const {
    formData,
    setFormData,
    setField,
    clearCache: clearFormCache,
    hasUnsavedChanges,
    isRestored,
  } = usePersistedForm<ProfileFormData>({
    formKey: 'consumer_profile_edit_form',
    initialValues: INITIAL_FORM_DATA,
    expiresIn: 1 * 60 * 60 * 1000, // 1 heure (plus court car c'est de l'édition)
  })

  // Charger les données utilisateur au premier rendu
  useEffect(() => {
    if (user && !userDataLoaded) {
      // Si pas de données persistées significatives, charger depuis user
      const hasPersistedChanges = isRestored && hasUnsavedChanges && (
        formData.first_name !== INITIAL_FORM_DATA.first_name ||
        formData.last_name !== INITIAL_FORM_DATA.last_name ||
        formData.email !== INITIAL_FORM_DATA.email
      )

      if (!hasPersistedChanges) {
        setFormData({
          first_name: user.first_name || '',
          last_name: user.last_name || '',
          email: user.email || '',
          phone: user.phone || '',
          address: user.address || '',
          city: user.city || '',
        })
      }
      setPhotoUri(user.photo_url ? getImageUrl(user.photo_url) : null)
      setUserDataLoaded(true)
      setIsLoadingProfile(false)
    } else if (!user) {
      setFormData(INITIAL_FORM_DATA)
      setPhotoUri(null)
      setIsLoadingProfile(false)
    }
  }, [user, isRestored])

  // Montrer une alerte si des modifications ont été récupérées
  useEffect(() => {
    if (isRestored && hasUnsavedChanges && userDataLoaded && user) {
      // Vérifier si les données persistées diffèrent des données utilisateur actuelles
      const isDifferent =
        formData.first_name !== (user.first_name || '') ||
        formData.last_name !== (user.last_name || '') ||
        formData.email !== (user.email || '') ||
        formData.phone !== (user.phone || '') ||
        formData.address !== (user.address || '') ||
        formData.city !== (user.city || '')

      if (isDifferent) {
        showWarning(
          'Modifications récupérées',
          'Nous avons retrouvé des modifications non enregistrées. Voulez-vous les conserver ?',
          [
            {
              text: 'Annuler les modifications',
              style: 'destructive',
              onPress: () => {
                hideAlert()
                setFormData({
                  first_name: user.first_name || '',
                  last_name: user.last_name || '',
                  email: user.email || '',
                  phone: user.phone || '',
                  address: user.address || '',
                  city: user.city || '',
                })
                clearFormCache()
              },
            },
            {
              text: 'Conserver',
              style: 'default',
              onPress: hideAlert,
            },
          ]
        )
      }
    }
  }, [isRestored, userDataLoaded])

  const syncProfileUpdates = useCallback(async () => {
    try {
      const updatedUser = await dispatch(refreshProfile()).unwrap()
      await apiService.setStoredUser(updatedUser)
    } catch (syncError) {
      profileEditLogger.warn('Erreur synchronisation profil:', syncError)
    }
  }, [dispatch])

  const pickImage = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync()

      if (permissionResult.status !== 'granted') {
        showError(
          'Permission refusée',
          "Vous devez autoriser l'accès à la galerie pour changer votre photo."
        )
        return
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      })

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0]

        if (asset.fileSize && asset.fileSize > MAX_PHOTO_SIZE_BYTES) {
          showError('Photo trop lourde', 'La photo ne doit pas dépasser 5 MB')
          return
        }

        setPhotoUri(asset.uri)
        await uploadPhoto(asset)
      }
    } catch (error) {
      profileEditLogger.warn('Erreur sélection image:', error)
      showError('Erreur', "Impossible de sélectionner l'image")
    }
  }

  const uploadPhoto = async (asset: ImagePicker.ImagePickerAsset) => {
    try {
      setUploading(true)

      // Create FormData
      const uploadFormData = new FormData()
      const filename = asset.fileName || asset.uri.split('/').pop() || 'photo.jpg'
      const mimeType = asset.mimeType || asset.type || 'image/jpeg'

      uploadFormData.append('photo', {
        uri: asset.uri,
        name: filename,
        type: mimeType,
      } as any)

      profileEditLogger.log('[ProfileEdit] Uploading photo:', { uri: asset.uri, filename, mimeType })

      // Use uploadFile method which uses native fetch (more reliable for FormData)
      const response = await apiService.uploadFile<ApiResponse<{ photo_url: string; full_url?: string }>>(
        '/consumers/profile/photo',
        uploadFormData
      )

      profileEditLogger.log('[ProfileEdit] Upload response:', response)

      if (response.success) {
        if (response.data?.full_url || response.data?.photo_url) {
          setPhotoUri(response.data.full_url || getImageUrl(response.data.photo_url))
        }
        await syncProfileUpdates()

        showSuccess('Succès', response.message || 'Photo mise à jour avec succès')
      } else {
        // Handle unsuccessful response
        showError('Erreur', response.message || "Impossible d'uploader la photo")
        // Revert to previous photo
        setPhotoUri(user?.photo_url ? getImageUrl(user.photo_url) : null)
      }
    } catch (error: any) {
      profileEditLogger.warn('[ProfileEdit] Erreur upload photo:', error)
      showError(
        'Erreur',
        error.response?.data?.message || error.message || "Impossible d'uploader la photo"
      )
      // Revert to previous photo on error
      setPhotoUri(user?.photo_url ? getImageUrl(user.photo_url) : null)
    } finally {
      setUploading(false)
    }
  }

  const handleSave = async () => {
    const sanitizedData: ProfileFormData = {
      first_name: formData.first_name.trim(),
      last_name: formData.last_name.trim(),
      email: formData.email.trim(),
      phone: formData.phone.trim(),
      address: formData.address.trim(),
      city: formData.city.trim(),
    }

    setFormData(sanitizedData)

    if (!sanitizedData.first_name || !sanitizedData.last_name) {
      showError('Erreur', 'Le prénom et le nom sont requis')
      return
    }

    if (sanitizedData.first_name.length < 2) {
      showError('Erreur', 'Le prénom doit contenir au moins 2 caractères')
      return
    }

    if (sanitizedData.last_name.length < 2) {
      showError('Erreur', 'Le nom doit contenir au moins 2 caractères')
      return
    }

    if (!sanitizedData.email) {
      showError('Erreur', "L'email est requis")
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(sanitizedData.email)) {
      showError('Erreur', 'Adresse email invalide')
      return
    }

    // BUG FIX #11: Re-enabled phone validation with improved comprehensive validator
    if (sanitizedData.phone) {
      const parsed = parsePhoneNumber(sanitizedData.phone)
      if (parsed.country) {
        const validationResult = validatePhoneNumber(parsed.localNumber, parsed.country)
        if (!validationResult.valid) {
          showError(
            'Erreur',
            validationResult.error || 'Numéro de téléphone invalide'
          )
          return
        }
      }
      // Note: If country not detected, we allow it through (backend will validate)
    }

    try {
      setIsSaving(true)

      const response = await apiService.put<ApiResponse<User>>(
        '/consumers/profile',
        sanitizedData
      )

      if (response.success) {
        await syncProfileUpdates()
        // Clear form cache on successful save
        await clearFormCache()

        showSuccess('Succès', response.message || 'Profil mis à jour avec succès', [
          {
            text: 'OK',
            onPress: () => {
              hideAlert()
              navigation.goBack()
            },
          },
        ])
      }
    } catch (error: any) {
      profileEditLogger.warn('Erreur mise à jour profil:', error)
      showError(
        'Erreur',
        error.response?.data?.message || error.message || 'Impossible de mettre à jour le profil'
      )
    } finally {
      setIsSaving(false)
    }
  }

  const updateField = (field: keyof ProfileFormData, value: string) => {
    setField(field, value)
  }

  if (isLoadingProfile && !formData.first_name) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary[500]} />
      </View>
    )
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar
        barStyle={theme.mode === 'dark' ? 'light-content' : 'dark-content'}
        backgroundColor={theme.colors.background}
      />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.isDark ? '#0F1622' : theme.colors.primary[500] }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Typography variant="h3" style={{ color: 'white', fontWeight: 'bold' }}>
          Modifier le profil
        </Typography>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAwareContainer
        style={styles.content}
        contentContainerStyle={{ paddingBottom: 40 }}
        extraScrollHeight={60}
      >
        {/* Photo de profil */}
        <View
          style={[
            styles.photoSection,
            { backgroundColor: theme.colors.cardBackground, marginBottom: theme.spacing.xl },
          ]}
        >
          <View style={styles.photoContainer}>
            {photoUri ? (
              <Image source={{ uri: photoUri }} style={styles.photo} />
            ) : (
              <View
                style={[
                  styles.photoPlaceholder,
                  { backgroundColor: theme.isDark ? theme.colors.neutral[700] : theme.colors.neutral[100] },
                ]}
              >
                <Ionicons name="person" size={48} color={theme.colors.neutral[400]} />
              </View>
            )}
            {uploading && (
              <View style={styles.uploadingOverlay}>
                <ActivityIndicator size="large" color="white" />
              </View>
            )}
          </View>
          <TouchableOpacity
            style={[
              styles.changePhotoButton,
              { backgroundColor: theme.isDark ? '#10B981' : theme.colors.primary[500] },
            ]}
            onPress={pickImage}
            disabled={uploading}
          >
            <Ionicons name="camera" size={20} color="white" />
            <Typography variant="body" style={{ color: 'white', fontWeight: '600' }}>
              Changer la photo
            </Typography>
          </TouchableOpacity>
        </View>

        {/* Formulaire */}
        <View style={[styles.formSection, { paddingHorizontal: theme.spacing.lg }]}>
          {/* Prénom */}
          <View style={{ marginBottom: theme.spacing.lg }}>
            <Typography
              variant="body"
              weight="semibold"
              style={{ marginBottom: theme.spacing.sm }}
            >
              Prénom *
            </Typography>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: theme.colors.inputBackground,
                  color: theme.colors.text,
                  borderColor: theme.colors.inputBorder,
                },
              ]}
              value={formData.first_name}
              onChangeText={(value) => updateField('first_name', value)}
              placeholder="Ex: Jean"
              placeholderTextColor={theme.colors.textSecondary}
            />
          </View>

          {/* Nom */}
          <View style={{ marginBottom: theme.spacing.lg }}>
            <Typography
              variant="body"
              weight="semibold"
              style={{ marginBottom: theme.spacing.sm }}
            >
              Nom *
            </Typography>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: theme.colors.inputBackground,
                  color: theme.colors.text,
                  borderColor: theme.colors.inputBorder,
                },
              ]}
              value={formData.last_name}
              onChangeText={(value) => updateField('last_name', value)}
              placeholder="Ex: Dupont"
              placeholderTextColor={theme.colors.textSecondary}
            />
          </View>

          {/* Email */}
          <View style={{ marginBottom: theme.spacing.lg }}>
            <Typography
              variant="body"
              weight="semibold"
              style={{ marginBottom: theme.spacing.sm }}
            >
              Email *
            </Typography>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: theme.colors.inputBackground,
                  color: theme.colors.text,
                  borderColor: theme.colors.inputBorder,
                },
              ]}
              value={formData.email}
              onChangeText={(value) => updateField('email', value)}
              placeholder="jean.dupont@email.com"
              placeholderTextColor={theme.colors.textSecondary}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          {/* Téléphone */}
          <PhoneInput
            label="Téléphone"
            value={formData.phone}
            onChangeText={(value) => updateField('phone', value)}
            placeholder="90 12 34 56"
          />

          {/* Adresse */}
          <View style={{ marginBottom: theme.spacing.lg }}>
            <Typography
              variant="body"
              weight="semibold"
              style={{ marginBottom: theme.spacing.sm }}
            >
              Adresse
            </Typography>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: theme.colors.inputBackground,
                  color: theme.colors.text,
                  borderColor: theme.colors.inputBorder,
                },
              ]}
              value={formData.address}
              onChangeText={(value) => updateField('address', value)}
              placeholder="123 Rue du Commerce"
              placeholderTextColor={theme.colors.textSecondary}
            />
          </View>

          {/* Ville */}
          <View style={{ marginBottom: theme.spacing.xl }}>
            <Typography
              variant="body"
              weight="semibold"
              style={{ marginBottom: theme.spacing.sm }}
            >
              Ville
            </Typography>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: theme.colors.inputBackground,
                  color: theme.colors.text,
                  borderColor: theme.colors.inputBorder,
                },
              ]}
              value={formData.city}
              onChangeText={(value) => updateField('city', value)}
              placeholder="Lomé"
              placeholderTextColor={theme.colors.textSecondary}
            />
          </View>
        </View>

        {/* Bouton sauvegarder */}
        <TouchableOpacity
          style={[
            styles.saveButton,
            {
              backgroundColor: theme.isDark ? '#10B981' : theme.colors.primary[500],
              marginHorizontal: theme.spacing.lg,
              marginBottom: theme.spacing['2xl'],
            },
          ]}
          onPress={handleSave}
          disabled={isSaving}
        >
          {isSaving ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={24} color="white" />
              <Typography variant="body" style={{ color: 'white', fontWeight: 'bold' }}>
                Enregistrer les modifications
              </Typography>
            </>
          )}
        </TouchableOpacity>
      </KeyboardAwareContainer>

      <AlertModal {...alertProps} />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  backButton: {
    padding: 8,
  },
  content: {
    flex: 1,
  },
  photoSection: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  photoContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  photo: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  photoPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  changePhotoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    gap: 8,
  },
  formSection: {
    flex: 1,
  },
  input: {
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    borderWidth: 1,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
})

export default ProfileEditScreen
