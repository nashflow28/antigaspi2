import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  StatusBar,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useNavigation } from '@react-navigation/native'
import { useSelector } from 'react-redux'
import { RootState } from '../../store'
import * as ImagePicker from 'expo-image-picker'
import { useTheme } from '../../theme'
import apiService from '../../services/api'
import useMerchantLocation, { LocationStatusVariant } from '../../hooks/useMerchantLocation'

interface ProfileFormData {
  business_name: string
  business_type: string
  description: string
  phone: string
  address: string
  city: string
  siret: string
}

const MerchantProfileEditScreen: React.FC = () => {
  const theme = useTheme()
  const navigation = useNavigation()
  const { user } = useSelector((state: RootState) => state.auth)

  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [photoUri, setPhotoUri] = useState<string | null>(null)
  const [formData, setFormData] = useState<ProfileFormData>({
    business_name: '',
    business_type: '',
    description: '',
    phone: '',
    address: '',
    city: '',
    siret: '',
  })
  const {
    latitude,
    longitude,
    setLatitude,
    setLongitude,
    locationLoading,
    status: locationStatus,
    loadMerchantLocation,
    requestCurrentLocation,
    saveLocationIfNeeded,
  } = useMerchantLocation()

  useEffect(() => {
    loadMerchantProfile()
    void loadMerchantLocation().catch((error) => {
      console.error('Erreur chargement localisation:', error)
    })
  }, [loadMerchantLocation])

  const loadMerchantProfile = async () => {
    try {
      setLoading(true)
      // Charger le profil merchant depuis l'endpoint (à implémenter ou utiliser les données user)
      // Pour l'instant on utilise les données du user
      if (user) {
        setFormData({
          business_name: user.merchant?.business_name || '',
          business_type: user.merchant?.business_type || '',
          description: user.merchant?.description || '',
          phone: user.phone || '',
          address: user.address || '',
          city: user.city || '',
          siret: user.merchant?.siret || '',
        })
        if (user.merchant?.photo_url) {
          setPhotoUri(user.merchant.photo_url)
        }
      }
    } catch (error) {
      console.error('Erreur chargement profil:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleUseCurrentLocation = async () => {
    try {
      await requestCurrentLocation()
    } catch (error) {
      console.error('Erreur géolocalisation:', error)
      Alert.alert(
        'Géolocalisation',
        error instanceof Error
          ? error.message
          : 'Impossible de récupérer votre position actuelle'
      )
    }
  }

  const pickImage = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync()

      if (permissionResult.status !== 'granted') {
        Alert.alert('Permission refusée', 'Vous devez autoriser l\'accès à la galerie pour changer votre photo.')
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
      Alert.alert('Erreur', 'Impossible de sélectionner l\'image')
    }
  }

  const uploadPhoto = async (uri: string) => {
    try {
      setUploading(true)

      // Créer FormData
      const formData = new FormData()
      const filename = uri.split('/').pop() || 'photo.jpg'
      const match = /\.(\w+)$/.exec(filename)
      const type = match ? `image/${match[1]}` : 'image/jpeg'

      formData.append('photo', {
        uri,
        name: filename,
        type,
      } as any)

      const response = await apiService.post('/merchants/profile/photo', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })

      if (response.data.success) {
        Alert.alert('Succès', 'Photo mise à jour avec succès')
      }
    } catch (error: any) {
      console.error('Erreur upload photo:', error)
      Alert.alert('Erreur', error.response?.data?.message || 'Impossible d\'uploader la photo')
    } finally {
      setUploading(false)
    }
  }

  const handleSave = async () => {
    try {
      setLoading(true)

      if (!formData.business_name.trim()) {
        Alert.alert('Erreur', 'Le nom de l\'entreprise est requis')
        return
      }

      const response = await apiService.put('/merchants/profile', formData)

      if (!response.data?.success) {
        throw new Error(response.data?.message || 'Impossible de mettre à jour le profil')
      }

      let locationUpdated = false

      try {
        locationUpdated = await saveLocationIfNeeded()
      } catch (locationError) {
        if (locationError instanceof Error) {
          throw locationError
        }

        throw new Error('Impossible de mettre à jour la localisation')
      }

      const successMessage = locationUpdated
        ? 'Profil et localisation mis à jour avec succès'
        : 'Profil mis à jour avec succès'

      Alert.alert('Succès', successMessage, [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ])
    } catch (error: any) {
      console.error('Erreur mise à jour profil:', error)
      const message =
        error instanceof Error
          ? error.message
          : error?.response?.data?.message || 'Impossible de mettre à jour le profil'
      Alert.alert('Erreur', message)
    } finally {
      setLoading(false)
    }
  }

  const updateField = (field: keyof ProfileFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const getLocationStatusColor = (variant: LocationStatusVariant) => {
    switch (variant) {
      case 'success':
        return theme.colors.semantic.success
      case 'error':
        return theme.colors.semantic.error
      case 'info':
        return theme.colors.accent.blue
      default:
        return theme.colors.textSecondary
    }
  }

  if (loading && !formData.business_name) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary[500]} />
      </View>
    )
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar barStyle="dark-content" backgroundColor={theme.colors.background} />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.colors.primary[500] }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Modifier le profil</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Photo de profil */}
        <View style={[styles.photoSection, { backgroundColor: theme.colors.surface.light }]}>
          <View style={styles.photoContainer}>
            {photoUri ? (
              <Image source={{ uri: photoUri }} style={styles.photo} />
            ) : (
              <View style={[styles.photoPlaceholder, { backgroundColor: theme.colors.neutral[100] }]}>
                <Ionicons name="storefront" size={48} color={theme.colors.neutral[400]} />
              </View>
            )}
            {uploading && (
              <View style={styles.uploadingOverlay}>
                <ActivityIndicator size="large" color="white" />
              </View>
            )}
          </View>
          <TouchableOpacity
            style={[styles.changePhotoButton, { backgroundColor: theme.colors.primary[500] }]}
            onPress={pickImage}
            disabled={uploading}
          >
            <Ionicons name="camera" size={20} color="white" />
            <Text style={styles.changePhotoText}>Changer la photo</Text>
          </TouchableOpacity>
        </View>

        {/* Formulaire */}
        <View style={styles.formSection}>
          {/* Nom de l'entreprise */}
          <View style={styles.fieldGroup}>
            <Text style={[styles.label, { color: theme.colors.text }]}>
              Nom de l'entreprise *
            </Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.colors.surface.light, color: theme.colors.text }]}
              value={formData.business_name}
              onChangeText={(value) => updateField('business_name', value)}
              placeholder="Ex: Boulangerie Martin"
              placeholderTextColor={theme.colors.textSecondary}
            />
          </View>

          {/* Type d'entreprise */}
          <View style={styles.fieldGroup}>
            <Text style={[styles.label, { color: theme.colors.text }]}>
              Type d'entreprise
            </Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.colors.surface.light, color: theme.colors.text }]}
              value={formData.business_type}
              onChangeText={(value) => updateField('business_type', value)}
              placeholder="Ex: Boulangerie, Restaurant, Épicerie"
              placeholderTextColor={theme.colors.textSecondary}
            />
          </View>

          {/* Description */}
          <View style={styles.fieldGroup}>
            <Text style={[styles.label, { color: theme.colors.text }]}>Description</Text>
            <TextInput
              style={[
                styles.input,
                styles.textArea,
                { backgroundColor: theme.colors.surface.light, color: theme.colors.text },
              ]}
              value={formData.description}
              onChangeText={(value) => updateField('description', value)}
              placeholder="Décrivez votre commerce..."
              placeholderTextColor={theme.colors.textSecondary}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          {/* Téléphone */}
          <View style={styles.fieldGroup}>
            <Text style={[styles.label, { color: theme.colors.text }]}>Téléphone</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.colors.surface.light, color: theme.colors.text }]}
              value={formData.phone}
              onChangeText={(value) => updateField('phone', value)}
              placeholder="+228 XX XX XX XX"
              placeholderTextColor={theme.colors.textSecondary}
              keyboardType="phone-pad"
            />
          </View>

          {/* Adresse */}
          <View style={styles.fieldGroup}>
            <Text style={[styles.label, { color: theme.colors.text }]}>Adresse</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.colors.surface.light, color: theme.colors.text }]}
              value={formData.address}
              onChangeText={(value) => updateField('address', value)}
              placeholder="123 Rue du Commerce"
              placeholderTextColor={theme.colors.textSecondary}
            />
          </View>

          {/* Ville */}
          <View style={styles.fieldGroup}>
            <Text style={[styles.label, { color: theme.colors.text }]}>Ville</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.colors.surface.light, color: theme.colors.text }]}
              value={formData.city}
              onChangeText={(value) => updateField('city', value)}
              placeholder="Lomé"
              placeholderTextColor={theme.colors.textSecondary}
            />
        </View>

        {/* SIRET */}
        <View style={styles.fieldGroup}>
          <Text style={[styles.label, { color: theme.colors.text }]}>Numéro SIRET</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.colors.surface.light, color: theme.colors.text }]}
              value={formData.siret}
              onChangeText={(value) => updateField('siret', value)}
              placeholder="12345678901234"
              placeholderTextColor={theme.colors.textSecondary}
              keyboardType="numeric"
            maxLength={14}
          />
        </View>
      </View>

      {/* Localisation */}
      <View
        style={[
          styles.locationSection,
          {
            backgroundColor: theme.colors.surface.light,
            borderColor: theme.withOpacity(theme.colors.primary[500], 0.2),
          },
        ]}
      >
        <View style={styles.locationHeader}>
          <Text style={[styles.locationTitle, { color: theme.colors.text }]}>Localisation du commerce</Text>
          <TouchableOpacity
            style={[
              styles.locationButton,
              {
                borderColor: theme.colors.primary[500],
                backgroundColor: theme.withOpacity(theme.colors.primary[500], 0.12),
              },
            ]}
            onPress={handleUseCurrentLocation}
            disabled={locationLoading}
          >
            {locationLoading ? (
              <ActivityIndicator size="small" color={theme.colors.primary[600] || theme.colors.primary[500]} />
            ) : (
              <>
                <Ionicons name="locate" size={18} color={theme.colors.primary[600] || theme.colors.primary[500]} />
                <Text
                  style={[
                    styles.locationButtonText,
                    { color: theme.colors.primary[600] || theme.colors.primary[500] },
                  ]}
                >
                  Ma position
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        <Text style={[styles.locationDescription, { color: theme.colors.textSecondary }]}> 
          Renseignez les coordonnées GPS pour apparaître sur la carte et permettre la recherche par proximité.
        </Text>

        <View style={styles.locationInputsRow}>
          <View style={styles.locationField}>
            <Text style={[styles.label, { color: theme.colors.text }]}>Latitude</Text>
            <TextInput
              style={[
                styles.input,
                styles.locationInput,
                { backgroundColor: theme.colors.surface.light, color: theme.colors.text },
              ]}
              value={latitude}
              onChangeText={setLatitude}
              placeholder="6.131900"
              placeholderTextColor={theme.colors.textSecondary}
              keyboardType="decimal-pad"
              autoCorrect={false}
            />
          </View>

          <View style={{ width: 16 }} />

          <View style={styles.locationField}>
            <Text style={[styles.label, { color: theme.colors.text }]}>Longitude</Text>
            <TextInput
              style={[
                styles.input,
                styles.locationInput,
                { backgroundColor: theme.colors.surface.light, color: theme.colors.text },
              ]}
              value={longitude}
              onChangeText={setLongitude}
              placeholder="1.222700"
              placeholderTextColor={theme.colors.textSecondary}
              keyboardType="decimal-pad"
              autoCorrect={false}
            />
          </View>
        </View>

        <Text
          style={[
            styles.locationStatus,
            { color: getLocationStatusColor(locationStatus.variant) },
          ]}
        >
          {locationStatus.message}
        </Text>
      </View>

      {/* Bouton sauvegarder */}
      <TouchableOpacity
        style={[styles.saveButton, { backgroundColor: theme.colors.primary[500] }]}
        onPress={handleSave}
        disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={24} color="white" />
              <Text style={styles.saveButtonText}>Enregistrer les modifications</Text>
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
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  photoSection: {
    alignItems: 'center',
    paddingVertical: 32,
    marginBottom: 24,
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
  changePhotoText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  formSection: {
    paddingHorizontal: 16,
  },
  fieldGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
  },
  textArea: {
    minHeight: 100,
    paddingTop: 14,
  },
  locationSection: {
    marginHorizontal: 16,
    marginTop: 24,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  locationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  locationTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  locationDescription: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 16,
  },
  locationInputsRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 12,
  },
  locationField: {
    flex: 1,
  },
  locationInput: {
    fontVariant: ['tabular-nums'],
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    gap: 6,
  },
  locationButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
  locationStatus: {
    fontSize: 12,
    lineHeight: 18,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 16,
    marginTop: 24,
    marginBottom: 32,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
})

export default MerchantProfileEditScreen
