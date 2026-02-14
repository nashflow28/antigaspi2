/**
 * MerchantPaymentsScreen - Merchant payments/earnings tracking
 * View payment history, filter by status/method, and see summaries
 */

import React, { useEffect, useState, useCallback, useMemo } from 'react'
import {
  View,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  ActivityIndicator,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useNavigation } from '@react-navigation/native'

import { Button, Card, Typography, Badge, Modal as Modal2025 } from '../../components/2025'
import AlertModal from '../../components/AlertModal'
import { useTheme } from '../../theme'
import { useAlert } from '../../hooks/useAlert'
import { formatCurrency } from '../../utils/currencyHelpers'
import apiService from '../../services/api'
import type { PaymentWithRelations, PaymentSummaryMeta, PaymentStatus, PaymentMethod } from '../../types'

const STATUS_LABELS: Record<string, string> = {
  success: 'Réussi',
  pending: 'En attente',
  failed: 'Échoué',
  on_site: 'Sur place',
  refunded: 'Remboursé',
  cancelled: 'Annulé',
  expired: 'Expiré',
}

const METHOD_LABELS: Record<string, string> = {
  wallet: 'Portefeuille',
  flooz: 'Flooz',
  tmoney: 'T-Money',
  orange_money: 'Orange Money',
  mtn_momo: 'MTN MoMo',
  paystack: 'Paystack',
  on_site: 'Sur place',
}

const STATUS_FILTERS = [
  { id: 'all', label: 'Tous' },
  { id: 'success', label: 'Réussis' },
  { id: 'pending', label: 'En attente' },
  { id: 'on_site', label: 'Sur place' },
  { id: 'failed', label: 'Échoués' },
]

const formatDateTime = (date: string) => {
  try {
    return new Date(date).toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return date
  }
}

const MerchantPaymentsScreen: React.FC = () => {
  const theme = useTheme()
  const insets = useSafeAreaInsets()
  const navigation = useNavigation()
  const { alertProps, showError } = useAlert()

  const [payments, setPayments] = useState<PaymentWithRelations[]>([])
  const [summary, setSummary] = useState<PaymentSummaryMeta | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [statusFilter, setStatusFilter] = useState('all')
  const [showFiltersModal, setShowFiltersModal] = useState(false)

  const [pagination, setPagination] = useState({
    currentPage: 1,
    lastPage: 1,
    total: 0,
  })

  const fetchPayments = useCallback(async (page = 1, refresh = false) => {
    try {
      if (refresh) {
        setRefreshing(true)
      } else if (page === 1) {
        setLoading(true)
      }

      const params: Record<string, unknown> = {
        page,
        per_page: 20,
      }

      if (statusFilter !== 'all') {
        params.status = statusFilter
      }

      const response = await apiService.getMerchantPayments(params)

      if (response.success && response.data) {
        const responseData = response.data as unknown as {
          data: PaymentWithRelations[]
          meta?: { summary?: PaymentSummaryMeta | null } | null
          pagination?: { current_page: number; last_page: number; total: number } | null
        }

        if (page === 1) {
          setPayments(responseData.data || [])
        } else {
          setPayments(prev => [...prev, ...(responseData.data || [])])
        }

        if (responseData.meta?.summary) {
          setSummary(responseData.meta.summary)
        }

        if (responseData.pagination) {
          setPagination({
            currentPage: responseData.pagination.current_page,
            lastPage: responseData.pagination.last_page,
            total: responseData.pagination.total,
          })
        }
      }
    } catch (error: any) {
      showError('Erreur', error?.message || 'Impossible de charger les paiements')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [statusFilter, showError])

  useEffect(() => {
    fetchPayments(1)
  }, [fetchPayments])

  const onRefresh = () => {
    fetchPayments(1, true)
  }

  const loadMore = () => {
    if (pagination.currentPage < pagination.lastPage && !loading) {
      fetchPayments(pagination.currentPage + 1)
    }
  }

  const handleFilterChange = (status: string) => {
    setStatusFilter(status)
    setShowFiltersModal(false)
  }

  const getStatusBadgeVariant = (status: PaymentStatus): 'success' | 'warning' | 'error' | 'info' | 'secondary' => {
    const mapping: Record<string, 'success' | 'warning' | 'error' | 'info' | 'secondary'> = {
      success: 'success',
      pending: 'warning',
      failed: 'error',
      on_site: 'info',
      refunded: 'secondary',
      cancelled: 'error',
      expired: 'secondary',
    }
    return mapping[status] || 'secondary'
  }

  const summaryCards = useMemo(() => {
    if (!summary) {
      return []
    }

    const statuses = summary.status_breakdown || {}
    const success = statuses['success'] || { count: 0, total_amount: 0 }
    const pending = statuses['pending'] || { count: 0, total_amount: 0 }
    const onSite = statuses['on_site'] || { count: 0, total_amount: 0 }

    return [
      {
        title: 'Total encaissé',
        value: formatCurrency(summary.total_amount),
        description: `${summary.total_count} transactions`,
        icon: 'wallet' as const,
        color: theme.colors.primary[500],
      },
      {
        title: 'Paiements réussis',
        value: formatCurrency(success.total_amount),
        description: `${success.count} confirmés`,
        icon: 'checkmark-circle' as const,
        color: theme.colors.success,
      },
      {
        title: 'En attente',
        value: formatCurrency(pending.total_amount),
        description: `${pending.count} en cours`,
        icon: 'time' as const,
        color: theme.colors.warning,
      },
      {
        title: 'Sur place',
        value: formatCurrency(onSite.total_amount),
        description: `${onSite.count} à encaisser`,
        icon: 'storefront' as const,
        color: theme.colors.info,
      },
    ]
  }, [summary, theme])

  const renderPaymentItem = ({ item }: { item: PaymentWithRelations }) => {
    const reservation = item.reservation
    const consumer = reservation?.consumer

    return (
      <Card variant="elevated" style={styles.paymentCard}>
        <View style={styles.paymentHeader}>
          <View style={styles.paymentInfo}>
            <Typography variant="body" weight="semibold">
              {item.reference || `PAY-${item.id}`}
            </Typography>
            <Typography variant="caption" color="secondary">
              {reservation?.reservation_code || '—'}
            </Typography>
          </View>
          <Typography variant="body" weight="bold" style={{ color: theme.colors.primary[600] }}>
            {formatCurrency(item.amount)}
          </Typography>
        </View>

        <View style={styles.paymentDetails}>
          <View style={styles.detailRow}>
            <Ionicons name="person" size={14} color={theme.colors.textSecondary} />
            <Typography variant="caption" color="secondary" style={{ marginLeft: 4 }}>
              {consumer?.name || 'Client inconnu'}
            </Typography>
          </View>
          {reservation?.product && (
            <View style={styles.detailRow}>
              <Ionicons name="cube" size={14} color={theme.colors.textSecondary} />
              <Typography variant="caption" color="secondary" style={{ marginLeft: 4, flex: 1 }} numberOfLines={1}>
                {reservation.product.name}
              </Typography>
            </View>
          )}
        </View>

        <View style={styles.paymentFooter}>
          <View style={styles.badgesRow}>
            <Badge variant={getStatusBadgeVariant(item.status)} size="sm">
              {STATUS_LABELS[item.status] || item.status}
            </Badge>
            <Badge variant="secondary" size="sm">
              {METHOD_LABELS[item.payment_method] || item.payment_method}
            </Badge>
          </View>
          <Typography variant="caption" color="secondary">
            {formatDateTime(item.created_at)}
          </Typography>
        </View>
      </Card>
    )
  }

  const renderHeader = () => (
    <View style={styles.headerContent}>
      {/* Summary Cards */}
      {summary && (
        <View style={styles.summaryGrid}>
          {summaryCards.map((card, index) => (
            <Card key={index} variant="flat" style={[styles.summaryCard, { borderLeftColor: card.color }]}>
              <View style={styles.summaryCardContent}>
                <Ionicons name={card.icon} size={20} color={card.color} />
                <View style={styles.summaryCardInfo}>
                  <Typography variant="caption" color="secondary">
                    {card.title}
                  </Typography>
                  <Typography variant="body" weight="bold">
                    {card.value}
                  </Typography>
                  <Typography variant="caption" color="secondary">
                    {card.description}
                  </Typography>
                </View>
              </View>
            </Card>
          ))}
        </View>
      )}

      {/* Filters */}
      <View style={styles.filtersSection}>
        <View style={styles.filtersHeader}>
          <Typography variant="body" weight="semibold">
            {pagination.total} paiement{pagination.total > 1 ? 's' : ''}
          </Typography>
          <TouchableOpacity
            onPress={() => setShowFiltersModal(true)}
            style={[styles.filterButton, { borderColor: theme.colors.border }]}
          >
            <Ionicons name="funnel" size={16} color={theme.colors.text} />
            <Typography variant="caption" weight="semibold" style={{ marginLeft: 4 }}>
              {statusFilter === 'all' ? 'Filtrer' : STATUS_LABELS[statusFilter] || statusFilter}
            </Typography>
          </TouchableOpacity>
        </View>

        {/* Quick Status Filters */}
        <View style={styles.quickFilters}>
          {STATUS_FILTERS.slice(0, 4).map((filter) => (
            <TouchableOpacity
              key={filter.id}
              style={[
                styles.quickFilterChip,
                {
                  backgroundColor: statusFilter === filter.id
                    ? theme.colors.primary[500]
                    : theme.colors.surface,
                  borderColor: statusFilter === filter.id
                    ? theme.colors.primary[500]
                    : theme.colors.border,
                },
              ]}
              onPress={() => setStatusFilter(filter.id)}
            >
              <Typography
                variant="caption"
                weight="semibold"
                style={{ color: statusFilter === filter.id ? '#fff' : theme.colors.text }}
              >
                {filter.label}
              </Typography>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  )

  const renderEmpty = () => {
    if (loading) {
      return (
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary[500]} />
          <Typography variant="body" color="secondary" style={{ marginTop: 16 }}>
            Chargement des paiements...
          </Typography>
        </View>
      )
    }

    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="wallet-outline" size={64} color={theme.colors.textSecondary} />
        <Typography variant="h3" weight="semibold" style={{ marginTop: 16 }}>
          Aucun paiement
        </Typography>
        <Typography variant="body" color="secondary" style={{ textAlign: 'center', marginTop: 8 }}>
          {statusFilter !== 'all'
            ? 'Aucun paiement ne correspond à ce filtre'
            : 'Vous n\'avez pas encore reçu de paiements'
          }
        </Typography>
        {statusFilter !== 'all' && (
          <Button
            variant="secondary"
            size="sm"
            onPress={() => setStatusFilter('all')}
            style={{ marginTop: 16 }}
          >
            Voir tous les paiements
          </Button>
        )}
      </View>
    )
  }

  const renderFooter = () => {
    if (pagination.currentPage >= pagination.lastPage) {
      return null
    }

    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={theme.colors.primary[500]} />
      </View>
    )
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar
        backgroundColor={theme.colors.primary[500]}
        barStyle="light-content"
      />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8, backgroundColor: theme.colors.primary[500] }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Typography variant="h3" weight="bold" style={{ color: '#fff', flex: 1, textAlign: 'center' }}>
          Mes paiements
        </Typography>
        <View style={{ width: 40 }} />
      </View>

      <FlatList
        data={payments}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderPaymentItem}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        ListFooterComponent={renderFooter}
        contentContainerStyle={[
          styles.listContent,
          payments.length === 0 && { flex: 1 },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.primary[500]}
            colors={[theme.colors.primary[500]]}
          />
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.3}
        showsVerticalScrollIndicator={false}
      />

      {/* Filters Modal */}
      <Modal2025
        visible={showFiltersModal}
        onClose={() => setShowFiltersModal(false)}
        title="Filtrer par statut"
        variant="bottom"
      >
        <View style={styles.modalContent}>
          {STATUS_FILTERS.map((filter) => (
            <TouchableOpacity
              key={filter.id}
              style={[
                styles.filterOption,
                {
                  backgroundColor: statusFilter === filter.id
                    ? `${theme.colors.primary[500]}15`
                    : 'transparent',
                },
              ]}
              onPress={() => handleFilterChange(filter.id)}
            >
              <Typography
                variant="body"
                weight={statusFilter === filter.id ? 'semibold' : 'regular'}
                style={{ color: statusFilter === filter.id ? theme.colors.primary[600] : theme.colors.text }}
              >
                {filter.label}
              </Typography>
              {statusFilter === filter.id && (
                <Ionicons name="checkmark" size={20} color={theme.colors.primary[500]} />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </Modal2025>

      <AlertModal {...alertProps} />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  headerContent: {
    marginBottom: 16,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  summaryCard: {
    width: '47%',
    borderLeftWidth: 3,
    paddingVertical: 12,
  },
  summaryCardContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  summaryCardInfo: {
    flex: 1,
  },
  filtersSection: {
    marginBottom: 8,
  },
  filtersHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  quickFilters: {
    flexDirection: 'row',
    gap: 8,
  },
  quickFilterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  paymentCard: {
    marginBottom: 12,
  },
  paymentHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  paymentInfo: {
    flex: 1,
  },
  paymentDetails: {
    marginBottom: 12,
    gap: 4,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  paymentFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  badgesRow: {
    flexDirection: 'row',
    gap: 8,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  footerLoader: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  modalContent: {
    gap: 4,
  },
  filterOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
})

export default MerchantPaymentsScreen
