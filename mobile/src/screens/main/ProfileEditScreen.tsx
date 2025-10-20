import React, { useState, useEffect } from 'react'
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
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useNavigation } from '@react-navigation/native'
import { useSelector, useDispatch } from 'react-redux'
import { AppDispatch, RootState } from '../../store'
import * as ImagePicker from 'expo-image-picker'
import { useTheme } from '../../theme'
import { Typography } from '../../components/2025'
import apiService from '../../services/api'

interface ProfileFormData {
  first_name: string
  last_name: string
  email: string
  phone: string
  address: string
  city: string
}

/**
 * ProfileEditScreen - Consumer profile editing screen
 * Allows consumers to update their personal information and photo
 */
const ProfileEditScreen: React.FC = () => {
  const theme = useTheme()
  const navigation = useNavigation()
  const dispatch = useDispatch<AppDispatch>()
  const { user } = useSelector((state: RootState) => state.auth)

  const [loading, setLoading] = useState(false)
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
    loadUserProfile()
  }, [])

  const loadUserProfile = async () => {
    try {
      setLoading(true)
      if (user) {
        setFormData({
          first_name: user.first_name || '',
          last_name: user.last_name || '',
          email: user.email || '',
          phone: user.phone || '',
          address: user.address || '',
          city: user.city || '',
        })
        if (user.photo_url) {
          setPhotoUri(user.photo_url)
        }
      }
    } catch (error) {
      console.error('Erreur chargement profil:', error)
    } finally {
      setLoading(false)
    }
  }

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
        setPhotoUri(result.assets[0].uri)
        await uploadPhoto(result.assets[0].uri)
      }
    } catch (error) {
      console.error('Erreur sélection image:', error)
      Alert.alert('Erreur', "Impossible de sélectionner l'image")
    }
  }

  const uploadPhoto = async (uri: string) => {
    try {
      setUploading(true)

      // Create FormData
      const formData = new FormData()
      const filename = uri.split('/').pop() || 'photo.jpg'
      const match = /\.(\w+)$/.exec(filename)
      const type = match ? `image/${match[1]}` : 'image/jpeg'

      formData.append('photo', {
        uri,
        name: filename,
        type,
      } as any)

      const response = await apiService.post('/consumers/profile/photo', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })

      if (response.data.success) {
        Alert.alert('Succès', 'Photo mise à jour avec succès')
      }
    } catch (error: any) {
      console.error('Erreur upload photo:', error)
      Alert.alert(
        'Erreur',
        error.response?.data?.message || "Impossible d'uploader la photo"
      )
    } finally {
      setUploading(false)
    }
  }

  const handleSave = async () => {
    try {
      setLoading(true)

      // Validation
      if (!formData.first_name.trim() || !formData.last_name.trim()) {
        Alert.alert('Erreur', 'Le prénom et le nom sont requis')
        return
      }

      if (!formData.email.trim()) {
        Alert.alert('Erreur', "L'email est requis")
        return
      }

      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(formData.email)) {
        Alert.alert('Erreur', 'Adresse email invalide')
        return
      }

      const response = await apiService.put('/consumers/profile', formData)

      if (response.data.success) {
        Alert.alert('Succès', 'Profil mis à jour avec succès', [
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
        error.response?.data?.message || 'Impossible de mettre à jour le profil'
      )
    } finally {
      setLoading(false)
    }
  }

  const updateField = (field: keyof ProfileFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  if (loading && !formData.first_name) {
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

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
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
              placeholder="+228 XX XX XX XX"
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
          disabled={loading}
        >
          {loading ? (
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
