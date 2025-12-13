import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StatusBar,
  Image,
  ActivityIndicator,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import * as ImagePicker from 'expo-image-picker'
import DateTimePicker from '@react-native-community/datetimepicker'
import { useTheme } from '../../theme'
import { Product } from '../../types'
import apiService from '../../services/api'
import { getImageUrl } from '../../utils/imageHelpers'
import { TEST_IDS } from '../../utils/testIds'
import { usePersistedForm } from '../../hooks/usePersistedForm'
import AlertModal from '../../components/AlertModal'
import { useAlert } from '../../hooks/useAlert'

interface Props {
  route: any
  navigation: any
}

// Type pour les données de formulaire persistées
interface ProductFormData {
  name: string
  description: string
  originalPrice: string
  discountedPrice: string
  quantity: string
  // expirationDate is stored as ISO string for JSON serialization
  expirationDateISO: string
}

const getDefaultExpirationDate = () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

const INITIAL_FORM_DATA: ProductFormData = {
  name: '',
  description: '',
  originalPrice: '',
  discountedPrice: '',
  quantity: '',
  expirationDateISO: getDefaultExpirationDate().toISOString(),
}

const ProductFormScreen: React.FC<Props> = ({ route, navigation }) => {
  const theme = useTheme()
  const { mode, product } = route.params || { mode: 'create', product: null }
  const { alertProps, showWarning, hideAlert } = useAlert()

  const isCreateMode = mode === 'create'

  const [loading, setLoading] = useState(false)

  // Error modal state
  const [errorModalVisible, setErrorModalVisible] = useState(false)
  const [errorTitle, setErrorTitle] = useState('')
  const [errorMessages, setErrorMessages] = useState<string[]>([])
  const [errorType, setErrorType] = useState<'error' | 'warning'>('error')

  // Formulaire persisté (seulement en mode création)
  const getInitialFormData = (): ProductFormData => {
    if (product) {
      // Mode édition - charger les données du produit
      const expDate = product.expiration_date
        ? new Date(product.expiration_date)
        : getDefaultExpirationDate()
      return {
        name: product.name || '',
        description: product.description || '',
        originalPrice: product.original_price?.toString() || '',
        discountedPrice: product.discounted_price?.toString() || '',
        quantity: product.quantity_available?.toString() || '',
        expirationDateISO: isNaN(expDate.getTime()) ? getDefaultExpirationDate().toISOString() : expDate.toISOString(),
      }
    }
    return INITIAL_FORM_DATA
  }

  const {
    formData,
    setFormData,
    setField,
    clearCache: clearFormCache,
    hasUnsavedChanges,
    isRestored,
  } = usePersistedForm<ProductFormData>({
    formKey: isCreateMode ? 'merchant_product_create_form' : `merchant_product_edit_${product?.id}`,
    initialValues: getInitialFormData(),
    expiresIn: 2 * 60 * 60 * 1000, // 2 heures
  })

  // Convert expirationDateISO to Date object for DateTimePicker
  const expirationDate = new Date(formData.expirationDateISO)
  const setExpirationDate = (date: Date) => {
    setField('expirationDateISO', date.toISOString())
  }

  const [showDatePicker, setShowDatePicker] = useState(false)
  const [imageUri, setImageUri] = useState<string | null>(product?.image_url ? getImageUrl(product.image_url) : null)

  // Show draft restoration alert in create mode
  useEffect(() => {
    if (isCreateMode && isRestored && hasUnsavedChanges) {
      const hasMeaningfulData = formData.name || formData.description || formData.originalPrice
      if (hasMeaningfulData) {
        showWarning(
          'Brouillon récupéré',
          'Nous avons retrouvé un produit en cours de création. Voulez-vous le reprendre ?',
          [
            {
              text: 'Recommencer',
              style: 'destructive',
              onPress: () => {
                hideAlert()
                setFormData(INITIAL_FORM_DATA)
                clearFormCache()
              },
            },
            {
              text: 'Reprendre',
              style: 'default',
              onPress: hideAlert,
            },
          ]
        )
      }
    }
  }, [isRestored])

  // Formater la date en JJ/MM/AAAA pour l'affichage
  const formatDateDisplay = (date: Date): string => {
    const day = date.getDate().toString().padStart(2, '0')
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const year = date.getFullYear()
    return `${day}/${month}/${year}`
  }

  // Formater la date en AAAA-MM-JJ pour l'API backend
  const formatDateForAPI = (date: Date): string => {
    return date.toISOString().split('T')[0]
  }

  // Gérer le changement de date
  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios') // Sur iOS, on garde le picker ouvert
    if (selectedDate) {
      // Validation: la date doit être dans le futur
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      if (selectedDate < today) {
        showErrorModal('Date invalide', ['La date d\'expiration doit être dans le futur'], 'warning')
        return
      }
      setExpirationDate(selectedDate)
    }
  }

  // Helper function to show styled error modal
  const showErrorModal = (title: string, messages: string[], type: 'error' | 'warning' = 'error') => {
    setErrorTitle(title)
    setErrorMessages(messages)
    setErrorType(type)
    setErrorModalVisible(true)
  }

  // Success modal state
  const [successModalVisible, setSuccessModalVisible] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')

  // Helper function to show styled success modal
  const showSuccessModal = (message: string) => {
    setSuccessMessage(message)
    setSuccessModalVisible(true)
  }


  const pickImage = async () => {
    try {
      console.log('📸 [ProductForm] Demande permission galerie...')
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
      console.log('📸 [ProductForm] Permission status:', status)

      if (status !== 'granted') {
        console.warn('⚠️ [ProductForm] Permission refusée')
        showErrorModal('Permission refusée', ['Nous avons besoin de votre permission pour accéder à la galerie.'], 'warning')
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
      showErrorModal('Erreur de sélection', ['Impossible de sélectionner une image.', 'Veuillez réessayer.'], 'error')
    }
  }

  const uploadImage = async (imageUri: string): Promise<string | null> => {
    try {
      console.log('📤 [ProductForm] Upload image démarré...', imageUri)
      const formData = new FormData()
      const filename = imageUri.split('/').pop() || 'image.jpg'
      const match = /\.(\w+)$/.exec(filename)
      const type = match ? `image/${match[1]}` : 'image/jpeg'

      console.log('📤 [ProductForm] Fichier:', { filename, type, uri: imageUri.substring(0, 50) + '...' })

      formData.append('image', {
        uri: imageUri,
        name: filename,
        type,
      } as any)

      // 🐛 BUG FIX #28: Use dedicated uploadFile method with native fetch
      // Axios has issues with FormData on React Native
      const response = await apiService.uploadFile('/products/upload-image', formData)

      // 🐛 BUG FIX #27: Backend returns { success: true, data: { url, path, filename } }
      // apiService.post() returns response.data directly, so response = { success, data: {...} }
      console.log('✅ [ProductForm] Upload image réussi:', JSON.stringify(response, null, 2))

      if (response.success && response.data?.url) {
        console.log('✅ [ProductForm] Image URL récupérée:', response.data.url)
        return response.data.url
      }

      console.warn('⚠️ [ProductForm] Aucune URL dans la réponse')
      return null
    } catch (error: any) {
      console.error('❌ [ProductForm] Erreur upload image:', error)
      console.error('❌ [ProductForm] Error details:', {
        message: error?.message,
        statusCode: error?.statusCode,
        validationErrors: error?.validationErrors,
      })
      // 🐛 BUG FIX #25: Don't throw - return null to allow product creation without image
      // Use styled modal instead of basic Alert
      showErrorModal(
        'Upload d\'image',
        ['L\'upload de l\'image a échoué.', 'Le produit sera créé sans image.', error?.message || ''],
        'warning'
      )
      return null
    }
  }

  const validateForm = (): boolean => {
    console.log('🔵 validateForm appelé')
    if (!formData.name.trim()) {
      console.error('❌ Nom du produit requis')
      showErrorModal('Erreur de validation', ['Le nom du produit est requis'], 'error')
      return false
    }
    // categoryId validation removed - automatically uses merchant's category
    const originalPriceNum = parseFloat(formData.originalPrice)
    if (!formData.originalPrice || isNaN(originalPriceNum) || originalPriceNum <= 0) {
      console.error('❌ Prix original invalide:', formData.originalPrice)
      showErrorModal('Erreur de validation', ['Le prix original doit être un nombre valide supérieur à 0'], 'error')
      return false
    }
    const discountedPriceNum = parseFloat(formData.discountedPrice)
    if (!formData.discountedPrice || isNaN(discountedPriceNum) || discountedPriceNum <= 0) {
      console.error('❌ Prix réduit invalide:', formData.discountedPrice)
      showErrorModal('Erreur de validation', ['Le prix réduit doit être un nombre valide supérieur à 0'], 'error')
      return false
    }
    if (discountedPriceNum >= originalPriceNum) {
      console.error('❌ Prix réduit >= Prix original:', { discountedPriceNum, originalPriceNum })
      showErrorModal('Erreur de validation', ['Le prix réduit doit être inférieur au prix original'], 'error')
      return false
    }
    const quantityNum = parseInt(formData.quantity)
    // 🐛 BUG FIX #29: Backend requires quantity >= 1, not 0
    if (!formData.quantity || isNaN(quantityNum) || quantityNum < 1) {
      console.error('❌ Quantité invalide:', formData.quantity)
      showErrorModal('Erreur de validation', ['La quantité doit être au minimum 1'], 'error')
      return false
    }
    console.log('✅ Validation réussie !')
    return true
  }

  const handleSubmit = async () => {
    console.log('🔴 handleSubmit appelé')
    console.log('Form data:', { name: formData.name, originalPrice: formData.originalPrice, discountedPrice: formData.discountedPrice, quantity: formData.quantity, expirationDate })

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
        name: formData.name.trim(),
        description: formData.description?.trim() || null,
        // category_id removed - automatically uses merchant's category
        original_price: parseFloat(formData.originalPrice),
        discounted_price: parseFloat(formData.discountedPrice),
        quantity_available: parseInt(formData.quantity, 10),
        expiration_date: formatDateForAPI(expirationDate),
        image_url: uploadedImageUrl,
      }

      console.log('📤 Envoi requête API:', mode === 'create' ? 'POST /products' : `PUT /products/${product.id}`)
      console.log('📦 Données envoyées:', JSON.stringify(productData, null, 2))

      if (mode === 'create') {
        const response = await apiService.post('/products', productData)
        // 🐛 BUG FIX #24: apiService.post() returns response.data directly
        console.log('✅ Réponse API reçue:', response)
        // Clear form cache on successful creation
        await clearFormCache()
        showSuccessModal('Le produit a été créé avec succès.')
      } else {
        const response = await apiService.put(`/products/${product.id}`, productData)
        // 🐛 BUG FIX #24: apiService.put() returns response.data directly
        console.log('✅ Réponse API reçue:', response)
        // Clear form cache on successful edit
        await clearFormCache()
        showSuccessModal('Le produit a été modifié avec succès.')
      }

      // Navigation will happen when success modal is closed
      console.log('🔙 Navigation après fermeture du modal')
    } catch (error: any) {
      console.error('❌ ERREUR COMPLÈTE:', error)
      console.error('❌ Error message:', error.message)
      console.error('❌ Error statusCode:', error.statusCode)
      console.error('❌ Error validationErrors:', error.validationErrors)

      let errorMessages: string[] = ['Impossible de sauvegarder le produit']

      // 🐛 BUG FIX #24: Handle validation errors from improved apiService
      if (error.statusCode === 422 && error.validationErrors) {
        // Format validation errors from backend
        errorMessages = Object.entries(error.validationErrors)
          .flatMap(([field, messages]: [string, any]) => {
            const fieldName = field.replace(/_/g, ' ')
            const msgArray = Array.isArray(messages) ? messages : [messages]
            return msgArray.map((msg: string) => `${fieldName}: ${msg}`)
          })
      } else if (error.message) {
        errorMessages = [error.message]
      }

      console.error('❌ Message erreur affiché:', errorMessages)
      showErrorModal('Erreur de création', errorMessages, 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]} testID={TEST_IDS.productFormScreen}>
      <StatusBar barStyle={theme.isDark ? "light-content" : "dark-content"} backgroundColor={theme.colors.background} />

      {/* Styled Error Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={errorModalVisible}
        onRequestClose={() => setErrorModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.errorModalContainer, { backgroundColor: theme.colors.background }]}>
            {/* Error Icon */}
            <View style={[
              styles.errorIconContainer,
              { backgroundColor: errorType === 'error' ? '#FEE2E2' : '#FEF3C7' }
            ]}>
              <Ionicons
                name={errorType === 'error' ? 'alert-circle' : 'warning'}
                size={48}
                color={errorType === 'error' ? '#DC2626' : '#D97706'}
              />
            </View>

            {/* Error Title */}
            <Text style={[
              styles.errorModalTitle,
              { color: errorType === 'error' ? '#DC2626' : '#D97706' }
            ]}>
              {errorTitle}
            </Text>

            {/* Error Messages */}
            <View style={styles.errorMessagesContainer}>
              {errorMessages.filter(msg => msg).map((message, index) => (
                <View key={index} style={styles.errorMessageRow}>
                  <Ionicons
                    name="chevron-forward"
                    size={16}
                    color={theme.colors.textSecondary}
                  />
                  <Text style={[styles.errorMessageText, { color: theme.colors.text }]}>
                    {message}
                  </Text>
                </View>
              ))}
            </View>

            {/* Close Button */}
            <TouchableOpacity
              style={[
                styles.errorModalButton,
                { backgroundColor: errorType === 'error' ? '#DC2626' : '#D97706' }
              ]}
              onPress={() => setErrorModalVisible(false)}
            >
              <Text style={styles.errorModalButtonText}>Compris</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Styled Success Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={successModalVisible}
        onRequestClose={() => {
          setSuccessModalVisible(false)
          if (navigation.canGoBack()) {
            navigation.goBack()
          } else {
            navigation.navigate('ProductsList')
          }
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.errorModalContainer, { backgroundColor: theme.colors.background }]}>
            {/* Success Icon */}
            <View style={styles.successIconContainer}>
              <Ionicons name="checkmark-circle" size={48} color="#10B981" />
            </View>

            {/* Success Title */}
            <Text style={styles.successModalTitle}>Succès</Text>

            {/* Success Message */}
            <Text style={[styles.successModalMessage, { color: theme.colors.text }]}>
              {successMessage}
            </Text>

            {/* Close Button */}
            <TouchableOpacity
              style={styles.successModalButton}
              onPress={() => {
                setSuccessModalVisible(false)
                if (navigation.canGoBack()) {
                  navigation.goBack()
                } else {
                  navigation.navigate('ProductsList')
                }
              }}
            >
              <Text style={styles.errorModalButtonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

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

      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
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
            value={formData.name}
            onChangeText={(v) => setField('name', v)}
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
            value={formData.description}
            onChangeText={(v) => setField('description', v)}
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
              value={formData.originalPrice}
              onChangeText={(v) => setField('originalPrice', v)}
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
              value={formData.discountedPrice}
              onChangeText={(v) => setField('discountedPrice', v)}
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
            value={formData.quantity}
            onChangeText={(v) => setField('quantity', v)}
            placeholder="10"
            placeholderTextColor={theme.colors.textSecondary}
            keyboardType="numeric"
            testID={TEST_IDS.quantityInput}
          />
        </View>

        {/* Date d'expiration avec DateTimePicker */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: theme.colors.text }]}>Date d'expiration *</Text>
          <TouchableOpacity
            style={[styles.datePickerButton, { backgroundColor: theme.colors.inputBackground, borderColor: theme.colors.border }]}
            onPress={() => setShowDatePicker(true)}
            testID={TEST_IDS.expirationDateInput}
          >
            <Ionicons name="calendar" size={24} color={theme.colors.primary[500]} />
            <Text style={[styles.datePickerText, { color: theme.colors.text }]}>
              {formatDateDisplay(expirationDate)}
            </Text>
            <Ionicons name="chevron-down" size={20} color={theme.colors.textSecondary} />
          </TouchableOpacity>
          <Text style={[styles.helperText, { color: theme.colors.textSecondary }]}>
            Format: JJ/MM/AAAA (ex: 31/12/2025)
          </Text>
        </View>

        {/* DateTimePicker Modal */}
        {showDatePicker && (
          <DateTimePicker
            testID="dateTimePicker"
            value={expirationDate}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={handleDateChange}
            minimumDate={new Date()} // Empêche de sélectionner une date passée
            locale="fr-FR"
          />
        )}

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
      </KeyboardAvoidingView>

      <AlertModal {...alertProps} />
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
  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    gap: 12,
  },
  datePickerText: {
    flex: 1,
    fontSize: 16,
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
  // Error Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorModalContainer: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  errorIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  errorModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
  },
  errorMessagesContainer: {
    width: '100%',
    marginBottom: 20,
  },
  errorMessageRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
    gap: 8,
  },
  errorMessageText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  errorModalButton: {
    width: '100%',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  errorModalButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  // Success Modal Styles
  successIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#D1FAE5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  successModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#10B981',
    textAlign: 'center',
    marginBottom: 12,
  },
  successModalMessage: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  successModalButton: {
    width: '100%',
    backgroundColor: '#10B981',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
})

export default ProductFormScreen
