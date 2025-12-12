import React, { useEffect, useState, useCallback, useMemo } from 'react'
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  StatusBar,
  RefreshControl,
  Alert,
  Image,
  ActivityIndicator,
  Modal,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useFocusEffect } from '@react-navigation/native'
import { useTheme } from '../../theme'
import { SurpriseBasket } from '../../types'
import apiService from '../../services/api'
import { getImageUrl } from '../../utils/imageHelpers'
import { Typography, Card, Button, Badge } from '../../components/2025'
import { formatCurrency } from '../../utils/currencyHelpers'
import { TEST_IDS } from '../../utils/testIds'

type StatusFilter = 'all' | 'active' | 'inactive'

interface Props {
  navigation: any
}

const MerchantSurpriseBasketsScreen: React.FC<Props> = ({ navigation }) => {
  const theme = useTheme()
  const [baskets, setBaskets] = useState<SurpriseBasket[]>([])
  const [refreshing, setRefreshing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [showModal, setShowModal] = useState(false)
  const [editingBasket, setEditingBasket] = useState<SurpriseBasket | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    discounted_price: '',
    quantity_available: '',
    min_items: '',
  })

  // Error modal state
  const [errorModalVisible, setErrorModalVisible] = useState(false)
  const [errorTitle, setErrorTitle] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  // Success modal state
  const [successModalVisible, setSuccessModalVisible] = useState(false)
  const [successTitle, setSuccessTitle] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  // Helper function to show styled error modal
  const showErrorModal = (title: string, message: string) => {
    setErrorTitle(title)
    setErrorMessage(message)
    setErrorModalVisible(true)
  }

  // Helper function to show styled success modal
  const showSuccessModal = (title: string, message: string) => {
    setSuccessTitle(title)
    setSuccessMessage(message)
    setSuccessModalVisible(true)
  }

  useFocusEffect(
    useCallback(() => {
      loadBaskets()
    }, [])
  )

  const loadBaskets = async () => {
    try {
      setLoading(true)
      console.log('📦 [MerchantSurpriseBaskets] Chargement des paniers...')
      const response = await apiService.get('/surprise-baskets/merchant/list')
      // apiService peut retourner le tableau directement ou {data: [...]}
      const allBaskets = Array.isArray(response.data) ? response.data : (response.data?.data || [])
      console.log('🟢 [MerchantSurpriseBaskets] Nombre baskets:', allBaskets.length)
      setBaskets(allBaskets)
    } catch (error: any) {
      console.error('❌ [MerchantSurpriseBaskets] Erreur:', error)
      showErrorModal('Erreur de chargement', 'Impossible de charger les paniers surprise. Veuillez réessayer.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const onRefresh = () => {
    setRefreshing(true)
    loadBaskets()
  }

  const handleCreate = () => {
    setEditingBasket(null)
    setFormData({
      name: '',
      description: '',
      discounted_price: '',
      quantity_available: '',
      min_items: '',
    })
    setShowModal(true)
  }

  const handleEdit = (basket: SurpriseBasket) => {
    setEditingBasket(basket)
    setFormData({
      name: basket.name,
      description: basket.description || '',
      discounted_price: basket.discounted_price.toString(),
      quantity_available: basket.quantity_available.toString(),
      min_items: basket.min_items?.toString() || '',
    })
    setShowModal(true)
  }

  const handleDelete = (basketId: number) => {
    Alert.alert(
      'Supprimer le panier',
      'Êtes-vous sûr de vouloir supprimer ce panier surprise ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true)
              await apiService.delete(`/surprise-baskets/${basketId}`)
              await loadBaskets()
              showSuccessModal('Suppression réussie', 'Le panier a été supprimé avec succès.')
            } catch (error: any) {
              console.error('❌ Erreur suppression:', error)
              showErrorModal('Erreur de suppression', 'Impossible de supprimer le panier. Veuillez réessayer.')
            } finally {
              setLoading(false)
            }
          },
        },
      ]
    )
  }

  const handleToggleStatus = async (basket: SurpriseBasket) => {
    try {
      setLoading(true)
      await apiService.put(`/surprise-baskets/${basket.id}`, {
        is_active: !basket.is_active,
      })
      await loadBaskets()
      showSuccessModal(
        'Statut modifié',
        basket.is_active ? 'Le panier a été désactivé.' : 'Le panier a été activé.'
      )
    } catch (error: any) {
      console.error('❌ Erreur toggle:', error)
      showErrorModal('Erreur de modification', 'Impossible de modifier le statut du panier.')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      showErrorModal('Validation', 'Le nom est requis')
      return
    }

    const price = parseFloat(formData.discounted_price)
    if (!formData.discounted_price || isNaN(price) || price <= 0) {
      showErrorModal('Validation', 'Le prix doit être un nombre valide supérieur à 0')
      return
    }

    const quantity = parseInt(formData.quantity_available)
    if (!formData.quantity_available || isNaN(quantity) || quantity <= 0) {
      showErrorModal('Validation', 'La quantité doit être un nombre valide supérieur à 0')
      return
    }

    try {
      setLoading(true)

      const minItems = formData.min_items ? parseInt(formData.min_items) : null
      const payload = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        discounted_price: price,
        quantity_available: quantity,
        min_items: minItems && !isNaN(minItems) && minItems > 0 ? minItems : null,
      }

      if (editingBasket) {
        await apiService.put(`/surprise-baskets/${editingBasket.id}`, payload)
        setShowModal(false)
        await loadBaskets()
        showSuccessModal('Modification réussie', 'Le panier a été modifié avec succès.')
      } else {
        await apiService.post('/surprise-baskets', payload)
        setShowModal(false)
        await loadBaskets()
        showSuccessModal('Création réussie', 'Le panier surprise a été créé avec succès.')
      }
    } catch (error: any) {
      console.error('❌ Erreur soumission:', error)
      showErrorModal(
        'Erreur de sauvegarde',
        error?.message || 'Impossible de sauvegarder le panier. Veuillez réessayer.'
      )
    } finally {
      setLoading(false)
    }
  }

  const activeCount = useMemo(() => baskets.filter((b) => b.is_active).length, [baskets])
  const inactiveCount = useMemo(() => baskets.filter((b) => !b.is_active).length, [baskets])
  const totalRevenue = useMemo(
    () => baskets.reduce((sum, b) => sum + (b.discounted_price ?? 0) * (b.quantity_available ?? 0), 0),
    [baskets]
  )

  const filteredBaskets = useMemo(() => {
    if (statusFilter === 'all') return baskets
    return baskets.filter((b) =>
      statusFilter === 'active' ? b.is_active : !b.is_active
    )
  }, [baskets, statusFilter])

  const renderBasket = ({ item }: { item: SurpriseBasket }) => (
    <Card variant="elevated" style={styles.basketCard} pressable={false}>
      <View style={styles.basketHeader}>
        <View style={{ flex: 1 }}>
          <Typography variant="h4" weight="semibold" numberOfLines={1}>
            {item.name}
          </Typography>
          {item.description && (
            <Typography variant="small" color="secondary" numberOfLines={2} style={{ marginTop: 4 }}>
              {item.description}
            </Typography>
          )}
        </View>
        <Badge variant={item.is_active ? 'success' : 'secondary'} size="sm">
          {item.is_active ? 'Actif' : 'Inactif'}
        </Badge>
      </View>

      <View style={styles.basketInfo}>
        <View style={styles.infoRow}>
          <Ionicons name="pricetag" size={16} color={theme.colors.neutral[400]} />
          <Typography variant="body" style={{ marginLeft: 6 }}>
            {formatCurrency(item.discounted_price)}
          </Typography>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="cube" size={16} color={theme.colors.neutral[400]} />
          <Typography variant="body" style={{ marginLeft: 6 }}>
            {item.quantity_available} disponibles
          </Typography>
        </View>
        {item.min_items && item.min_items > 0 && (
          <View style={styles.infoRow}>
            <Ionicons name="basket" size={16} color={theme.colors.primary[500]} />
            <Typography variant="body" style={{ marginLeft: 6, color: theme.colors.primary[500] }}>
              {item.min_items} articles
            </Typography>
          </View>
        )}
      </View>

      <View style={styles.basketActions}>
        <Button
          variant="ghost"
          size="sm"
          onPress={() => handleEdit(item)}
          leftIcon={<Ionicons name="create-outline" size={18} />}
        >
          Modifier
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onPress={() => handleToggleStatus(item)}
          leftIcon={
            <Ionicons name={item.is_active ? 'close-circle-outline' : 'checkmark-circle-outline'} size={18} />
          }
        >
          {item.is_active ? 'Désactiver' : 'Activer'}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onPress={() => handleDelete(item.id)}
          leftIcon={<Ionicons name="trash-outline" size={18} color={theme.colors.semantic.error} />}
        >
          <Typography variant="small" style={{ color: theme.colors.semantic.error }}>
            Supprimer
          </Typography>
        </Button>
      </View>
    </Card>
  )

  if (loading && baskets.length === 0) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary[500]} />
        <Typography variant="body" color="secondary" style={{ marginTop: 12 }}>
          Chargement des paniers...
        </Typography>
      </View>
    )
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]} testID={TEST_IDS.merchantSurpriseBaskets}>
      <StatusBar barStyle={theme.isDark ? "light-content" : "dark-content"} backgroundColor={theme.colors.background} />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.isDark ? '#0F1622' : theme.colors.primary[500] }]}>
        <View style={styles.headerContent}>
          <View>
            <Typography variant="caption" style={{ color: theme.isDark ? 'rgba(248, 250, 255, 0.7)' : 'rgba(255, 255, 255, 0.8)' }}>
              Mes Paniers
            </Typography>
            <Typography variant="h2" weight="bold" style={{ color: theme.isDark ? '#F8FAFF' : 'white' }}>
              Paniers Surprise
            </Typography>
          </View>
          <TouchableOpacity
            onPress={handleCreate}
            style={styles.createButton}
            testID="create-basket-button"
          >
            <Ionicons name="add-circle" size={32} color="white" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Stats */}
      <View style={styles.statsContainer} testID={TEST_IDS.surpriseBasketsStatsCard}>
        <View style={styles.statCard}>
          <Typography variant="h3" weight="bold" color="primary">
            {baskets.length}
          </Typography>
          <Typography variant="caption" color="secondary">
            Total paniers
          </Typography>
        </View>
        <View style={styles.statCard}>
          <Typography variant="h3" weight="bold" style={{ color: theme.colors.semantic.success }}>
            {activeCount}
          </Typography>
          <Typography variant="caption" color="secondary">
            Actifs
          </Typography>
        </View>
        <View style={styles.statCard}>
          <Typography variant="h3" weight="bold" color="primary">
            {formatCurrency(totalRevenue)}
          </Typography>
          <Typography variant="caption" color="secondary">
            Revenus potentiels
          </Typography>
        </View>
      </View>

      {/* Filters */}
      <View style={styles.filtersContainer}>
        {(['all', 'active', 'inactive'] as StatusFilter[]).map((filter) => (
          <TouchableOpacity
            key={filter}
            style={[
              styles.filterButton,
              {
                backgroundColor: theme.isDark
                  ? (statusFilter === filter ? '#10B981' : '#1B2433')
                  : (statusFilter === filter ? theme.colors.primary[100] : theme.colors.cardBackground),
                borderColor:
                  statusFilter === filter ? (theme.isDark ? '#10B981' : theme.colors.primary[500]) : theme.colors.border,
              },
            ]}
            onPress={() => setStatusFilter(filter)}
          >
            <Typography
              variant="small"
              weight={statusFilter === filter ? 'semibold' : 'regular'}
              style={{
                color: theme.isDark
                  ? (statusFilter === filter ? '#0B140F' : '#E9EDF5')
                  : (statusFilter === filter ? theme.colors.primary[500] : theme.colors.neutral[400]),
              }}
            >
              {filter === 'all' ? 'Tous' : filter === 'active' ? 'Actifs' : 'Inactifs'}
            </Typography>
          </TouchableOpacity>
        ))}
      </View>

      {/* Liste */}
      <FlatList
        data={filteredBaskets}
        renderItem={renderBasket}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="gift-outline" size={64} color={theme.colors.neutral[400]} />
            <Typography variant="h3" weight="semibold" style={{ marginTop: 16 }}>
              Aucun panier surprise
            </Typography>
            <Typography variant="body" color="secondary" style={{ marginTop: 8, textAlign: 'center' }}>
              {statusFilter === 'all'
                ? 'Créez votre premier panier surprise'
                : `Aucun panier ${statusFilter === 'active' ? 'actif' : 'inactif'}`}
            </Typography>
            {statusFilter === 'all' && (
              <Button variant="primary" size="md" onPress={handleCreate} style={{ marginTop: 24 }}>
                Créer un panier
              </Button>
            )}
          </View>
        }
      />

      {/* Modal Création/Édition */}
      <Modal visible={showModal} animationType="slide" transparent={true} testID={TEST_IDS.basketFormModal}>
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={[styles.modalContent, { backgroundColor: theme.colors.background }]}>
            <View style={[styles.modalHeader, { borderBottomColor: theme.colors.border }]}>
              <Typography variant="h3" weight="semibold">
                {editingBasket ? 'Modifier le panier' : 'Nouveau panier surprise'}
              </Typography>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Ionicons name="close" size={28} color={theme.colors.neutral[400]} />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.modalBody}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.formGroup}>
                <Typography variant="body" weight="semibold" style={{ marginBottom: 8 }}>
                  Nom du panier *
                </Typography>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: theme.colors.inputBackground,
                      borderColor: theme.colors.inputBorder,
                      borderWidth: 1,
                      color: theme.colors.text,
                    },
                  ]}
                  placeholder="Ex: Panier Mystère du Jour"
                  placeholderTextColor={theme.colors.textTertiary}
                  value={formData.name}
                  onChangeText={(text) => setFormData({ ...formData, name: text })}
                  testID={TEST_IDS.basketNameInput}
                />
              </View>

              <View style={styles.formGroup}>
                <Typography variant="body" weight="semibold" style={{ marginBottom: 8 }}>
                  Description
                </Typography>
                <TextInput
                  style={[
                    styles.textArea,
                    {
                      backgroundColor: theme.colors.inputBackground,
                      borderColor: theme.colors.inputBorder,
                      borderWidth: 1,
                      color: theme.colors.text,
                    },
                  ]}
                  placeholder="Décrivez le contenu du panier"
                  placeholderTextColor={theme.colors.textTertiary}
                  value={formData.description}
                  onChangeText={(text) => setFormData({ ...formData, description: text })}
                  multiline
                  numberOfLines={4}
                  testID={TEST_IDS.basketDescriptionInput}
                />
              </View>

              <View style={styles.formGroup}>
                <Typography variant="body" weight="semibold" style={{ marginBottom: 8 }}>
                  Prix (XOF) *
                </Typography>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: theme.colors.inputBackground,
                      borderColor: theme.colors.inputBorder,
                      borderWidth: 1,
                      color: theme.colors.text,
                    },
                  ]}
                  placeholder="Ex: 2000"
                  placeholderTextColor={theme.colors.textTertiary}
                  value={formData.discounted_price}
                  onChangeText={(text) => setFormData({ ...formData, discounted_price: text })}
                  keyboardType="numeric"
                  testID={TEST_IDS.basketPriceInput}
                />
              </View>

              <View style={styles.formGroup}>
                <Typography variant="body" weight="semibold" style={{ marginBottom: 8 }}>
                  Quantité disponible *
                </Typography>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: theme.colors.inputBackground,
                      borderColor: theme.colors.inputBorder,
                      borderWidth: 1,
                      color: theme.colors.text,
                    },
                  ]}
                  placeholder="Ex: 10"
                  placeholderTextColor={theme.colors.textTertiary}
                  value={formData.quantity_available}
                  onChangeText={(text) => setFormData({ ...formData, quantity_available: text })}
                  keyboardType="numeric"
                  testID={TEST_IDS.basketQuantityInput}
                />
              </View>

              <View style={styles.formGroup}>
                <Typography variant="body" weight="semibold" style={{ marginBottom: 8 }}>
                  Nombre d'articles dans le panier
                </Typography>
                <Typography variant="caption" color="secondary" style={{ marginBottom: 8 }}>
                  Indiquez combien d'articles seront inclus dans ce panier surprise
                </Typography>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: theme.colors.inputBackground,
                      borderColor: theme.colors.inputBorder,
                      borderWidth: 1,
                      color: theme.colors.text,
                    },
                  ]}
                  placeholder="Ex: 5"
                  placeholderTextColor={theme.colors.textTertiary}
                  value={formData.min_items}
                  onChangeText={(text) => setFormData({ ...formData, min_items: text })}
                  keyboardType="numeric"
                  testID="basket-items-count-input"
                />
              </View>
            </ScrollView>

            <View style={[styles.modalFooter, { borderTopColor: theme.colors.border }]}>
              <Button
                variant="secondary"
                size="md"
                onPress={() => setShowModal(false)}
                style={{ flex: 1, marginRight: 8 }}
              >
                Annuler
              </Button>
              <Button
                variant="primary"
                size="md"
                onPress={handleSubmit}
                loading={loading}
                style={{ flex: 1, marginLeft: 8 }}
                testID={TEST_IDS.submitBasketButton}
              >
                {editingBasket ? 'Modifier' : 'Créer'}
              </Button>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Styled Error Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={errorModalVisible}
        onRequestClose={() => setErrorModalVisible(false)}
      >
        <View style={styles.errorModalOverlay}>
          <View style={[styles.errorModalContainer, { backgroundColor: theme.colors.background }]}>
            {/* Error Icon */}
            <View style={styles.errorIconContainer}>
              <Ionicons name="alert-circle" size={48} color="#DC2626" />
            </View>

            {/* Error Title */}
            <Text style={styles.errorModalTitle}>{errorTitle}</Text>

            {/* Error Message */}
            <Text style={[styles.errorModalMessage, { color: theme.colors.text }]}>
              {errorMessage}
            </Text>

            {/* Close Button */}
            <TouchableOpacity
              style={styles.errorModalButton}
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
        onRequestClose={() => setSuccessModalVisible(false)}
      >
        <View style={styles.errorModalOverlay}>
          <View style={[styles.errorModalContainer, { backgroundColor: theme.colors.background }]}>
            {/* Success Icon */}
            <View style={styles.successIconContainer}>
              <Ionicons name="checkmark-circle" size={48} color="#10B981" />
            </View>

            {/* Success Title */}
            <Text style={styles.successModalTitle}>{successTitle}</Text>

            {/* Success Message */}
            <Text style={[styles.errorModalMessage, { color: theme.colors.text }]}>
              {successMessage}
            </Text>

            {/* Close Button */}
            <TouchableOpacity
              style={styles.successModalButton}
              onPress={() => setSuccessModalVisible(false)}
            >
              <Text style={styles.errorModalButtonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  header: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  createButton: {
    padding: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
  },
  filtersContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  listContent: {
    padding: 16,
  },
  basketCard: {
    marginBottom: 12,
    padding: 16,
  },
  basketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  basketInfo: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  basketActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
  },
  modalBody: {
    padding: 20,
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
  },
  formGroup: {
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  // Error Modal Styles
  errorModalOverlay: {
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
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  errorModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#DC2626',
    textAlign: 'center',
    marginBottom: 12,
  },
  errorModalMessage: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  errorModalButton: {
    width: '100%',
    backgroundColor: '#DC2626',
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
  successModalButton: {
    width: '100%',
    backgroundColor: '#10B981',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
})

export default MerchantSurpriseBasketsScreen
