import React, { useEffect, useState, useCallback } from 'react'
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  StatusBar,
  RefreshControl,
  Alert,
  TextInput,
  ActivityIndicator,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useTheme } from '../../theme'
import { User } from '../../types'
import apiService from '../../services/api'
import { Button, Badge, Card, Typography } from '../../components/2025'

type RoleFilter = 'all' | 'consumer' | 'merchant' | 'admin'

const AdminUsersScreen: React.FC = () => {
  const theme = useTheme()
  const insets = useSafeAreaInsets()
  const [users, setUsers] = useState<User[]>([])
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const [refreshing, setRefreshing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all')

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
      // Expected response: { data: { data: User[] } }
      const response = await apiService.get('/admin/users')
      setUsers(response.data.data || [])
    } catch (error: any) {
      console.error('Erreur chargement utilisateurs:', error)

      // Gestion des erreurs d'autorisation
      if (error.response?.status === 401 || error.response?.status === 403) {
        Alert.alert(
          'Session expirée',
          'Votre session a expiré. Veuillez vous reconnecter.'
        )
        return
      }

      Alert.alert('Erreur', 'Impossible de charger les utilisateurs')
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

  const toggleUserStatus = async (user: User) => {
    const isSuspended = user.is_suspended || false

    Alert.alert(
      isSuspended ? 'Débloquer l\'utilisateur' : 'Bloquer l\'utilisateur',
      isSuspended
        ? `Voulez-vous vraiment débloquer ${user.first_name} ${user.last_name} ?`
        : `Voulez-vous vraiment bloquer ${user.first_name} ${user.last_name} ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: isSuspended ? 'Débloquer' : 'Bloquer',
          style: isSuspended ? 'default' : 'destructive',
          onPress: async () => {
            // Backup de l'état précédent pour rollback en cas d'erreur
            const previousUsers = [...users]

            try {
              // Mise à jour optimiste
              setUsers(prev =>
                prev.map(u =>
                  u.id === user.id ? { ...u, is_suspended: !isSuspended } : u
                )
              )

              const endpoint = isSuspended
                ? `/admin/users/${user.id}/unsuspend`
                : `/admin/users/${user.id}/suspend`

              await apiService.patch(endpoint)

              Alert.alert('Succès', isSuspended ? 'Utilisateur débloqué' : 'Utilisateur bloqué')
            } catch (error: any) {
              console.error('Erreur mise à jour statut:', error)

              // Rollback en cas d'erreur
              setUsers(previousUsers)

              Alert.alert('Erreur', 'Impossible de mettre à jour le statut')
            }
          },
        },
      ]
    )
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
    <Card style={styles.userCard}>
      <View style={styles.cardHeader}>
        <View style={[styles.iconContainer, { backgroundColor: theme.colors.primary[50] }]}>
          <Ionicons name="person" size={24} color={theme.colors.primary[500]} />
        </View>
        <View style={styles.cardContent}>
          <View style={styles.titleRow}>
            <Typography variant="h4" weight="semibold" style={{ flex: 1 }}>
              {item.first_name} {item.last_name}
            </Typography>
            <Badge variant={getRoleBadgeVariant(item.role)}>
              {getRoleLabel(item.role)}
            </Badge>
          </View>
          <Typography variant="caption" color="secondary">
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
      </View>
      <View style={styles.actions}>
        <Button
          variant={item.is_suspended ? 'primary' : 'destructive'}
          size="sm"
          onPress={() => toggleUserStatus(item)}
          style={{ flex: 1 }}
          leftIcon={
            <Ionicons
              name={item.is_suspended ? 'checkmark-circle' : 'ban'}
              size={16}
              color="#FFFFFF"
            />
          }
        >
          {item.is_suspended ? 'Débloquer' : 'Bloquer'}
        </Button>
      </View>
    </Card>
  )

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
      <StatusBar barStyle="dark-content" backgroundColor={theme.colors.background} />

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
    marginBottom: 12,
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
    alignItems: 'center',
    gap: 12,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
})

export default AdminUsersScreen
