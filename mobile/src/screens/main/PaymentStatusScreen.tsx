import React, { useEffect, useState, useRef, useCallback } from 'react'
import {
  View,
  StyleSheet,
  StatusBar,
  ActivityIndicator,
  Animated,
  Easing,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'

import { useTheme } from '../../theme'
import { Typography, Button, Card } from '../../components/2025'
import { formatCurrency } from '../../utils/currencyHelpers'
import paymentService from '../../services/paymentService'
import { Payment, MobileMoneyProvider } from '../../types'
import { useToast } from '../../contexts/ToastContext'
import { useHaptics } from '../../hooks/useHaptics'

type PaymentStatusParams = {
  paymentId: number
  reservationId: number
  provider: MobileMoneyProvider
  amount: number
  reservationCode: string
}

type PaymentState = 'pending' | 'success' | 'failed' | 'timeout'

const PaymentStatusScreen = ({ navigation, route }: { navigation: any; route: any }) => {
  const params = route.params as PaymentStatusParams
  const { paymentId, reservationId, provider, amount, reservationCode } = params
  const theme = useTheme()
  const insets = useSafeAreaInsets()
  const { showSuccess, showError } = useToast()
  const haptics = useHaptics()

  const [paymentState, setPaymentState] = useState<PaymentState>('pending')
  const [payment, setPayment] = useState<Payment | null>(null)
  const [elapsedTime, setElapsedTime] = useState(0)
  const spinAnim = useRef(new Animated.Value(0)).current
  const stopPollingRef = useRef<(() => void) | null>(null)

  // Spinner animation for pending state
  useEffect(() => {
    if (paymentState === 'pending') {
      const spin = Animated.loop(
        Animated.timing(spinAnim, {
          toValue: 1,
          duration: 1500,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      )
      spin.start()
      return () => spin.stop()
    }
  }, [paymentState, spinAnim])

  // Timer for elapsed time
  useEffect(() => {
    if (paymentState !== 'pending') return

    const timer = setInterval(() => {
      setElapsedTime(prev => prev + 1)
    }, 1000)

    return () => clearInterval(timer)
  }, [paymentState])

  // Start polling for payment status
  useEffect(() => {
    const stopPolling = paymentService.pollPaymentStatus(
      paymentId,
      (updatedPayment, isComplete) => {
        setPayment(updatedPayment)

        if (isComplete) {
          if (updatedPayment.status === 'success') {
            setPaymentState('success')
            haptics.success()
          } else {
            setPaymentState('failed')
            haptics.error()
          }
        }
      },
      () => {
        // Timeout
        setPaymentState('timeout')
        haptics.error()
      },
      (error) => {
        // Error during polling - continue but log
        console.warn('Payment polling error:', error)
      }
    )

    stopPollingRef.current = stopPolling

    return () => {
      stopPolling()
    }
  }, [paymentId, haptics])

  const handleGoToReservation = useCallback(() => {
    // Stop polling if still active
    stopPollingRef.current?.()
    navigation.replace('ReservationDetails', { reservationId })
  }, [navigation, reservationId])

  const handleGoBack = useCallback(() => {
    stopPollingRef.current?.()
    navigation.goBack()
  }, [navigation])

  const handleRetry = useCallback(() => {
    // For retry, go back to cart to try again
    stopPollingRef.current?.()
    navigation.navigate('Cart')
  }, [navigation])

  const instructions = paymentService.getPaymentInstructions(provider, amount)
  const providerInfo = paymentService.getProviderById(provider)
  const formattedTime = `${Math.floor(elapsedTime / 60)}:${(elapsedTime % 60).toString().padStart(2, '0')}`

  const spinInterpolate = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  })

  const renderPendingState = () => (
    <>
      <View style={styles.statusIconContainer}>
        <Animated.View style={{ transform: [{ rotate: spinInterpolate }] }}>
          <View style={[styles.spinnerOuter, { borderColor: theme.colors.primary[100] }]}>
            <View style={[styles.spinnerInner, { borderTopColor: theme.colors.primary[500] }]} />
          </View>
        </Animated.View>
      </View>

      <Typography variant="h2" weight="bold" style={styles.statusTitle}>
        Paiement en cours...
      </Typography>

      <Typography variant="body" color="secondary" style={styles.statusSubtitle}>
        {providerInfo?.name || 'Mobile Money'}
      </Typography>

      <View style={[styles.amountContainer, { backgroundColor: theme.colors.primary[50] }]}>
        <Typography variant="h1" weight="bold" color="primary">
          {formatCurrency(amount)}
        </Typography>
      </View>

      <Card style={styles.instructionsCard}>
        <Typography variant="body" weight="semibold" style={{ marginBottom: 12 }}>
          Instructions
        </Typography>
        {instructions.map((instruction, index) => (
          <View key={index} style={styles.instructionRow}>
            <View style={[styles.instructionBullet, { backgroundColor: theme.colors.primary[500] }]}>
              <Typography variant="caption" style={{ color: 'white', fontWeight: 'bold' }}>
                {index + 1}
              </Typography>
            </View>
            <Typography variant="body" color="secondary" style={{ flex: 1 }}>
              {instruction}
            </Typography>
          </View>
        ))}
      </Card>

      <View style={styles.timerContainer}>
        <Ionicons name="time-outline" size={20} color={theme.colors.neutral[400]} />
        <Typography variant="caption" color="secondary">
          Temps d'attente: {formattedTime}
        </Typography>
      </View>

      <Typography variant="caption" color="secondary" style={styles.helpText}>
        Ne fermez pas cette page. Le statut sera mis à jour automatiquement
        dès que vous aurez validé le paiement sur votre téléphone.
      </Typography>
    </>
  )

  const renderSuccessState = () => (
    <>
      <View style={[styles.statusIconContainer, { backgroundColor: theme.colors.success + '20' }]}>
        <Ionicons name="checkmark-circle" size={80} color={theme.colors.success} />
      </View>

      <Typography variant="h2" weight="bold" style={styles.statusTitle}>
        Paiement confirmé !
      </Typography>

      <Typography variant="body" color="secondary" style={styles.statusSubtitle}>
        Votre réservation #{reservationCode} est validée
      </Typography>

      <View style={[styles.amountContainer, { backgroundColor: theme.colors.success + '15' }]}>
        <Typography variant="h1" weight="bold" style={{ color: theme.colors.success }}>
          {formatCurrency(amount)}
        </Typography>
      </View>

      <Card style={styles.successCard}>
        <View style={styles.successRow}>
          <Ionicons name="receipt-outline" size={24} color={theme.colors.primary[500]} />
          <View style={{ flex: 1 }}>
            <Typography variant="body" weight="semibold">
              Réservation confirmée
            </Typography>
            <Typography variant="caption" color="secondary">
              Vous pouvez récupérer votre commande chez le commerçant
            </Typography>
          </View>
        </View>
      </Card>

      <Button
        variant="primary"
        size="lg"
        fullWidth
        onPress={handleGoToReservation}
        style={{ marginTop: 24 }}
      >
        Voir ma réservation
      </Button>
    </>
  )

  const renderFailedState = () => (
    <>
      <View style={[styles.statusIconContainer, { backgroundColor: theme.colors.error + '20' }]}>
        <Ionicons name="close-circle" size={80} color={theme.colors.error} />
      </View>

      <Typography variant="h2" weight="bold" style={styles.statusTitle}>
        Paiement échoué
      </Typography>

      <Typography variant="body" color="secondary" style={styles.statusSubtitle}>
        Le paiement n'a pas pu être effectué
      </Typography>

      <Card style={[styles.errorCard, { borderColor: theme.colors.error }]}>
        <Typography variant="body" style={{ color: theme.colors.error }}>
          {payment?.status === 'cancelled'
            ? 'Le paiement a été annulé'
            : payment?.status === 'expired'
            ? 'Le délai de paiement a expiré'
            : 'Une erreur est survenue lors du paiement'}
        </Typography>
      </Card>

      <View style={styles.buttonRow}>
        <Button
          variant="secondary"
          size="lg"
          onPress={handleGoBack}
          style={{ flex: 1 }}
        >
          Retour
        </Button>
        <Button
          variant="primary"
          size="lg"
          onPress={handleRetry}
          style={{ flex: 1 }}
        >
          Réessayer
        </Button>
      </View>
    </>
  )

  const renderTimeoutState = () => (
    <>
      <View style={[styles.statusIconContainer, { backgroundColor: theme.colors.warning + '20' }]}>
        <Ionicons name="time" size={80} color={theme.colors.warning} />
      </View>

      <Typography variant="h2" weight="bold" style={styles.statusTitle}>
        Délai dépassé
      </Typography>

      <Typography variant="body" color="secondary" style={styles.statusSubtitle}>
        Nous n'avons pas reçu de confirmation de paiement
      </Typography>

      <Card style={styles.infoCard}>
        <Typography variant="body" color="secondary">
          Si vous avez validé le paiement sur votre téléphone, il peut arriver
          que la confirmation prenne plus de temps. Vérifiez vos réservations
          dans quelques minutes.
        </Typography>
      </Card>

      <View style={styles.buttonRow}>
        <Button
          variant="secondary"
          size="lg"
          onPress={handleGoToReservation}
          style={{ flex: 1 }}
        >
          Voir réservation
        </Button>
        <Button
          variant="primary"
          size="lg"
          onPress={handleRetry}
          style={{ flex: 1 }}
        >
          Réessayer
        </Button>
      </View>
    </>
  )

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar barStyle={theme.isDark ? 'light-content' : 'dark-content'} />

      <View style={[styles.content, { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 20 }]}>
        {paymentState === 'pending' && renderPendingState()}
        {paymentState === 'success' && renderSuccessState()}
        {paymentState === 'failed' && renderFailedState()}
        {paymentState === 'timeout' && renderTimeoutState()}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  statusIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  spinnerOuter: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  spinnerInner: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: 'transparent',
    position: 'absolute',
  },
  statusTitle: {
    textAlign: 'center',
    marginBottom: 8,
  },
  statusSubtitle: {
    textAlign: 'center',
    marginBottom: 24,
  },
  amountContainer: {
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 16,
    marginBottom: 24,
  },
  instructionsCard: {
    width: '100%',
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
  },
  instructionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    gap: 12,
  },
  instructionBullet: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  helpText: {
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  successCard: {
    width: '100%',
    padding: 16,
    borderRadius: 16,
  },
  successRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  errorCard: {
    width: '100%',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 24,
  },
  infoCard: {
    width: '100%',
    padding: 16,
    borderRadius: 16,
    marginBottom: 24,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
    marginTop: 24,
  },
})

export default PaymentStatusScreen
