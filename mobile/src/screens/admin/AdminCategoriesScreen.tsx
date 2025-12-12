import React, { useEffect, useState } from 'react'
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  StatusBar,
  RefreshControl,
  Alert,
  TextInput,
  Modal,
  ScrollView,
  ActivityIndicator,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useTheme } from '../../theme'
import { Category } from '../../types'
import apiService from '../../services/api'
import { Button, Badge, Card, Typography } from '../../components/2025'

interface CategoryWithStats extends Category {
  products_count?: number
  active_products?: number
}

type FormMode = 'create' | 'edit'

const AdminCategoriesScreen: React.FC = () => {
  const theme = useTheme()
  const insets = useSafeAreaInsets()
  const [categories, setCategories] = useState<CategoryWithStats[]>([])
  const [refreshing, setRefreshing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [showFormModal, setShowFormModal] = useState(false)
  const [formMode, setFormMode] = useState<FormMode>('create')
  const [selectedCategory, setSelectedCategory] = useState<CategoryWithStats | null>(null)
  const [formData, setFormData] = useState({ name: '', description: '' })
  const [formLoading, setFormLoading] = useState(false)

  useEffect(() => {
    loadCategories()
  }, [])

  const loadCategories = async () => {
    try {
      setLoading(true)
      const response = await apiService.get('/admin/categories')
      // Extract data from {success: true, data: [...]} response format
      const allCategories = response.data?.data || response.data || []
      setCategories(allCategories)
    } catch (error: any) {
      console.error('Erreur chargement categories:', error)

      // Gestion des erreurs d'autorisation
      if (error.response?.status === 401 || error.response?.status === 403) {
        Alert.alert('Session expirée', 'Votre session a expiré. Veuillez vous reconnecter.')
        return
      }

      Alert.alert('Erreur', 'Impossible de charger les catégories')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleRefresh = () => {
    setRefreshing(true)
    loadCategories()
  }

  const handleCreateCategory = () => {
    setFormMode('create')
    setFormData({ name: '', description: '' })
    setSelectedCategory(null)
    setShowFormModal(true)
  }

  const handleEditCategory = (category: CategoryWithStats) => {
    setFormMode('edit')
    setFormData({
      name: category.name,
      description: category.description || '',
    })
    setSelectedCategory(category)
    setShowFormModal(true)
  }

  const handleDeleteCategory = (category: CategoryWithStats) => {
    Alert.alert(
      'Supprimer la catégorie',
      `Voulez-vous vraiment supprimer "${category.name}" ?\n\n${
        (category.products_count || 0) > 0
          ? `⚠️ Attention: ${category.products_count} produit(s) sont associés à cette catégorie.`
          : ''
      }`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            // Backup pour rollback
            const previousCategories = [...categories]

            try {
              // Mise à jour optimiste (pas de setLoading pour ne pas bloquer l'UI)
              setCategories(prev => prev.filter(c => c.id !== category.id))

              await apiService.delete(`/admin/categories/${category.id}`)

              Alert.alert('Succès', 'Catégorie supprimée avec succès')
            } catch (error: any) {
              console.error('Erreur suppression:', error)

              // Rollback en cas d'erreur
              setCategories(previousCategories)
              Alert.alert(
                'Erreur',
                error.response?.data?.message || 'Impossible de supprimer la catégorie'
              )
            }
          },
        },
      ]
    )
  }

  const handleSubmitForm = async () => {
    // Validation
    if (formData.name.trim().length < 3) {
      Alert.alert('Erreur', 'Le nom doit contenir au moins 3 caractères')
      return
    }

    try {
      setFormLoading(true)

      if (formMode === 'create') {
        const response = await apiService.post('/admin/categories', {
          name: formData.name.trim(),
          description: formData.description.trim() || null,
        })

        // Vérifier AVANT d'utiliser response.data (API peut retourner { data: {...} } ou directement l'objet)
        const newCategory = response.data?.data || response.data
        if (!newCategory || !newCategory.id) {
          throw new Error('Réponse invalide du serveur')
        }

        setCategories(prev => [newCategory, ...prev])
        Alert.alert('Succès', 'Catégorie créée avec succès')
      } else if (selectedCategory) {
        await apiService.put(`/admin/categories/${selectedCategory.id}`, {
          name: formData.name.trim(),
          description: formData.description.trim() || null,
        })

        // Mise à jour locale
        setCategories(prev =>
          prev.map(c =>
            c.id === selectedCategory.id
              ? { ...c, name: formData.name.trim(), description: formData.description.trim() }
              : c
          )
        )
        Alert.alert('Succès', 'Catégorie mise à jour avec succès')
      }

      setShowFormModal(false)
      setFormData({ name: '', description: '' })
    } catch (error: any) {
      console.error('Erreur soumission:', error)
      Alert.alert('Erreur', error.response?.data?.message || 'Impossible de sauvegarder la catégorie')
    } finally {
      setFormLoading(false)
    }
  }

  const renderCategoryCard = ({ item }: { item: CategoryWithStats }) => (
    <Card style={styles.categoryCard}>
      <View style={styles.cardHeader}>
        <View style={styles.iconContainer}>
          <Ionicons name="grid" size={24} color={theme.colors.primary[500]} />
        </View>
        <View style={styles.cardContent}>
          <Typography variant="h4" weight="semibold">
            {item.name}
          </Typography>
          {item.description && (
            <Typography variant="caption" color="secondary" numberOfLines={1}>
              {item.description}
            </Typography>
          )}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Ionicons name="cube-outline" size={14} color={theme.colors.neutral[500]} />
              <Typography variant="caption" color="secondary" style={{ marginLeft: 4 }}>
                {item.products_count || 0} produits
              </Typography>
            </View>
            {(item.active_products ?? 0) > 0 && (
              <Badge variant="success" size="sm">
                {item.active_products} actif{(item.active_products ?? 0) > 1 ? 's' : ''}
              </Badge>
            )}
          </View>
        </View>
        <View style={styles.actionsRow}>
          <TouchableOpacity onPress={() => handleEditCategory(item)} style={styles.actionButton} testID="edit-category-button">
            <Ionicons name="pencil" size={20} color={theme.colors.primary[500]} testID="pencil-icon" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => handleDeleteCategory(item)}
            style={styles.actionButton}
            testID="delete-category-button"
          >
            <Ionicons name="trash-outline" size={20} color={theme.colors.error} testID="trash-icon" />
          </TouchableOpacity>
        </View>
      </View>
    </Card>
  )

  const renderFormModal = () => (
    <Modal
      visible={showFormModal}
      animationType="slide"
      transparent
      onRequestClose={() => setShowFormModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: theme.colors.background }]}>
          <View style={styles.modalHeader}>
            <Typography variant="h3" weight="bold">
              {formMode === 'create' ? 'Nouvelle catégorie' : 'Modifier la catégorie'}
            </Typography>
            <TouchableOpacity onPress={() => setShowFormModal(false)} testID="close-modal-button">
              <Ionicons name="close" size={28} color={theme.colors.neutral[600]} testID="close-icon" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
            <View style={styles.formGroup}>
              <Typography variant="body" weight="medium" style={{ marginBottom: 8 }}>
                Nom de la catégorie *
              </Typography>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.colors.surface.light,
                    color: theme.colors.text,
                    borderColor: theme.colors.neutral[300],
                  },
                ]}
                placeholder="Ex: Boulangerie, Fruits & Légumes"
                placeholderTextColor={theme.colors.neutral[400]}
                value={formData.name}
                onChangeText={name => setFormData(prev => ({ ...prev, name }))}
                maxLength={50}
                autoCapitalize="words"
              />
              <Typography variant="caption" color="secondary" style={{ marginTop: 4 }}>
                {formData.name.length}/50 caractères
              </Typography>
            </View>

            <View style={styles.formGroup}>
              <Typography variant="body" weight="medium" style={{ marginBottom: 8 }}>
                Description (optionnel)
              </Typography>
              <TextInput
                style={[
                  styles.input,
                  styles.textArea,
                  {
                    backgroundColor: theme.colors.surface.light,
                    color: theme.colors.text,
                    borderColor: theme.colors.neutral[300],
                  },
                ]}
                placeholder="Description de la catégorie..."
                placeholderTextColor={theme.colors.neutral[400]}
                value={formData.description}
                onChangeText={description => setFormData(prev => ({ ...prev, description }))}
                multiline
                numberOfLines={4}
                maxLength={200}
              />
              <Typography variant="caption" color="secondary" style={{ marginTop: 4 }}>
                {formData.description.length}/200 caractères
              </Typography>
            </View>

            <View style={styles.formActions}>
              <Button
                variant="secondary"
                onPress={() => setShowFormModal(false)}
                style={{ flex: 1 }}
                disabled={formLoading}
              >
                Annuler
              </Button>
              <Button
                variant="primary"
                onPress={handleSubmitForm}
                style={{ flex: 1 }}
                disabled={formLoading || formData.name.trim().length < 3}
                leftIcon={
                  formLoading ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Ionicons
                      name={formMode === 'create' ? 'add-circle' : 'checkmark-circle'}
                      size={20}
                      color="#FFFFFF"
                    />
                  )
                }
              >
                {formLoading
                  ? 'Enregistrement...'
                  : formMode === 'create'
                  ? 'Créer'
                  : 'Mettre à jour'}
              </Button>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  )

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.titleRow}>
        <Typography variant="h2" weight="bold">
          Catégories de produits
        </Typography>
        <TouchableOpacity onPress={handleCreateCategory} style={styles.createButton} testID="create-category-button">
          <Ionicons name="add-circle" size={28} color={theme.colors.primary[500]} testID="add-circle-icon" />
        </TouchableOpacity>
      </View>
      <Typography variant="body" color="secondary" style={{ marginTop: 8 }}>
        {categories.length} catégorie{categories.length > 1 ? 's' : ''} enregistrée
        {categories.length > 1 ? 's' : ''}
      </Typography>
    </View>
  )

  if (loading) {
    return (
      <View
        style={[styles.container, styles.centered, { backgroundColor: theme.colors.background }]}
      >
        <ActivityIndicator size="large" color={theme.colors.primary[500]} />
        <Typography variant="body" color="secondary" style={{ marginTop: 12 }}>
          Chargement des catégories...
        </Typography>
      </View>
    )
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar barStyle="dark-content" backgroundColor={theme.colors.background} />

      <FlatList
        data={categories}
        keyExtractor={item => `category-${item.id}`}
        renderItem={renderCategoryCard}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="grid-outline" size={64} color={theme.colors.neutral[400]} />
            <Typography variant="h4" weight="semibold" style={{ marginTop: 16 }}>
              Aucune catégorie
            </Typography>
            <Typography variant="body" color="secondary" style={{ marginTop: 8, marginBottom: 24 }}>
              Créez votre première catégorie pour commencer
            </Typography>
            <Button variant="primary" onPress={handleCreateCategory}>
              <Ionicons name="add-circle-outline" size={20} color="#FFFFFF" />
              {'  '}Créer une catégorie
            </Button>
          </View>
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[theme.colors.primary[500]]}
          />
        }
        contentContainerStyle={[styles.listContent, { paddingTop: insets.top + 16 }]}
        showsVerticalScrollIndicator={false}
      />

      {renderFormModal()}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  header: {
    paddingTop: 16,
    paddingBottom: 16,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  createButton: {
    padding: 4,
  },
  categoryCard: {
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  cardContent: {
    flex: 1,
  },
  statsRow: {
    flexDirection: 'row',
    marginTop: 8,
    alignItems: 'center',
    gap: 12,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalBody: {
    padding: 20,
  },
  formGroup: {
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    fontSize: 15,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  formActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
})

export default AdminCategoriesScreen
