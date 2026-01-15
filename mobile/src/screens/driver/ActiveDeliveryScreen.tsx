import React, { useEffect, useCallback, useState, useRef } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Linking,
  Platform,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  AppState,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useNavigation, useRoute } from '@react-navigation/native'
import { useDispatch, useSelector } from 'react-redux'
import * as Location from 'expo-location'
import { useTheme } from '../../theme'
import { useHaptics } from '../../hooks/useHaptics'
import { RootState, AppDispatch } from '../../store'
import {
  fetchActiveDelivery,
  startPickup,
  confirmPickup,
  startDeliveryTrip,
  completeDelivery,
  reportDeliveryFailure,
  cancelDriverDelivery,
  updateDriverLocation,
} from '../../store/slices/driverSlice'
import LoadingSpinner from '../../components/LoadingSpinner'

const ActiveDeliveryScreen: React.FC = () => {
  const theme = useTheme()
  const haptics = useHaptics()
  const navigation = useNavigation<any>()
  const route = useRoute<any>()
  const dispatch = useDispatch<AppDispatch>()

  const [loading, setLoading] = useState(false)

  // Cross-platform prompt modal state
  const [promptVisible, setPromptVisible] = useState(false)
  const [promptTitle, setPromptTitle] = useState('')
  const [promptMessage, setPromptMessage] = useState('')
  const [promptValue, setPromptValue] = useState('')
  const [promptAction, setPromptAction] = useState<'report' | 'cancel' | null>(null)

  const { activeDelivery, deliveriesLoading } = useSelector((state: RootState) => state.driver)
  const delivery = activeDelivery

  const locationSubscription = useRef<Location.LocationSubscription | null>(null)
  const appState = useRef(AppState.currentState)

  useEffect(() => {
    dispatch(fetchActiveDelivery())
  }, [dispatch])

  // Driver location tracking
  useEffect(() => {
    const startLocationTracking = async () => {
      // Only track when driver has an active delivery in progress
      const activeStatuses = ['picking_up', 'picked_up', 'delivering']
      if (!delivery || !activeStatuses.includes(delivery.status)) {
        return
      }

      try {
        const { status } = await Location.requestForegroundPermissionsAsync()
        if (status !== 'granted') {
          console.warn('Location permission not granted')
          return
        }

        // Start watching location
        locationSubscription.current = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.High,
            timeInterval: 10000, // 10 seconds
            distanceInterval: 50, // 50 meters
          },
          (location) => {
            // Send location update to backend
            dispatch(updateDriverLocation({
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
              speed: location.coords.speed,
              heading: location.coords.heading,
              accuracy: location.coords.accuracy,
            }))
          }
        )
      } catch (err) {
        console.error('Location tracking error:', err)
      }
    }

    startLocationTracking()

    // Cleanup on unmount
    return () => {
      if (locationSubscription.current) {
        locationSubscription.current.remove()
        locationSubscription.current = null
      }
    }
  }, [delivery?.id, delivery?.status, dispatch])

  // Pause/resume tracking based on app state
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        // App came to foreground - refresh data
        dispatch(fetchActiveDelivery())
      }
      appState.current = nextAppState
    })

    return () => subscription.remove()
  }, [dispatch])

  const openNavigation = (latitude: number, longitude: number, label: string) => {
    const scheme = Platform.select({ ios: 'maps:', android: 'geo:' })
    const url = Platform.select({
      ios: `maps:?daddr=${latitude},${longitude}&dirflg=d`,
      android: `google.navigation:q=${latitude},${longitude}`,
    })
    Linking.openURL(url || `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`)
  }

  const callRecipient = () => {
    if (delivery?.recipient_phone) {
      Linking.openURL(`tel:${delivery.recipient_phone}`)
    }
  }

  const handleStartPickup = async () => {
    if (!delivery) return
    setLoading(true)
    haptics.mediumTap()
    try {
      await dispatch(startPickup(delivery.id)).unwrap()
      haptics.success()
    } catch (err: any) {
      haptics.error()
      Alert.alert('Erreur', err || 'Impossible de démarrer')
    }
    setLoading(false)
  }

  const handleConfirmPickup = async () => {
    if (!delivery) return
    setLoading(true)
    haptics.mediumTap()
    try {
      await dispatch(confirmPickup(delivery.id)).unwrap()
      haptics.success()
    } catch (err: any) {
      haptics.error()
      Alert.alert('Erreur', err || 'Impossible de confirmer')
    }
    setLoading(false)
  }

  const handleStartDelivery = async () => {
    if (!delivery) return
    setLoading(true)
    haptics.mediumTap()
    try {
      await dispatch(startDeliveryTrip(delivery.id)).unwrap()
      haptics.success()
    } catch (err: any) {
      haptics.error()
      Alert.alert('Erreur', err || 'Impossible de démarrer')
    }
    setLoading(false)
  }

  const handleComplete = async () => {
    if (!delivery) return

    Alert.alert(
      'Confirmer la livraison',
      'Confirmez-vous avoir livré le colis au destinataire?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Confirmer',
          onPress: async () => {
            setLoading(true)
            haptics.mediumTap()
            try {
              await dispatch(completeDelivery({ deliveryId: delivery.id, data: {} })).unwrap()
              haptics.success()
              Alert.alert(
                'Livraison terminée!',
                `Commission: ${formatCurrency(delivery.driver_commission)}`,
                [{ text: 'OK', onPress: () => navigation.goBack() }]
              )
            } catch (err: any) {
              haptics.error()
              Alert.alert('Erreur', err || 'Impossible de compléter')
            }
            setLoading(false)
          },
        },
      ]
    )
  }

  const handleReportFailure = () => {
    if (!delivery) return
    setPromptTitle('Signaler un problème')
    setPromptMessage('Décrivez le problème rencontré:')
    setPromptValue('')
    setPromptAction('report')
    setPromptVisible(true)
  }

  const handleCancel = () => {
    if (!delivery) return

    if (!['assigned', 'picking_up'].includes(delivery.status)) {
      Alert.alert('Impossible', 'Vous ne pouvez plus annuler après avoir récupéré le colis.')
      return
    }

    setPromptTitle('Annuler la livraison')
    setPromptMessage("Indiquez la raison de l'annulation:")
    setPromptValue('')
    setPromptAction('cancel')
    setPromptVisible(true)
  }

  const handlePromptSubmit = async () => {
    if (!delivery || !promptAction) return

    if (!promptValue.trim()) {
      Alert.alert('Erreur', promptAction === 'report' ? 'Veuillez décrire le problème' : 'Veuillez indiquer une raison')
      return
    }

    setPromptVisible(false)
    setLoading(true)

    try {
      if (promptAction === 'report') {
        await dispatch(reportDeliveryFailure({ deliveryId: delivery.id, reason: promptValue.trim() })).unwrap()
        Alert.alert('Signalé', 'Le problème a été signalé', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ])
      } else if (promptAction === 'cancel') {
        await dispatch(cancelDriverDelivery({ deliveryId: delivery.id, reason: promptValue.trim() })).unwrap()
        Alert.alert('Annulée', 'La livraison a été annulée', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ])
      }
    } catch (err: any) {
      Alert.alert('Erreur', err || (promptAction === 'report' ? 'Impossible de signaler' : "Impossible d'annuler"))
    }

    setLoading(false)
    setPromptAction(null)
  }

  const handlePromptCancel = () => {
    setPromptVisible(false)
    setPromptValue('')
    setPromptAction(null)
  }

  if (deliveriesLoading && !delivery) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <LoadingSpinner />
      </SafeAreaView>
    )
  }

  if (!delivery) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.emptyState}>
          <Ionicons name="bicycle-outline" size={64} color={theme.colors.neutral[300]} />
          <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>
            Aucune livraison active
          </Text>
          <TouchableOpacity
            style={[styles.backButton, { backgroundColor: theme.colors.primary[500] }]}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>Retour</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    )
  }

  const renderActionButton = () => {
    switch (delivery.status) {
      case 'assigned':
        return (
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: theme.colors.primary[500] }]}
            onPress={handleStartPickup}
            disabled={loading}
          >
            <Ionicons name="navigate" size={24} color="white" />
            <Text style={styles.actionButtonText}>
              En route vers le commerçant
            </Text>
          </TouchableOpacity>
        )
      case 'picking_up':
        return (
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: theme.colors.success }]}
            onPress={handleConfirmPickup}
            disabled={loading}
          >
            <Ionicons name="checkmark-circle" size={24} color="white" />
            <Text style={styles.actionButtonText}>
              J'ai récupéré le colis
            </Text>
          </TouchableOpacity>
        )
      case 'picked_up':
        return (
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: theme.colors.primary[500] }]}
            onPress={handleStartDelivery}
            disabled={loading}
          >
            <Ionicons name="navigate" size={24} color="white" />
            <Text style={styles.actionButtonText}>
              En route vers le client
            </Text>
          </TouchableOpacity>
        )
      case 'delivering':
        return (
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: theme.colors.success }]}
            onPress={handleComplete}
            disabled={loading}
          >
            <Ionicons name="checkmark-done" size={24} color="white" />
            <Text style={styles.actionButtonText}>
              Livraison effectuée
            </Text>
          </TouchableOpacity>
        )
      default:
        return null
    }
  }

  const getTargetLocation = () => {
    if (['assigned', 'picking_up'].includes(delivery.status)) {
      return { lat: delivery.pickup_latitude, lng: delivery.pickup_longitude, address: delivery.pickup_address }
    }
    return { lat: delivery.delivery_latitude, lng: delivery.delivery_longitude, address: delivery.delivery_address }
  }

  const target = getTargetLocation()

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.colors.cardBackground }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
          Livraison #{delivery.delivery_code}
        </Text>
        <TouchableOpacity
          onPress={() => navigation.navigate('DeliveryMap', { deliveryId: delivery.id })}
        >
          <Ionicons name="map" size={24} color={theme.colors.primary[500]} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Status */}
        <View style={[styles.statusCard, { backgroundColor: theme.colors.primary[100] }]}>
          <Text style={[styles.statusText, { color: theme.colors.primary[700] }]}>
            {getStatusLabel(delivery.status)}
          </Text>
        </View>

        {/* Target destination */}
        <View style={[styles.destinationCard, { backgroundColor: theme.colors.cardBackground }]}>
          <Text style={[styles.destinationLabel, { color: theme.colors.textSecondary }]}>
            {['assigned', 'picking_up'].includes(delivery.status) ? 'Récupération' : 'Livraison'}
          </Text>
          <Text style={[styles.destinationAddress, { color: theme.colors.text }]}>
            {target.address}
          </Text>
          <TouchableOpacity
            style={[styles.navigateButton, { backgroundColor: theme.colors.primary[500] }]}
            onPress={() => openNavigation(target.lat, target.lng, target.address)}
          >
            <Ionicons name="navigate" size={20} color="white" />
            <Text style={styles.navigateButtonText}>Naviguer</Text>
          </TouchableOpacity>
        </View>

        {/* Recipient info */}
        <View style={[styles.recipientCard, { backgroundColor: theme.colors.cardBackground }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Destinataire</Text>
          <View style={styles.recipientRow}>
            <View style={styles.recipientInfo}>
              <Text style={[styles.recipientName, { color: theme.colors.text }]}>
                {delivery.recipient_name}
              </Text>
              <Text style={[styles.recipientPhone, { color: theme.colors.textSecondary }]}>
                {delivery.recipient_phone}
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.callButton, { backgroundColor: theme.colors.success }]}
              onPress={callRecipient}
            >
              <Ionicons name="call" size={20} color="white" />
            </TouchableOpacity>
          </View>
          {delivery.delivery_instructions && (
            <View style={[styles.instructionsBox, { backgroundColor: theme.colors.surface.light }]}>
              <Text style={[styles.instructionsTitle, { color: theme.colors.textSecondary }]}>
                Instructions:
              </Text>
              <Text style={[styles.instructionsText, { color: theme.colors.text }]}>
                {delivery.delivery_instructions}
              </Text>
            </View>
          )}
        </View>

        {/* Earnings */}
        <View style={[styles.earningsCard, { backgroundColor: theme.colors.cardBackground }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Votre gain</Text>
          <Text style={[styles.earningsAmount, { color: theme.colors.success }]}>
            {formatCurrency(delivery.driver_commission)}
          </Text>
        </View>

        {/* Action button */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <LoadingSpinner />
          </View>
        ) : (
          renderActionButton()
        )}

        {/* Secondary actions */}
        <View style={styles.secondaryActions}>
          {['assigned', 'picking_up'].includes(delivery.status) && (
            <TouchableOpacity
              style={[styles.secondaryButton, { borderColor: theme.colors.error }]}
              onPress={handleCancel}
            >
              <Text style={[styles.secondaryButtonText, { color: theme.colors.error }]}>
                Annuler la livraison
              </Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[styles.secondaryButton, { borderColor: theme.colors.warning }]}
            onPress={handleReportFailure}
          >
            <Text style={[styles.secondaryButtonText, { color: theme.colors.warning }]}>
              Signaler un problème
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Cross-platform prompt modal */}
      <Modal
        visible={promptVisible}
        transparent
        animationType="fade"
        onRequestClose={handlePromptCancel}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={[styles.modalContent, { backgroundColor: theme.colors.cardBackground }]}>
            <Text style={[styles.modalTitle, { color: theme.colors.text }]}>{promptTitle}</Text>
            <Text style={[styles.modalMessage, { color: theme.colors.textSecondary }]}>{promptMessage}</Text>
            <TextInput
              style={[
                styles.modalInput,
                {
                  backgroundColor: theme.colors.background,
                  color: theme.colors.text,
                  borderColor: theme.colors.border,
                },
              ]}
              value={promptValue}
              onChangeText={setPromptValue}
              placeholder="Entrez votre texte..."
              placeholderTextColor={theme.colors.textTertiary}
              multiline
              numberOfLines={3}
              autoFocus
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: theme.colors.neutral[200] }]}
                onPress={handlePromptCancel}
              >
                <Text style={[styles.modalButtonText, { color: theme.colors.text }]}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalButton,
                  { backgroundColor: promptAction === 'cancel' ? theme.colors.error : theme.colors.primary[500] },
                ]}
                onPress={handlePromptSubmit}
              >
                <Text style={[styles.modalButtonText, { color: 'white' }]}>
                  {promptAction === 'cancel' ? 'Annuler livraison' : 'Signaler'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  )
}

const getStatusLabel = (status: string): string => {
  const labels: Record<string, string> = {
    assigned: 'Livraison assignée',
    picking_up: 'En route vers le commerçant',
    picked_up: 'Colis récupéré',
    delivering: 'En route vers le client',
    delivered: 'Livrée',
  }
  return labels[status] || status
}

const formatCurrency = (amount: number): string => {
  if (!amount) return '0 XOF'
  return new Intl.NumberFormat('fr-FR', {
    style: 'decimal',
    maximumFractionDigits: 0,
  }).format(amount) + ' XOF'
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  statusCard: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
  },
  destinationCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  destinationLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  destinationAddress: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 12,
  },
  navigateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
  },
  navigateButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  recipientCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
  },
  recipientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  recipientInfo: {
    flex: 1,
  },
  recipientName: {
    fontSize: 16,
    fontWeight: '500',
  },
  recipientPhone: {
    fontSize: 14,
    marginTop: 2,
  },
  callButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  instructionsBox: {
    marginTop: 12,
    padding: 12,
    borderRadius: 8,
  },
  instructionsTitle: {
    fontSize: 12,
    marginBottom: 4,
  },
  instructionsText: {
    fontSize: 14,
  },
  earningsCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  earningsAmount: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  loadingContainer: {
    padding: 20,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  actionButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
  secondaryActions: {
    marginBottom: 32,
  },
  secondaryButton: {
    padding: 14,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    marginBottom: 8,
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 24,
  },
  backButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 16,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  modalMessage: {
    fontSize: 14,
    marginBottom: 16,
  },
  modalInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    minHeight: 80,
    textAlignVertical: 'top',
    fontSize: 14,
  },
  modalButtons: {
    flexDirection: 'row',
    marginTop: 16,
    gap: 12,
  },
  modalButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
})

export default ActiveDeliveryScreen
