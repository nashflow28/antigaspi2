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
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useNavigation } from '@react-navigation/native'
import { useSelector, useDispatch } from 'react-redux'
import { RootState } from '../../store'
import { refreshProfile } from '../../store/slices/authSlice'
import * as ImagePicker from 'expo-image-picker'
import { useTheme } from '../../theme'
import apiService, { API_BASE_URL } from '../../services/api'
import * as Location from 'expo-location'
import MapLocationPicker from '../../components/MapLocationPicker'

interface ProfileFormData {
  business_name: string
  business_type: string
  description: string
  phone: string
  address: string
  city: string
  siret: string
}

// Helper pour construire l'URL complète de la photo
const buildPhotoUrl = (photoUrl: string | null | undefined): string | null => {
  if (!photoUrl) return null
  if (photoUrl.startsWith('http')) return photoUrl
  if (photoUrl.startsWith('file://')) return photoUrl // Local file URI
  // Construct full URL (remove /api from base URL)
  const serverBaseUrl = API_BASE_URL.replace(/\/api\/?$/, '')
  return `${serverBaseUrl}${photoUrl}`
}

const MerchantProfileEditScreen: React.FC = () => {
  const theme = useTheme()
  const navigation = useNavigation()
  const dispatch = useDispatch()
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
  const [locationLoading, setLocationLoading] = useState(false)
  const [latitude, setLatitude] = useState('')
  const [longitude, setLongitude] = useState('')
  const [initialLatitudeValue, setInitialLatitudeValue] = useState<number | null>(null)
  const [initialLongitudeValue, setInitialLongitudeValue] = useState<number | null>(null)
  const [hasLocation, setHasLocation] = useState(false)
  const [mapPickerVisible, setMapPickerVisible] = useState(false)

  const formatCoordinate = (value: number | null): string => {
    if (value === null || Number.isNaN(value)) {
      return ''
    }
    return Number(value).toFixed(6)
  }

  const parseCoordinateInput = (value: string): number | null => {
    if (!value || !value.trim()) {
      return null
    }

    const normalized = value.trim().replace(',', '.')
    const numeric = Number(normalized)
    return Number.isFinite(numeric) ? numeric : null
  }

  const parseCoordinateFromApi = (value: unknown): number | null => {
    if (typeof value === 'number') {
      return Number.isFinite(value) ? value : null
    }

    if (typeof value === 'string') {
      const numeric = Number(value)
      return Number.isFinite(numeric) ? numeric : null
    }

    return null
  }

  useEffect(() => {
    loadMerchantProfile()
    loadMerchantLocation()
  }, [])

  const loadMerchantProfile = async () => {
    try {
      setLoading(true)
      // Rafraîchir le profil depuis l'API pour avoir les données merchant à jour
      const resultAction = await dispatch(refreshProfile() as any)

      if (refreshProfile.fulfilled.match(resultAction)) {
        const freshUser = resultAction.payload
        setFormData({
          business_name: freshUser.merchant?.business_name || '',
          business_type: freshUser.merchant?.business_type || '',
          description: freshUser.merchant?.description || '',
          phone: freshUser.phone || '',
          address: freshUser.address || '',
          city: freshUser.city || '',
          siret: freshUser.merchant?.siret || '',
        })
        // 🐛 BUG FIX: Build full URL for photo
        const photoFullUrl = buildPhotoUrl(freshUser.merchant?.photo_url)
        if (photoFullUrl) {
          setPhotoUri(photoFullUrl)
        }
      } else if (user) {
        // Fallback sur les données existantes si le refresh échoue
        setFormData({
          business_name: user.merchant?.business_name || '',
          business_type: user.merchant?.business_type || '',
          description: user.merchant?.description || '',
          phone: user.phone || '',
          address: user.address || '',
          city: user.city || '',
          siret: user.merchant?.siret || '',
        })
        // 🐛 BUG FIX: Build full URL for photo
        const photoFullUrl = buildPhotoUrl(user.merchant?.photo_url)
        if (photoFullUrl) {
          setPhotoUri(photoFullUrl)
        }
      }
    } catch (error) {
      console.error('Erreur chargement profil:', error)
      // Fallback sur les données existantes en cas d'erreur
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
      }
    } finally {
      setLoading(false)
    }
  }

  const loadMerchantLocation = async () => {
    try {
      setLocationLoading(true)
      const response = await apiService.getMerchantLocation()

      // 🐛 BUG FIX #22: apiService methods return response.data directly
      if (response.success) {
        const locationData = response.data
        const latValue = parseCoordinateFromApi(locationData?.latitude)
        const lngValue = parseCoordinateFromApi(locationData?.longitude)

        setInitialLatitudeValue(latValue)
        setInitialLongitudeValue(lngValue)
        setLatitude(formatCoordinate(latValue))
        setLongitude(formatCoordinate(lngValue))
        setHasLocation(Boolean(locationData?.has_location || (latValue !== null && lngValue !== null)))
      }
    } catch (error) {
      console.error('Erreur chargement localisation:', error)
    } finally {
      setLocationLoading(false)
    }
  }

  const handleUseCurrentLocation = async () => {
    try {
      setLocationLoading(true)
      const { status } = await Location.requestForegroundPermissionsAsync()

      if (status !== 'granted') {
        throw new Error('Permission de géolocalisation refusée')
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      })

      const newLatitude = Number(position.coords.latitude)
      const newLongitude = Number(position.coords.longitude)

      setLatitude(formatCoordinate(newLatitude))
      setLongitude(formatCoordinate(newLongitude))
    } catch (error) {
      console.error('Erreur géolocalisation:', error)
      Alert.alert(
        'Géolocalisation',
        error instanceof Error
          ? error.message
          : 'Impossible de récupérer votre position actuelle'
      )
    } finally {
      setLocationLoading(false)
    }
  }

  const handleMapLocationSelect = async (lat: number, lng: number) => {
    // Update local state
    setLatitude(formatCoordinate(lat))
    setLongitude(formatCoordinate(lng))
    setInitialLatitudeValue(lat)
    setInitialLongitudeValue(lng)
    setHasLocation(true)

    // BUG FIX: Auto-save location to backend when selected from map
    try {
      setLoading(true)
      const response = await apiService.updateMerchantLocation({
        latitude: lat,
        longitude: lng,
      })

      if (response.success) {
        const savedLat = parseCoordinateFromApi(response.data?.latitude) ?? lat
        const savedLng = parseCoordinateFromApi(response.data?.longitude) ?? lng
        setLatitude(formatCoordinate(savedLat))
        setLongitude(formatCoordinate(savedLng))
        setInitialLatitudeValue(savedLat)
        setInitialLongitudeValue(savedLng)
        setHasLocation(true)
        // Refresh Redux store
        await dispatch(refreshProfile() as any)
        Alert.alert('Succès', 'Position mise à jour avec succès')
        console.log('[MerchantProfileEdit] Location saved:', { lat: savedLat, lng: savedLng })
      } else {
        throw new Error(response.message || 'Erreur lors de la sauvegarde')
      }
    } catch (error: any) {
      console.error('[MerchantProfileEdit] Location save error:', error)
      Alert.alert(
        'Erreur',
        error.response?.data?.message || error.message || 'Impossible de sauvegarder la position'
      )
    } finally {
      setLoading(false)
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
      const formDataObj = new FormData()
      const filename = uri.split('/').pop() || 'photo.jpg'
      const match = /\.(\w+)$/.exec(filename)
      const type = match ? `image/${match[1]}` : 'image/jpeg'

      formDataObj.append('photo', {
        uri,
        name: filename,
        type,
      } as any)

      // 🐛 BUG FIX: Use uploadFile() with native fetch instead of post() with axios
      // axios has known issues with FormData on React Native
      const response = await apiService.uploadFile('/merchants/profile/photo', formDataObj)

      // 🐛 BUG FIX: apiService.post returns response.data directly
      if (response.success) {
        // 🐛 BUG FIX: Update photoUri with server URL (not local file URI)
        const fullPhotoUrl = buildPhotoUrl(response.data?.photo_url)
        if (fullPhotoUrl) {
          setPhotoUri(fullPhotoUrl)
          console.log('📸 [MerchantProfileEdit] Photo URL mise à jour:', fullPhotoUrl)
        }

        // 🐛 BUG FIX: Refresh Redux store to sync photo_url
        await dispatch(refreshProfile() as any)

        Alert.alert('Succès', 'Photo mise à jour avec succès')
      } else {
        throw new Error(response.message || 'Échec de l\'upload')
      }
    } catch (error: any) {
      console.error('Erreur upload photo:', error)
      // Revert to previous photo if upload failed
      const previousPhotoUrl = buildPhotoUrl(user?.merchant?.photo_url)
      setPhotoUri(previousPhotoUrl)
      Alert.alert('Erreur', error.response?.data?.message || error.message || 'Impossible d\'uploader la photo')
    } finally {
      setUploading(false)
    }
  }

  const saveLocationIfNeeded = async (): Promise<boolean> => {
    const hasLatInput = latitude.trim().length > 0
    const hasLngInput = longitude.trim().length > 0

    // 🐛 BUG FIX #21: Improved coordinate validation to require BOTH coordinates
    if (!hasLatInput && !hasLngInput) {
      // No coordinates entered - restore initial values if they exist
      if (initialLatitudeValue !== null || initialLongitudeValue !== null) {
        setLatitude(formatCoordinate(initialLatitudeValue))
        setLongitude(formatCoordinate(initialLongitudeValue))
      }
      return false
    }

    // If only ONE coordinate is entered, require BOTH
    if (hasLatInput && !hasLngInput) {
      throw new Error('Veuillez entrer également la longitude (ou laissez les deux champs vides).')
    }

    if (!hasLatInput && hasLngInput) {
      throw new Error('Veuillez entrer également la latitude (ou laissez les deux champs vides).')
    }

    // Both coordinates entered - parse and validate
    const parsedLatitude = parseCoordinateInput(latitude)
    const parsedLongitude = parseCoordinateInput(longitude)

    if (parsedLatitude === null) {
      throw new Error('Latitude invalide. Utilisez un nombre entre -90 et 90.')
    }

    if (parsedLatitude < -90 || parsedLatitude > 90) {
      throw new Error('La latitude doit être comprise entre -90 et 90.')
    }

    if (parsedLongitude === null) {
      throw new Error('Longitude invalide. Utilisez un nombre entre -180 et 180.')
    }

    if (parsedLongitude < -180 || parsedLongitude > 180) {
      throw new Error('La longitude doit être comprise entre -180 et 180.')
    }

    const hasChanged =
      initialLatitudeValue === null ||
      initialLongitudeValue === null ||
      Math.abs(parsedLatitude - initialLatitudeValue) > 0.000001 ||
      Math.abs(parsedLongitude - initialLongitudeValue) > 0.000001

    if (!hasChanged) {
      return false
    }

    const response = await apiService.updateMerchantLocation({
      latitude: parsedLatitude,
      longitude: parsedLongitude,
    })

    // 🐛 BUG FIX #22: apiService methods return response.data directly
    if (!response.success) {
      throw new Error(response.message || 'Impossible de mettre à jour la localisation')
    }

    const savedLatValue = parseCoordinateFromApi(response.data?.latitude) ?? parsedLatitude
    const savedLngValue = parseCoordinateFromApi(response.data?.longitude) ?? parsedLongitude

    setLatitude(formatCoordinate(savedLatValue))
    setLongitude(formatCoordinate(savedLngValue))
    setInitialLatitudeValue(savedLatValue)
    setInitialLongitudeValue(savedLngValue)
    setHasLocation(true)

    return true
  }

  const handleSave = async () => {
    try {
      setLoading(true)

      if (!formData.business_name.trim()) {
        Alert.alert('Erreur', 'Le nom de l\'entreprise est requis')
        return
      }

      // 🐛 DEBUG: Log request data
      console.log('📤 [MerchantProfileEdit] Envoi données:', JSON.stringify(formData, null, 2))

      const response = await apiService.put('/merchants/profile', formData)

      // 🐛 DEBUG: Log response - apiService.put() returns response.data directly
      console.log('📥 [MerchantProfileEdit] Réponse complète:', JSON.stringify(response, null, 2))

      // 🐛 BUG FIX #22: apiService.put() returns response.data directly, not the full response
      // So we access response.success, NOT response.data.success
      if (!response.success) {
        console.error('❌ [MerchantProfileEdit] API returned success=false:', response)
        throw new Error(response.message || 'Impossible de mettre à jour le profil')
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

      // 🐛 BUG FIX #23: Refresh user data from backend to update Redux store
      console.log('🔄 [MerchantProfileEdit] Rafraîchissement des données user...')
      await dispatch(refreshProfile() as any)
      console.log('✅ [MerchantProfileEdit] Données user rafraîchies')

      const successMessage = locationUpdated
        ? 'Profil et localisation mis à jour avec succès'
        : 'Profil mis à jour avec succès'

      Alert.alert('Succès', successMessage, [
        {
          text: 'OK',
          onPress: () => {
            if (navigation.canGoBack()) {
              navigation.goBack()
            } else {
              (navigation as any).navigate('Dashboard')
            }
          },
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

  const hasDraftCoordinates = latitude.trim().length > 0 && longitude.trim().length > 0
  const draftCoordinatesAreValid = (() => {
    if (!hasDraftCoordinates) {
      return false
    }

    const parsedLat = parseCoordinateInput(latitude)
    const parsedLng = parseCoordinateInput(longitude)

    if (parsedLat === null || parsedLng === null) {
      return false
    }

    return parsedLat >= -90 && parsedLat <= 90 && parsedLng >= -180 && parsedLng <= 180
  })()
  const coordinatesChangedFromInitial = (() => {
    if (!hasDraftCoordinates) {
      return false
    }

    const parsedLat = parseCoordinateInput(latitude)
    const parsedLng = parseCoordinateInput(longitude)

    if (parsedLat === null || parsedLng === null) {
      return false
    }

    if (initialLatitudeValue === null || initialLongitudeValue === null) {
      return true
    }

    return (
      Math.abs(parsedLat - initialLatitudeValue) > 0.000001 ||
      Math.abs(parsedLng - initialLongitudeValue) > 0.000001
    )
  })()

  if (loading && !formData.business_name) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary[500]} />
      </View>
    )
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar barStyle={theme.isDark ? "light-content" : "dark-content"} backgroundColor={theme.colors.background} />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.isDark ? '#0F1622' : theme.colors.primary[500] }]}>
        <TouchableOpacity onPress={() => {
          if (navigation.canGoBack()) {
            navigation.goBack()
          } else {
            (navigation as any).navigate('Dashboard')
          }
        }} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Modifier le profil</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Photo de profil */}
        <View style={[styles.photoSection, { backgroundColor: theme.colors.cardBackground, borderColor: theme.colors.cardBorder, borderWidth: 1 }]}>
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
            style={[styles.changePhotoButton, { backgroundColor: theme.isDark ? '#10B981' : theme.colors.primary[500] }]}
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
              style={[styles.input, { backgroundColor: theme.colors.inputBackground, borderColor: theme.colors.inputBorder, borderWidth: 1, color: theme.colors.text }]}
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
              style={[styles.input, { backgroundColor: theme.colors.inputBackground, borderColor: theme.colors.inputBorder, borderWidth: 1, color: theme.colors.text }]}
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
              style={[styles.input, { backgroundColor: theme.colors.inputBackground, borderColor: theme.colors.inputBorder, borderWidth: 1, color: theme.colors.text }]}
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
              style={[styles.input, { backgroundColor: theme.colors.inputBackground, borderColor: theme.colors.inputBorder, borderWidth: 1, color: theme.colors.text }]}
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
              style={[styles.input, { backgroundColor: theme.colors.inputBackground, borderColor: theme.colors.inputBorder, borderWidth: 1, color: theme.colors.text }]}
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
              style={[styles.input, { backgroundColor: theme.colors.inputBackground, borderColor: theme.colors.inputBorder, borderWidth: 1, color: theme.colors.text }]}
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
            backgroundColor: theme.colors.cardBackground,
            borderColor: theme.colors.cardBorder,
          },
        ]}
      >
        <View style={styles.locationHeader}>
          <Text style={[styles.locationTitle, { color: theme.colors.text }]}>Localisation du commerce</Text>
          <View style={styles.locationButtonsRow}>
            <TouchableOpacity
              style={[
                styles.locationButton,
                {
                  borderColor: theme.isDark ? '#10B981' : theme.colors.primary[500],
                  backgroundColor: theme.isDark ? theme.withOpacity('#10B981', 0.15) : theme.withOpacity(theme.colors.primary[500], 0.12),
                },
              ]}
              onPress={handleUseCurrentLocation}
              disabled={locationLoading}
            >
              {locationLoading ? (
                <ActivityIndicator size="small" color={theme.isDark ? '#10B981' : (theme.colors.primary[600] || theme.colors.primary[500])} />
              ) : (
                <>
                  <Ionicons name="locate" size={18} color={theme.isDark ? '#10B981' : (theme.colors.primary[600] || theme.colors.primary[500])} />
                  <Text
                    style={[
                      styles.locationButtonText,
                      { color: theme.isDark ? '#10B981' : (theme.colors.primary[600] || theme.colors.primary[500]) },
                    ]}
                  >
                    GPS
                  </Text>
                </>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.locationButton,
                {
                  borderColor: theme.isDark ? '#3B82F6' : '#2563EB',
                  backgroundColor: theme.isDark ? theme.withOpacity('#3B82F6', 0.15) : theme.withOpacity('#2563EB', 0.12),
                },
              ]}
              onPress={() => setMapPickerVisible(true)}
            >
              <Ionicons name="map" size={18} color={theme.isDark ? '#3B82F6' : '#2563EB'} />
              <Text
                style={[
                  styles.locationButtonText,
                  { color: theme.isDark ? '#3B82F6' : '#2563EB' },
                ]}
              >
                Carte
              </Text>
            </TouchableOpacity>
          </View>
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
            {
              color: hasLocation
                ? theme.colors.semantic.success
                : hasDraftCoordinates
                  ? draftCoordinatesAreValid
                    ? theme.colors.accent.blue
                    : theme.colors.semantic.error
                  : theme.colors.textSecondary,
            },
          ]}
        >
          {hasLocation
            ? 'Coordonnées enregistrées. Appuyez sur « Enregistrer » après modification pour les mettre à jour.'
            : draftCoordinatesAreValid
              ? coordinatesChangedFromInitial
                ? 'Coordonnées prêtes à être enregistrées. Appuyez sur « Enregistrer » pour les sauvegarder.'
                : 'Ces coordonnées correspondent déjà à la position enregistrée.'
              : hasDraftCoordinates
                ? 'Veuillez saisir une latitude et une longitude valides.'
                : 'Aucune localisation enregistrée pour le moment.'}
        </Text>
      </View>

      {/* Bouton sauvegarder */}
      <TouchableOpacity
        style={[styles.saveButton, { backgroundColor: theme.isDark ? '#10B981' : theme.colors.primary[500] }]}
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
      </KeyboardAvoidingView>

      {/* Map Location Picker Modal */}
      <MapLocationPicker
        visible={mapPickerVisible}
        onClose={() => setMapPickerVisible(false)}
        onSelectLocation={handleMapLocationSelect}
        initialLatitude={initialLatitudeValue ?? parseCoordinateInput(latitude)}
        initialLongitude={initialLongitudeValue ?? parseCoordinateInput(longitude)}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardAvoid: {
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
    flexWrap: 'wrap',
    gap: 8,
  },
  locationButtonsRow: {
    flexDirection: 'row',
    gap: 8,
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
