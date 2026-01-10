import React, { useEffect, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  RefreshControl,
  Dimensions,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useNavigation } from '@react-navigation/native'
import { useTheme } from '../../theme'
import apiService from '../../services/api'
import { formatCurrency } from '../../utils/currencyHelpers'

const { width: SCREEN_WIDTH } = Dimensions.get('window')
const CHART_WIDTH = SCREEN_WIDTH - 64

interface ChartDataPoint {
  date: string
  revenue?: number
  count?: number
}

interface ProductDataPoint {
  product_id: number
  product_name: string
  total_sold: number
}

type Period = 'week' | 'month' | 'quarter'

const MerchantAnalyticsScreen: React.FC = () => {
  const theme = useTheme()
  const navigation = useNavigation()
  const [refreshing, setRefreshing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState<Period>('week')

  // Data
  const [revenueData, setRevenueData] = useState<ChartDataPoint[]>([])
  const [reservationsData, setReservationsData] = useState<ChartDataPoint[]>([])
  const [productsData, setProductsData] = useState<ProductDataPoint[]>([])

  useEffect(() => {
    loadAnalyticsData()
  }, [period])

  const loadAnalyticsData = async () => {
    try {
      setLoading(true)

      // Charger les 3 graphiques en parallèle
      const [revenueRes, reservationsRes, productsRes] = await Promise.all([
        apiService.get(`/analytics/merchant-revenue-chart?period=${period}`),
        apiService.get(`/analytics/merchant-reservations-chart?period=${period}`),
        apiService.get('/analytics/merchant-products-chart?limit=5'),
      ])

      // BUG FIX #1: Correct API response parsing
      // API returns { success: true, data: { chart_data: [...] } }
      if (revenueRes.success) {
        setRevenueData(revenueRes.data?.chart_data || [])
      }

      if (reservationsRes.success) {
        setReservationsData(reservationsRes.data?.chart_data || [])
      }

      if (productsRes.success) {
        setProductsData(productsRes.data?.chart_data || [])
      }
    } catch (error) {
      // Analytics loading error handled silently
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const onRefresh = () => {
    setRefreshing(true)
    loadAnalyticsData()
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return '--'
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return '--'
    return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })
  }

  const renderLineChart = (data: ChartDataPoint[], valueKey: 'revenue' | 'count') => {
    if (data.length === 0) {
      return (
        <View style={styles.emptyChart}>
          <Text style={[styles.emptyChartText, { color: theme.colors.textSecondary }]}>
            Aucune donnée disponible
          </Text>
        </View>
      )
    }

    const maxValue = Math.max(...data.map(d => d[valueKey] || 0))
    const chartHeight = 180

    return (
      <View style={styles.lineChartContainer}>
        {/* Y-axis labels */}
        <View style={styles.yAxisLabels}>
          <Text style={[styles.axisLabel, { color: theme.colors.textSecondary }]}>
            {valueKey === 'revenue' ? formatCurrency(maxValue) : maxValue}
          </Text>
          <Text style={[styles.axisLabel, { color: theme.colors.textSecondary }]}>
            {maxValue > 0
              ? (valueKey === 'revenue' ? formatCurrency(maxValue / 2) : Math.floor(maxValue / 2))
              : (valueKey === 'revenue' ? formatCurrency(0) : 0)
            }
          </Text>
          <Text style={[styles.axisLabel, { color: theme.colors.textSecondary }]}>0</Text>
        </View>

        {/* Chart area */}
        <View style={styles.chartArea}>
          <View style={[styles.lineChart, { height: chartHeight }]}>
            {data.map((point, index) => {
              const value = point[valueKey] || 0
              const heightPercentage = maxValue > 0 ? (value / maxValue) * 100 : 0
              const barHeight = (chartHeight * heightPercentage) / 100

              return (
                <View key={index} style={styles.barContainer}>
                  <View style={styles.barColumn}>
                    <View
                      style={[
                        styles.bar,
                        {
                          height: barHeight,
                          backgroundColor: theme.colors.primary[500],
                        }
                      ]}
                    />
                  </View>
                  <Text style={[styles.xAxisLabel, { color: theme.colors.textSecondary }]}>
                    {point.date ? formatDate(point.date) : '--'}
                  </Text>
                </View>
              )
            })}
          </View>
        </View>
      </View>
    )
  }

  const renderBarChart = (data: ProductDataPoint[]) => {
    if (data.length === 0) {
      return (
        <View style={styles.emptyChart}>
          <Text style={[styles.emptyChartText, { color: theme.colors.textSecondary }]}>
            Aucune donnée disponible
          </Text>
        </View>
      )
    }

    const maxValue = data.length > 0 ? Math.max(...data.map(d => d.total_sold || 0)) : 0

    return (
      <View style={styles.barChartContainer}>
        {data.map((product, index) => {
          const widthPercentage = maxValue > 0 ? (product.total_sold / maxValue) * 100 : 0

          return (
            <View key={product.product_id} style={styles.horizontalBarRow}>
              <View style={styles.productLabelContainer}>
                <Text
                  style={[styles.productLabel, { color: theme.colors.text }]}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {product.product_name}
                </Text>
              </View>
              <View style={styles.horizontalBarContainer}>
                <View
                  style={[
                    styles.horizontalBar,
                    {
                      width: `${widthPercentage}%`,
                      backgroundColor: theme.colors.primary[500],
                    }
                  ]}
                />
                <Text style={[styles.barValue, { color: theme.colors.text }]}>
                  {product.total_sold}
                </Text>
              </View>
            </View>
          )
        })}
      </View>
    )
  }

  const totalRevenue = revenueData.reduce((sum, d) => sum + (d.revenue || 0), 0)
  // 🐛 BUG FIX #MOB-M-002: Sum of chart data, not total reservations count
  const totalReservations = reservationsData.reduce((sum, d) => sum + (d.count || 0), 0)

  // Helper to get period label for display
  const getPeriodLabel = () => {
    switch (period) {
      case 'week': return '7 jours'
      case 'month': return '30 jours'
      case 'quarter': return '90 jours'
      default: return ''
    }
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar barStyle={theme.isDark ? "light-content" : "dark-content"} backgroundColor={theme.colors.background} />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.isDark ? '#0F1622' : theme.colors.primary[500] }]}>
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color="white" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Statistiques</Text>
          </View>
          <TouchableOpacity onPress={loadAnalyticsData}>
            <Ionicons name="refresh" size={24} color="white" />
          </TouchableOpacity>
        </View>

        {/* Period filters */}
        <View style={styles.filtersContainer}>
          {[
            { value: 'week', label: '7 jours' },
            { value: 'month', label: '30 jours' },
            { value: 'quarter', label: '90 jours' },
          ].map((filterOption) => (
            <TouchableOpacity
              key={filterOption.value}
              style={[
                styles.filterChip,
                {
                  backgroundColor: period === filterOption.value
                    ? 'white'
                    : 'rgba(255, 255, 255, 0.2)',
                }
              ]}
              onPress={() => setPeriod(filterOption.value as Period)}
            >
              <Text style={[
                styles.filterText,
                {
                  color: period === filterOption.value
                    ? theme.colors.primary[500]
                    : 'white'
                }
              ]}>
                {filterOption.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Summary Cards */}
        <View style={styles.summaryCards}>
          <View style={[styles.summaryCard, { backgroundColor: theme.colors.cardBackground, borderColor: theme.colors.cardBorder, borderWidth: 1 }]}>
            <Ionicons name="cash-outline" size={32} color={theme.colors.semantic.success} />
            <Text style={[styles.summaryValue, { color: theme.colors.text }]}>
              {formatCurrency(totalRevenue)}
            </Text>
            <Text style={[styles.summaryLabel, { color: theme.colors.textSecondary }]}>
              Revenus totaux
            </Text>
          </View>

          <View style={[styles.summaryCard, { backgroundColor: theme.colors.cardBackground, borderColor: theme.colors.cardBorder, borderWidth: 1 }]}>
            <Ionicons name="receipt-outline" size={32} color={theme.colors.primary[500]} />
            <Text style={[styles.summaryValue, { color: theme.colors.text }]}>
              {totalReservations}
            </Text>
            <Text style={[styles.summaryLabel, { color: theme.colors.textSecondary }]}>
              Réservations ({getPeriodLabel()})
            </Text>
          </View>
        </View>

        {/* Revenue Chart */}
        <View style={[styles.chartCard, { backgroundColor: theme.colors.cardBackground, borderColor: theme.colors.cardBorder, borderWidth: 1 }]}>
          <View style={styles.chartHeader}>
            <Ionicons name="trending-up" size={20} color={theme.colors.primary[500]} />
            <Text style={[styles.chartTitle, { color: theme.colors.text }]}>
              Évolution du chiffre d'affaires
            </Text>
          </View>
          {renderLineChart(revenueData, 'revenue')}
        </View>

        {/* Reservations Chart */}
        <View style={[styles.chartCard, { backgroundColor: theme.colors.cardBackground, borderColor: theme.colors.cardBorder, borderWidth: 1 }]}>
          <View style={styles.chartHeader}>
            <Ionicons name="calendar-outline" size={20} color={theme.colors.primary[500]} />
            <Text style={[styles.chartTitle, { color: theme.colors.text }]}>
              Tendance des réservations
            </Text>
          </View>
          {renderLineChart(reservationsData, 'count')}
        </View>

        {/* Top Products Chart */}
        <View style={[styles.chartCard, { backgroundColor: theme.colors.cardBackground, borderColor: theme.colors.cardBorder, borderWidth: 1 }]}>
          <View style={styles.chartHeader}>
            <Ionicons name="trophy" size={20} color="#F59E0B" />
            <Text style={[styles.chartTitle, { color: theme.colors.text }]}>
              Top 5 produits vendus
            </Text>
          </View>
          {renderBarChart(productsData)}
        </View>
      </ScrollView>
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
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 12,
    padding: 4,
  },
  headerTitle: {
    color: 'white',
    fontSize: 28,
    fontWeight: 'bold',
  },
  filtersContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  summaryCards: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  summaryCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 8,
  },
  summaryLabel: {
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
  },
  chartCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
  },
  chartHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  lineChartContainer: {
    flexDirection: 'row',
  },
  yAxisLabels: {
    width: 50,
    justifyContent: 'space-between',
    paddingRight: 8,
  },
  axisLabel: {
    fontSize: 10,
  },
  chartArea: {
    flex: 1,
  },
  lineChart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
  },
  barContainer: {
    flex: 1,
    alignItems: 'center',
  },
  barColumn: {
    width: '80%',
    height: '100%',
    justifyContent: 'flex-end',
  },
  bar: {
    width: '100%',
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  xAxisLabel: {
    fontSize: 10,
    marginTop: 4,
    textAlign: 'center',
  },
  barChartContainer: {
    gap: 12,
  },
  horizontalBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  productLabelContainer: {
    width: 120,
  },
  productLabel: {
    fontSize: 12,
  },
  horizontalBarContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  horizontalBar: {
    height: 24,
    borderRadius: 4,
    minWidth: 20,
  },
  barValue: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 8,
  },
  emptyChart: {
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyChartText: {
    fontSize: 14,
  },
})

export default MerchantAnalyticsScreen
