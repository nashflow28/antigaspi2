import React, { useEffect, useMemo, useState } from 'react'
import {
  ActivityIndicator,
  FlatList,
  Platform,
  RefreshControl,
  StatusBar,
  StyleSheet,
  Switch,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigation } from '@react-navigation/native'

import { Button, Card, Typography, Modal as Modal2025, Badge } from '../../components/2025'
import AlertModal from '../../components/AlertModal'
import { useTheme } from '../../theme'
import { useAlert } from '../../hooks/useAlert'
import { formatCurrency } from '../../utils/currencyHelpers'
import { TEST_IDS } from '../../utils/testIds'
import type { AppDispatch, RootState } from '../../store'
import {
  changeWalletPin,
  fetchWallet,
  fetchWalletStats,
  fetchWalletTransactions,
  rechargeWallet,
  setWalletPin,
  toggleWalletStatus,
  updateWalletDailyLimit,
} from '../../store/slices/walletSlice'
import apiService from '../../services/api'
import type { WalletTransaction, WalletTransactionType, WalletRechargePayload } from '../../types'

const paymentMethods: { id: WalletRechargePayload['paymentMethod']; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { id: 'flooz', label: 'Flooz', icon: 'phone-portrait' },
  { id: 'tmoney', label: 'TMoney', icon: 'wallet' },
  { id: 'orange_money', label: 'Orange Money', icon: 'flash' },
  { id: 'mtn_momo', label: 'MTN MoMo', icon: 'card' },
  { id: 'paystack', label: 'Paystack', icon: 'globe-outline' },
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
  } catch (error) {
    return date
  }
}

const getTransactionIcon = (type: WalletTransactionType): keyof typeof Ionicons.glyphMap =>
  type === 'credit' ? 'arrow-down-circle' : 'arrow-up-circle'

const getTransactionColor = (type: WalletTransactionType, theme: ReturnType<typeof useTheme>) =>
  type === 'credit' ? theme.colors.success : theme.colors.error

const WalletScreen: React.FC = () => {
  const theme = useTheme()
  const { alertProps, showError, showSuccess } = useAlert()
  const navigation = useNavigation()
  const dispatch = useDispatch<AppDispatch>()
  const {
    wallet,
    stats,
    transactions,
    loading,
    transactionsLoading,
    statsLoading,
    rechargeLoading,
    pinLoading,
    statusLoading,
    dailyLimitLoading,
    statsPeriod,
  } = useSelector((state: RootState) => state.wallet)

  const [refreshing, setRefreshing] = useState(false)
  const [filter, setFilter] = useState<'all' | WalletTransactionType>('all')
  const [showRechargeModal, setShowRechargeModal] = useState(false)
  const [showPinModal, setShowPinModal] = useState(false)
  const [rechargeAmount, setRechargeAmount] = useState('')
  const [rechargePhone, setRechargePhone] = useState('')
  const [selectedMethod, setSelectedMethod] = useState<WalletRechargePayload['paymentMethod']>('flooz')
  const [pinMode, setPinMode] = useState<'create' | 'update'>('create')
  const [currentPin, setCurrentPin] = useState('')
  const [newPin, setNewPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [customDailyLimit, setCustomDailyLimit] = useState(wallet?.daily_limit ? String(wallet.daily_limit) : '')
  const [showTestRechargeModal, setShowTestRechargeModal] = useState(false)
  const [testRechargeAmount, setTestRechargeAmount] = useState('5000')
  const [testRechargeLoading, setTestRechargeLoading] = useState(false)

  const dailySpent = useMemo(
    () => Math.max(0, (wallet?.daily_limit ?? 0) - (wallet?.remaining_daily_limit ?? 0)),
    [wallet?.daily_limit, wallet?.remaining_daily_limit]
  )

  useEffect(() => {
    if (wallet?.has_pin) {
      setPinMode('update')
    }
  }, [wallet?.has_pin])

  useEffect(() => {
    setCustomDailyLimit(wallet?.daily_limit ? String(wallet.daily_limit) : '')
  }, [wallet?.daily_limit])

  useEffect(() => {
    void (async () => {
      await dispatch(fetchWallet())
      await dispatch(fetchWalletTransactions({}))
      await dispatch(fetchWalletStats(statsPeriod))
    })()
  }, [dispatch, statsPeriod])

  const onRefresh = async () => {
    setRefreshing(true)
    await dispatch(fetchWallet())
    await dispatch(fetchWalletTransactions({ filters: filter === 'all' ? undefined : { type: filter } }))
    await dispatch(fetchWalletStats(statsPeriod))
    setRefreshing(false)
  }

  const filteredTransactions = useMemo(() => {
    if (filter === 'all') {
      return transactions
    }
    return transactions.filter((transaction) => transaction.type === filter)
  }, [transactions, filter])

  const handleFilterChange = async (nextFilter: 'all' | WalletTransactionType) => {
    setFilter(nextFilter)
    await dispatch(fetchWalletTransactions({ filters: nextFilter === 'all' ? undefined : { type: nextFilter }, page: 1 }))
  }

  const handleRechargeSubmit = async () => {
    const amount = Number.parseFloat(rechargeAmount.replace(/\s/g, ''))
    if (!Number.isFinite(amount) || amount <= 0) {
      showError('Montant invalide', 'Veuillez saisir un montant supérieur à zéro.')
      return
    }

    try {
      await dispatch(rechargeWallet({ amount, paymentMethod: selectedMethod, phone: rechargePhone || undefined })).unwrap()
      setRechargeAmount('')
      setRechargePhone('')
      setSelectedMethod('flooz')
      setShowRechargeModal(false)
      showSuccess('Succès', 'Recharge initiée avec succès. Finalisez l\'opération depuis votre mobile money.')
    } catch (error: any) {
      showError('Recharge impossible', error?.message ?? 'Une erreur est survenue lors de la recharge.')
    }
  }

  const handlePinSubmit = async () => {
    if (newPin.trim().length < 4) {
      showError('PIN invalide', 'Le PIN doit contenir au moins 4 chiffres.')
      return
    }

    if (newPin !== confirmPin) {
      showError('PIN différent', 'Les codes PIN saisis ne correspondent pas.')
      return
    }

    try {
      if (pinMode === 'update') {
        if (currentPin.trim().length < 4) {
          showError('PIN actuel requis', 'Veuillez saisir votre PIN actuel pour le modifier.')
          return
        }
        await dispatch(changeWalletPin({ currentPin: currentPin.trim(), newPin: newPin.trim() })).unwrap()
        showSuccess('Succès', 'Votre code PIN a été mis à jour.')
      } else {
        await dispatch(setWalletPin({ pin: newPin.trim() })).unwrap()
        showSuccess('Succès', 'Votre code PIN a été configuré.')
      }
      setShowPinModal(false)
      setCurrentPin('')
      setNewPin('')
      setConfirmPin('')
    } catch (error: any) {
      showError('Erreur PIN', error?.message ?? 'Impossible de mettre à jour le code PIN.')
    }
  }

  const handleToggleStatus = async (next: boolean) => {
    try {
      await dispatch(toggleWalletStatus(next)).unwrap()
    } catch (error: any) {
      showError('Action impossible', error?.message ?? 'Impossible de mettre à jour le statut du portefeuille.')
    }
  }

  const handleUpdateDailyLimit = async () => {
    const parsed = Number.parseInt(customDailyLimit, 10)
    if (!Number.isFinite(parsed) || parsed <= 0) {
      showError('Valeur invalide', 'Veuillez saisir une limite quotidienne valide (minimum 1).')
      return
    }

    try {
      await dispatch(updateWalletDailyLimit(parsed)).unwrap()
      showSuccess('Limite mise à jour', 'Votre limite quotidienne a été enregistrée.')
    } catch (error: any) {
      showError('Erreur', error?.message ?? 'Impossible de mettre à jour la limite quotidienne.')
    }
  }

  const handleTestRecharge = async () => {
    const amount = Number.parseInt(testRechargeAmount, 10)
    if (!Number.isFinite(amount) || amount < 100 || amount > 100000) {
      showError('Montant invalide', 'Le montant doit être entre 100 et 100 000 F CFA.')
      return
    }

    setTestRechargeLoading(true)
    try {
      const response = await apiService.testRechargeWallet(amount)
      if (response.success) {
        showSuccess(
          'Recharge test réussie',
          `Votre portefeuille a été crédité de ${formatCurrency(amount)}. Nouveau solde: ${formatCurrency(response.data.wallet.balance)}`
        )
        setShowTestRechargeModal(false)
        setTestRechargeAmount('5000')
        // Refresh wallet data
        await dispatch(fetchWallet())
        await dispatch(fetchWalletTransactions({}))
        await dispatch(fetchWalletStats(statsPeriod))
      } else {
        showError('Erreur', response.message || 'La recharge test a échoué.')
      }
    } catch (error: any) {
      showError('Erreur', error?.message ?? 'Impossible d\'effectuer la recharge test.')
    } finally {
      setTestRechargeLoading(false)
    }
  }

  const renderTransactionItem = ({ item }: { item: WalletTransaction }) => (
    <Card style={[styles.transactionCard, { borderColor: theme.withOpacity(getTransactionColor(item.type, theme), 0.15) }]}> 
      <View style={styles.transactionHeader}>
        <View style={styles.transactionIconContainer}>
          <Ionicons
            name={getTransactionIcon(item.type)}
            size={26}
            color={getTransactionColor(item.type, theme)}
          />
        </View>
        <View style={styles.transactionContent}>
          <Typography variant="body" weight="semibold" style={styles.transactionTitle}>
            {item.description || (item.type === 'credit' ? 'Crédit reçu' : 'Paiement effectué')}
          </Typography>
          <Typography variant="caption" color="secondary">
            Ref. {item.reference}
          </Typography>
        </View>
        <Typography
          variant="body"
          weight="semibold"
          style={{ color: getTransactionColor(item.type, theme) }}
        >
          {item.type === 'credit' ? '+' : '-'}{formatCurrency(item.amount, { showSymbol: true })}
        </Typography>
      </View>
      <View style={styles.transactionFooter}>
        <Typography variant="caption" color="secondary">
          {formatDateTime(item.created_at)}
        </Typography>
        <Badge variant={item.type === 'credit' ? 'success' : 'warning'}>
          {item.type === 'credit' ? 'Crédit' : 'Débit'}
        </Badge>
      </View>
    </Card>
  )

  const renderEmpty = () => {
    if (transactionsLoading) {
      return (
        <View style={styles.emptyContainer}>
          <ActivityIndicator color={theme.colors.primary[500]} />
          <Typography variant="caption" color="secondary" style={styles.emptyText}>
            Chargement des transactions...
          </Typography>
        </View>
      )
    }

    return (
      <View style={styles.emptyContainer}>
        <Typography variant="body" weight="semibold" style={styles.emptyText}>
          Aucune transaction pour le moment
        </Typography>
        <Typography variant="caption" color="secondary" style={styles.emptyText}>
          Rechargez votre portefeuille ou effectuez un achat pour voir vos mouvements ici.
        </Typography>
      </View>
    )
  }

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <Card
        variant="glass"
        style={[styles.balanceCard, { backgroundColor: theme.withOpacity(theme.colors.primary[50], theme.isDark ? 0.2 : 0.6) }]}
        testID={TEST_IDS.walletBalanceCard}
      >
        <Typography variant="caption" color="secondary">
          Solde disponible
        </Typography>
        <Typography variant="h3" weight="bold" style={styles.balanceValue}>
          {formatCurrency(wallet?.balance ?? 0)}
        </Typography>
        <Typography variant="caption" color="secondary" style={styles.balanceSubtext}>
          Dernière activité : {wallet?.last_transaction_at ? formatDateTime(wallet.last_transaction_at) : 'Aucune transaction'}
        </Typography>
        <View style={styles.balanceActions}>
          <Button
            variant="primary"
            size="sm"
            onPress={() => setShowRechargeModal(true)}
            testID={TEST_IDS.walletRechargeButton}
            disabled={rechargeLoading}
          >
            <Ionicons name="add-circle" size={18} color="#fff" style={styles.buttonIcon} />
            Recharger
          </Button>
          <Button
            variant="outline"
            size="sm"
            onPress={() => setShowTestRechargeModal(true)}
            disabled={testRechargeLoading}
          >
            <Ionicons name="flask" size={18} color={theme.colors.warning} style={styles.buttonIcon} />
            Test
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onPress={() => {
              setPinMode(wallet?.has_pin ? 'update' : 'create')
              setShowPinModal(true)
            }}
            testID={TEST_IDS.walletPinButton}
            disabled={pinLoading}
          >
            <Ionicons name="lock-closed" size={18} color={theme.colors.primary[600]} style={styles.buttonIcon} />
            PIN
          </Button>
        </View>
      </Card>

      <Card variant="flat" style={styles.statusCard}>
        <View style={styles.statusRow}>
          <Typography variant="body" weight="semibold">
            Statut du portefeuille
          </Typography>
          <Switch
            trackColor={{ true: theme.colors.primary[500], false: theme.colors.neutral[300] }}
            thumbColor="#fff"
            value={wallet?.is_active ?? false}
            onValueChange={handleToggleStatus}
            disabled={statusLoading || loading}
          />
        </View>
        <Typography variant="caption" color="secondary" style={styles.statusHint}>
          {wallet?.is_active
            ? 'Votre portefeuille est prêt à encaisser ou à payer les commandes.'
            : 'Activez le portefeuille pour accepter des paiements Antigaspi.'}
        </Typography>
      </Card>

      <Card variant="flat" style={styles.statsCard}>
        <View style={styles.statsHeader}>
          <Typography variant="body" weight="semibold">
            Aperçu ({statsPeriod === 'month' ? '30 derniers jours' : statsPeriod})
          </Typography>
          {statsLoading && <ActivityIndicator size="small" color={theme.colors.primary[500]} />}
        </View>
        <View style={styles.statsGrid}>
          <View style={styles.statsItem}>
            <Typography variant="caption" color="secondary">
              Crédits
            </Typography>
            <Typography variant="body" weight="semibold" style={{ color: theme.colors.success }}>
              {stats ? formatCurrency(stats.period_stats.total_credits) : '—'}
            </Typography>
          </View>
          <View style={styles.statsItem}>
            <Typography variant="caption" color="secondary">
              Débits
            </Typography>
            <Typography variant="body" weight="semibold" style={{ color: theme.colors.error }}>
              {stats ? formatCurrency(stats.period_stats.total_debits) : '—'}
            </Typography>
          </View>
          <View style={styles.statsItem}>
            <Typography variant="caption" color="secondary">
              Transactions
            </Typography>
            <Typography variant="body" weight="semibold">
              {stats ? stats.period_stats.transaction_count : '—'}
            </Typography>
          </View>
        </View>
      </Card>

      <Card variant="flat" style={styles.limitCard}>
        <View style={styles.limitHeader}>
          <Typography variant="body" weight="semibold">
            Limite quotidienne
          </Typography>
          {dailyLimitLoading && <ActivityIndicator size="small" color={theme.colors.primary[500]} />}
        </View>
        <View style={styles.limitInputs}>
          <TextInput
            value={customDailyLimit}
            onChangeText={setCustomDailyLimit}
            keyboardType="numeric"
            placeholder="Ex: 10000"
            style={[styles.input, { borderColor: theme.colors.border, backgroundColor: theme.isDark ? theme.colors.neutral[800] : theme.colors.surface.light, color: theme.colors.text }]}
          />
          <Button
            size="sm"
            variant="primary"
            onPress={handleUpdateDailyLimit}
            disabled={dailyLimitLoading}
          >
            Enregistrer
          </Button>
        </View>
        <Typography variant="caption" color="secondary">
          Montant utilisé aujourd'hui : {formatCurrency(dailySpent)}
        </Typography>
      </Card>

      <View style={styles.filtersRow}>
        {(['all', 'credit', 'debit'] as const).map((value) => (
          <TouchableOpacity
            key={value}
            style={[
              styles.filterChip,
              {
                backgroundColor: theme.isDark ? theme.colors.neutral[800] : theme.colors.surface.light,
                borderColor: theme.colors.border,
              },
              value === filter && {
                backgroundColor: theme.isDark ? theme.colors.primary[900] : theme.colors.primary[50],
                borderColor: theme.colors.primary[400],
              },
            ]}
            onPress={() => void handleFilterChange(value)}
          >
            <Typography
              variant="caption"
              weight="semibold"
              style={{ color: value === filter ? theme.colors.primary[600] : theme.colors.text }}
            >
              {value === 'all' ? 'Toutes' : value === 'credit' ? 'Crédits' : 'Débits'}
            </Typography>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  )

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]} testID={TEST_IDS.walletScreen}>
      <StatusBar barStyle="light-content" />

      {/* Header avec bouton retour */}
      <View style={[styles.screenHeader, { backgroundColor: theme.colors.primary[500] }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Typography variant="h3" style={{ color: 'white', fontWeight: 'bold', flex: 1, textAlign: 'center' }}>
          Portefeuille
        </Typography>
        <View style={{ width: 40 }} />
      </View>

      <FlatList
        data={filteredTransactions}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderTransactionItem}
        contentContainerStyle={[styles.listContent, { paddingBottom: theme.spacing.xl * 4 }]}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        refreshControl={(
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.primary[500]}
            colors={[theme.colors.primary[500]]}
          />
        )}
        testID={TEST_IDS.walletTransactionsList}
        showsVerticalScrollIndicator={false}
      />

      <Modal2025
        visible={showRechargeModal}
        onClose={() => setShowRechargeModal(false)}
        title="Recharger mon portefeuille"
        variant="bottom"
        avoidKeyboard={true}
        testID="wallet-recharge-modal"
      >
        <View style={styles.modalContent}>
          <Typography variant="caption" color="secondary" style={styles.modalSubtitle}>
            Choisissez le montant et le moyen de paiement pour alimenter votre portefeuille.
          </Typography>
          <Typography variant="caption">Montant</Typography>
          <TextInput
            value={rechargeAmount}
            onChangeText={setRechargeAmount}
            placeholder="Ex: 5000"
            keyboardType="numeric"
            style={[styles.input, { borderColor: theme.colors.border, backgroundColor: theme.isDark ? theme.colors.neutral[800] : theme.colors.surface.light, color: theme.colors.text }]}
          />
          <Typography variant="caption" style={styles.modalSectionTitle}>
            Moyen de paiement
          </Typography>
          <View style={styles.methodGrid}>
            {paymentMethods.map((method) => {
              const isSelected = selectedMethod === method.id
              return (
                <TouchableOpacity
                  key={method.id}
                  style={[
                    styles.methodItem,
                    {
                      borderColor: isSelected ? theme.colors.primary[500] : theme.colors.border,
                      backgroundColor: isSelected
                        ? (theme.isDark ? theme.colors.primary[900] : theme.colors.primary[50])
                        : (theme.isDark ? theme.colors.neutral[800] : theme.colors.surface.light),
                    },
                  ]}
                  onPress={() => setSelectedMethod(method.id)}
                >
                  <Ionicons
                    name={method.icon}
                    size={20}
                    color={isSelected ? theme.colors.primary[600] : theme.colors.text}
                  />
                  <Typography variant="caption" weight="semibold">
                    {method.label}
                  </Typography>
                </TouchableOpacity>
              )
            })}
          </View>
          <Typography variant="caption" style={styles.modalSectionTitle}>
            Numéro Mobile Money (optionnel)
          </Typography>
          <TextInput
            value={rechargePhone}
            onChangeText={setRechargePhone}
            placeholder="Ex: 90 12 34 56"
            keyboardType="phone-pad"
            style={[styles.input, { borderColor: theme.colors.border, backgroundColor: theme.isDark ? theme.colors.neutral[800] : theme.colors.surface.light, color: theme.colors.text }]}
          />
          <Button
            variant="primary"
            onPress={handleRechargeSubmit}
            disabled={rechargeLoading}
          >
            {rechargeLoading ? 'Traitement...' : 'Continuer'}
          </Button>
        </View>
      </Modal2025>

      <Modal2025
        visible={showPinModal}
        onClose={() => setShowPinModal(false)}
        title={pinMode === 'update' ? 'Modifier mon code PIN' : 'Configurer un code PIN'}
        variant="bottom"
        avoidKeyboard={true}
        testID="wallet-pin-modal"
      >
        <View style={styles.modalContent}>
          {pinMode === 'update' && (
            <>
              <Typography variant="caption">PIN actuel</Typography>
              <TextInput
                value={currentPin}
                onChangeText={setCurrentPin}
                secureTextEntry
                keyboardType="numeric"
                style={[styles.input, { borderColor: theme.colors.border, backgroundColor: theme.isDark ? theme.colors.neutral[800] : theme.colors.surface.light, color: theme.colors.text }]}
              />
            </>
          )}
          <Typography variant="caption">Nouveau PIN</Typography>
          <TextInput
            value={newPin}
            onChangeText={setNewPin}
            secureTextEntry
            keyboardType="numeric"
            style={[styles.input, { borderColor: theme.colors.border, backgroundColor: theme.isDark ? theme.colors.neutral[800] : theme.colors.surface.light, color: theme.colors.text }]}
          />
          <Typography variant="caption">Confirmation</Typography>
          <TextInput
            value={confirmPin}
            onChangeText={setConfirmPin}
            secureTextEntry
            keyboardType="numeric"
            style={[styles.input, { borderColor: theme.colors.border, backgroundColor: theme.isDark ? theme.colors.neutral[800] : theme.colors.surface.light, color: theme.colors.text }]}
          />
          <Button
            variant="primary"
            onPress={handlePinSubmit}
            disabled={pinLoading}
          >
            {pinLoading ? 'Enregistrement...' : 'Valider'}
          </Button>
        </View>
      </Modal2025>

      <Modal2025
        visible={showTestRechargeModal}
        onClose={() => setShowTestRechargeModal(false)}
        title="Recharge Test"
        variant="bottom"
        avoidKeyboard={true}
        testID="wallet-test-recharge-modal"
      >
        <View style={styles.modalContent}>
          <View style={[styles.testWarningBanner, { backgroundColor: theme.withOpacity(theme.colors.warning, 0.15) }]}>
            <Ionicons name="flask" size={24} color={theme.colors.warning} />
            <View style={{ flex: 1 }}>
              <Typography variant="body" weight="semibold" style={{ color: theme.colors.warning }}>
                Mode Test
              </Typography>
              <Typography variant="caption" color="secondary">
                Cette fonctionnalité permet de recharger virtuellement votre portefeuille pour tester l'application.
              </Typography>
            </View>
          </View>
          <Typography variant="caption">Montant (100 - 100 000 F CFA)</Typography>
          <TextInput
            value={testRechargeAmount}
            onChangeText={setTestRechargeAmount}
            placeholder="Ex: 5000"
            keyboardType="numeric"
            style={[styles.input, { borderColor: theme.colors.border, backgroundColor: theme.isDark ? theme.colors.neutral[800] : theme.colors.surface.light, color: theme.colors.text }]}
          />
          <View style={styles.testAmountPresets}>
            {[1000, 5000, 10000, 25000].map((preset) => (
              <TouchableOpacity
                key={preset}
                style={[
                  styles.testAmountChip,
                  {
                    borderColor: testRechargeAmount === String(preset) ? theme.colors.primary[500] : theme.colors.border,
                    backgroundColor: testRechargeAmount === String(preset)
                      ? (theme.isDark ? theme.colors.primary[900] : theme.colors.primary[50])
                      : (theme.isDark ? theme.colors.neutral[800] : theme.colors.surface.light),
                  },
                ]}
                onPress={() => setTestRechargeAmount(String(preset))}
              >
                <Typography
                  variant="caption"
                  weight="semibold"
                  style={{ color: testRechargeAmount === String(preset) ? theme.colors.primary[600] : theme.colors.text }}
                >
                  {formatCurrency(preset)}
                </Typography>
              </TouchableOpacity>
            ))}
          </View>
          <Button
            variant="primary"
            onPress={handleTestRecharge}
            disabled={testRechargeLoading}
          >
            {testRechargeLoading ? 'Chargement...' : `Créditer ${formatCurrency(Number.parseInt(testRechargeAmount, 10) || 0)}`}
          </Button>
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
  screenHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  backButton: {
    padding: 8,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 24,
  },
  headerContainer: {
    gap: 16,
    marginBottom: 16,
  },
  balanceCard: {
    gap: 12,
  },
  balanceValue: {
    fontSize: 28,
  },
  balanceSubtext: {
    marginBottom: 12,
  },
  balanceActions: {
    flexDirection: 'row',
    gap: 12,
  },
  buttonIcon: {
    marginRight: 6,
  },
  statusCard: {
    gap: 8,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusHint: {
    marginTop: 4,
  },
  statsCard: {
    gap: 12,
  },
  statsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statsItem: {
    flex: 1,
    gap: 4,
  },
  limitCard: {
    gap: 12,
  },
  limitHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  limitInputs: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    flex: 1,
  },
  filtersRow: {
    flexDirection: 'row',
    gap: 10,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 24,
    borderWidth: 1,
  },
  transactionCard: {
    marginBottom: 12,
    gap: 12,
  },
  transactionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  transactionContent: {
    flex: 1,
    gap: 4,
  },
  transactionIconContainer: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(59, 130, 246, 0.08)',
  },
  transactionTitle: {
    flexShrink: 1,
  },
  transactionFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 12,
  },
  emptyText: {
    textAlign: 'center',
  },
  modalContent: {
    gap: 16,
  },
  modalSubtitle: {
    marginBottom: 4,
  },
  modalSectionTitle: {
    marginTop: 8,
  },
  methodGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  methodItem: {
    width: '30%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1,
    gap: 6,
  },
  testWarningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 12,
  },
  testAmountPresets: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  testAmountChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
  },
})

export default WalletScreen
