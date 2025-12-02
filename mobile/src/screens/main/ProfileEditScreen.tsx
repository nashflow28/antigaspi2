import React, { useState, useEffect, useCallback } from 'react'
import {
  View,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  StatusBar,
  Platform,
  KeyboardAvoidingView,
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

const ProfileEditScreen: React.FC<ProfileEditScreenProps> = ({ navigation: navigationOverride }) => {
  const theme = useTheme()
  const defaultNavigation = useNavigation<any>()
  const navigation = navigationOverride ?? defaultNavigation
  const dispatch = useDispatch<AppDispatch>()
  const { user } = useSelector((state: RootState) => state.auth)

  const [isLoadingProfile, setIsLoadingProfile] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [photoUri, setPhotoUri] = useState<string | null>(null)
  const [formData, setFormData] = useState<ProfileFormData>({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
  })

  useEffect(() => {
    if (user) {
      setFormData({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        email: user.email || '',
        phone: user.phone || '',
        address: user.address || '',
        city: user.city || '',
      })
      setPhotoUri(user.photo_url ?? null)
    } else {
      setFormData({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        address: '',
        city: '',
      })
      setPhotoUri(null)
    }

    setIsLoadingProfile(false)
  }, [user])

  const syncProfileUpdates = useCallback(async () => {
    try {
      const updatedUser = await dispatch(refreshProfile()).unwrap()
      await apiService.setStoredUser(updatedUser)
    } catch (syncError) {
      console.error('Erreur synchronisation profil:', syncError)
    }
  }, [dispatch])

  const pickImage = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync()

      if (permissionResult.status !== 'granted') {
        Alert.alert(
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
          Alert.alert('Photo trop lourde', 'La photo ne doit pas dépasser 5 MB')
          return
        }

        setPhotoUri(asset.uri)
        await uploadPhoto(asset)
      }
    } catch (error) {
      console.error('Erreur sélection image:', error)
      Alert.alert('Erreur', "Impossible de sélectionner l'image")
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

      const response = await apiService.post<ApiResponse<{ photo_url: string; full_url?: string }>>(
        '/consumers/profile/photo',
        uploadFormData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      )

      if (response.success) {
        if (response.data?.full_url || response.data?.photo_url) {
          setPhotoUri(response.data.full_url || response.data.photo_url)
        }
        await syncProfileUpdates()

        Alert.alert('Succès', response.message || 'Photo mise à jour avec succès')
      }
    } catch (error: any) {
      console.error('Erreur upload photo:', error)
      Alert.alert(
        'Erreur',
        error.response?.data?.message || error.message || "Impossible d'uploader la photo"
      )
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
      Alert.alert('Erreur', 'Le prénom et le nom sont requis')
      return
    }

    if (sanitizedData.first_name.length < 2) {
      Alert.alert('Erreur', 'Le prénom doit contenir au moins 2 caractères')
      return
    }

    if (sanitizedData.last_name.length < 2) {
      Alert.alert('Erreur', 'Le nom doit contenir au moins 2 caractères')
      return
    }

    if (!sanitizedData.email) {
      Alert.alert('Erreur', "L'email est requis")
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(sanitizedData.email)) {
      Alert.alert('Erreur', 'Adresse email invalide')
      return
    }

    // Validation téléphone désactivée temporairement
    // Le backend accepte maintenant tout format (max 20 caractères)
    // if (sanitizedData.phone && !PHONE_REGEX.test(sanitizedData.phone)) {
    //   Alert.alert(
    //     'Erreur',
    //     'Format de téléphone invalide. Utilisez le format: +XXX XX XX XX XX\n' +
    //     'Indicatifs acceptés: +221 (Sénégal), +223 (Mali), +225 (Côte d\'Ivoire), +226 (Burkina Faso), +227 (Niger), +228 (Togo), +229 (Bénin)'
    //   )
    //   return
    // }

    try {
      setIsSaving(true)

      const response = await apiService.put<ApiResponse<User>>(
        '/consumers/profile',
        sanitizedData
      )

      if (response.success) {
        await syncProfileUpdates()

        Alert.alert('Succès', response.message || 'Profil mis à jour avec succès', [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ])
      }
    } catch (error: any) {
      console.error('Erreur mise à jour profil:', error)
      Alert.alert(
        'Erreur',
        error.response?.data?.message || error.message || 'Impossible de mettre à jour le profil'
      )
    } finally {
      setIsSaving(false)
    }
  }

  const updateField = (field: keyof ProfileFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
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
      <View style={[styles.header, { backgroundColor: theme.colors.primary[500] }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Typography variant="h3" style={{ color: 'white', fontWeight: 'bold' }}>
          Modifier le profil
        </Typography>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: 40 }}
        >
        {/* Photo de profil */}
        <View
          style={[
            styles.photoSection,
            { backgroundColor: theme.colors.surface.light, marginBottom: theme.spacing.xl },
          ]}
        >
          <View style={styles.photoContainer}>
            {photoUri ? (
              <Image source={{ uri: photoUri }} style={styles.photo} />
            ) : (
              <View
                style={[
                  styles.photoPlaceholder,
                  { backgroundColor: theme.colors.neutral[100] },
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
              { backgroundColor: theme.colors.primary[500] },
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
                  backgroundColor: theme.colors.surface.light,
                  color: theme.colors.text,
                  borderColor: theme.colors.border,
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
                  backgroundColor: theme.colors.surface.light,
                  color: theme.colors.text,
                  borderColor: theme.colors.border,
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
                  backgroundColor: theme.colors.surface.light,
                  color: theme.colors.text,
                  borderColor: theme.colors.border,
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
          <View style={{ marginBottom: theme.spacing.lg }}>
            <Typography
              variant="body"
              weight="semibold"
              style={{ marginBottom: theme.spacing.sm }}
            >
              Téléphone
            </Typography>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: theme.colors.surface.light,
                  color: theme.colors.text,
                  borderColor: theme.colors.border,
                },
              ]}
              value={formData.phone}
              onChangeText={(value) => updateField('phone', value)}
              placeholder="+XXX XX XX XX XX (Afrique de l'Ouest)"
              placeholderTextColor={theme.colors.textSecondary}
              keyboardType="phone-pad"
            />
          </View>

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
                  backgroundColor: theme.colors.surface.light,
                  color: theme.colors.text,
                  borderColor: theme.colors.border,
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
                  backgroundColor: theme.colors.surface.light,
                  color: theme.colors.text,
                  borderColor: theme.colors.border,
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
              backgroundColor: theme.colors.primary[500],
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
        </ScrollView>
      </KeyboardAvoidingView>
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
