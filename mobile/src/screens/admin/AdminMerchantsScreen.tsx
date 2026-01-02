import React, { useEffect, useState, useCallback } from 'react'
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  TextInput,
  Modal,
  ScrollView,
  ActivityIndicator,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useTheme } from '../../theme'
import apiService from '../../services/api'
import { Button, Badge, Card, Typography } from '../../components/2025'
import { AdminHeader } from '../../components/admin'
import AlertModal from '../../components/AlertModal'
import { useAlert } from '../../hooks/useAlert'

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
  const insets = useSafeAreaInsets()
  const { alertProps, showError, showSuccess, showWarning, hideAlert } = useAlert()
  const [merchants, setMerchants] = useState<MerchantWithStats[]>([])
  const [filteredMerchants, setFilteredMerchants] = useState<MerchantWithStats[]>([])
  const [refreshing, setRefreshing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<MerchantStatus>('all')
  const [selectedMerchant, setSelectedMerchant] = useState<MerchantWithStats | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  // Utiliser un Set d'IDs au lieu d'un boolean pour éviter les race conditions
  const [actionLoadingIds, setActionLoadingIds] = useState<Set<number>>(new Set())
  // Modal de rejet (remplacement de Alert.prompt qui n'existe pas sur Android)
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [rejectReason, setRejectReason] = useState('')

  useEffect(() => {
    loadMerchants()
  }, [])

  useEffect(() => {
    filterMerchants()
  }, [merchants, searchQuery, statusFilter])

  const loadMerchants = async () => {
    try {
      setLoading(true)
      // API endpoint: GET /admin/moderation
      // NOTE: Utilise endpoint admin/moderation pour avoir les statistiques étendues
      // L'endpoint retourne { merchants: MerchantWithStats[], pending_products: Product[] }
      // TODO: Implémenter pagination si le nombre de merchants dépasse 100
      const response = await apiService.get('/admin/moderation')
      // apiService retourne directement response.data d'axios
      // Backend retourne {success, merchants, pendingMerchants, ...}
      console.log('🟢 [AdminMerchants] Response keys:', Object.keys(response || {}))
      console.log('🟢 [AdminMerchants] response.merchants:', response.merchants?.length)
      console.log('🟢 [AdminMerchants] response.data:', response.data)

      // Essayer plusieurs chemins possibles
      const allMerchants = response.merchants || response.data?.merchants || response.data || []
      console.log('🟢 [AdminMerchants] Nombre merchants:', allMerchants.length)
      setMerchants(allMerchants)
    } catch (error: any) {
      console.error('Erreur chargement merchants:', error)

      // Gestion des erreurs d'autorisation
      if (error.response?.status === 401 || error.response?.status === 403) {
        showWarning(
          'Session expirée',
          'Votre session a expiré. Veuillez vous reconnecter.'
        )
        return
      }

      showError('Erreur', 'Impossible de charger les commerçants')
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
    showWarning(
      'Approuver le commerçant',
      `Voulez-vous approuver ${merchant.business_name} ?`,
      [
        { text: 'Annuler', style: 'cancel', onPress: hideAlert },
        {
          text: 'Approuver',
          style: 'default',
          onPress: async () => {
            hideAlert()
            // Backup pour rollback en cas d'erreur
            const previousMerchants = [...merchants]

            try {
              // Ajouter l'ID au Set de loading
              setActionLoadingIds(prev => new Set(prev).add(merchant.id))

              // Mise à jour optimiste
              setMerchants(prev =>
                prev.map(m => (m.id === merchant.id ? { ...m, is_verified: true } : m))
              )

              await apiService.post(`/admin/merchants/${merchant.id}/approve`)

              showSuccess('Succès', `${merchant.business_name} a été approuvé`)
              setShowDetailModal(false)
            } catch (error: any) {
              console.error('Erreur approbation:', error)

              // Rollback en cas d'erreur
              setMerchants(previousMerchants)

              showError('Erreur', "Impossible d'approuver le commerçant")
            } finally {
              // Retirer l'ID du Set
              setActionLoadingIds(prev => {
                const newSet = new Set(prev)
                newSet.delete(merchant.id)
                return newSet
              })
            }
          },
        },
      ]
    )
  }

  const handleRejectMerchant = (merchant: MerchantWithStats) => {
    // Ouvrir le modal de rejet personnalisé (Alert.prompt n'existe pas sur Android)
    setSelectedMerchant(merchant)
    setRejectReason('')
    setShowRejectModal(true)
  }

  const confirmRejectMerchant = async () => {
    if (!selectedMerchant) return

    if (!rejectReason || rejectReason.trim().length < 10) {
      showError('Erreur', 'La raison doit contenir au moins 10 caractères')
      return
    }

    // Backup pour rollback en cas d'erreur
    const previousMerchants = [...merchants]

    try {
      // Ajouter l'ID au Set de loading
      setActionLoadingIds(prev => new Set(prev).add(selectedMerchant.id))

      // Mise à jour optimiste
      setMerchants(prev =>
        prev.map(m => (m.id === selectedMerchant.id ? { ...m, is_verified: false } : m))
      )

      await apiService.post(`/admin/merchants/${selectedMerchant.id}/reject`, {
        reason: rejectReason.trim(),
      })

      showSuccess('Succès', `${selectedMerchant.business_name} a été rejeté`)
      setShowRejectModal(false)
      setShowDetailModal(false)
      setRejectReason('')
    } catch (error: any) {
      console.error('Erreur rejet:', error)

      // Rollback en cas d'erreur
      setMerchants(previousMerchants)

      showError('Erreur', 'Impossible de rejeter le commerçant')
    } finally {
      // Retirer l'ID du Set
      setActionLoadingIds(prev => {
        const newSet = new Set(prev)
        newSet.delete(selectedMerchant.id)
        return newSet
      })
    }
  }

  const renderMerchantCard = ({ item }: { item: MerchantWithStats }) => (
    <TouchableOpacity onPress={() => handleViewDetails(item)} activeOpacity={0.7}>
      <Card style={styles.merchantCard}>
        <View style={styles.cardHeader}>
          <View style={[styles.iconContainer, { backgroundColor: theme.colors.primary[50] }]}>
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
              {item.business_type} • {item.user?.city || 'Non renseigné'}
            </Typography>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Ionicons name="cube-outline" size={14} color={theme.colors.neutral[500]} />
                <Typography variant="caption" color="secondary" style={{ marginLeft: 4 }}>
                  {item.products_count || 0} produits
                </Typography>
              </View>
              {item.user?.email && (
                <View style={styles.statItem}>
                  <Ionicons name="person-outline" size={14} color={theme.colors.neutral[500]} />
                  <Typography variant="caption" color="secondary" style={{ marginLeft: 4 }}>
                    {item.user.email}
                  </Typography>
                </View>
              )}
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
            <View style={[styles.modalHeader, { borderBottomColor: theme.colors.border }]}>
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
              {selectedMerchant.user ? (
                <View style={styles.section}>
                  <Typography variant="h4" weight="semibold" style={{ marginBottom: 12 }}>
                    Contact
                  </Typography>
                  <View style={styles.infoRow}>
                    <Typography variant="body" color="secondary">
                      Nom complet:
                    </Typography>
                    <Typography variant="body" weight="medium">
                      {selectedMerchant.user.first_name || ''} {selectedMerchant.user.last_name || ''}
                    </Typography>
                  </View>
                  <View style={styles.infoRow}>
                    <Typography variant="body" color="secondary">
                      Email:
                    </Typography>
                    <Typography variant="body" weight="medium">
                      {selectedMerchant.user.email || 'Non renseigné'}
                    </Typography>
                  </View>
                  <View style={styles.infoRow}>
                    <Typography variant="body" color="secondary">
                      Téléphone:
                    </Typography>
                    <Typography variant="body" weight="medium">
                      {selectedMerchant.user.phone || 'Non renseigné'}
                    </Typography>
                  </View>
                  <View style={styles.infoRow}>
                    <Typography variant="body" color="secondary">
                      Ville:
                    </Typography>
                    <Typography variant="body" weight="medium">
                      {selectedMerchant.user.city || 'Non renseigné'}
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
              ) : (
                <View style={styles.section}>
                  <Typography variant="h4" weight="semibold" style={{ marginBottom: 12 }}>
                    Contact
                  </Typography>
                  <Typography variant="body" color="secondary">
                    Informations de contact non disponibles
                  </Typography>
                </View>
              )}

              {/* Actions admin */}
              <View style={styles.section}>
                <Typography variant="h4" weight="semibold" style={{ marginBottom: 12 }}>
                  Actions administrateur
                </Typography>
                {!selectedMerchant.is_verified && (
                  <Button
                    variant="primary"
                    onPress={() => handleApproveMerchant(selectedMerchant)}
                    disabled={actionLoadingIds.has(selectedMerchant.id)}
                    style={{ marginBottom: 12 }}
                    leftIcon={
                      <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
                    }
                  >
                    {actionLoadingIds.has(selectedMerchant.id) ? 'Chargement...' : 'Approuver le commerçant'}
                  </Button>
                )}
                <Button
                  variant="destructive"
                  onPress={() => handleRejectMerchant(selectedMerchant)}
                  disabled={actionLoadingIds.has(selectedMerchant.id)}
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

  // Modal de rejet personnalisé (remplacement de Alert.prompt qui n'existe pas sur Android)
  const renderRejectModal = () => {
    if (!selectedMerchant) return null

    return (
      <Modal
        visible={showRejectModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowRejectModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.colors.background }]}>
            <View style={[styles.modalHeader, { borderBottomColor: theme.colors.border }]}>
              <Typography variant="h3" weight="bold">
                Rejeter le commerçant
              </Typography>
              <TouchableOpacity onPress={() => setShowRejectModal(false)}>
                <Ionicons name="close" size={28} color={theme.colors.neutral[600]} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Typography variant="body" color="secondary" style={{ marginBottom: 16 }}>
                Commerçant : {selectedMerchant.business_name}
              </Typography>

              <Typography variant="body" weight="medium" style={{ marginBottom: 8 }}>
                Raison du rejet (minimum 10 caractères) :
              </Typography>

              <TextInput
                style={[
                  styles.rejectInput,
                  {
                    backgroundColor: theme.colors.surface.light,
                    color: theme.colors.text,
                    borderColor: theme.colors.neutral[300],
                  },
                ]}
                placeholder="Indiquez la raison du rejet..."
                placeholderTextColor={theme.colors.neutral[400]}
                value={rejectReason}
                onChangeText={setRejectReason}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                maxLength={500}
              />

              <Typography variant="caption" color="secondary" style={{ marginTop: 4, marginBottom: 24 }}>
                {rejectReason.length}/500 caractères
              </Typography>

              <View style={styles.modalActions}>
                <Button
                  variant="secondary"
                  onPress={() => {
                    setShowRejectModal(false)
                    setRejectReason('')
                  }}
                  disabled={selectedMerchant ? actionLoadingIds.has(selectedMerchant.id) : false}
                  style={{ flex: 1 }}
                >
                  Annuler
                </Button>

                <Button
                  variant="destructive"
                  onPress={confirmRejectMerchant}
                  disabled={(selectedMerchant ? actionLoadingIds.has(selectedMerchant.id) : false) || rejectReason.trim().length < 10}
                  style={{ flex: 1 }}
                  leftIcon={
                    (selectedMerchant && actionLoadingIds.has(selectedMerchant.id)) ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Ionicons name="close-circle" size={20} color="#FFFFFF" />
                    )
                  }
                >
                  {(selectedMerchant && actionLoadingIds.has(selectedMerchant.id)) ? 'Rejet...' : 'Rejeter'}
                </Button>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    )
  }

  const renderHeader = () => (
    <View style={styles.header}>
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
                statusFilter === 'verified' ? theme.colors.success : theme.colors.surface.light,
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
                statusFilter === 'pending' ? theme.colors.warning : theme.colors.surface.light,
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
      <AdminHeader
        title="Commercants"
        rightIcon="refresh"
        onRightPress={handleRefresh}
        rightIconTestId="refresh-merchants-button"
      />

      <FlatList
        data={filteredMerchants}
        keyExtractor={item => `merchant-${item.id}`}
        renderItem={renderMerchantCard}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="storefront-outline" size={64} color={theme.colors.neutral[400]} />
            <Typography variant="h4" weight="semibold" style={{ marginTop: 16 }}>
              Aucun commercant trouve
            </Typography>
            <Typography variant="body" color="secondary" style={{ marginTop: 8 }}>
              {searchQuery
                ? 'Essayez de modifier votre recherche'
                : 'Aucun commercant enregistre pour le moment'}
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
      {renderRejectModal()}

      <AlertModal {...alertProps} />
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
  rejectInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    fontSize: 15,
    minHeight: 100,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
})

export default AdminMerchantsScreen
