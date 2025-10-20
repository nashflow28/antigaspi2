import React, { useEffect, useState } from 'react'
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
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useTheme } from '../../theme'
import { User } from '../../types'
import apiService from '../../services/api'

const AdminUsersScreen: React.FC = () => {
  const theme = useTheme()
  const [users, setUsers] = useState<User[]>([])
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const [refreshing, setRefreshing] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState<'all' | 'consumer' | 'merchant' | 'admin'>('all')

  useEffect(() => {
    loadUsers()
  }, [])

  useEffect(() => {
    filterUsers()
  }, [users, searchQuery, roleFilter])

  const loadUsers = async () => {
    try {
      const response = await apiService.get('/admin/users')
      setUsers(response.data.data || [])
    } catch (error) {
      console.error('Erreur chargement utilisateurs:', error)
    } finally {
      setRefreshing(false)
    }
  }

  const filterUsers = () => {
    let filtered = users

    if (roleFilter !== 'all') {
      filtered = filtered.filter(u => u.role === roleFilter)
    }

    if (searchQuery.trim()) {
      filtered = filtered.filter(u =>
        u.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.last_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    setFilteredUsers(filtered)
  }

  const onRefresh = () => {
    setRefreshing(true)
    loadUsers()
  }

  const toggleUserStatus = async (userId: number, currentStatus: boolean) => {
    Alert.alert(
      currentStatus ? 'Bloquer l\'utilisateur' : 'Débloquer l\'utilisateur',
      currentStatus
        ? 'Voulez-vous vraiment bloquer cet utilisateur ?'
        : 'Voulez-vous vraiment débloquer cet utilisateur ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: currentStatus ? 'Bloquer' : 'Débloquer',
          style: currentStatus ? 'destructive' : 'default',
          onPress: async () => {
            try {
              await apiService.put(`/admin/users/${userId}/block`, {
                is_blocked: !currentStatus
              })
              loadUsers()
            } catch (error) {
              console.error('Erreur mise à jour statut:', error)
              Alert.alert('Erreur', 'Impossible de mettre à jour le statut')
            }
          },
        },
      ]
    )
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return theme.colors.semantic.error
      case 'merchant':
        return theme.colors.semantic.warning
      case 'consumer':
        return theme.colors.semantic.success
      default:
        return theme.colors.neutral[400]
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

  const renderUser = ({ item }: { item: User }) => (
    <View style={[styles.userCard, { backgroundColor: theme.colors.surface.light }]}>
      <View style={styles.userHeader}>
        <View style={styles.userInfo}>
          <View style={[styles.avatar, { backgroundColor: theme.withOpacity(theme.colors.primary[500], 0.1) }]}>
            <Ionicons name="person" size={24} color={theme.colors.primary[500]} />
          </View>
          <View style={styles.userDetails}>
            <Text style={[styles.userName, { color: theme.colors.text }]}>
              {item.first_name} {item.last_name}
            </Text>
            <Text style={[styles.userEmail, { color: theme.colors.textSecondary }]}>
              {item.email}
            </Text>
            <View style={styles.badges}>
              <View style={[styles.roleBadge, { backgroundColor: theme.withOpacity(getRoleBadgeColor(item.role), 0.1) }]}>
                <Text style={[styles.roleText, { color: getRoleBadgeColor(item.role) }]}>
                  {getRoleLabel(item.role)}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.userActions}>
        <TouchableOpacity
          style={[
            styles.actionButton,
            {
              backgroundColor: theme.withOpacity(
                theme.colors.semantic.error,
                0.1
              )
            }
          ]}
          onPress={() => toggleUserStatus(item.id, false)}
        >
          <Ionicons name="ban" size={18} color={theme.colors.semantic.error} />
          <Text style={[styles.actionText, { color: theme.colors.semantic.error }]}>
            Bloquer
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  )

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar barStyle="dark-content" backgroundColor={theme.colors.background} />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.colors.primary[500] }]}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Utilisateurs</Text>
          <TouchableOpacity onPress={loadUsers}>
            <Ionicons name="refresh" size={24} color="white" />
          </TouchableOpacity>
        </View>

        {/* Search */}
        <View style={[styles.searchContainer, { backgroundColor: 'rgba(255, 255, 255, 0.2)' }]}>
          <Ionicons name="search" size={20} color="rgba(255, 255, 255, 0.8)" />
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher..."
            placeholderTextColor="rgba(255, 255, 255, 0.6)"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Role Filters */}
        <View style={styles.filtersContainer}>
          {[
            { value: 'all', label: 'Tous', count: users.length },
            { value: 'consumer', label: 'Consommateurs', count: users.filter(u => u.role === 'consumer').length },
            { value: 'merchant', label: 'Commerçants', count: users.filter(u => u.role === 'merchant').length },
            { value: 'admin', label: 'Admins', count: users.filter(u => u.role === 'admin').length },
          ].map((filter) => (
            <TouchableOpacity
              key={filter.value}
              style={[
                styles.filterChip,
                {
                  backgroundColor: roleFilter === filter.value
                    ? 'white'
                    : 'rgba(255, 255, 255, 0.2)',
                }
              ]}
              onPress={() => setRoleFilter(filter.value as any)}
            >
              <Text style={[
                styles.filterText,
                {
                  color: roleFilter === filter.value
                    ? theme.colors.primary[500]
                    : 'white'
                }
              ]}>
                {filter.label} ({filter.count})
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Liste des utilisateurs */}
      <FlatList
        data={filteredUsers}
        renderItem={renderUser}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={[styles.emptyState, { backgroundColor: theme.colors.surface.light }]}>
            <Ionicons name="people-outline" size={64} color={theme.colors.neutral[300]} />
            <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
              Aucun utilisateur trouvé
            </Text>
          </View>
        }
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    color: 'white',
    fontSize: 28,
    fontWeight: 'bold',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    color: 'white',
    fontSize: 16,
  },
  filtersContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  filterText: {
    fontSize: 13,
    fontWeight: '600',
  },
  listContent: {
    padding: 16,
    flexGrow: 1,
  },
  userCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  userHeader: {
    marginBottom: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userDetails: {
    marginLeft: 12,
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    marginBottom: 8,
  },
  badges: {
    flexDirection: 'row',
    gap: 6,
  },
  roleBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  roleText: {
    fontSize: 11,
    fontWeight: '600',
  },
  userActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    borderRadius: 8,
    gap: 6,
  },
  actionText: {
    fontSize: 13,
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    padding: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 40,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    textAlign: 'center',
  },
})

export default AdminUsersScreen
