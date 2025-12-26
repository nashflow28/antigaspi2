import React, { useState, useEffect, useCallback } from 'react'
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useNavigation } from '@react-navigation/native'

import apiService from '../../services/api'
import notificationService from '../../services/notificationService'
import theme from '../../styles/theme'

interface Notification {
  id: number
  type: string
  title: string
  message: string
  is_read: boolean
  data?: Record<string, any>
  created_at: string
}

interface NotificationsResponse {
  success: boolean
  data: Notification[]
  meta: {
    current_page: number
    last_page: number
    total: number
  }
}

const NOTIFICATION_ICONS: Record<string, string> = {
  'reservation_status': 'receipt-outline',
  'reservation_confirmed': 'checkmark-circle-outline',
  'reservation_ready': 'time-outline',
  'reservation_completed': 'checkmark-done-outline',
  'reservation_cancelled': 'close-circle-outline',
  'new_product': 'basket-outline',
  'surprise_basket': 'gift-outline',
  'promotion': 'pricetag-outline',
  'discount': 'pricetag-outline',
  'expiring_product': 'alert-circle-outline',
  'loyalty_tier_upgrade': 'trophy-outline',
  'loyalty_points': 'diamond-outline',
  'referral_bonus': 'people-outline',
  'admin_broadcast': 'megaphone-outline',
  'default': 'notifications-outline',
}

const NOTIFICATION_COLORS: Record<string, string> = {
  'reservation_confirmed': theme.colors.success,
  'reservation_ready': theme.colors.warning,
  'reservation_completed': theme.colors.success,
  'reservation_cancelled': theme.colors.error,
  'promotion': theme.colors.secondary,
  'discount': theme.colors.secondary,
  'loyalty_tier_upgrade': '#F5C518',
  'expiring_product': theme.colors.warning,
  'default': theme.colors.primary,
}

export default function NotificationsScreen() {
  const navigation = useNavigation<any>()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [filter, setFilter] = useState<'all' | 'unread'>('all')

  const fetchNotifications = useCallback(async (pageNum: number = 1, append: boolean = false) => {
    try {
      const params: Record<string, any> = {
        page: pageNum,
        per_page: 20,
      }

      if (filter === 'unread') {
        params.unread = '1'
      }

      const queryString = new URLSearchParams(params).toString()
      const response = await apiService.get<NotificationsResponse>(
        `/notifications?${queryString}`
      )

      if (response.success && response.data) {
        if (append) {
          setNotifications(prev => [...prev, ...response.data])
        } else {
          setNotifications(response.data)
        }
        setHasMore(response.meta.current_page < response.meta.last_page)
        setPage(response.meta.current_page)
      }
    } catch (error) {
      console.error('Error fetching notifications:', error)
    }
  }, [filter])

  const loadData = useCallback(async () => {
    setLoading(true)
    await fetchNotifications(1, false)
    setLoading(false)
  }, [fetchNotifications])

  const handleRefresh = useCallback(async () => {
    setRefreshing(true)
    await fetchNotifications(1, false)
    // Update badge count
    await notificationService.updateBadge()
    setRefreshing(false)
  }, [fetchNotifications])

  const handleLoadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return

    setLoadingMore(true)
    await fetchNotifications(page + 1, true)
    setLoadingMore(false)
  }, [loadingMore, hasMore, page, fetchNotifications])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleNotificationPress = async (notification: Notification) => {
    // Mark as read if not already
    if (!notification.is_read) {
      try {
        await apiService.post(`/notifications/${notification.id}/read`)
        setNotifications(prev =>
          prev.map(n =>
            n.id === notification.id ? { ...n, is_read: true } : n
          )
        )
        // Update badge
        await notificationService.updateBadge()
      } catch (error) {
        console.error('Error marking notification as read:', error)
      }
    }

    // Navigate based on type
    if (notification.data?.type || notification.type) {
      notificationService.handleNotificationByType(
        notification.data?.type || notification.type,
        notification.data || {}
      )
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      await apiService.post('/notifications/read-all')
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
      await notificationService.updateBadge()
      Alert.alert('Succès', 'Toutes les notifications ont été marquées comme lues')
    } catch (error) {
      console.error('Error marking all as read:', error)
      Alert.alert('Erreur', 'Impossible de marquer les notifications comme lues')
    }
  }

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return "À l'instant"
    if (diffMins < 60) return `Il y a ${diffMins} min`
    if (diffHours < 24) return `Il y a ${diffHours}h`
    if (diffDays < 7) return `Il y a ${diffDays}j`

    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
    })
  }

  const getIcon = (type: string): string => {
    return NOTIFICATION_ICONS[type] || NOTIFICATION_ICONS.default
  }

  const getColor = (type: string): string => {
    return NOTIFICATION_COLORS[type] || NOTIFICATION_COLORS.default
  }

  const renderNotificationItem = ({ item }: { item: Notification }) => {
    const iconName = getIcon(item.type)
    const iconColor = getColor(item.type)

    return (
      <TouchableOpacity
        style={[
          styles.notificationItem,
          !item.is_read && styles.notificationUnread,
        ]}
        onPress={() => handleNotificationPress(item)}
        activeOpacity={0.7}
      >
        <View style={[styles.iconContainer, { backgroundColor: iconColor + '20' }]}>
          <Ionicons name={iconName as any} size={24} color={iconColor} />
        </View>

        <View style={styles.notificationContent}>
          <View style={styles.notificationHeader}>
            <Text
              style={[
                styles.notificationTitle,
                !item.is_read && styles.notificationTitleUnread,
              ]}
              numberOfLines={1}
            >
              {item.title}
            </Text>
            {!item.is_read && <View style={styles.unreadDot} />}
          </View>

          <Text style={styles.notificationMessage} numberOfLines={2}>
            {item.message}
          </Text>

          <Text style={styles.notificationTime}>
            {formatDate(item.created_at)}
          </Text>
        </View>

        <Ionicons
          name="chevron-forward"
          size={20}
          color={theme.colors.textLight}
        />
      </TouchableOpacity>
    )
  }

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'all' && styles.filterButtonActive]}
          onPress={() => {
            setFilter('all')
            setNotifications([])
            setLoading(true)
          }}
        >
          <Text
            style={[
              styles.filterButtonText,
              filter === 'all' && styles.filterButtonTextActive,
            ]}
          >
            Toutes
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterButton, filter === 'unread' && styles.filterButtonActive]}
          onPress={() => {
            setFilter('unread')
            setNotifications([])
            setLoading(true)
          }}
        >
          <Text
            style={[
              styles.filterButtonText,
              filter === 'unread' && styles.filterButtonTextActive,
            ]}
          >
            Non lues
          </Text>
        </TouchableOpacity>
      </View>

      {notifications.some(n => !n.is_read) && (
        <TouchableOpacity
          style={styles.markAllButton}
          onPress={handleMarkAllAsRead}
        >
          <Ionicons name="checkmark-done" size={18} color={theme.colors.primary} />
          <Text style={styles.markAllButtonText}>Tout marquer lu</Text>
        </TouchableOpacity>
      )}
    </View>
  )

  const renderFooter = () => {
    if (!loadingMore) return null

    return (
      <View style={styles.loadingMore}>
        <ActivityIndicator size="small" color={theme.colors.primary} />
      </View>
    )
  }

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons
        name="notifications-off-outline"
        size={60}
        color={theme.colors.textLight}
      />
      <Text style={styles.emptyTitle}>Aucune notification</Text>
      <Text style={styles.emptyText}>
        {filter === 'unread'
          ? 'Vous avez lu toutes vos notifications'
          : "Vous n'avez pas encore reçu de notifications"}
      </Text>
    </View>
  )

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Chargement...</Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Navigation Header */}
      <View style={styles.navHeader}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.navTitle}>Notifications</Text>
        <TouchableOpacity
          style={styles.settingsButton}
          onPress={() => navigation.navigate('NotificationSettings')}
        >
          <Ionicons name="settings-outline" size={24} color={theme.colors.text} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={notifications}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderNotificationItem}
        ListHeaderComponent={renderHeader}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={notifications.length === 0 ? styles.emptyList : styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[theme.colors.primary]}
          />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.3}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  navHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  backButton: {
    padding: 4,
  },
  navTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
  },
  settingsButton: {
    padding: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  header: {
    padding: 16,
    paddingBottom: 8,
  },
  filterContainer: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    borderRadius: 10,
    padding: 4,
    marginBottom: 12,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  filterButtonActive: {
    backgroundColor: theme.colors.primary,
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.textSecondary,
  },
  filterButtonTextActive: {
    color: '#fff',
  },
  markAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    paddingVertical: 6,
    paddingHorizontal: 12,
    gap: 6,
  },
  markAllButtonText: {
    fontSize: 13,
    color: theme.colors.primary,
    fontWeight: '500',
  },
  list: {
    paddingBottom: 20,
  },
  emptyList: {
    flex: 1,
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 14,
    borderRadius: 12,
    ...theme.shadows.sm,
  },
  notificationUnread: {
    backgroundColor: theme.colors.primaryLight || '#E6F7F2',
    borderLeftWidth: 3,
    borderLeftColor: theme.colors.primary,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  notificationContent: {
    flex: 1,
    marginRight: 8,
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  notificationTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: theme.colors.text,
  },
  notificationTitleUnread: {
    fontWeight: '600',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.primary,
    marginLeft: 8,
  },
  notificationMessage: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    lineHeight: 18,
    marginBottom: 4,
  },
  notificationTime: {
    fontSize: 12,
    color: theme.colors.textLight,
  },
  loadingMore: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
})
