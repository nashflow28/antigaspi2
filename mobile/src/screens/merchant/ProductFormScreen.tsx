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
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()

    if (status !== 'granted') {
      Alert.alert('Permission refusée', 'Nous avons besoin de votre permission pour accéder à la galerie.')
      return
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    })

    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri)
    }
  }

  const uploadImage = async (imageUri: string): Promise<string | null> => {
    try {
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

      return response.data.image_url || null
    } catch (error) {
      console.error('Erreur upload image:', error)
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
      Alert.alert('Erreur', 'Le prix original doit être supérieur à 0')
      return false
    }
    const discountedPriceNum = parseFloat(discountedPrice)
    if (!discountedPrice || isNaN(discountedPriceNum) || discountedPriceNum <= 0) {
      console.error('❌ Prix réduit invalide:', discountedPrice)
      Alert.alert('Erreur', 'Le prix réduit doit être supérieur à 0')
      return false
    }
    if (discountedPriceNum >= originalPriceNum) {
      console.error('❌ Prix réduit >= Prix original:', { discountedPriceNum, originalPriceNum })
      Alert.alert('Erreur', 'Le prix réduit doit être inférieur au prix original')
      return false
    }
    if (!quantity || parseInt(quantity) < 0) {
      console.error('❌ Quantité invalide:', quantity)
      Alert.alert('Erreur', 'La quantité doit être supérieure ou égale à 0')
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
      }

      const productData = {
        name: name.trim(),
        description: description.trim(),
        // category_id removed - automatically uses merchant's category
        original_price: parseFloat(originalPrice),
        discounted_price: parseFloat(discountedPrice),
        quantity_available: parseInt(quantity),
        expiration_date: expirationDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        image_url: uploadedImageUrl,
      }

      console.log('📤 Envoi requête API:', mode === 'create' ? 'POST /products' : `PUT /products/${product.id}`)
      console.log('📦 Données envoyées:', JSON.stringify(productData, null, 2))

      if (mode === 'create') {
        const response = await apiService.post('/products', productData)
        console.log('✅ Réponse API reçue:', response.data)
        Alert.alert('Succès', 'Produit créé avec succès')
      } else {
        const response = await apiService.put(`/products/${product.id}`, productData)
        console.log('✅ Réponse API reçue:', response.data)
        Alert.alert('Succès', 'Produit modifié avec succès')
      }

      console.log('🔙 Navigation retour vers liste produits')
      navigation.goBack()
    } catch (error: any) {
      console.error('❌ ERREUR COMPLÈTE:', error)
      console.error('❌ Error response:', error.response)
      console.error('❌ Error data:', error.response?.data)
      console.error('❌ Error status:', error.response?.status)

      let errorMessage = 'Impossible de sauvegarder le produit'

      if (error.response?.status === 401) {
        errorMessage = 'Session expirée. Veuillez vous reconnecter.'
      } else if (error.response?.status === 422) {
        const errors = error.response?.data?.errors
        if (errors) {
          errorMessage = Object.values(errors).flat().join('\n')
        } else {
          errorMessage = error.response?.data?.message || 'Erreurs de validation'
        }
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message
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
      <StatusBar barStyle="dark-content" backgroundColor={theme.colors.background} />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.colors.primary[500] }]}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
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
            style={[styles.imagePicker, { backgroundColor: theme.colors.surface.light, borderColor: theme.colors.border }]}
            onPress={pickImage}
            testID={TEST_IDS.imagePickerButton}
          >
            {imageUri ? (
              <Image source={{ uri: imageUri }} style={styles.imagePreview} />
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
            style={[styles.input, { backgroundColor: theme.colors.surface.light, color: theme.colors.text, borderColor: theme.colors.border }]}
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
            style={[styles.input, styles.textArea, { backgroundColor: theme.colors.surface.light, color: theme.colors.text, borderColor: theme.colors.border }]}
            value={description}
            onChangeText={setDescription}
            placeholder="Décrivez votre produit..."
            placeholderTextColor={theme.colors.textSecondary}
            multiline
            numberOfLines={4}
            testID={TEST_IDS.productDescriptionInput}
          />
        </View>

        {/* Catégorie - Removed: automatically uses merchant's category */}

        {/* Prix */}
        <View style={styles.row}>
          <View style={[styles.section, styles.halfWidth]}>
            <Text style={[styles.label, { color: theme.colors.text }]}>Prix original *</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.colors.surface.light, color: theme.colors.text, borderColor: theme.colors.border }]}
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
              style={[styles.input, { backgroundColor: theme.colors.surface.light, color: theme.colors.text, borderColor: theme.colors.border }]}
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
            style={[styles.input, { backgroundColor: theme.colors.surface.light, color: theme.colors.text, borderColor: theme.colors.border }]}
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
            style={[styles.input, { backgroundColor: theme.colors.surface.light, color: theme.colors.text, borderColor: theme.colors.border }]}
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
          style={[styles.submitButton, { backgroundColor: theme.colors.primary[500] }]}
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
  // categoryContainer, categoryChip, categoryText removed - category is automatic
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
