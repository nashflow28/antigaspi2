/**
 * WalletTopUpScreen - Dedicated wallet recharge screen
 * Step-by-step flow: Amount → Payment → Success
 */

import React, { useState, useCallback } from 'react'
import {
  View,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigation } from '@react-navigation/native'

import { Button, Card, Typography, PhoneInput } from '../../components/2025'
import AlertModal from '../../components/AlertModal'
import { useTheme } from '../../theme'
import { useAlert } from '../../hooks/useAlert'
import { formatCurrency } from '../../utils/currencyHelpers'
import type { AppDispatch, RootState } from '../../store'
import { fetchWallet, rechargeWallet } from '../../store/slices/walletSlice'
import type { WalletRechargePayload } from '../../types'

type TopUpStep = 'amount' | 'payment' | 'success'

const PRESET_AMOUNTS = [1000, 2000, 5000, 10000, 20000, 50000]
const MIN_AMOUNT = 500
const MAX_AMOUNT = 500000

const paymentMethods: { id: WalletRechargePayload['paymentMethod']; label: string; icon: keyof typeof Ionicons.glyphMap; description: string }[] = [
  { id: 'flooz', label: 'Flooz (Moov)', icon: 'phone-portrait', description: 'Paiement via Moov Money' },
  { id: 'tmoney', label: 'T-Money', icon: 'wallet', description: 'Paiement via Togocel Money' },
]

const WalletTopUpScreen: React.FC = () => {
  const theme = useTheme()
  const insets = useSafeAreaInsets()
  const navigation = useNavigation()
  const dispatch = useDispatch<AppDispatch>()
  const { alertProps, showError, showSuccess } = useAlert()

  const { wallet, rechargeLoading } = useSelector((state: RootState) => state.wallet)

  const [step, setStep] = useState<TopUpStep>('amount')
  const [selectedAmount, setSelectedAmount] = useState(0)
  const [customAmountInput, setCustomAmountInput] = useState('')
  const [amountError, setAmountError] = useState('')
  const [selectedMethod, setSelectedMethod] = useState<WalletRechargePayload['paymentMethod']>('flooz')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [previousBalance] = useState(wallet?.balance ?? 0)

  const currentBalance = wallet?.balance ?? 0
  const newBalance = previousBalance + selectedAmount

  const formatAmount = (value: number): string => {
    return new Intl.NumberFormat('fr-FR').format(value)
  }

  const selectPreset = (amount: number) => {
    setSelectedAmount(amount)
    setCustomAmountInput(amount.toString())
    setAmountError('')
  }

  const handleCustomAmount = (text: string) => {
    const value = text.replace(/\D/g, '')
    setCustomAmountInput(value)
    const numValue = parseInt(value) || 0

    if (numValue > 0) {
      setSelectedAmount(numValue)

      if (numValue < MIN_AMOUNT) {
        setAmountError(`Le montant minimum est de ${formatAmount(MIN_AMOUNT)} XOF`)
      } else if (numValue > MAX_AMOUNT) {
        setAmountError(`Le montant maximum est de ${formatAmount(MAX_AMOUNT)} XOF`)
      } else {
        setAmountError('')
      }
    } else {
      setSelectedAmount(0)
      setAmountError('')
    }
  }

  const proceedToPayment = () => {
    if (selectedAmount >= MIN_AMOUNT && selectedAmount <= MAX_AMOUNT) {
      setStep('payment')
    }
  }

  const handlePaymentSubmit = async () => {
    try {
      await dispatch(rechargeWallet({
        amount: selectedAmount,
        paymentMethod: selectedMethod,
        phone: phoneNumber || undefined,
      })).unwrap()

      // Refresh wallet to get updated balance
      await dispatch(fetchWallet())

      setStep('success')
      showSuccess('Recharge initiée', 'Finalisez l\'opération depuis votre mobile money.')
    } catch (error: any) {
      showError('Erreur de paiement', error?.message ?? 'Une erreur est survenue lors de la recharge.')
    }
  }

  const handleGoBack = useCallback(() => {
    if (step === 'payment') {
      setStep('amount')
    } else if (step === 'success') {
      navigation.goBack()
    } else {
      navigation.goBack()
    }
  }, [step, navigation])

  const resetAndTopUpAgain = () => {
    setSelectedAmount(0)
    setCustomAmountInput('')
    setAmountError('')
    setPhoneNumber('')
    setStep('amount')
  }

  const goToWallet = () => {
    navigation.goBack()
  }

  // Step 1: Amount Selection
  const renderAmountStep = () => (
    <ScrollView style={styles.stepContent} showsVerticalScrollIndicator={false}>
      {/* Current Balance */}
      <Card variant="elevated" style={styles.balanceCard}>
        <View style={styles.balanceRow}>
          <View>
            <Typography variant="caption" color="secondary">
              Solde actuel
            </Typography>
            <Typography variant="h2" weight="bold">
              {formatCurrency(currentBalance)} <Typography variant="caption">XOF</Typography>
            </Typography>
          </View>
          <View style={[styles.balanceIcon, { backgroundColor: `${theme.colors.success}20` }]}>
            <Ionicons name="wallet" size={24} color={theme.colors.success} />
          </View>
        </View>
      </Card>

      {/* Quick Amount Buttons */}
      <View style={styles.section}>
        <Typography variant="body" weight="semibold" style={styles.sectionTitle}>
          Montants rapides
        </Typography>
        <View style={styles.presetsGrid}>
          {PRESET_AMOUNTS.map((amount) => (
            <TouchableOpacity
              key={amount}
              style={[
                styles.presetButton,
                {
                  borderColor: selectedAmount === amount ? theme.colors.primary[500] : theme.colors.border,
                  backgroundColor: selectedAmount === amount
                    ? `${theme.colors.primary[500]}15`
                    : theme.colors.surface,
                },
              ]}
              onPress={() => selectPreset(amount)}
            >
              <Typography
                variant="body"
                weight="semibold"
                style={{
                  color: selectedAmount === amount ? theme.colors.primary[600] : theme.colors.text,
                }}
              >
                {formatAmount(amount)}
              </Typography>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Custom Amount */}
      <View style={styles.section}>
        <Typography variant="body" weight="semibold" style={styles.sectionTitle}>
          Ou entrez un montant personnalisé
        </Typography>
        <View style={[styles.customInputContainer, { borderColor: theme.colors.border }]}>
          <TextInput
            style={[styles.customInput, { color: theme.colors.text }]}
            value={customAmountInput}
            onChangeText={handleCustomAmount}
            placeholder="5000"
            placeholderTextColor={theme.colors.textSecondary}
            keyboardType="numeric"
          />
          <Typography variant="body" color="secondary">
            XOF
          </Typography>
        </View>
        {amountError ? (
          <Typography variant="caption" style={{ color: theme.colors.error, marginTop: 4 }}>
            {amountError}
          </Typography>
        ) : (
          <Typography variant="caption" color="secondary" style={{ marginTop: 4 }}>
            Minimum : {formatAmount(MIN_AMOUNT)} XOF • Maximum : {formatAmount(MAX_AMOUNT)} XOF
          </Typography>
        )}
      </View>

      {/* Amount Summary */}
      {selectedAmount > 0 && selectedAmount >= MIN_AMOUNT && selectedAmount <= MAX_AMOUNT && (
        <Card
          variant="elevated"
          style={[styles.summaryCard, { backgroundColor: `${theme.colors.primary[500]}10` }]}
        >
          <View style={styles.summaryRow}>
            <Typography variant="body" color="secondary">
              Montant à recharger
            </Typography>
            <Typography variant="h3" weight="bold" style={{ color: theme.colors.primary[600] }}>
              {formatAmount(selectedAmount)} XOF
            </Typography>
          </View>
        </Card>
      )}

      {/* Continue Button */}
      <Button
        variant="primary"
        size="lg"
        fullWidth
        onPress={proceedToPayment}
        disabled={!selectedAmount || selectedAmount < MIN_AMOUNT || selectedAmount > MAX_AMOUNT}
        style={styles.continueButton}
      >
        <View style={styles.buttonContent}>
          <Typography variant="body" weight="semibold" style={{ color: '#fff' }}>
            Continuer
          </Typography>
          <Ionicons name="arrow-forward" size={20} color="#fff" style={{ marginLeft: 8 }} />
        </View>
      </Button>
    </ScrollView>
  )

  // Step 2: Payment Method Selection
  const renderPaymentStep = () => (
    <ScrollView style={styles.stepContent} showsVerticalScrollIndicator={false}>
      {/* Amount Summary */}
      <Card variant="elevated" style={styles.summaryCard}>
        <Typography variant="caption" color="secondary">
          Montant à recharger
        </Typography>
        <Typography variant="h2" weight="bold" style={{ color: theme.colors.primary[600] }}>
          {formatAmount(selectedAmount)} XOF
        </Typography>
      </Card>

      {/* Payment Methods */}
      <View style={styles.section}>
        <Typography variant="body" weight="semibold" style={styles.sectionTitle}>
          Choisissez votre moyen de paiement
        </Typography>
        <View style={styles.methodsContainer}>
          {paymentMethods.map((method) => (
            <TouchableOpacity
              key={method.id}
              style={[
                styles.methodCard,
                {
                  borderColor: selectedMethod === method.id ? theme.colors.primary[500] : theme.colors.border,
                  backgroundColor: selectedMethod === method.id
                    ? `${theme.colors.primary[500]}10`
                    : theme.colors.surface,
                },
              ]}
              onPress={() => setSelectedMethod(method.id)}
            >
              <View style={[styles.methodIcon, { backgroundColor: `${theme.colors.primary[500]}15` }]}>
                <Ionicons name={method.icon} size={24} color={theme.colors.primary[500]} />
              </View>
              <View style={styles.methodInfo}>
                <Typography variant="body" weight="semibold">
                  {method.label}
                </Typography>
                <Typography variant="caption" color="secondary">
                  {method.description}
                </Typography>
              </View>
              {selectedMethod === method.id && (
                <Ionicons name="checkmark-circle" size={24} color={theme.colors.primary[500]} />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Phone Number */}
      <View style={styles.section}>
        <Typography variant="body" weight="semibold" style={styles.sectionTitle}>
          Numéro Mobile Money
        </Typography>
        <PhoneInput
          value={phoneNumber}
          onChangeText={setPhoneNumber}
          placeholder="90 12 34 56"
          defaultCountryCode="+228"
        />
        <Typography variant="caption" color="secondary" style={{ marginTop: 4 }}>
          Entrez le numéro associé à votre compte Mobile Money
        </Typography>
      </View>

      {/* Submit Button */}
      <Button
        variant="primary"
        size="lg"
        fullWidth
        onPress={handlePaymentSubmit}
        disabled={rechargeLoading}
        style={styles.continueButton}
      >
        {rechargeLoading ? (
          <View style={styles.buttonContent}>
            <ActivityIndicator size="small" color="#fff" />
            <Typography variant="body" weight="semibold" style={{ color: '#fff', marginLeft: 8 }}>
              Traitement...
            </Typography>
          </View>
        ) : (
          <View style={styles.buttonContent}>
            <Typography variant="body" weight="semibold" style={{ color: '#fff' }}>
              Payer {formatAmount(selectedAmount)} XOF
            </Typography>
          </View>
        )}
      </Button>
    </ScrollView>
  )

  // Step 3: Success
  const renderSuccessStep = () => (
    <ScrollView style={styles.stepContent} contentContainerStyle={styles.successContent}>
      {/* Success Icon */}
      <View style={[styles.successIcon, { backgroundColor: `${theme.colors.success}20` }]}>
        <Ionicons name="checkmark-circle" size={60} color={theme.colors.success} />
      </View>

      <Typography variant="h2" weight="bold" style={styles.successTitle}>
        Recharge initiée !
      </Typography>
      <Typography variant="body" color="secondary" style={styles.successDescription}>
        Votre demande de recharge de {formatAmount(selectedAmount)} XOF a été envoyée.
        Finalisez l'opération depuis votre application Mobile Money.
      </Typography>

      {/* Balance Summary */}
      <Card variant="elevated" style={styles.balanceSummaryCard}>
        <View style={styles.balanceSummaryRow}>
          <Typography variant="caption" color="secondary">
            Ancien solde
          </Typography>
          <Typography variant="body">
            {formatCurrency(previousBalance)} XOF
          </Typography>
        </View>
        <View style={styles.balanceSummaryRow}>
          <Typography variant="caption" color="secondary">
            Recharge
          </Typography>
          <Typography variant="body" style={{ color: theme.colors.success }}>
            +{formatCurrency(selectedAmount)} XOF
          </Typography>
        </View>
        <View style={[styles.balanceSummaryDivider, { borderColor: theme.colors.border }]} />
        <View style={styles.balanceSummaryRow}>
          <Typography variant="body" weight="semibold">
            Nouveau solde (après confirmation)
          </Typography>
          <Typography variant="h3" weight="bold" style={{ color: theme.colors.primary[600] }}>
            {formatCurrency(newBalance)} XOF
          </Typography>
        </View>
      </Card>

      {/* Actions */}
      <View style={styles.successActions}>
        <Button
          variant="primary"
          size="lg"
          fullWidth
          onPress={goToWallet}
        >
          Voir mon portefeuille
        </Button>
        <Button
          variant="secondary"
          size="lg"
          fullWidth
          onPress={resetAndTopUpAgain}
          style={{ marginTop: 12 }}
        >
          Faire une autre recharge
        </Button>
      </View>
    </ScrollView>
  )

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar
        backgroundColor={theme.colors.surface}
        barStyle={theme.isDark ? 'light-content' : 'dark-content'}
      />

      {/* Header */}
      <View
        style={[
          styles.header,
          {
            paddingTop: insets.top + 8,
            backgroundColor: theme.colors.surface,
            borderBottomColor: theme.colors.border,
          },
        ]}
      >
        <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Typography variant="h3" weight="semibold">
          Recharger mon portefeuille
        </Typography>
        <View style={{ width: 40 }} />
      </View>

      {/* Progress Indicator */}
      {step !== 'success' && (
        <View style={[styles.progressContainer, { backgroundColor: theme.colors.surface }]}>
          <View style={styles.progressSteps}>
            {['Montant', 'Paiement'].map((label, index) => {
              const stepIndex = index
              const currentStepIndex = step === 'amount' ? 0 : 1
              const isActive = stepIndex <= currentStepIndex

              return (
                <View key={label} style={styles.progressStep}>
                  <View
                    style={[
                      styles.progressDot,
                      {
                        backgroundColor: isActive ? theme.colors.primary[500] : theme.colors.border,
                      },
                    ]}
                  >
                    {stepIndex < currentStepIndex ? (
                      <Ionicons name="checkmark" size={12} color="#fff" />
                    ) : (
                      <Typography
                        variant="caption"
                        weight="bold"
                        style={{ color: isActive ? '#fff' : theme.colors.textSecondary }}
                      >
                        {stepIndex + 1}
                      </Typography>
                    )}
                  </View>
                  <Typography
                    variant="caption"
                    weight={isActive ? 'semibold' : 'regular'}
                    style={{ color: isActive ? theme.colors.text : theme.colors.textSecondary }}
                  >
                    {label}
                  </Typography>
                </View>
              )
            })}
          </View>
        </View>
      )}

      {/* Content */}
      {step === 'amount' && renderAmountStep()}
      {step === 'payment' && renderPaymentStep()}
      {step === 'success' && renderSuccessStep()}

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
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  progressContainer: {
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  progressSteps: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 48,
  },
  progressStep: {
    alignItems: 'center',
    gap: 4,
  },
  progressDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepContent: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  balanceCard: {
    marginBottom: 24,
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  balanceIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    marginBottom: 12,
  },
  presetsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  presetButton: {
    width: '30%',
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
  },
  customInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  customInput: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
  },
  summaryCard: {
    marginBottom: 24,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  continueButton: {
    marginBottom: 24,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  methodsContainer: {
    gap: 12,
  },
  methodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
  },
  methodIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  methodInfo: {
    flex: 1,
    marginLeft: 12,
  },
  successContent: {
    alignItems: 'center',
    paddingTop: 40,
  },
  successIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  successTitle: {
    marginBottom: 8,
    textAlign: 'center',
  },
  successDescription: {
    textAlign: 'center',
    marginBottom: 32,
    paddingHorizontal: 16,
  },
  balanceSummaryCard: {
    width: '100%',
    marginBottom: 32,
  },
  balanceSummaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  balanceSummaryDivider: {
    borderTopWidth: 1,
    marginVertical: 8,
  },
  successActions: {
    width: '100%',
  },
})

export default WalletTopUpScreen
