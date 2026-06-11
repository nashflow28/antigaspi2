import React, { useState, useEffect, useRef, useCallback } from 'react'
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  StatusBar,
  ActivityIndicator,
  FlatList,
  TouchableOpacity,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useTheme } from '../../theme'
import { Typography, Card, Badge, Button } from '../../components/2025'
import { AdminHeader } from '../../components/admin'
import AlertModal from '../../components/AlertModal'
import { useAlert } from '../../hooks/useAlert'
import apiService from '../../services/api'
import { createLogger } from '../../utils/logger'

const log = createLogger('AdminPaymentDashboard')

interface Payment {
  id: number
  amount: number
  currency: string
  payment_method: string
  status: string
  transaction_id: string
  reference: string
  provider: string
  customer_phone: string
  paid_at: string | null
  created_at: string
  customer: {
    id: number
    name: string
    email: string
    phone: string
  } | null
  merchant: {
    id: number
    business_name: string
    business_type: string
    email: string
  } | null
  reservation_id: number
}

interface Summary {
  total_payments: number
  total_amount: number
  successful_payments: number
  failed_payments: number
  pending_payments: number
}

interface Pagination {
  current_page: number
  total_pages: number
  per_page: number
  total: number
}

const AdminPaymentDashboardScreen: React.FC = () => {
  const theme = useTheme()
  const insets = useSafeAreaInsets()

  // Dark mode adaptive surface color
  const surfaceColor = theme.isDark ? theme.colors.neutral[800] : theme.colors.surface.light
  const { alertProps, showError, showInfo, hideAlert } = useAlert()
  const isMountedRef = useRef(true)

  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [payments, setPayments] = useState<Payment[]>([])
  const [summary, setSummary] = useState<Summary>({
    total_payments: 0,
    total_amount: 0,
    successful_payments: 0,
    failed_payments: 0,
    pending_payments: 0,
  })
  const [pagination, setPagination] = useState<Pagination>({
    current_page: 1,
    total_pages: 1,
    per_page: 20,
    total: 0,
  })
  const [selectedStatus, setSelectedStatus] = useState<string>('')

  const statusFilters = [
    { value: '', label: 'Tous', icon: 'list' },
    { value: 'success', label: 'Réussis', icon: 'checkmark-circle' },
    { value: 'pending', label: 'En attente', icon: 'time' },
    { value: 'failed', label: 'Échoués', icon: 'close-circle' },
  ]

  useEffect(() => {
    isMountedRef.current = true
    loadPayments()

    return () => {
      isMountedRef.current = false
    }
  }, [selectedStatus])

  const loadPayments = async (page = 1) => {
    try {
      if (page === 1 && isMountedRef.current) {
        setLoading(true)
      }

      const params: Record<string, any> = { page, per_page: 20 }
      if (selectedStatus) {
        params.status = selectedStatus
      }

      const queryString = new URLSearchParams(params).toString()
      const response = await apiService.get<{
        success: boolean
        data: Payment[]
        summary: Summary
        pagination: Pagination
      }>(`/admin/payments?${queryString}`)

      if (isMountedRef.current && response.success) {
        if (page === 1) {
          setPayments(response.data)
        } else {
          setPayments(prev => [...prev, ...response.data])
        }
        setSummary(response.summary)
        setPagination(response.pagination)
      }
    } catch (error: any) {
      log.error('Error fetching payments:', error)
      if (isMountedRef.current) {
        showError('Erreur', error.response?.data?.message || 'Impossible de charger les paiements')
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false)
        setRefreshing(false)
        setLoadingMore(false)
      }
    }
  }

  const onRefresh = useCallback(() => {
    setRefreshing(true)
    loadPayments(1)
  }, [selectedStatus])

  const loadMore = useCallback(() => {
    if (!loadingMore && pagination.current_page < pagination.total_pages) {
      setLoadingMore(true)
      loadPayments(pagination.current_page + 1)
    }
  }, [loadingMore, pagination])

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0,
    }).format(amount || 0)
  }

  const formatDate = (dateString: string): string => {
    if (!dateString) return '--'
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date)
  }

  const getStatusColor = (status: string): string => {
    const colors: Record<string, string> = {
      success: theme.colors.success,
      pending: theme.colors.warning,
      failed: theme.colors.error,
      on_site: '#06B6D4',
      refunded: theme.colors.neutral[500],
    }
    return colors[status] || theme.colors.neutral[400]
  }

  const getStatusLabel = (status: string): string => {
    const labels: Record<string, string> = {
      success: 'Réussi',
      pending: 'En attente',
      failed: 'Échoué',
      on_site: 'Sur place',
      refunded: 'Remboursé',
    }
    return labels[status] || status
  }

  const getPaymentMethodLabel = (method: string): string => {
    const labels: Record<string, string> = {
      flooz: 'Flooz',
      tmoney: 'TMoney',
      orange_money: 'Orange Money',
      mtn_momo: 'MTN MoMo',
      paystack: 'Paystack',
      on_site: 'Sur place',
      wallet: 'Portefeuille',
    }
    return labels[method] || method
  }

  const viewPaymentDetails = (payment: Payment) => {
    showInfo(
      `Paiement #${payment.id}`,
      `Transaction: ${payment.transaction_id}\n\n` +
      `Montant: ${formatCurrency(payment.amount)}\n` +
      `Statut: ${getStatusLabel(payment.status)}\n` +
      `Méthode: ${getPaymentMethodLabel(payment.payment_method)}\n` +
      `Date: ${formatDate(payment.created_at)}\n\n` +
      `Client: ${payment.customer?.name || 'N/A'}\n` +
      `Commerçant: ${payment.merchant?.business_name || 'N/A'}`,
      [{ text: 'Fermer', onPress: hideAlert }]
    )
  }

  const renderStatCard = (
    title: string,
    value: string | number,
    icon: string,
    color: string,
    subtitle?: string
  ) => (
    <Card variant="elevated" style={styles.statCard}>
      <View style={[styles.statIcon, { backgroundColor: theme.withOpacity(color, 0.1) }]}>
        <Ionicons name={icon as any} size={24} color={color} />
      </View>
      <Typography variant="h3" weight="bold" style={{ marginTop: 8 }}>
        {typeof value === 'number' ? value.toLocaleString() : value}
      </Typography>
      <Typography variant="caption" color="secondary">
        {title}
      </Typography>
      {subtitle && (
        <Typography variant="caption" color="secondary" style={{ marginTop: 2 }}>
          {subtitle}
        </Typography>
      )}
    </Card>
  )

  const renderPaymentItem = ({ item }: { item: Payment }) => (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={() => viewPaymentDetails(item)}
      style={[styles.paymentCard, { backgroundColor: surfaceColor, borderColor: theme.isDark ? theme.colors.neutral[700] : theme.colors.border }]}
    >
      <View style={styles.paymentHeader}>
        <View style={{ flex: 1 }}>
          <Typography variant="body" weight="semibold" numberOfLines={1}>
            {item.customer?.name || 'Client inconnu'}
          </Typography>
          <Typography variant="caption" color="secondary" numberOfLines={1}>
            {item.transaction_id}
          </Typography>
        </View>
        <Badge
          variant={item.status === 'success' ? 'success' : item.status === 'pending' ? 'warning' : 'error'}
          size="sm"
        >
          {getStatusLabel(item.status)}
        </Badge>
      </View>

      <View style={styles.paymentDetails}>
        <View style={styles.paymentDetail}>
          <Ionicons name="cash-outline" size={16} color={theme.colors.neutral[400]} />
          <Typography variant="body" weight="bold" style={{ marginLeft: 6, color: theme.colors.primary[500] }}>
            {formatCurrency(item.amount)}
          </Typography>
        </View>
        <View style={styles.paymentDetail}>
          <Ionicons name="card-outline" size={16} color={theme.colors.neutral[400]} />
          <Typography variant="small" color="secondary" style={{ marginLeft: 6 }}>
            {getPaymentMethodLabel(item.payment_method)}
          </Typography>
        </View>
      </View>

      <View style={styles.paymentFooter}>
        <View style={styles.paymentDetail}>
          <Ionicons name="storefront-outline" size={14} color={theme.colors.neutral[400]} />
          <Typography variant="caption" color="secondary" style={{ marginLeft: 4 }} numberOfLines={1}>
            {item.merchant?.business_name || 'N/A'}
          </Typography>
        </View>
        <Typography variant="caption" color="secondary">
          {formatDate(item.created_at)}
        </Typography>
      </View>
    </TouchableOpacity>
  )

  const renderHeader = () => (
    <View style={styles.listHeader}>
      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        {renderStatCard('Total', summary.total_payments, 'card', theme.colors.primary[500])}
        {renderStatCard('Montant', formatCurrency(summary.total_amount), 'cash', theme.colors.success)}
        {renderStatCard('Réussis', summary.successful_payments, 'checkmark-circle', theme.colors.success)}
        {renderStatCard('Échoués', summary.failed_payments, 'close-circle', theme.colors.error)}
      </View>

      {/* Status Filters */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filtersContainer}
        contentContainerStyle={styles.filtersContent}
      >
        {statusFilters.map((filter) => (
          <TouchableOpacity
            key={filter.value}
            style={[
              styles.filterChip,
              {
                backgroundColor: selectedStatus === filter.value
                  ? theme.colors.primary[500]
                  : surfaceColor,
                borderColor: selectedStatus === filter.value
                  ? theme.colors.primary[500]
                  : theme.isDark ? theme.colors.neutral[600] : theme.colors.border,
              },
            ]}
            onPress={() => setSelectedStatus(filter.value)}
          >
            <Ionicons
              name={filter.icon as any}
              size={16}
              color={selectedStatus === filter.value ? 'white' : theme.colors.neutral[500]}
            />
            <Typography
              variant="small"
              weight={selectedStatus === filter.value ? 'semibold' : 'regular'}
              style={{
                marginLeft: 6,
                color: selectedStatus === filter.value ? 'white' : theme.colors.neutral[600],
              }}
            >
              {filter.label}
            </Typography>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Results Count */}
      <View style={styles.resultsHeader}>
        <Typography variant="body" weight="semibold">
          {pagination.total} paiement{pagination.total > 1 ? 's' : ''}
        </Typography>
        {selectedStatus && (
          <Badge variant="primary" size="sm">
            {statusFilters.find(f => f.value === selectedStatus)?.label}
          </Badge>
        )}
      </View>
    </View>
  )

  const renderFooter = () => {
    if (!loadingMore) return null
    return (
      <View style={styles.loadingMore}>
        <ActivityIndicator size="small" color={theme.colors.primary[500]} />
      </View>
    )
  }

  if (loading) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary[500]} />
        <Typography variant="body" color="secondary" style={{ marginTop: 12 }}>
          Chargement des paiements...
        </Typography>
      </View>
    )
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.primary[500]} />

      <AdminHeader
        title="Paiements"
        showBack
        rightIcon="refresh"
        onRightPress={onRefresh}
      />

      <FlatList
        data={payments}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderPaymentItem}
        ListHeaderComponent={renderHeader}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="card-outline" size={48} color={theme.colors.neutral[300]} />
            <Typography variant="body" color="secondary" style={{ marginTop: 12 }}>
              Aucun paiement trouvé
            </Typography>
          </View>
        }
        contentContainerStyle={styles.listContent}
        onEndReached={loadMore}
        onEndReachedThreshold={0.3}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.colors.primary[500]]}
          />
        }
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
  header: {
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  refreshButton: {
    padding: 8,
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  listHeader: {
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    padding: 16,
    alignItems: 'center',
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filtersContainer: {
    marginBottom: 16,
  },
  filtersContent: {
    gap: 8,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
    minHeight: 44,
  },
  resultsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  paymentCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  paymentHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  paymentDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  paymentDetail: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  paymentFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  loadingMore: {
    paddingVertical: 16,
    alignItems: 'center',
  },
})

export default AdminPaymentDashboardScreen
