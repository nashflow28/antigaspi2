import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StatusBar,
  Alert,
  Image,
  ActivityIndicator,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import * as ImagePicker from 'expo-image-picker'
import { useTheme } from '../../theme'
import { Product } from '../../types'
import apiService from '../../services/api'
import { getImageUrl } from '../../utils/imageHelpers'
import { TEST_IDS } from '../../utils/testIds'

interface Props {
  route: any
  navigation: any
}

const ProductFormScreen: React.FC<Props> = ({ route, navigation }) => {
  const theme = useTheme()
  const { mode, product } = route.params || { mode: 'create', product: null }

  const [loading, setLoading] = useState(false)

  // Form state
  const [name, setName] = useState(product?.name || '')
  const [description, setDescription] = useState(product?.description || '')
  // categoryId removed - automatically uses merchant's category
  const [originalPrice, setOriginalPrice] = useState(product?.original_price || '')
  const [discountedPrice, setDiscountedPrice] = useState(product?.discounted_price || '')
  const [quantity, setQuantity] = useState(product?.quantity_available?.toString() || '')
  const [expirationDate, setExpirationDate] = useState(product?.expiration_date || '')
  const [imageUri, setImageUri] = useState<string | null>(product?.image_url ? getImageUrl(product.image_url) : null)


  const pickImage = async () => {
    try {
      console.log('📸 [ProductForm] Demande permission galerie...')
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
      console.log('📸 [ProductForm] Permission status:', status)

      if (status !== 'granted') {
        console.warn('⚠️ [ProductForm] Permission refusée')
        Alert.alert('Permission refusée', 'Nous avons besoin de votre permission pour accéder à la galerie.')
        return
      }

      console.log('📸 [ProductForm] Ouverture galerie...')
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images, // ⚠️ Deprecated but still required in expo-image-picker v17
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      })

      console.log('📸 [ProductForm] Résultat sélection:', result.canceled ? 'Annulé' : 'Image sélectionnée')

      if (!result.canceled && result.assets[0]) {
        const selectedUri = result.assets[0].uri
        console.log('✅ [ProductForm] Image URI:', selectedUri)
        setImageUri(selectedUri)
      }
    } catch (error) {
      console.error('❌ [ProductForm] Erreur sélection image:', error)
      Alert.alert('Erreur', 'Impossible de sélectionner une image. Veuillez réessayer.')
    }
  }

  const uploadImage = async (imageUri: string): Promise<string | null> => {
    try {
      console.log('📤 [ProductForm] Upload image démarré...')
      const formData = new FormData()
      const filename = imageUri.split('/').pop() || 'image.jpg'
      const match = /\.(\w+)$/.exec(filename)
      const type = match ? `image/${match[1]}` : 'image/jpeg'

      formData.append('image', {
        uri: imageUri,
        name: filename,
        type,
      } as any)

      const response = await apiService.post('/products/upload-image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })

      // 🐛 BUG FIX #27: Backend returns { success: true, data: { url, path, filename } }
      // apiService.post() returns response.data directly, so response = { success, data: {...} }
      console.log('✅ [ProductForm] Upload image réussi:', JSON.stringify(response, null, 2))

      if (response.success && response.data?.url) {
        console.log('✅ [ProductForm] Image URL récupérée:', response.data.url)
        return response.data.url
      }

      console.warn('⚠️ [ProductForm] Aucune URL dans la réponse')
      return null
    } catch (error) {
      console.error('❌ [ProductForm] Erreur upload image:', error)
      // 🐛 BUG FIX #25: Don't throw - return null to allow product creation without image
      Alert.alert('Attention', 'L\'upload de l\'image a échoué. Le produit sera créé sans image.')
      return null
    }
  }

  const validateForm = (): boolean => {
    console.log('🔵 validateForm appelé')
    if (!name.trim()) {
      console.error('❌ Nom du produit requis')
      Alert.alert('Erreur', 'Le nom du produit est requis')
      return false
    }
    // categoryId validation removed - automatically uses merchant's category
    const originalPriceNum = parseFloat(originalPrice)
    if (!originalPrice || isNaN(originalPriceNum) || originalPriceNum <= 0) {
      console.error('❌ Prix original invalide:', originalPrice)
      Alert.alert('Erreur', 'Le prix original doit être un nombre valide supérieur à 0')
      return false
    }
    const discountedPriceNum = parseFloat(discountedPrice)
    if (!discountedPrice || isNaN(discountedPriceNum) || discountedPriceNum <= 0) {
      console.error('❌ Prix réduit invalide:', discountedPrice)
      Alert.alert('Erreur', 'Le prix réduit doit être un nombre valide supérieur à 0')
      return false
    }
    if (discountedPriceNum >= originalPriceNum) {
      console.error('❌ Prix réduit >= Prix original:', { discountedPriceNum, originalPriceNum })
      Alert.alert('Erreur', 'Le prix réduit doit être inférieur au prix original')
      return false
    }
    const quantityNum = parseInt(quantity)
    if (!quantity || isNaN(quantityNum) || quantityNum < 0) {
      console.error('❌ Quantité invalide:', quantity)
      Alert.alert('Erreur', 'La quantité doit être un nombre valide supérieur ou égal à 0')
      return false
    }
    console.log('✅ Validation réussie !')
    return true
  }

  const handleSubmit = async () => {
    console.log('🔴 handleSubmit appelé')
    console.log('Form data:', { name, originalPrice, discountedPrice, quantity, expirationDate })

    if (!validateForm()) {
      console.log('❌ Validation échouée')
      return
    }

    try {
      setLoading(true)

      let uploadedImageUrl = product?.image_url || null

      // Upload image si une nouvelle image a été sélectionnée
      if (imageUri && !imageUri.startsWith('http')) {
        console.log('📤 Upload image en cours...')
        uploadedImageUrl = await uploadImage(imageUri)
        console.log('✅ Image uploadée:', uploadedImageUrl)

        // 🐛 BUG FIX #27: Update imageUri with server URL for display
        if (uploadedImageUrl) {
          setImageUri(uploadedImageUrl)
        }
      }

      const productData = {
        name: name.trim(),
        description: description.trim(),
        // category_id removed - automatically uses merchant's category
        original_price: parseFloat(originalPrice),
        discounted_price: parseFloat(discountedPrice),
        quantity_available: parseInt(quantity, 10),
        expiration_date: (() => {
          if (expirationDate && /^\d{4}-\d{2}-\d{2}$/.test(expirationDate)) {
            const date = new Date(expirationDate);
            if (!isNaN(date.getTime())) {
              return expirationDate;
            }
          }
          return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        })(),
        image_url: uploadedImageUrl,
      }

      console.log('📤 Envoi requête API:', mode === 'create' ? 'POST /products' : `PUT /products/${product.id}`)
      console.log('📦 Données envoyées:', JSON.stringify(productData, null, 2))

      if (mode === 'create') {
        const response = await apiService.post('/products', productData)
        // 🐛 BUG FIX #24: apiService.post() returns response.data directly
        console.log('✅ Réponse API reçue:', response)
        Alert.alert('Succès', 'Produit créé avec succès')
      } else {
        const response = await apiService.put(`/products/${product.id}`, productData)
        // 🐛 BUG FIX #24: apiService.put() returns response.data directly
        console.log('✅ Réponse API reçue:', response)
        Alert.alert('Succès', 'Produit modifié avec succès')
      }

      console.log('🔙 Navigation retour vers liste produits')
      if (navigation.canGoBack()) {
        navigation.goBack()
      } else {
        navigation.navigate('ProductsList')
      }
    } catch (error: any) {
      console.error('❌ ERREUR COMPLÈTE:', error)
      console.error('❌ Error message:', error.message)
      console.error('❌ Error statusCode:', error.statusCode)
      console.error('❌ Error validationErrors:', error.validationErrors)

      let errorMessage = 'Impossible de sauvegarder le produit'

      // 🐛 BUG FIX #24: Handle validation errors from improved apiService
      if (error.statusCode === 422 && error.validationErrors) {
        // Format validation errors from backend
        const errorMessages = Object.entries(error.validationErrors)
          .map(([field, messages]: [string, any]) => {
            const fieldName = field.replace(/_/g, ' ')
            return `• ${fieldName}: ${Array.isArray(messages) ? messages.join(', ') : messages}`
          })
          .join('\n')
        errorMessage = `Erreurs de validation:\n${errorMessages}`
      } else if (error.message) {
        errorMessage = error.message
      }

      console.error('❌ Message erreur affiché:', errorMessage)
      Alert.alert('Erreur', errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]} testID={TEST_IDS.productFormScreen}>
      <StatusBar barStyle={theme.isDark ? "light-content" : "dark-content"} backgroundColor={theme.colors.background} />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.isDark ? '#0F1622' : theme.colors.primary[500] }]}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => {
            if (navigation.canGoBack()) {
              navigation.goBack()
            } else {
              navigation.navigate('ProductsList')
            }
          }} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {mode === 'create' ? 'Nouveau produit' : 'Modifier le produit'}
          </Text>
          <View style={{ width: 40 }} />
        </View>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        {/* Image */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: theme.colors.text }]}>Photo du produit</Text>
          <TouchableOpacity
            style={[styles.imagePicker, { backgroundColor: theme.colors.inputBackground, borderColor: theme.colors.border }]}
            onPress={() => {
              console.log('🖱️ [ProductForm] Bouton image cliqué !')
              pickImage()
            }}
            testID={TEST_IDS.imagePickerButton}
          >
            {imageUri ? (
              (() => {
                const displayUri = imageUri.startsWith('file://') ? imageUri : getImageUrl(imageUri)
                console.log('🖼️ [ProductForm] Affichage image:', {
                  imageUri,
                  isLocalFile: imageUri.startsWith('file://'),
                  displayUri
                })
                return (
                  <Image
                    source={{ uri: displayUri }}
                    style={styles.imagePreview}
                    onError={(error) => {
                      console.error('❌ [ProductForm] Erreur chargement image:', error.nativeEvent.error)
                    }}
                    onLoad={() => {
                      console.log('✅ [ProductForm] Image chargée avec succès:', displayUri)
                    }}
                  />
                )
              })()
            ) : (
              <View style={styles.imagePlaceholder}>
                <Ionicons name="camera" size={48} color={theme.colors.neutral[300]} />
                <Text style={[styles.imageText, { color: theme.colors.textSecondary }]}>
                  Appuyez pour ajouter une photo
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Nom */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: theme.colors.text }]}>Nom du produit *</Text>
          <TextInput
            style={[styles.input, { backgroundColor: theme.colors.inputBackground, color: theme.colors.text, borderColor: theme.colors.border }]}
            value={name}
            onChangeText={setName}
            placeholder="Ex: Pain complet artisanal"
            placeholderTextColor={theme.colors.textSecondary}
            testID={TEST_IDS.productNameInput}
          />
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: theme.colors.text }]}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea, { backgroundColor: theme.colors.inputBackground, color: theme.colors.text, borderColor: theme.colors.border }]}
            value={description}
            onChangeText={setDescription}
            placeholder="Décrivez votre produit..."
            placeholderTextColor={theme.colors.textSecondary}
            multiline
            numberOfLines={4}
            testID={TEST_IDS.productDescriptionInput}
          />
        </View>

        {/* Catégorie - Automatique */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: theme.colors.text }]}>Catégorie</Text>
          <View style={[styles.categoryInfoBox, { backgroundColor: theme.withOpacity(theme.colors.primary[500], 0.1), borderColor: theme.withOpacity(theme.colors.primary[500], 0.3) }]}>
            <Ionicons name="information-circle" size={20} color={theme.colors.primary[500]} />
            <Text style={[styles.categoryInfoText, { color: theme.colors.text }]}>
              La catégorie est définie automatiquement selon votre type de commerce
            </Text>
          </View>
        </View>

        {/* Prix */}
        <View style={styles.row}>
          <View style={[styles.section, styles.halfWidth]}>
            <Text style={[styles.label, { color: theme.colors.text }]}>Prix original *</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.colors.inputBackground, color: theme.colors.text, borderColor: theme.colors.border }]}
              value={originalPrice}
              onChangeText={setOriginalPrice}
              placeholder="500"
              placeholderTextColor={theme.colors.textSecondary}
              keyboardType="numeric"
              testID={TEST_IDS.originalPriceInput}
            />
          </View>

          <View style={[styles.section, styles.halfWidth]}>
            <Text style={[styles.label, { color: theme.colors.text }]}>Prix réduit *</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.colors.inputBackground, color: theme.colors.text, borderColor: theme.colors.border }]}
              value={discountedPrice}
              onChangeText={setDiscountedPrice}
              placeholder="250"
              placeholderTextColor={theme.colors.textSecondary}
              keyboardType="numeric"
              testID={TEST_IDS.discountedPriceInput}
            />
          </View>
        </View>

        {/* Quantité */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: theme.colors.text }]}>Quantité disponible *</Text>
          <TextInput
            style={[styles.input, { backgroundColor: theme.colors.inputBackground, color: theme.colors.text, borderColor: theme.colors.border }]}
            value={quantity}
            onChangeText={setQuantity}
            placeholder="10"
            placeholderTextColor={theme.colors.textSecondary}
            keyboardType="numeric"
            testID={TEST_IDS.quantityInput}
          />
        </View>

        {/* Date d'expiration */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: theme.colors.text }]}>Date d'expiration</Text>
          <TextInput
            style={[styles.input, { backgroundColor: theme.colors.inputBackground, color: theme.colors.text, borderColor: theme.colors.border }]}
            value={expirationDate}
            onChangeText={setExpirationDate}
            placeholder="AAAA-MM-JJ"
            placeholderTextColor={theme.colors.textSecondary}
            testID={TEST_IDS.expirationDateInput}
          />
          <Text style={[styles.helperText, { color: theme.colors.textSecondary }]}>
            Format: 2025-12-31
          </Text>
        </View>

        {/* Bouton de soumission */}
        <TouchableOpacity
          style={[styles.submitButton, { backgroundColor: theme.isDark ? '#10B981' : theme.colors.primary[500] }]}
          onPress={() => {
            console.log('🟢 Bouton cliqué !')
            handleSubmit()
          }}
          disabled={loading}
          testID={TEST_IDS.submitProductButton}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <>
              <Ionicons name={mode === 'create' ? 'add-circle' : 'checkmark-circle'} size={24} color="white" />
              <Text style={styles.submitButtonText}>
                {mode === 'create' ? 'Créer le produit' : 'Enregistrer les modifications'}
              </Text>
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
  header: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  section: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  imagePicker: {
    height: 200,
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: 'dashed',
    overflow: 'hidden',
  },
  imagePreview: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageText: {
    marginTop: 12,
    fontSize: 14,
  },
  categoryInfoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    gap: 10,
  },
  categoryInfoText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfWidth: {
    flex: 1,
  },
  helperText: {
    fontSize: 12,
    marginTop: 4,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginTop: 20,
    marginBottom: 40,
    gap: 8,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
})

export default ProductFormScreen
