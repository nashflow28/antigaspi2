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
import { Product, Category } from '../../types'
import apiService from '../../services/api'
import { getImageUrl } from '../../utils/imageHelpers'

interface Props {
  route: any
  navigation: any
}

const ProductFormScreen: React.FC<Props> = ({ route, navigation }) => {
  const theme = useTheme()
  const { mode, product } = route.params || { mode: 'create', product: null }

  const [loading, setLoading] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])

  // Form state
  const [name, setName] = useState(product?.name || '')
  const [description, setDescription] = useState(product?.description || '')
  const [categoryId, setCategoryId] = useState(product?.category?.id?.toString() || '')
  const [originalPrice, setOriginalPrice] = useState(product?.original_price || '')
  const [discountedPrice, setDiscountedPrice] = useState(product?.discounted_price || '')
  const [quantity, setQuantity] = useState(product?.quantity_available?.toString() || '')
  const [expirationDate, setExpirationDate] = useState(product?.expiration_date || '')
  const [imageUri, setImageUri] = useState<string | null>(product?.image_url ? getImageUrl(product.image_url) : null)

  useEffect(() => {
    loadCategories()
  }, [])

  const loadCategories = async () => {
    try {
      const response = await apiService.get('/products/categories/list')
      setCategories(response.data.data || [])
    } catch (error) {
      console.error('Erreur chargement catégories:', error)
    }
  }

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
    if (!name.trim()) {
      Alert.alert('Erreur', 'Le nom du produit est requis')
      return false
    }
    if (!categoryId) {
      Alert.alert('Erreur', 'Veuillez sélectionner une catégorie')
      return false
    }
    if (!originalPrice || parseFloat(originalPrice) <= 0) {
      Alert.alert('Erreur', 'Le prix original doit être supérieur à 0')
      return false
    }
    if (!discountedPrice || parseFloat(discountedPrice) <= 0) {
      Alert.alert('Erreur', 'Le prix réduit doit être supérieur à 0')
      return false
    }
    if (parseFloat(discountedPrice) >= parseFloat(originalPrice)) {
      Alert.alert('Erreur', 'Le prix réduit doit être inférieur au prix original')
      return false
    }
    if (!quantity || parseInt(quantity) < 0) {
      Alert.alert('Erreur', 'La quantité doit être supérieure ou égale à 0')
      return false
    }
    return true
  }

  const handleSubmit = async () => {
    if (!validateForm()) return

    try {
      setLoading(true)

      let uploadedImageUrl = product?.image_url || null

      // Upload image si une nouvelle image a été sélectionnée
      if (imageUri && !imageUri.startsWith('http')) {
        uploadedImageUrl = await uploadImage(imageUri)
      }

      const productData = {
        name: name.trim(),
        description: description.trim(),
        category_id: parseInt(categoryId),
        original_price: parseFloat(originalPrice),
        discounted_price: parseFloat(discountedPrice),
        quantity_available: parseInt(quantity),
        expiration_date: expirationDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        image_url: uploadedImageUrl,
      }

      if (mode === 'create') {
        await apiService.post('/products', productData)
        Alert.alert('Succès', 'Produit créé avec succès')
      } else {
        await apiService.put(`/products/${product.id}`, productData)
        Alert.alert('Succès', 'Produit modifié avec succès')
      }

      navigation.goBack()
    } catch (error: any) {
      console.error('Erreur sauvegarde produit:', error)
      Alert.alert('Erreur', error.response?.data?.message || 'Impossible de sauvegarder le produit')
    } finally {
      setLoading(false)
    }
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
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
          <Text style={[styles.label, { color: theme.colors.text.primary }]}>Photo du produit</Text>
          <TouchableOpacity
            style={[styles.imagePicker, { backgroundColor: theme.colors.surface.light, borderColor: theme.colors.border }]}
            onPress={pickImage}
          >
            {imageUri ? (
              <Image source={{ uri: imageUri }} style={styles.imagePreview} />
            ) : (
              <View style={styles.imagePlaceholder}>
                <Ionicons name="camera" size={48} color={theme.colors.neutral[300]} />
                <Text style={[styles.imageText, { color: theme.colors.text.secondary }]}>
                  Appuyez pour ajouter une photo
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Nom */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: theme.colors.text.primary }]}>Nom du produit *</Text>
          <TextInput
            style={[styles.input, { backgroundColor: theme.colors.surface.light, color: theme.colors.text.primary, borderColor: theme.colors.border }]}
            value={name}
            onChangeText={setName}
            placeholder="Ex: Pain complet artisanal"
            placeholderTextColor={theme.colors.text.secondary}
          />
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: theme.colors.text.primary }]}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea, { backgroundColor: theme.colors.surface.light, color: theme.colors.text.primary, borderColor: theme.colors.border }]}
            value={description}
            onChangeText={setDescription}
            placeholder="Décrivez votre produit..."
            placeholderTextColor={theme.colors.text.secondary}
            multiline
            numberOfLines={4}
          />
        </View>

        {/* Catégorie */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: theme.colors.text.primary }]}>Catégorie *</Text>
          <View style={styles.categoryContainer}>
            {categories.map((cat) => (
              <TouchableOpacity
                key={cat.id}
                style={[
                  styles.categoryChip,
                  {
                    backgroundColor: categoryId === cat.id.toString()
                      ? theme.colors.primary[500]
                      : theme.colors.surface.light,
                    borderColor: categoryId === cat.id.toString()
                      ? theme.colors.primary[500]
                      : theme.colors.border,
                  }
                ]}
                onPress={() => setCategoryId(cat.id.toString())}
              >
                <Text style={[
                  styles.categoryText,
                  {
                    color: categoryId === cat.id.toString()
                      ? 'white'
                      : theme.colors.text.primary
                  }
                ]}>
                  {cat.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Prix */}
        <View style={styles.row}>
          <View style={[styles.section, styles.halfWidth]}>
            <Text style={[styles.label, { color: theme.colors.text.primary }]}>Prix original *</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.colors.surface.light, color: theme.colors.text.primary, borderColor: theme.colors.border }]}
              value={originalPrice}
              onChangeText={setOriginalPrice}
              placeholder="500"
              placeholderTextColor={theme.colors.text.secondary}
              keyboardType="numeric"
            />
          </View>

          <View style={[styles.section, styles.halfWidth]}>
            <Text style={[styles.label, { color: theme.colors.text.primary }]}>Prix réduit *</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.colors.surface.light, color: theme.colors.text.primary, borderColor: theme.colors.border }]}
              value={discountedPrice}
              onChangeText={setDiscountedPrice}
              placeholder="250"
              placeholderTextColor={theme.colors.text.secondary}
              keyboardType="numeric"
            />
          </View>
        </View>

        {/* Quantité */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: theme.colors.text.primary }]}>Quantité disponible *</Text>
          <TextInput
            style={[styles.input, { backgroundColor: theme.colors.surface.light, color: theme.colors.text.primary, borderColor: theme.colors.border }]}
            value={quantity}
            onChangeText={setQuantity}
            placeholder="10"
            placeholderTextColor={theme.colors.text.secondary}
            keyboardType="numeric"
          />
        </View>

        {/* Date d'expiration */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: theme.colors.text.primary }]}>Date d'expiration</Text>
          <TextInput
            style={[styles.input, { backgroundColor: theme.colors.surface.light, color: theme.colors.text.primary, borderColor: theme.colors.border }]}
            value={expirationDate}
            onChangeText={setExpirationDate}
            placeholder="AAAA-MM-JJ"
            placeholderTextColor={theme.colors.text.secondary}
          />
          <Text style={[styles.helperText, { color: theme.colors.text.secondary }]}>
            Format: 2025-12-31
          </Text>
        </View>

        {/* Bouton de soumission */}
        <TouchableOpacity
          style={[styles.submitButton, { backgroundColor: theme.colors.primary[500] }]}
          onPress={handleSubmit}
          disabled={loading}
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
  categoryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '500',
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
