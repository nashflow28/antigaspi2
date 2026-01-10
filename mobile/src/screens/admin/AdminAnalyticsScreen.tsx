import React, { useState, useMemo, useRef } from 'react'
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useTheme } from '../../theme'
import { Typography, Card, Badge, DatePicker } from '../../components/2025'
import { Pagination } from '../../components/admin'
import RevenueChart from '../../components/admin/RevenueChart'
import GeographicChart from '../../components/admin/GeographicChart'
import ExportButton from '../../components/admin/ExportButton'
import AlertModal from '../../components/AlertModal'
import apiService from '../../services/api'
import { AdminAnalyticsData, AdminAnalyticsFilters } from '../../types'
import { formatCurrency } from '../../utils/currencyHelpers'
import { TEST_IDS } from '../../utils/testIds'
import { useDebouncedEffect } from '../../hooks/useDebounce'
import { useAlert } from '../../hooks/useAlert'

type Period = '7d' | '30d' | '90d' | 'custom'
type Tab = 'revenue' | 'geography' | 'merchants'

const MERCHANTS_PER_PAGE = 10

const AdminAnalyticsScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const theme = useTheme()
  const insets = useSafeAreaInsets()
  const { alertProps, showError, showWarning } = useAlert()

  // Dark mode adaptive surface color
  const surfaceColor = theme.isDark ? theme.colors.neutral[800] : theme.colors.surface.light
  const [selectedPeriod, setSelectedPeriod] = useState<Period>('30d')
  const [selectedTab, setSelectedTab] = useState<Tab>('revenue')
  const [data, setData] = useState<AdminAnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [startDate, setStartDate] = useState(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))
  const [endDate, setEndDate] = useState(new Date())
  const [merchantPage, setMerchantPage] = useState(1)

  // Paginated merchants data
  const paginatedMerchants = useMemo(() => {
    if (!data?.merchant_performance) return { items: [], totalPages: 0, total: 0 }

    const total = data.merchant_performance.length
    const totalPages = Math.ceil(total / MERCHANTS_PER_PAGE)
    const startIndex = (merchantPage - 1) * MERCHANTS_PER_PAGE
    const items = data.merchant_performance.slice(startIndex, startIndex + MERCHANTS_PER_PAGE)

    return { items, totalPages, total }
  }, [data?.merchant_performance, merchantPage])

  // BUG FIX #15: Debounce API calls when dates change to prevent excessive requests
  // When user changes both start and end dates quickly, this prevents multiple API calls
  useDebouncedEffect(
    () => {
      loadAnalytics()
    },
    [selectedPeriod, startDate, endDate],
    selectedPeriod === 'custom' ? 800 : 0 // Only debounce for custom date ranges
  )

  const loadAnalytics = async () => {
    try {
      setLoading(true)

      const filters: AdminAnalyticsFilters = {
        period: selectedPeriod,
      }

      if (selectedPeriod === 'custom') {
        filters.start_date = startDate.toISOString().split('T')[0]
        filters.end_date = endDate.toISOString().split('T')[0]
      }

      // Utiliser .get() au lieu de getAdminAnalytics() qui n'existe peut-être pas
      const response = await apiService.get('/admin/analytics', { params: filters })
      // apiService retourne response.data d'axios directement
      // Backend peut retourner {summary, ...} ou {data: {summary, ...}}

      // Essayer plusieurs chemins possibles
      const analyticsData = response.summary
        ? response
        : (response.data?.summary ? response.data : response)

      setData(analyticsData)
    } catch (error: any) {
      // Gestion des erreurs d'autorisation
      if (error.response?.status === 401 || error.response?.status === 403) {
        showWarning(
          'Session expirée',
          'Votre session a expiré. Veuillez vous reconnecter.'
        )
        return
      }

      showError('Erreur', 'Impossible de charger les analytics')
    } finally {
      setLoading(false)
    }
  }

  const PERIODS = [
    { id: '7d' as const, label: '7 jours' },
    { id: '30d' as const, label: '30 jours' },
    { id: '90d' as const, label: '90 jours' },
    { id: 'custom' as const, label: 'Personnalisé' },
  ]

  const TABS = [
    { id: 'revenue' as const, label: 'Revenus', icon: 'trending-up' },
    { id: 'geography' as const, label: 'Géographie', icon: 'map' },
    { id: 'merchants' as const, label: 'Commerçants', icon: 'storefront' },
  ]

  if (loading && !data) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary[500]} />
        <Typography variant="body" color="secondary" style={{ marginTop: 12 }}>
          Chargement des analytics...
        </Typography>
      </View>
    )
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.primary[500]} />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.colors.primary[500] }]}>
        <View style={styles.headerContent}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
            testID="back-button"
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Typography variant="caption" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
              Administrateur
            </Typography>
            <Typography variant="h2" weight="bold" style={{ color: 'white' }}>
              Analytics Avancées
            </Typography>
          </View>
          <TouchableOpacity onPress={loadAnalytics} testID="refresh-button">
            <Ionicons name="refresh" size={24} color="white" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 16 }]}>
        {/* Period Selector */}
        <Card variant="elevated" style={styles.card}>
          <Typography variant="h4" weight="semibold" style={{ marginBottom: 12 }}>
            Période
          </Typography>
          <View style={styles.periodButtons}>
            {PERIODS.map((period) => (
              <TouchableOpacity
                key={period.id}
                style={[
                  styles.periodButton,
                  {
                    backgroundColor:
                      selectedPeriod === period.id
                        ? theme.colors.primary[100]
                        : surfaceColor,
                    borderColor:
                      selectedPeriod === period.id
                        ? theme.colors.primary[500]
                        : theme.isDark ? theme.colors.neutral[600] : theme.colors.border,
                  },
                ]}
                onPress={() => setSelectedPeriod(period.id)}
              >
                <Typography
                  variant="small"
                  weight={selectedPeriod === period.id ? 'semibold' : 'regular'}
                  style={{
                    color:
                      selectedPeriod === period.id
                        ? theme.colors.primary[500]
                        : theme.colors.neutral[400],
                  }}
                >
                  {period.label}
                </Typography>
              </TouchableOpacity>
            ))}
          </View>

          {/* Custom Date Range */}
          {selectedPeriod === 'custom' && (
            <View style={styles.dateRange}>
              <View style={{ flex: 1 }}>
                <DatePicker
                  label="Du"
                  placeholder="Date de début"
                  value={startDate}
                  onChange={setStartDate}
                  maxDate={endDate}
                />
              </View>
              <View style={{ flex: 1 }}>
                <DatePicker
                  label="Au"
                  placeholder="Date de fin"
                  value={endDate}
                  onChange={setEndDate}
                  minDate={startDate}
                  maxDate={new Date()}
                />
              </View>
            </View>
          )}
        </Card>

        {/* KPI Cards */}
        {data && (
          <>
            <View style={styles.kpiGrid}>
              <Card variant="elevated" style={styles.kpiCard}>
                <Typography variant="caption" color="secondary">
                  Revenu Total
                </Typography>
                <Typography variant="h3" weight="bold" color="primary">
                  {formatCurrency(data.summary.total_revenue)}
                </Typography>
                <View style={styles.kpiChange}>
                  <Ionicons
                    name={data.summary.growth_rate >= 0 ? 'trending-up' : 'trending-down'}
                    size={16}
                    color={data.summary.growth_rate >= 0 ? theme.colors.semantic.success : theme.colors.semantic.error}
                  />
                  <Typography
                    variant="caption"
                    style={{
                      color: data.summary.growth_rate >= 0 ? theme.colors.semantic.success : theme.colors.semantic.error,
                      marginLeft: 4,
                    }}
                  >
                    {data.summary.growth_rate >= 0 ? '+' : ''}{data.summary.growth_rate.toFixed(1)}%
                  </Typography>
                </View>
              </Card>

              <Card variant="elevated" style={styles.kpiCard}>
                <Typography variant="caption" color="secondary">
                  Transactions
                </Typography>
                <Typography variant="h3" weight="bold" color="primary">
                  {data.summary.total_transactions}
                </Typography>
                <Typography variant="caption" color="secondary">
                  transactions
                </Typography>
              </Card>

              <Card variant="elevated" style={styles.kpiCard}>
                <Typography variant="caption" color="secondary">
                  Panier Moyen
                </Typography>
                <Typography variant="h3" weight="bold" color="primary">
                  {formatCurrency(data.summary.average_order_value)}
                </Typography>
                <Typography variant="caption" color="secondary">
                  par commande
                </Typography>
              </Card>
            </View>

            {/* Export Buttons */}
            <View style={styles.exportContainer}>
              <Typography variant="h4" weight="semibold" style={{ marginBottom: 12 }}>
                Exporter les données
              </Typography>
              <View style={styles.exportButtons}>
                <ExportButton
                  format="csv"
                  filters={{
                    period: selectedPeriod,
                    start_date: selectedPeriod === 'custom' ? startDate.toISOString().split('T')[0] : undefined,
                    end_date: selectedPeriod === 'custom' ? endDate.toISOString().split('T')[0] : undefined,
                  }}
                />
                <ExportButton
                  format="pdf"
                  filters={{
                    period: selectedPeriod,
                    start_date: selectedPeriod === 'custom' ? startDate.toISOString().split('T')[0] : undefined,
                    end_date: selectedPeriod === 'custom' ? endDate.toISOString().split('T')[0] : undefined,
                  }}
                />
              </View>
            </View>

            {/* Tabs */}
            <View style={styles.tabs}>
              {TABS.map((tab) => {
                const getTabTestId = () => {
                  switch (tab.id) {
                    case 'revenue': return TEST_IDS.revenueTab
                    case 'geography': return TEST_IDS.geographyTab
                    case 'merchants': return TEST_IDS.merchantsTab
                  }
                }
                return (
                <TouchableOpacity
                  key={tab.id}
                  style={[
                    styles.tab,
                    {
                      borderBottomColor:
                        selectedTab === tab.id ? theme.colors.primary[500] : 'transparent',
                    },
                  ]}
                  onPress={() => setSelectedTab(tab.id)}
                  testID={getTabTestId()}
                >
                  <Ionicons
                    name={tab.icon as any}
                    size={20}
                    color={
                      selectedTab === tab.id
                        ? theme.colors.primary[500]
                        : theme.colors.neutral[400]
                    }
                  />
                  <Typography
                    variant="small"
                    weight={selectedTab === tab.id ? 'semibold' : 'regular'}
                    style={{
                      color:
                        selectedTab === tab.id
                          ? theme.colors.primary[500]
                          : theme.colors.neutral[400],
                      marginLeft: 6,
                    }}
                  >
                    {tab.label}
                  </Typography>
                </TouchableOpacity>
              )})}
            </View>

            {/* Tab Content */}
            <Card variant="elevated" style={styles.card}>
              {selectedTab === 'revenue' && (
                <RevenueChart
                  labels={data.revenue_chart.labels}
                  data={data.revenue_chart.datasets[0]?.data || []}
                  title="Évolution des revenus"
                />
              )}

              {selectedTab === 'geography' && (
                <GeographicChart
                  data={data.geographic_distribution}
                  title="Top 5 villes"
                />
              )}

              {selectedTab === 'merchants' && (
                <View>
                  <Typography variant="h4" weight="semibold" style={{ marginBottom: 16 }}>
                    Performance des commerçants
                  </Typography>
                  {paginatedMerchants.items.map((merchant, index) => {
                    const globalIndex = (merchantPage - 1) * MERCHANTS_PER_PAGE + index
                    return (
                      <View key={merchant.merchant_id} style={[styles.merchantRow, { borderBottomColor: theme.colors.border }]}>
                        <View style={styles.merchantInfo}>
                          <Badge variant="primary" size="sm" style={{ marginRight: 12 }}>
                            #{globalIndex + 1}
                          </Badge>
                          <View style={{ flex: 1 }}>
                            <Typography variant="body" weight="semibold" numberOfLines={1}>
                              {merchant.merchant_name}
                            </Typography>
                            <Typography variant="caption" color="secondary">
                              {merchant.reservations_count} réservations
                            </Typography>
                          </View>
                        </View>
                        <View style={{ alignItems: 'flex-end' }}>
                          <Typography variant="body" weight="semibold">
                            {formatCurrency(merchant.revenue)}
                          </Typography>
                          <View style={styles.growthBadge}>
                            <Ionicons
                              name={merchant.growth_rate >= 0 ? 'arrow-up' : 'arrow-down'}
                              size={12}
                              color={merchant.growth_rate >= 0 ? theme.colors.semantic.success : theme.colors.semantic.error}
                            />
                            <Typography
                              variant="caption"
                              style={{
                                color: merchant.growth_rate >= 0 ? theme.colors.semantic.success : theme.colors.semantic.error,
                                marginLeft: 2,
                              }}
                            >
                              {merchant.growth_rate >= 0 ? '+' : ''}{merchant.growth_rate.toFixed(1)}%
                            </Typography>
                          </View>
                        </View>
                      </View>
                    )
                  })}

                  {/* Pagination */}
                  <Pagination
                    currentPage={merchantPage}
                    totalPages={paginatedMerchants.totalPages}
                    totalItems={paginatedMerchants.total}
                    itemsPerPage={MERCHANTS_PER_PAGE}
                    onPageChange={setMerchantPage}
                    loading={loading}
                    testID={TEST_IDS.adminMerchantsPagination}
                  />
                </View>
              )}
            </Card>
          </>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

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
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 16,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  card: {
    marginBottom: 16,
    padding: 16,
  },
  periodButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  periodButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 2,
  },
  dateRange: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    gap: 8,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderRadius: 8,
    flex: 1,
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  kpiCard: {
    flex: 1,
    minWidth: '30%',
    padding: 16,
  },
  kpiChange: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  exportContainer: {
    marginBottom: 16,
  },
  exportButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  tabs: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 16,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 12,
    borderBottomWidth: 2,
  },
  merchantRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  merchantInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  growthBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
})

export default AdminAnalyticsScreen
