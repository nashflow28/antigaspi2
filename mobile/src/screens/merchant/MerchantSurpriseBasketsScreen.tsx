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
  })

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
      console.log('📦 [MerchantSurpriseBaskets] Réponse:', response)
      // 🐛 BUG FIX: API returns paginated data, baskets are in response.data.data
      setBaskets(response.data?.data || [])
    } catch (error: any) {
      console.error('❌ [MerchantSurpriseBaskets] Erreur:', error)
      Alert.alert('Erreur', 'Impossible de charger les paniers surprise')
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
              Alert.alert('Succès', 'Le panier a été supprimé')
            } catch (error: any) {
              console.error('❌ Erreur suppression:', error)
              Alert.alert('Erreur', 'Impossible de supprimer le panier')
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
      Alert.alert(
        'Succès',
        basket.is_active ? 'Panier désactivé' : 'Panier activé'
      )
    } catch (error: any) {
      console.error('❌ Erreur toggle:', error)
      Alert.alert('Erreur', 'Impossible de modifier le statut')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      Alert.alert('Erreur', 'Le nom est requis')
      return
    }

    const price = parseFloat(formData.discounted_price)
    if (!formData.discounted_price || isNaN(price) || price <= 0) {
      Alert.alert('Erreur', 'Le prix doit être un nombre valide supérieur à 0')
      return
    }

    const quantity = parseInt(formData.quantity_available)
    if (!formData.quantity_available || isNaN(quantity) || quantity <= 0) {
      Alert.alert('Erreur', 'La quantité doit être un nombre valide supérieur à 0')
      return
    }

    try {
      setLoading(true)

      const payload = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        discounted_price: price,
        quantity_available: quantity,
      }

      if (editingBasket) {
        await apiService.put(`/surprise-baskets/${editingBasket.id}`, payload)
        Alert.alert('Succès', 'Panier modifié avec succès')
      } else {
        await apiService.post('/surprise-baskets', payload)
        Alert.alert('Succès', 'Panier créé avec succès')
      }

      setShowModal(false)
      await loadBaskets()
    } catch (error: any) {
      console.error('❌ Erreur soumission:', error)
      Alert.alert(
        'Erreur',
        error?.response?.data?.message || 'Impossible de sauvegarder le panier'
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
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.primary[500]} />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.colors.primary[500] }]}>
        <View style={styles.headerContent}>
          <View>
            <Typography variant="caption" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
              Mes Paniers
            </Typography>
            <Typography variant="h2" weight="bold" style={{ color: 'white' }}>
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
                backgroundColor:
                  statusFilter === filter ? theme.colors.primary[100] : theme.colors.surface.light,
                borderColor:
                  statusFilter === filter ? theme.colors.primary[500] : theme.colors.border,
              },
            ]}
            onPress={() => setStatusFilter(filter)}
          >
            <Typography
              variant="small"
              weight={statusFilter === filter ? 'semibold' : 'regular'}
              style={{
                color:
                  statusFilter === filter ? theme.colors.primary[500] : theme.colors.neutral[400],
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
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.colors.background }]}>
            <View style={[styles.modalHeader, { borderBottomColor: theme.colors.border }]}>
              <Typography variant="h3" weight="semibold">
                {editingBasket ? 'Modifier le panier' : 'Nouveau panier surprise'}
              </Typography>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Ionicons name="close" size={28} color={theme.colors.neutral[400]} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <View style={styles.formGroup}>
                <Typography variant="body" weight="semibold" style={{ marginBottom: 8 }}>
                  Nom du panier *
                </Typography>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: theme.colors.surface.light,
                      borderColor: theme.colors.border,
                      color: theme.colors.neutral[900],
                    },
                  ]}
                  placeholder="Ex: Panier Mystère du Jour"
                  placeholderTextColor={theme.colors.neutral[400]}
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
                      backgroundColor: theme.colors.surface.light,
                      borderColor: theme.colors.border,
                      color: theme.colors.neutral[900],
                    },
                  ]}
                  placeholder="Décrivez le contenu du panier"
                  placeholderTextColor={theme.colors.neutral[400]}
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
                      backgroundColor: theme.colors.surface.light,
                      borderColor: theme.colors.border,
                      color: theme.colors.neutral[900],
                    },
                  ]}
                  placeholder="Ex: 2000"
                  placeholderTextColor={theme.colors.neutral[400]}
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
                      backgroundColor: theme.colors.surface.light,
                      borderColor: theme.colors.border,
                      color: theme.colors.neutral[900],
                    },
                  ]}
                  placeholder="Ex: 10"
                  placeholderTextColor={theme.colors.neutral[400]}
                  value={formData.quantity_available}
                  onChangeText={(text) => setFormData({ ...formData, quantity_available: text })}
                  keyboardType="numeric"
                  testID={TEST_IDS.basketQuantityInput}
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
})

export default MerchantSurpriseBasketsScreen
