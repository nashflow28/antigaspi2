import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  StatusBar,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useNavigation } from '@react-navigation/native'
import { useTheme } from '../../theme'
import apiService from '../../services/api'

interface Notification {
  id: number
  type: string
  title: string
  message: string
  data: any
  is_read: boolean
  created_at: string
}

const MerchantNotificationsScreen: React.FC = () => {
  const theme = useTheme()
  const navigation = useNavigation()

  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false) // 🐛 BUG FIX: Prevent pagination race condition
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [lastPage, setLastPage] = useState(1)

  useEffect(() => {
    loadNotifications()
  }, [])

  const loadNotifications = async (page = 1) => {
    try {
      // 🐛 BUG FIX: Prevent loading same page multiple times
      if (page > 1 && loadingMore) {
        return
      }

      if (page === 1) {
        setLoading(true)
      } else {
        setLoadingMore(true)
      }

      const response = await apiService.get(`/notifications?page=${page}`)

      if (response.data.success) {
        const newNotifications = response.data.data
        if (page === 1) {
          setNotifications(newNotifications)
        } else {
          setNotifications((prev) => [...prev, ...newNotifications])
        }
        setCurrentPage(response.data.meta.current_page)
        setLastPage(response.data.meta.last_page)
      }
    } catch (error) {
      console.error('Erreur chargement notifications:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
      setLoadingMore(false)
    }
  }

  const onRefresh = () => {
    setRefreshing(true)
    loadNotifications(1)
  }

  const markAsRead = async (notificationId: number) => {
    try {
      await apiService.post(`/notifications/${notificationId}/read`)
      setNotifications((prev) =>
        prev.map((notif) => (notif.id === notificationId ? { ...notif, is_read: true } : notif))
      )
    } catch (error) {
      console.error('Erreur marquage lu:', error)
    }
  }

  const markAllAsRead = async () => {
    try {
      await apiService.post('/notifications/read-all')
      setNotifications((prev) => prev.map((notif) => ({ ...notif, is_read: true })))
    } catch (error) {
      console.error('Erreur marquage tout lu:', error)
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'reservation':
        return 'receipt-outline'
      case 'review':
        return 'star-outline'
      case 'product':
        return 'cube-outline'
      case 'payment':
        return 'cash-outline'
      default:
        return 'notifications-outline'
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))

    if (days === 0) {
      const hours = Math.floor(diff / (1000 * 60 * 60))
      if (hours === 0) {
        const minutes = Math.floor(diff / (1000 * 60))
        return `Il y a ${minutes} min`
      }
      return `Il y a ${hours}h`
    } else if (days === 1) {
      return 'Hier'
    } else if (days < 7) {
      return `Il y a ${days} jours`
    } else {
      return date.toLocaleDateString('fr-FR')
    }
  }

  const renderNotification = ({ item }: { item: Notification }) => (
    <TouchableOpacity
      style={[
        styles.notificationCard,
        {
          backgroundColor: item.is_read ? theme.colors.surface.light : theme.withOpacity(theme.colors.primary[500], 0.1),
        },
      ]}
      onPress={() => !item.is_read && markAsRead(item.id)}
    >
      <View
        style={[
          styles.iconContainer,
          {
            backgroundColor: theme.withOpacity(theme.colors.primary[500], 0.15),
          },
        ]}
      >
        <Ionicons name={getNotificationIcon(item.type) as any} size={24} color={theme.colors.primary[500]} />
      </View>
      <View style={styles.notificationContent}>
        <View style={styles.notificationHeader}>
          <Text style={[styles.notificationTitle, { color: theme.colors.text }]} numberOfLines={1}>
            {item.title}
          </Text>
          {!item.is_read && (
            <View style={[styles.unreadDot, { backgroundColor: theme.colors.primary[500] }]} />
          )}
        </View>
        <Text style={[styles.notificationMessage, { color: theme.colors.textSecondary }]} numberOfLines={2}>
          {item.message}
        </Text>
        <Text style={[styles.notificationDate, { color: theme.colors.textSecondary }]}>
          {formatDate(item.created_at)}
        </Text>
      </View>
    </TouchableOpacity>
  )

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="notifications-off-outline" size={64} color={theme.colors.neutral[300]} />
      <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>Aucune notification</Text>
    </View>
  )

  const renderFooter = () => {
    if (currentPage >= lastPage) return null

    return (
      <View style={styles.footerLoading}>
        <ActivityIndicator size="small" color={theme.colors.primary[500]} />
      </View>
    )
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar barStyle="dark-content" backgroundColor={theme.colors.background} />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.colors.primary[500] }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        <TouchableOpacity onPress={markAllAsRead} style={styles.markAllButton}>
          <Ionicons name="checkmark-done" size={24} color="white" />
        </TouchableOpacity>
      </View>

      {loading && notifications.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary[500]} />
        </View>
      ) : (
        <FlatList
          data={notifications}
          renderItem={renderNotification}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={renderEmpty}
          ListFooterComponent={renderFooter}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          onEndReached={() => {
            if (currentPage < lastPage) {
              loadNotifications(currentPage + 1)
            }
          }}
          onEndReachedThreshold={0.5}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  markAllButton: {
    padding: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 16,
  },
  notificationCard: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  notificationContent: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: 8,
  },
  notificationMessage: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 4,
  },
  notificationDate: {
    fontSize: 12,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  emptyText: {
    fontSize: 16,
    marginTop: 16,
  },
  footerLoading: {
    paddingVertical: 20,
    alignItems: 'center',
  },
})

export default MerchantNotificationsScreen
