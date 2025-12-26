import React, { useEffect, useState, useCallback } from 'react'
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  StatusBar,
  RefreshControl,
  TextInput,
  ActivityIndicator,
  Modal,
  ScrollView,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useTheme } from '../../theme'
import { User } from '../../types'
import apiService from '../../services/api'
import { Button, Badge, Card, Typography, ConfirmModal } from '../../components/2025'
import AlertModal from '../../components/AlertModal'
import { useAlert } from '../../hooks/useAlert'
import { createLogger } from '../../utils/logger'

const adminLogger = createLogger('AdminUsers')

type RoleFilter = 'all' | 'consumer' | 'merchant' | 'admin'

const AdminUsersScreen: React.FC = () => {
  const theme = useTheme()
  const insets = useSafeAreaInsets()
  const { alertProps, showError, showSuccess, showWarning, hideAlert } = useAlert()
  const [users, setUsers] = useState<User[]>([])
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const [refreshing, setRefreshing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all')

  // Modal states
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [confirmAction, setConfirmAction] = useState<'block' | 'unblock'>('block')
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    loadUsers()
  }, [])

  useEffect(() => {
    filterUsers()
  }, [users, searchQuery, roleFilter])

  const loadUsers = async () => {
    try {
      setLoading(true)
      // API endpoint: GET /admin/users
      // Expected response: { success: true, data: User[] }
      adminLogger.log('Loading users...')
      const response = await apiService.get('/admin/users')
      // apiService retourne déjà response.data, donc response.data = tableau d'users
      const users = Array.isArray(response.data) ? response.data : (response.data?.data || [])
      adminLogger.log('Users loaded:', users.length)
      setUsers(users)
    } catch (error: any) {
      adminLogger.error('Load users error')

      // Gestion des erreurs d'autorisation
      if (error.response?.status === 401 || error.response?.status === 403) {
        showWarning(
          'Session expirée',
          'Votre session a expiré. Veuillez vous reconnecter.'
        )
        return
      }

      showError('Erreur', 'Impossible de charger les utilisateurs')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const filterUsers = useCallback(() => {
    let filtered = [...users]

    if (roleFilter !== 'all') {
      filtered = filtered.filter(u => u.role === roleFilter)
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      // Safe access avec optional chaining pour éviter les crashes si null/undefined
      filtered = filtered.filter(
        u =>
          (u.first_name?.toLowerCase() || '').includes(query) ||
          (u.last_name?.toLowerCase() || '').includes(query) ||
          (u.email?.toLowerCase() || '').includes(query)
      )
    }

    setFilteredUsers(filtered)
  }, [users, searchQuery, roleFilter])

  const handleRefresh = () => {
    setRefreshing(true)
    loadUsers()
  }

  const handleOpenBlockModal = (user: User) => {
    setSelectedUser(user)
    setConfirmAction(user.is_suspended ? 'unblock' : 'block')
    setShowConfirmModal(true)
  }

  const handleConfirmToggleStatus = async () => {
    if (!selectedUser) return

    const isSuspended = selectedUser.is_suspended || false
    const previousUsers = [...users]

    try {
      setActionLoading(true)

      // Mise à jour optimiste
      setUsers(prev =>
        prev.map(u =>
          u.id === selectedUser.id ? { ...u, is_suspended: !isSuspended } : u
        )
      )

      const endpoint = isSuspended
        ? `/admin/users/${selectedUser.id}/unsuspend`
        : `/admin/users/${selectedUser.id}/suspend`

      await apiService.patch(endpoint)

      setShowConfirmModal(false)
      setShowDetailModal(false)
      showSuccess('Succès', isSuspended ? 'Utilisateur débloqué' : 'Utilisateur bloqué')
    } catch (error: any) {
      console.error('Erreur mise à jour statut:', error)
      setUsers(previousUsers)
      showError('Erreur', 'Impossible de mettre à jour le statut')
    } finally {
      setActionLoading(false)
    }
  }

  const handleViewDetails = (user: User) => {
    setSelectedUser(user)
    setShowDetailModal(true)
  }

  const getRoleBadgeVariant = (role: string): 'primary' | 'success' | 'warning' | 'error' => {
    switch (role) {
      case 'admin':
        return 'error'
      case 'merchant':
        return 'warning'
      case 'consumer':
        return 'success'
      default:
        return 'primary'
    }
  }

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin':
        return 'Admin'
      case 'merchant':
        return 'Commerçant'
      case 'consumer':
        return 'Consommateur'
      default:
        return role
    }
  }

  const renderUserCard = ({ item }: { item: User }) => (
    <TouchableOpacity onPress={() => handleViewDetails(item)} activeOpacity={0.7}>
      <Card style={styles.userCard}>
        <View style={styles.cardHeader}>
          <View style={[styles.avatarContainer, { backgroundColor: getRoleColor(item.role) }]}>
            <Typography variant="h4" weight="bold" style={{ color: 'white' }}>
              {(item.first_name?.[0] || '').toUpperCase()}{(item.last_name?.[0] || '').toUpperCase()}
            </Typography>
          </View>
          <View style={styles.cardContent}>
            <View style={styles.titleRow}>
              <Typography variant="h4" weight="semibold" style={{ flex: 1 }} numberOfLines={1}>
                {item.first_name} {item.last_name}
              </Typography>
              <Badge variant={getRoleBadgeVariant(item.role)} size="sm">
                {getRoleLabel(item.role)}
              </Badge>
            </View>
            <Typography variant="caption" color="secondary" numberOfLines={1}>
              {item.email}
            </Typography>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Ionicons name="location-outline" size={14} color={theme.colors.neutral[500]} />
                <Typography variant="caption" color="secondary" style={{ marginLeft: 4 }}>
                  {item.city || 'Non renseigné'}
                </Typography>
              </View>
              {item.is_suspended && (
                <Badge variant="error" size="sm">
                  Bloqué
                </Badge>
              )}
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color={theme.colors.neutral[400]} />
        </View>
      </Card>
    </TouchableOpacity>
  )

  const getRoleColor = (role: string): string => {
    switch (role) {
      case 'admin':
        return '#EF4444'
      case 'merchant':
        return '#F59E0B'
      case 'consumer':
        return '#10B981'
      default:
        return theme.colors.primary[500]
    }
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Non renseigné'
    const date = new Date(dateString)
    return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })
  }

  const renderDetailModal = () => {
    if (!selectedUser) return null

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
                Détails utilisateur
              </Typography>
              <TouchableOpacity onPress={() => setShowDetailModal(false)}>
                <Ionicons name="close" size={28} color={theme.colors.neutral[600]} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              {/* Avatar & Nom */}
              <View style={[styles.userHeader, { borderBottomColor: theme.colors.border }]}>
                <View style={[styles.largeAvatar, { backgroundColor: getRoleColor(selectedUser.role) }]}>
                  <Typography variant="h1" weight="bold" style={{ color: 'white' }}>
                    {(selectedUser.first_name?.[0] || '').toUpperCase()}{(selectedUser.last_name?.[0] || '').toUpperCase()}
                  </Typography>
                </View>
                <Typography variant="h2" weight="bold" style={{ marginTop: 16 }}>
                  {selectedUser.first_name} {selectedUser.last_name}
                </Typography>
                <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
                  <Badge variant={getRoleBadgeVariant(selectedUser.role)}>
                    {getRoleLabel(selectedUser.role)}
                  </Badge>
                  {selectedUser.is_suspended && (
                    <Badge variant="error">Bloqué</Badge>
                  )}
                </View>
              </View>

              {/* Informations */}
              <View style={styles.section}>
                <Typography variant="h4" weight="semibold" style={{ marginBottom: 16 }}>
                  Informations
                </Typography>

                <View style={[styles.infoRow, { borderBottomColor: theme.colors.border }]}>
                  <View style={[styles.infoIcon, { backgroundColor: theme.withOpacity(theme.colors.primary[500], 0.1) }]}>
                    <Ionicons name="mail-outline" size={20} color={theme.colors.primary[500]} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Typography variant="caption" color="secondary">Email</Typography>
                    <Typography variant="body" weight="medium">{selectedUser.email}</Typography>
                  </View>
                </View>

                <View style={[styles.infoRow, { borderBottomColor: theme.colors.border }]}>
                  <View style={[styles.infoIcon, { backgroundColor: theme.withOpacity(theme.colors.primary[500], 0.1) }]}>
                    <Ionicons name="call-outline" size={20} color={theme.colors.primary[500]} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Typography variant="caption" color="secondary">Téléphone</Typography>
                    <Typography variant="body" weight="medium">{selectedUser.phone || 'Non renseigné'}</Typography>
                  </View>
                </View>

                <View style={[styles.infoRow, { borderBottomColor: theme.colors.border }]}>
                  <View style={[styles.infoIcon, { backgroundColor: theme.withOpacity(theme.colors.primary[500], 0.1) }]}>
                    <Ionicons name="location-outline" size={20} color={theme.colors.primary[500]} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Typography variant="caption" color="secondary">Ville</Typography>
                    <Typography variant="body" weight="medium">{selectedUser.city || 'Non renseigné'}</Typography>
                  </View>
                </View>

                <View style={[styles.infoRow, { borderBottomColor: theme.colors.border }]}>
                  <View style={[styles.infoIcon, { backgroundColor: theme.withOpacity(theme.colors.primary[500], 0.1) }]}>
                    <Ionicons name="calendar-outline" size={20} color={theme.colors.primary[500]} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Typography variant="caption" color="secondary">Inscrit le</Typography>
                    <Typography variant="body" weight="medium">{formatDate(selectedUser.created_at)}</Typography>
                  </View>
                </View>
              </View>

              {/* Actions */}
              <View style={styles.section}>
                <Typography variant="h4" weight="semibold" style={{ marginBottom: 16 }}>
                  Actions
                </Typography>
                <Button
                  variant={selectedUser.is_suspended ? 'primary' : 'destructive'}
                  onPress={() => handleOpenBlockModal(selectedUser)}
                  leftIcon={
                    <Ionicons
                      name={selectedUser.is_suspended ? 'checkmark-circle' : 'ban'}
                      size={20}
                      color="#FFFFFF"
                    />
                  }
                >
                  {selectedUser.is_suspended ? 'Débloquer l\'utilisateur' : 'Bloquer l\'utilisateur'}
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
        Gestion des utilisateurs
      </Typography>

      {/* Barre de recherche */}
      <View style={[styles.searchBar, { backgroundColor: theme.colors.surface.light }]}>
        <Ionicons name="search" size={20} color={theme.colors.neutral[500]} />
        <TextInput
          style={[styles.searchInput, { color: theme.colors.text }]}
          placeholder="Rechercher un utilisateur..."
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

      {/* Filtres par rôle */}
      <View style={styles.filtersRow}>
        <TouchableOpacity
          onPress={() => setRoleFilter('all')}
          style={[
            styles.filterChip,
            {
              backgroundColor:
                roleFilter === 'all' ? theme.colors.primary[500] : theme.colors.surface.light,
            },
          ]}
        >
          <Typography
            variant="caption"
            weight="medium"
            style={{ color: roleFilter === 'all' ? '#FFFFFF' : theme.colors.text }}
          >
            Tous ({users.length})
          </Typography>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setRoleFilter('consumer')}
          style={[
            styles.filterChip,
            {
              backgroundColor:
                roleFilter === 'consumer' ? theme.colors.success : theme.colors.surface.light,
            },
          ]}
        >
          <Typography
            variant="caption"
            weight="medium"
            style={{
              color: roleFilter === 'consumer' ? '#FFFFFF' : theme.colors.text,
            }}
          >
            Consommateurs ({users.filter(u => u.role === 'consumer').length})
          </Typography>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setRoleFilter('merchant')}
          style={[
            styles.filterChip,
            {
              backgroundColor:
                roleFilter === 'merchant' ? theme.colors.warning : theme.colors.surface.light,
            },
          ]}
        >
          <Typography
            variant="caption"
            weight="medium"
            style={{
              color: roleFilter === 'merchant' ? '#FFFFFF' : theme.colors.text,
            }}
          >
            Commerçants ({users.filter(u => u.role === 'merchant').length})
          </Typography>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setRoleFilter('admin')}
          style={[
            styles.filterChip,
            {
              backgroundColor:
                roleFilter === 'admin' ? theme.colors.error : theme.colors.surface.light,
            },
          ]}
        >
          <Typography
            variant="caption"
            weight="medium"
            style={{
              color: roleFilter === 'admin' ? '#FFFFFF' : theme.colors.text,
            }}
          >
            Admins ({users.filter(u => u.role === 'admin').length})
          </Typography>
        </TouchableOpacity>
      </View>
    </View>
  )

  if (loading) {
    return (
      <View
        style={[styles.container, styles.centered, { backgroundColor: theme.colors.background }]}
      >
        <ActivityIndicator size="large" color={theme.colors.primary[500]} />
        <Typography variant="body" color="secondary" style={{ marginTop: 12 }}>
          Chargement des utilisateurs...
        </Typography>
      </View>
    )
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar barStyle={theme.isDark ? 'light-content' : 'dark-content'} backgroundColor={theme.colors.background} />

      <FlatList
        data={filteredUsers}
        keyExtractor={item => `user-${item.id}`}
        renderItem={renderUserCard}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={64} color={theme.colors.neutral[400]} />
            <Typography variant="h4" weight="semibold" style={{ marginTop: 16 }}>
              Aucun utilisateur trouvé
            </Typography>
            <Typography variant="body" color="secondary" style={{ marginTop: 8 }}>
              {searchQuery
                ? 'Essayez de modifier votre recherche'
                : 'Aucun utilisateur enregistré pour le moment'}
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
        contentContainerStyle={[styles.listContent, { paddingTop: insets.top + 16 }]}
        showsVerticalScrollIndicator={false}
      />

      {/* Modal détails utilisateur */}
      {renderDetailModal()}

      {/* Modal confirmation blocage */}
      <ConfirmModal
        visible={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={handleConfirmToggleStatus}
        title={confirmAction === 'block' ? 'Bloquer l\'utilisateur' : 'Débloquer l\'utilisateur'}
        message={
          confirmAction === 'block'
            ? `Êtes-vous sûr de vouloir bloquer ${selectedUser?.first_name} ${selectedUser?.last_name} ?\n\nL'utilisateur ne pourra plus accéder à son compte.`
            : `Êtes-vous sûr de vouloir débloquer ${selectedUser?.first_name} ${selectedUser?.last_name} ?\n\nL'utilisateur pourra à nouveau accéder à son compte.`
        }
        confirmText={confirmAction === 'block' ? 'Bloquer' : 'Débloquer'}
        variant={confirmAction === 'block' ? 'danger' : 'success'}
        loading={actionLoading}
        icon={confirmAction === 'block' ? 'ban' : 'checkmark-circle'}
      />

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
    flexWrap: 'wrap',
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  userCard: {
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
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
    alignItems: 'center',
    gap: 12,
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
  // Modal styles
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
  userHeader: {
    alignItems: 'center',
    paddingVertical: 24,
    borderBottomWidth: 1,
    marginBottom: 24,
  },
  largeAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  section: {
    marginBottom: 24,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  infoIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
})

export default AdminUsersScreen
