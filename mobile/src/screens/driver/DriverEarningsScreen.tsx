import React, { useEffect, useCallback, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useNavigation } from '@react-navigation/native'
import { useDispatch, useSelector } from 'react-redux'
import { useTheme } from '../../theme'
import { RootState, AppDispatch } from '../../store'
import { fetchDriverEarnings } from '../../store/slices/driverSlice'
import { DriverEarning } from '../../types'
import LoadingSpinner from '../../components/LoadingSpinner'

type PeriodType = 'today' | 'week' | 'month'

const DriverEarningsScreen: React.FC = () => {
  const theme = useTheme()
  const navigation = useNavigation<any>()
  const dispatch = useDispatch<AppDispatch>()

  const [refreshing, setRefreshing] = useState(false)
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodType>('week')

  const { earnings, earningsLoading, error } = useSelector((state: RootState) => state.driver)

  const loadData = useCallback(async () => {
    await dispatch(fetchDriverEarnings({ period: selectedPeriod }))
  }, [dispatch, selectedPeriod])

  useEffect(() => {
    loadData()
  }, [loadData])

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await loadData()
    setRefreshing(false)
  }, [loadData])

  const handlePeriodChange = (period: PeriodType) => {
    setSelectedPeriod(period)
  }

  const renderEarningItem = ({ item }: { item: DriverEarning }) => {
    const isPositive = item.amount > 0
    const typeIcons: Record<string, string> = {
      delivery: 'bicycle',
      bonus: 'gift',
      tip: 'heart',
      adjustment: 'swap-horizontal',
      withdrawal: 'arrow-down-circle',
    }

    return (
      <View style={[styles.earningItem, { backgroundColor: theme.colors.cardBackground }]}>
        <View style={[styles.iconContainer, {
          backgroundColor: isPositive ? theme.colors.success + '20' : theme.colors.error + '20'
        }]}>
          <Ionicons
            name={(typeIcons[item.type] || 'cash') as any}
            size={20}
            color={isPositive ? theme.colors.success : theme.colors.error}
          />
        </View>
        <View style={styles.earningInfo}>
          <Text style={[styles.earningType, { color: theme.colors.text }]}>
            {getTypeLabel(item.type)}
          </Text>
          <Text style={[styles.earningDescription, { color: theme.colors.textSecondary }]}>
            {item.description || getTypeLabel(item.type)}
          </Text>
          <Text style={[styles.earningDate, { color: theme.colors.textTertiary }]}>
            {formatDate(item.created_at)}
          </Text>
        </View>
        <Text style={[styles.earningAmount, { color: isPositive ? theme.colors.success : theme.colors.error }]}>
          {isPositive ? '+' : ''}{formatCurrency(item.amount)}
        </Text>
      </View>
    )
  }

  const summary = earnings?.summary

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.text }]}>Mes gains</Text>
        <TouchableOpacity onPress={() => navigation.navigate('DriverHistory')}>
          <Ionicons name="time-outline" size={24} color={theme.colors.primary[500]} />
        </TouchableOpacity>
      </View>

      {/* Period selector */}
      <View style={styles.periodSelector}>
        {(['today', 'week', 'month'] as PeriodType[]).map((period) => (
          <TouchableOpacity
            key={period}
            style={[
              styles.periodButton,
              selectedPeriod === period && { backgroundColor: theme.colors.primary[500] },
            ]}
            onPress={() => handlePeriodChange(period)}
          >
            <Text style={[
              styles.periodText,
              { color: selectedPeriod === period ? 'white' : theme.colors.textSecondary },
            ]}>
              {getPeriodLabel(period)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Summary cards */}
      {summary && (
        <View style={styles.summaryContainer}>
          <View style={[styles.totalCard, { backgroundColor: theme.colors.primary[500] }]}>
            <Text style={styles.totalLabel}>Total des gains</Text>
            <Text style={styles.totalAmount}>{formatCurrency(summary.total)}</Text>
          </View>

          <View style={styles.summaryRow}>
            <View style={[styles.summaryCard, { backgroundColor: theme.colors.cardBackground }]}>
              <Ionicons name="bicycle" size={24} color={theme.colors.primary[500]} />
              <Text style={[styles.summaryValue, { color: theme.colors.text }]}>
                {formatCurrency(summary.deliveries)}
              </Text>
              <Text style={[styles.summaryLabel, { color: theme.colors.textSecondary }]}>
                Livraisons
              </Text>
            </View>
            <View style={[styles.summaryCard, { backgroundColor: theme.colors.cardBackground }]}>
              <Ionicons name="gift" size={24} color={theme.colors.accent.orange} />
              <Text style={[styles.summaryValue, { color: theme.colors.text }]}>
                {formatCurrency(summary.bonuses)}
              </Text>
              <Text style={[styles.summaryLabel, { color: theme.colors.textSecondary }]}>
                Bonus
              </Text>
            </View>
            <View style={[styles.summaryCard, { backgroundColor: theme.colors.cardBackground }]}>
              <Ionicons name="heart" size={24} color={theme.colors.error} />
              <Text style={[styles.summaryValue, { color: theme.colors.text }]}>
                {formatCurrency(summary.tips)}
              </Text>
              <Text style={[styles.summaryLabel, { color: theme.colors.textSecondary }]}>
                Pourboires
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Transactions list */}
      <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
        Historique
      </Text>

      {earningsLoading && !earnings ? (
        <LoadingSpinner />
      ) : (
        <FlatList
          data={earnings?.earnings.data || []}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderEarningItem}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={theme.colors.primary[500]}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="wallet-outline" size={48} color={theme.colors.neutral[300]} />
              <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
                Aucune transaction pour cette période
              </Text>
            </View>
          }
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  )
}

const getTypeLabel = (type: string): string => {
  const labels: Record<string, string> = {
    delivery: 'Commission livraison',
    bonus: 'Bonus',
    tip: 'Pourboire',
    adjustment: 'Ajustement',
    withdrawal: 'Retrait',
  }
  return labels[type] || type
}

const getPeriodLabel = (period: PeriodType): string => {
  const labels: Record<PeriodType, string> = {
    today: "Aujourd'hui",
    week: 'Cette semaine',
    month: 'Ce mois',
  }
  return labels[period]
}

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'decimal',
    maximumFractionDigits: 0,
  }).format(Math.abs(amount)) + ' XOF'
}

const formatDate = (dateString: string): string => {
  const date = new Date(dateString)
  return date.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  periodSelector: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 10,
    marginHorizontal: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.05)',
    alignItems: 'center',
  },
  periodText: {
    fontSize: 14,
    fontWeight: '500',
  },
  summaryContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  totalCard: {
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  totalLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
  },
  totalAmount: {
    color: 'white',
    fontSize: 32,
    fontWeight: 'bold',
    marginTop: 4,
  },
  summaryRow: {
    flexDirection: 'row',
  },
  summaryCard: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 8,
  },
  summaryLabel: {
    fontSize: 11,
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  listContent: {
    padding: 16,
    paddingTop: 0,
  },
  earningItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  earningInfo: {
    flex: 1,
    marginLeft: 12,
  },
  earningType: {
    fontSize: 14,
    fontWeight: '600',
  },
  earningDescription: {
    fontSize: 12,
    marginTop: 2,
  },
  earningDate: {
    fontSize: 11,
    marginTop: 4,
  },
  earningAmount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 14,
    marginTop: 12,
  },
})

export default DriverEarningsScreen
