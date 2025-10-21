import React, { useEffect, useState, useCallback } from 'react'
import {
  View,
  Text,
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
import { Ionicons } from '@expo/vector-icons'
import { useTheme } from '../../theme'
import apiService from '../../services/api'
import { Button, Badge, Card, Typography } from '../../components/2025'

interface MerchantWithStats {
  id: number
  business_name: string
  business_type: string
  city?: string
  is_verified: boolean
  latitude: number | null
  longitude: number | null
  products_count: number
  user: {
    id: number
    email: string
    first_name: string
    last_name: string
    city: string
    address: string | null
    phone: string
  }
  created_at?: string
  pending_products?: number
  total_sales?: number
}

type MerchantStatus = 'all' | 'verified' | 'pending'

const AdminMerchantsScreen: React.FC = () => {
  const theme = useTheme()
  const [merchants, setMerchants] = useState<MerchantWithStats[]>([])
  const [filteredMerchants, setFilteredMerchants] = useState<MerchantWithStats[]>([])
  const [refreshing, setRefreshing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<MerchantStatus>('all')
  const [selectedMerchant, setSelectedMerchant] = useState<MerchantWithStats | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    loadMerchants()
  }, [])

  useEffect(() => {
    filterMerchants()
  }, [merchants, searchQuery, statusFilter])

  const loadMerchants = async () => {
    try {
      setLoading(true)
      // Utiliser endpoint admin/moderation pour avoir les statistiques
      const response = await apiService.get('/admin/moderation')
      // L'endpoint retourne { merchants: [...], pending_products: [...] }
      const allMerchants = response.data?.merchants || response.data || []
      setMerchants(allMerchants)
    } catch (error: any) {
      console.error('Erreur chargement merchants:', error)
      Alert.alert('Erreur', 'Impossible de charger les commerçants')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const filterMerchants = useCallback(() => {
    let filtered = [...merchants]

    // Filtre par statut
    if (statusFilter === 'verified') {
      filtered = filtered.filter(m => m.is_verified === true)
    } else if (statusFilter === 'pending') {
      filtered = filtered.filter(m => m.is_verified === false)
    }

    // Filtre par recherche
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        m =>
          m.business_name.toLowerCase().includes(query) ||
          m.business_type.toLowerCase().includes(query) ||
          m.city?.toLowerCase().includes(query) ||
          m.user?.city?.toLowerCase().includes(query) ||
          m.user?.email?.toLowerCase().includes(query)
      )
    }

    setFilteredMerchants(filtered)
  }, [merchants, searchQuery, statusFilter])

  const handleRefresh = () => {
    setRefreshing(true)
    loadMerchants()
  }

  const handleViewDetails = (merchant: MerchantWithStats) => {
    setSelectedMerchant(merchant)
    setShowDetailModal(true)
  }

  const handleApproveMerchant = async (merchant: MerchantWithStats) => {
    Alert.alert(
      'Approuver le commerçant',
      `Voulez-vous approuver ${merchant.business_name} ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Approuver',
          style: 'default',
          onPress: async () => {
            try {
              setActionLoading(true)
              await apiService.post(`/admin/merchants/${merchant.id}/approve`)

              // Mise à jour locale optimiste
              setMerchants(prev =>
                prev.map(m => (m.id === merchant.id ? { ...m, is_verified: true } : m))
              )

              Alert.alert('Succès', `${merchant.business_name} a été approuvé`)
              setShowDetailModal(false)
            } catch (error: any) {
              console.error('Erreur approbation:', error)
              Alert.alert('Erreur', "Impossible d'approuver le commerçant")
            } finally {
              setActionLoading(false)
            }
          },
        },
      ]
    )
  }

  const handleRejectMerchant = async (merchant: MerchantWithStats) => {
    Alert.prompt(
      'Rejeter le commerçant',
      'Veuillez indiquer la raison du rejet :',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Rejeter',
          style: 'destructive',
          onPress: async (reason: string | undefined) => {
            if (!reason || reason.trim().length < 10) {
              Alert.alert('Erreur', 'La raison doit contenir au moins 10 caractères')
              return
            }

            try {
              setActionLoading(true)
              await apiService.post(`/admin/merchants/${merchant.id}/reject`, {
                reason: reason.trim(),
              })

              // Mise à jour locale
              setMerchants(prev =>
                prev.map(m => (m.id === merchant.id ? { ...m, is_verified: false } : m))
              )

              Alert.alert('Succès', `${merchant.business_name} a été rejeté`)
              setShowDetailModal(false)
            } catch (error: any) {
              console.error('Erreur rejet:', error)
              Alert.alert('Erreur', 'Impossible de rejeter le commerçant')
            } finally {
              setActionLoading(false)
            }
          },
        },
      ],
      'plain-text'
    )
  }

  const renderMerchantCard = ({ item }: { item: MerchantWithStats }) => (
    <TouchableOpacity onPress={() => handleViewDetails(item)} activeOpacity={0.7}>
      <Card style={styles.merchantCard}>
        <View style={styles.cardHeader}>
          <View style={styles.iconContainer}>
            <Ionicons name="storefront" size={24} color={theme.colors.primary[500]} />
          </View>
          <View style={styles.cardContent}>
            <View style={styles.titleRow}>
              <Typography variant="h4" weight="semibold" style={{ flex: 1 }}>
                {item.business_name}
              </Typography>
              <Badge variant={item.is_verified ? 'success' : 'warning'}>
                {item.is_verified ? 'Vérifié' : 'En attente'}
              </Badge>
            </View>
            <Typography variant="caption" color="secondary">
              {item.business_type} • {item.user.city}
            </Typography>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Ionicons name="cube-outline" size={14} color={theme.colors.neutral[500]} />
                <Typography variant="caption" color="secondary" style={{ marginLeft: 4 }}>
                  {item.products_count || 0} produits
                </Typography>
              </View>
              <View style={styles.statItem}>
                <Ionicons name="person-outline" size={14} color={theme.colors.neutral[500]} />
                <Typography variant="caption" color="secondary" style={{ marginLeft: 4 }}>
                  {item.user.email}
                </Typography>
              </View>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color={theme.colors.neutral[400]} />
        </View>
      </Card>
    </TouchableOpacity>
  )

  const renderDetailModal = () => {
    if (!selectedMerchant) return null

    return (
      <Modal
        visible={showDetailModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowDetailModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.colors.background }]}>
            <View style={styles.modalHeader}>
              <Typography variant="h3" weight="bold">
                Détails du commerçant
              </Typography>
              <TouchableOpacity onPress={() => setShowDetailModal(false)}>
                <Ionicons name="close" size={28} color={theme.colors.neutral[600]} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              {/* Informations entreprise */}
              <View style={styles.section}>
                <Typography variant="h4" weight="semibold" style={{ marginBottom: 12 }}>
                  Entreprise
                </Typography>
                <View style={styles.infoRow}>
                  <Typography variant="body" color="secondary">
                    Nom:
                  </Typography>
                  <Typography variant="body" weight="medium">
                    {selectedMerchant.business_name}
                  </Typography>
                </View>
                <View style={styles.infoRow}>
                  <Typography variant="body" color="secondary">
                    Type:
                  </Typography>
                  <Typography variant="body" weight="medium">
                    {selectedMerchant.business_type}
                  </Typography>
                </View>
                <View style={styles.infoRow}>
                  <Typography variant="body" color="secondary">
                    Statut:
                  </Typography>
                  <Badge variant={selectedMerchant.is_verified ? 'success' : 'warning'}>
                    {selectedMerchant.is_verified ? 'Vérifié' : 'En attente'}
                  </Badge>
                </View>
                <View style={styles.infoRow}>
                  <Typography variant="body" color="secondary">
                    Produits:
                  </Typography>
                  <Typography variant="body" weight="medium">
                    {selectedMerchant.products_count || 0} produits
                  </Typography>
                </View>
              </View>

              {/* Informations utilisateur */}
              <View style={styles.section}>
                <Typography variant="h4" weight="semibold" style={{ marginBottom: 12 }}>
                  Contact
                </Typography>
                <View style={styles.infoRow}>
                  <Typography variant="body" color="secondary">
                    Nom complet:
                  </Typography>
                  <Typography variant="body" weight="medium">
                    {selectedMerchant.user.first_name} {selectedMerchant.user.last_name}
                  </Typography>
                </View>
                <View style={styles.infoRow}>
                  <Typography variant="body" color="secondary">
                    Email:
                  </Typography>
                  <Typography variant="body" weight="medium">
                    {selectedMerchant.user.email}
                  </Typography>
                </View>
                <View style={styles.infoRow}>
                  <Typography variant="body" color="secondary">
                    Téléphone:
                  </Typography>
                  <Typography variant="body" weight="medium">
                    {selectedMerchant.user.phone}
                  </Typography>
                </View>
                <View style={styles.infoRow}>
                  <Typography variant="body" color="secondary">
                    Ville:
                  </Typography>
                  <Typography variant="body" weight="medium">
                    {selectedMerchant.user.city}
                  </Typography>
                </View>
                {selectedMerchant.user.address && (
                  <View style={styles.infoRow}>
                    <Typography variant="body" color="secondary">
                      Adresse:
                    </Typography>
                    <Typography variant="body" weight="medium" style={{ flex: 1, textAlign: 'right' }}>
                      {selectedMerchant.user.address}
                    </Typography>
                  </View>
                )}
              </View>

              {/* Actions admin */}
              <View style={styles.section}>
                <Typography variant="h4" weight="semibold" style={{ marginBottom: 12 }}>
                  Actions administrateur
                </Typography>
                {!selectedMerchant.is_verified && (
                  <Button
                    variant="primary"
                    onPress={() => handleApproveMerchant(selectedMerchant)}
                    disabled={actionLoading}
                    style={{ marginBottom: 12 }}
                    leftIcon={
                      <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
                    }
                  >
                    {actionLoading ? 'Chargement...' : 'Approuver le commerçant'}
                  </Button>
                )}
                <Button
                  variant="destructive"
                  onPress={() => handleRejectMerchant(selectedMerchant)}
                  disabled={actionLoading}
                  leftIcon={<Ionicons name="close-circle" size={20} color="#FFFFFF" />}
                >
                  Rejeter / Suspendre
                </Button>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    )
  }

  const renderHeader = () => (
    <View style={styles.header}>
      <Typography variant="h2" weight="bold" style={{ marginBottom: 16 }}>
        Gestion des commerçants
      </Typography>

      {/* Barre de recherche */}
      <View style={[styles.searchBar, { backgroundColor: theme.colors.surface.light }]}>
        <Ionicons name="search" size={20} color={theme.colors.neutral[500]} />
        <TextInput
          style={[styles.searchInput, { color: theme.colors.text }]}
          placeholder="Rechercher un commerçant..."
          placeholderTextColor={theme.colors.neutral[400]}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color={theme.colors.neutral[500]} />
          </TouchableOpacity>
        )}
      </View>

      {/* Filtres */}
      <View style={styles.filtersRow}>
        <TouchableOpacity
          onPress={() => setStatusFilter('all')}
          style={[
            styles.filterChip,
            {
              backgroundColor:
                statusFilter === 'all' ? theme.colors.primary[500] : theme.colors.surface.light,
            },
          ]}
        >
          <Typography
            variant="caption"
            weight="medium"
            style={{ color: statusFilter === 'all' ? '#FFFFFF' : theme.colors.text }}
          >
            Tous ({merchants.length})
          </Typography>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setStatusFilter('verified')}
          style={[
            styles.filterChip,
            {
              backgroundColor:
                statusFilter === 'verified' ? theme.colors.success[500] : theme.colors.surface.light,
            },
          ]}
        >
          <Typography
            variant="caption"
            weight="medium"
            style={{
              color: statusFilter === 'verified' ? '#FFFFFF' : theme.colors.text,
            }}
          >
            Vérifiés ({merchants.filter(m => m.is_verified).length})
          </Typography>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setStatusFilter('pending')}
          style={[
            styles.filterChip,
            {
              backgroundColor:
                statusFilter === 'pending' ? theme.colors.warning[500] : theme.colors.surface.light,
            },
          ]}
        >
          <Typography
            variant="caption"
            weight="medium"
            style={{
              color: statusFilter === 'pending' ? '#FFFFFF' : theme.colors.text,
            }}
          >
            En attente ({merchants.filter(m => !m.is_verified).length})
          </Typography>
        </TouchableOpacity>
      </View>
    </View>
  )

  if (loading) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary[500]} />
        <Typography variant="body" color="secondary" style={{ marginTop: 12 }}>
          Chargement des commerçants...
        </Typography>
      </View>
    )
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar barStyle="dark-content" backgroundColor={theme.colors.background} />

      <FlatList
        data={filteredMerchants}
        keyExtractor={item => `merchant-${item.id}`}
        renderItem={renderMerchantCard}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="storefront-outline" size={64} color={theme.colors.neutral[400]} />
            <Typography variant="h4" weight="semibold" style={{ marginTop: 16 }}>
              Aucun commerçant trouvé
            </Typography>
            <Typography variant="body" color="secondary" style={{ marginTop: 8 }}>
              {searchQuery
                ? 'Essayez de modifier votre recherche'
                : 'Aucun commerçant enregistré pour le moment'}
            </Typography>
          </View>
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[theme.colors.primary[500]]}
          />
        }
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />

      {renderDetailModal()}
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
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 15,
  },
  filtersRow: {
    flexDirection: 'row',
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  merchantCard: {
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
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 8,
  },
  statsRow: {
    flexDirection: 'row',
    marginTop: 8,
    gap: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
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
    maxHeight: '90%',
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
  section: {
    marginBottom: 24,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
})

export default AdminMerchantsScreen
