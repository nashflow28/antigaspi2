import React, { useEffect, useState, useCallback, useRef } from 'react'
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  StatusBar,
  ActivityIndicator,
  Modal,
  ScrollView,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useTheme } from '../../theme'
import apiService from '../../services/api'
import { Typography, Card, Badge } from '../../components/2025'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'

interface AuditLog {
  id: number
  admin_id: number
  action: string
  entity_type: string
  entity_id?: number | null
  reason?: string | null
  old_values?: Record<string, unknown> | null
  new_values?: Record<string, unknown> | null
  ip_address?: string | null
  user_agent?: string | null
  created_at: string
  admin?: {
    id: number
    first_name: string
    last_name: string
    email?: string | null
  } | null
}

interface AuditLogStats {
  total_actions: number
  today_actions: number
  week_actions: number
  active_admins: number
  actions_by_type: Record<string, number>
  actions_by_entity: Record<string, number>
}

interface FilterOption {
  value: string
  label: string
}

type AdminAuditLogScreenProps = {
  navigation: NativeStackNavigationProp<any>
}

const ACTION_LABELS: Record<string, string> = {
  approve_merchant: 'Approbation commerçant',
  reject_merchant: 'Rejet commerçant',
  approve_product: 'Approbation produit',
  reject_product: 'Rejet produit',
  suspend_user: 'Suspension utilisateur',
  unsuspend_user: 'Réactivation utilisateur',
  approve_review: 'Approbation avis',
  reject_review: 'Rejet avis',
  resolve_report: 'Résolution signalement',
  create_category: 'Création catégorie',
  update_category: 'Modification catégorie',
  delete_category: 'Suppression catégorie',
  broadcast_notification: 'Envoi notification',
  update_settings: 'Modification paramètres',
  award_points: 'Attribution points',
}

const ENTITY_LABELS: Record<string, string> = {
  merchant: 'Commerçant',
  product: 'Produit',
  user: 'Utilisateur',
  review: 'Avis',
  report: 'Signalement',
  category: 'Catégorie',
  notification: 'Notification',
  settings: 'Paramètres',
  loyalty: 'Points fidélité',
}

const getActionColor = (action: string, theme: any): string => {
  if (action.includes('approve') || action.includes('unsuspend')) {
    return theme.colors.success
  }
  if (action.includes('reject') || action.includes('suspend') || action.includes('delete')) {
    return theme.colors.error
  }
  if (action.includes('update') || action.includes('broadcast')) {
    return theme.colors.warning
  }
  return theme.colors.primary[500]
}

const getActionIcon = (action: string): keyof typeof Ionicons.glyphMap => {
  if (action.includes('approve')) return 'checkmark-circle-outline'
  if (action.includes('reject')) return 'close-circle-outline'
  if (action.includes('suspend')) return 'ban-outline'
  if (action.includes('unsuspend')) return 'checkmark-circle-outline'
  if (action.includes('create')) return 'add-circle-outline'
  if (action.includes('update') || action.includes('settings')) return 'settings-outline'
  if (action.includes('delete')) return 'trash-outline'
  if (action.includes('broadcast')) return 'megaphone-outline'
  if (action.includes('award') || action.includes('points')) return 'gift-outline'
  return 'document-text-outline'
}

const formatDate = (dateString: string): string => {
  if (!dateString) return '--'
  const date = new Date(dateString)
  if (isNaN(date.getTime())) return '--'
  return date.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const formatRelativeDate = (dateString: string): string => {
  if (!dateString) return '--'
  const date = new Date(dateString)
  if (isNaN(date.getTime())) return '--'

  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const minutes = Math.floor(diff / (1000 * 60))
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))

  if (minutes < 1) return "À l'instant"
  if (minutes < 60) return `Il y a ${minutes} min`
  if (hours < 24) return `Il y a ${hours}h`
  if (days === 1) return 'Hier'
  if (days < 7) return `Il y a ${days} jours`
  return date.toLocaleDateString('fr-FR')
}

const AdminAuditLogScreen: React.FC<AdminAuditLogScreenProps> = ({ navigation }) => {
  const theme = useTheme()
  const insets = useSafeAreaInsets()
  const isMountedRef = useRef(true)

  const [logs, setLogs] = useState<AuditLog[]>([])
  const [stats, setStats] = useState<AuditLogStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)

  // Filters
  const [filterAction, setFilterAction] = useState<string>('')
  const [filterEntity, setFilterEntity] = useState<string>('')
  const [filterModalVisible, setFilterModalVisible] = useState(false)
  const [actionOptions, setActionOptions] = useState<FilterOption[]>([])
  const [entityOptions, setEntityOptions] = useState<FilterOption[]>([])

  // Detail modal
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null)
  const [detailModalVisible, setDetailModalVisible] = useState(false)

  useEffect(() => {
    isMountedRef.current = true
    loadData()
    loadFilterOptions()

    return () => {
      isMountedRef.current = false
    }
  }, [])

  useEffect(() => {
    setPage(1)
    setLogs([])
    loadLogs(1, true)
  }, [filterAction, filterEntity])

  const loadFilterOptions = async () => {
    try {
      const response = await apiService.getAuditLogActions()
      if (response.success && response.data) {
        setActionOptions(response.data.actions || [])
        setEntityOptions(response.data.entity_types || [])
      }
    } catch {
      // Use fallback options
      setActionOptions(
        Object.entries(ACTION_LABELS).map(([value, label]) => ({ value, label }))
      )
      setEntityOptions(
        Object.entries(ENTITY_LABELS).map(([value, label]) => ({ value, label }))
      )
    }
  }

  const loadData = async () => {
    setLoading(true)
    await Promise.all([loadStats(), loadLogs(1, true)])
    if (isMountedRef.current) {
      setLoading(false)
    }
  }

  const loadStats = async () => {
    try {
      const response = await apiService.getAuditLogStats('week')
      if (isMountedRef.current && response.success && response.data) {
        setStats(response.data)
      }
    } catch (error) {
      console.error('Error loading audit stats:', error)
    }
  }

  const loadLogs = async (pageNum: number, reset = false) => {
    try {
      const response = await apiService.getAuditLogs({
        page: pageNum,
        per_page: 20,
        action: filterAction || undefined,
        entity_type: filterEntity || undefined,
      })

      if (isMountedRef.current && response.success && response.data) {
        const newLogs = response.data.data || []
        setLogs(prev => (reset ? newLogs : [...prev, ...newLogs]))
        setHasMore(
          response.data.meta ? response.data.meta.current_page < response.data.meta.last_page : false
        )
        setPage(pageNum)
      }
    } catch (error) {
      console.error('Error loading audit logs:', error)
    }
  }

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await Promise.all([loadStats(), loadLogs(1, true)])
    if (isMountedRef.current) {
      setRefreshing(false)
    }
  }, [filterAction, filterEntity])

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return
    setLoadingMore(true)
    await loadLogs(page + 1)
    if (isMountedRef.current) {
      setLoadingMore(false)
    }
  }, [page, loadingMore, hasMore, filterAction, filterEntity])

  const openDetail = async (log: AuditLog) => {
    try {
      const response = await apiService.getAuditLogDetail(log.id)
      if (response.success && response.data) {
        setSelectedLog(response.data)
        setDetailModalVisible(true)
      }
    } catch {
      // Fallback to local data
      setSelectedLog(log)
      setDetailModalVisible(true)
    }
  }

  const clearFilters = () => {
    setFilterAction('')
    setFilterEntity('')
    setFilterModalVisible(false)
  }

  const activeFiltersCount = (filterAction ? 1 : 0) + (filterEntity ? 1 : 0)

  const renderStatCard = (
    title: string,
    value: number | string,
    icon: keyof typeof Ionicons.glyphMap,
    color: string
  ) => (
    <Card variant="elevated" style={styles.statCard}>
      <View style={[styles.statIcon, { backgroundColor: theme.withOpacity(color, 0.1) }]}>
        <Ionicons name={icon} size={22} color={color} />
      </View>
      <Typography variant="h3" weight="bold" style={{ marginTop: 8 }}>
        {value}
      </Typography>
      <Typography variant="caption" color="secondary" numberOfLines={1}>
        {title}
      </Typography>
    </Card>
  )

  const renderLogItem = ({ item }: { item: AuditLog }) => {
    const actionColor = getActionColor(item.action, theme)
    const actionIcon = getActionIcon(item.action)
    const actionLabel = ACTION_LABELS[item.action] || item.action
    const entityLabel = ENTITY_LABELS[item.entity_type] || item.entity_type
    const adminName = item.admin
      ? `${item.admin.first_name} ${item.admin.last_name}`
      : 'Système'

    return (
      <TouchableOpacity activeOpacity={0.7} onPress={() => openDetail(item)}>
        <Card variant="elevated" style={styles.logCard}>
          <View style={styles.logHeader}>
            <View style={[styles.logIconContainer, { backgroundColor: theme.withOpacity(actionColor, 0.1) }]}>
              <Ionicons name={actionIcon} size={20} color={actionColor} />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Typography variant="body" weight="semibold" numberOfLines={1}>
                {actionLabel}
              </Typography>
              <Typography variant="caption" color="secondary">
                {adminName}
              </Typography>
            </View>
            <Badge
              variant={item.action.includes('reject') || item.action.includes('suspend') ? 'error' : 'info'}
              size="sm"
            >
              {entityLabel}
            </Badge>
          </View>

          {item.reason && (
            <View style={styles.reasonContainer}>
              <Typography variant="small" color="secondary" numberOfLines={2}>
                {item.reason}
              </Typography>
            </View>
          )}

          <View style={styles.logFooter}>
            <View style={styles.logMeta}>
              <Ionicons name="time-outline" size={14} color={theme.colors.textSecondary} />
              <Typography variant="caption" color="secondary" style={{ marginLeft: 4 }}>
                {formatRelativeDate(item.created_at)}
              </Typography>
            </View>
            {item.ip_address && (
              <View style={styles.logMeta}>
                <Ionicons name="globe-outline" size={14} color={theme.colors.textSecondary} />
                <Typography variant="caption" color="secondary" style={{ marginLeft: 4 }}>
                  {item.ip_address}
                </Typography>
              </View>
            )}
          </View>
        </Card>
      </TouchableOpacity>
    )
  }

  const renderFilterModal = () => (
    <Modal
      visible={filterModalVisible}
      animationType="slide"
      transparent
      onRequestClose={() => setFilterModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: theme.colors.cardBackground }]}>
          <View style={styles.modalHeader}>
            <Typography variant="h3" weight="bold">
              Filtres
            </Typography>
            <TouchableOpacity onPress={() => setFilterModalVisible(false)}>
              <Ionicons name="close" size={24} color={theme.colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody}>
            {/* Action Filter */}
            <Typography variant="body" weight="semibold" style={{ marginBottom: 8 }}>
              Type d'action
            </Typography>
            <View style={styles.filterChips}>
              <TouchableOpacity
                style={[
                  styles.filterChip,
                  !filterAction && { backgroundColor: theme.colors.primary[500] },
                  { borderColor: theme.colors.border },
                ]}
                onPress={() => setFilterAction('')}
              >
                <Typography
                  variant="small"
                  style={{ color: !filterAction ? 'white' : theme.colors.text }}
                >
                  Toutes
                </Typography>
              </TouchableOpacity>
              {actionOptions.map(option => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.filterChip,
                    filterAction === option.value && { backgroundColor: theme.colors.primary[500] },
                    { borderColor: theme.colors.border },
                  ]}
                  onPress={() => setFilterAction(option.value)}
                >
                  <Typography
                    variant="small"
                    style={{ color: filterAction === option.value ? 'white' : theme.colors.text }}
                  >
                    {option.label}
                  </Typography>
                </TouchableOpacity>
              ))}
            </View>

            {/* Entity Filter */}
            <Typography variant="body" weight="semibold" style={{ marginTop: 20, marginBottom: 8 }}>
              Type d'entité
            </Typography>
            <View style={styles.filterChips}>
              <TouchableOpacity
                style={[
                  styles.filterChip,
                  !filterEntity && { backgroundColor: theme.colors.primary[500] },
                  { borderColor: theme.colors.border },
                ]}
                onPress={() => setFilterEntity('')}
              >
                <Typography
                  variant="small"
                  style={{ color: !filterEntity ? 'white' : theme.colors.text }}
                >
                  Toutes
                </Typography>
              </TouchableOpacity>
              {entityOptions.map(option => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.filterChip,
                    filterEntity === option.value && { backgroundColor: theme.colors.primary[500] },
                    { borderColor: theme.colors.border },
                  ]}
                  onPress={() => setFilterEntity(option.value)}
                >
                  <Typography
                    variant="small"
                    style={{ color: filterEntity === option.value ? 'white' : theme.colors.text }}
                  >
                    {option.label}
                  </Typography>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={[styles.modalButton, { borderColor: theme.colors.border }]}
              onPress={clearFilters}
            >
              <Typography variant="body" color="secondary">
                Réinitialiser
              </Typography>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: theme.colors.primary[500] }]}
              onPress={() => setFilterModalVisible(false)}
            >
              <Typography variant="body" style={{ color: 'white' }}>
                Appliquer
              </Typography>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  )

  const renderDetailModal = () => (
    <Modal
      visible={detailModalVisible}
      animationType="slide"
      transparent
      onRequestClose={() => setDetailModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, styles.detailModal, { backgroundColor: theme.colors.cardBackground }]}>
          <View style={styles.modalHeader}>
            <Typography variant="h3" weight="bold">
              Détails de l'action
            </Typography>
            <TouchableOpacity onPress={() => setDetailModalVisible(false)}>
              <Ionicons name="close" size={24} color={theme.colors.text} />
            </TouchableOpacity>
          </View>

          {selectedLog && (
            <ScrollView style={styles.modalBody}>
              <View style={styles.detailRow}>
                <Typography variant="caption" color="secondary">
                  Action
                </Typography>
                <Typography variant="body" weight="semibold">
                  {ACTION_LABELS[selectedLog.action] || selectedLog.action}
                </Typography>
              </View>

              <View style={styles.detailRow}>
                <Typography variant="caption" color="secondary">
                  Administrateur
                </Typography>
                <Typography variant="body">
                  {selectedLog.admin
                    ? `${selectedLog.admin.first_name} ${selectedLog.admin.last_name}`
                    : 'Système'}
                </Typography>
              </View>

              <View style={styles.detailRow}>
                <Typography variant="caption" color="secondary">
                  Entité
                </Typography>
                <Typography variant="body">
                  {ENTITY_LABELS[selectedLog.entity_type] || selectedLog.entity_type}
                  {selectedLog.entity_id && ` #${selectedLog.entity_id}`}
                </Typography>
              </View>

              {selectedLog.reason && (
                <View style={styles.detailRow}>
                  <Typography variant="caption" color="secondary">
                    Raison
                  </Typography>
                  <Typography variant="body">{selectedLog.reason}</Typography>
                </View>
              )}

              <View style={styles.detailRow}>
                <Typography variant="caption" color="secondary">
                  Date
                </Typography>
                <Typography variant="body">{formatDate(selectedLog.created_at)}</Typography>
              </View>

              {selectedLog.ip_address && (
                <View style={styles.detailRow}>
                  <Typography variant="caption" color="secondary">
                    Adresse IP
                  </Typography>
                  <Typography variant="body">{selectedLog.ip_address}</Typography>
                </View>
              )}

              {selectedLog.user_agent && (
                <View style={styles.detailRow}>
                  <Typography variant="caption" color="secondary">
                    User Agent
                  </Typography>
                  <Typography variant="small" color="secondary" numberOfLines={3}>
                    {selectedLog.user_agent}
                  </Typography>
                </View>
              )}

              {selectedLog.old_values && Object.keys(selectedLog.old_values).length > 0 && (
                <View style={styles.detailSection}>
                  <Typography variant="body" weight="semibold" style={{ marginBottom: 8 }}>
                    Anciennes valeurs
                  </Typography>
                  <Card
                    variant="outline"
                    style={[styles.jsonCard, { backgroundColor: theme.withOpacity(theme.colors.error, 0.05) }]}
                  >
                    <Typography variant="small" style={{ fontFamily: 'monospace' }}>
                      {JSON.stringify(selectedLog.old_values, null, 2)}
                    </Typography>
                  </Card>
                </View>
              )}

              {selectedLog.new_values && Object.keys(selectedLog.new_values).length > 0 && (
                <View style={styles.detailSection}>
                  <Typography variant="body" weight="semibold" style={{ marginBottom: 8 }}>
                    Nouvelles valeurs
                  </Typography>
                  <Card
                    variant="outline"
                    style={[styles.jsonCard, { backgroundColor: theme.withOpacity(theme.colors.success, 0.05) }]}
                  >
                    <Typography variant="small" style={{ fontFamily: 'monospace' }}>
                      {JSON.stringify(selectedLog.new_values, null, 2)}
                    </Typography>
                  </Card>
                </View>
              )}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  )

  if (loading) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary[500]} />
        <Typography variant="body" color="secondary" style={{ marginTop: 12 }}>
          Chargement du journal d'audit...
        </Typography>
      </View>
    )
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.primary[500]} />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.colors.primary[500], paddingTop: insets.top + 10 }]}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Typography variant="h2" weight="bold" style={{ color: 'white' }}>
              Journal d'audit
            </Typography>
            <Typography variant="caption" style={{ color: 'rgba(255,255,255,0.8)' }}>
              Historique des actions administratives
            </Typography>
          </View>
          <TouchableOpacity
            onPress={() => setFilterModalVisible(true)}
            style={styles.filterButton}
          >
            <Ionicons name="filter" size={22} color="white" />
            {activeFiltersCount > 0 && (
              <View style={styles.filterBadge}>
                <Typography variant="caption" style={{ color: 'white', fontSize: 10 }}>
                  {activeFiltersCount}
                </Typography>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={logs}
        keyExtractor={item => item.id.toString()}
        renderItem={renderLogItem}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.colors.primary[500]]}
          />
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.3}
        ListHeaderComponent={
          <View style={styles.statsContainer}>
            {stats && (
              <View style={styles.statsGrid}>
                {renderStatCard('Total', stats.total_actions, 'document-text-outline', theme.colors.primary[500])}
                {renderStatCard("Aujourd'hui", stats.today_actions, 'today-outline', theme.colors.success)}
                {renderStatCard('Cette semaine', stats.week_actions, 'calendar-outline', theme.colors.warning)}
                {renderStatCard('Admins actifs', stats.active_admins, 'people-outline', '#8B5CF6')}
              </View>
            )}
          </View>
        }
        ListFooterComponent={
          loadingMore ? (
            <View style={styles.loadingMore}>
              <ActivityIndicator size="small" color={theme.colors.primary[500]} />
            </View>
          ) : null
        }
        ListEmptyComponent={
          <Card variant="elevated" style={styles.emptyCard}>
            <Ionicons name="document-text-outline" size={48} color={theme.colors.neutral[300]} />
            <Typography variant="body" color="secondary" style={{ marginTop: 12, textAlign: 'center' }}>
              Aucune action trouvée
            </Typography>
            {activeFiltersCount > 0 && (
              <TouchableOpacity onPress={clearFilters} style={{ marginTop: 8 }}>
                <Typography variant="small" color="primary">
                  Réinitialiser les filtres
                </Typography>
              </TouchableOpacity>
            )}
          </Card>
        }
      />

      {renderFilterModal()}
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
  header: {
    paddingBottom: 20,
    paddingHorizontal: 16,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  filterButton: {
    padding: 8,
    position: 'relative',
  },
  filterBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: '#EF4444',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  statsContainer: {
    marginBottom: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '46%',
    padding: 16,
    alignItems: 'center',
  },
  statIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logCard: {
    padding: 16,
    marginBottom: 12,
  },
  logHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reasonContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  logFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  logMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  loadingMore: {
    padding: 16,
    alignItems: 'center',
  },
  emptyCard: {
    padding: 32,
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  detailModal: {
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  modalBody: {
    padding: 20,
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  modalButton: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  filterChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  detailRow: {
    marginBottom: 16,
  },
  detailSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  jsonCard: {
    padding: 12,
  },
})

export default AdminAuditLogScreen
