import React, { useEffect, useState, useCallback } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Switch,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useNavigation, useRoute } from '@react-navigation/native'
import { useDispatch, useSelector } from 'react-redux'
import * as Location from 'expo-location'
import { useTheme } from '../../theme'
import { useHaptics } from '../../hooks/useHaptics'
import { RootState, AppDispatch } from '../../store'
import { estimateDelivery, requestDelivery, clearDeliveryError } from '../../store/slices/deliverySlice'
import LoadingSpinner from '../../components/LoadingSpinner'
import { createLogger } from '../../utils/logger'

const log = createLogger('DeliveryRequest')

/**
 * Normalize phone number to +228 format (Togo)
 */
const normalizePhone = (phone: string): string => {
  if (!phone) return ''
  // Remove spaces, dashes, parentheses
  let cleaned = phone.replace(/[\s\-()]/g, '')
  // If starts with 00, replace with +
  if (cleaned.startsWith('00')) {
    cleaned = '+' + cleaned.substring(2)
  }
  // If 8 digits without prefix, assume Togo
  if (/^\d{8}$/.test(cleaned)) {
    cleaned = '+228' + cleaned
  }
  // If starts with 228 without +, add +
  if (cleaned.startsWith('228') && !cleaned.startsWith('+')) {
    cleaned = '+' + cleaned
  }
  return cleaned
}

const DeliveryRequestScreen: React.FC = () => {
  const theme = useTheme()
  const haptics = useHaptics()
  const navigation = useNavigation<any>()
  const route = useRoute<any>()
  const dispatch = useDispatch<AppDispatch>()

  const { reservationId } = route.params || {}

  const { estimate, estimateLoading, requestLoading, error } = useSelector(
    (state: RootState) => state.delivery
  )
  const { user } = useSelector((state: RootState) => state.auth)

  const [deliveryAddress, setDeliveryAddress] = useState('')
  const [deliveryLatitude, setDeliveryLatitude] = useState<number | null>(null)
  const [deliveryLongitude, setDeliveryLongitude] = useState<number | null>(null)
  const [deliveryInstructions, setDeliveryInstructions] = useState('')
  const [recipientName, setRecipientName] = useState('')
  const [recipientPhone, setRecipientPhone] = useState('')
  const [useMyInfo, setUseMyInfo] = useState(false)
  const [useCurrentLocation, setUseCurrentLocation] = useState(false)
  const [locationLoading, setLocationLoading] = useState(false)

  // Handle "use my info" toggle
  const handleUseMyInfoToggle = useCallback((value: boolean) => {
    setUseMyInfo(value)
    haptics.lightTap()
    if (value && user) {
      // Pre-fill from user profile
      const fullName = [user.first_name, user.last_name].filter(Boolean).join(' ')
      setRecipientName(fullName || '')
      setRecipientPhone(normalizePhone(user.phone || ''))
    } else {
      // Clear fields
      setRecipientName('')
      setRecipientPhone('')
    }
  }, [user, haptics])

  useEffect(() => {
    if (error) {
      Alert.alert('Erreur', error)
      dispatch(clearDeliveryError())
    }
  }, [error, dispatch])

  const getCurrentLocation = useCallback(async () => {
    setLocationLoading(true)
    try {
      const { status } = await Location.requestForegroundPermissionsAsync()
      if (status !== 'granted') {
        Alert.alert('Permission refusée', "L'accès à la localisation est nécessaire")
        setLocationLoading(false)
        return
      }

      const location = await Location.getCurrentPositionAsync({})
      setDeliveryLatitude(location.coords.latitude)
      setDeliveryLongitude(location.coords.longitude)

      // Reverse geocoding to get address
      const addresses = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      })

      if (addresses.length > 0) {
        const addr = addresses[0]
        const addressParts = [
          addr.street,
          addr.streetNumber,
          addr.district,
          addr.city,
          addr.region,
        ].filter(Boolean)
        setDeliveryAddress(addressParts.join(', '))
      }

      setUseCurrentLocation(true)
      haptics.success()
    } catch (err) {
      log.error('Location error:', err)
      Alert.alert('Erreur', 'Impossible de récupérer votre position')
    }
    setLocationLoading(false)
  }, [haptics])

  const handleEstimate = useCallback(async () => {
    if (!deliveryLatitude || !deliveryLongitude) {
      Alert.alert('Erreur', 'Veuillez sélectionner une adresse de livraison')
      return
    }

    if (!reservationId) {
      Alert.alert('Erreur', 'Réservation non trouvée')
      return
    }

    haptics.mediumTap()
    await dispatch(estimateDelivery({
      reservation_id: reservationId,
      delivery_latitude: deliveryLatitude,
      delivery_longitude: deliveryLongitude,
    }))
  }, [dispatch, reservationId, deliveryLatitude, deliveryLongitude, haptics])

  const handleRequestDelivery = useCallback(async () => {
    if (!deliveryAddress || !deliveryLatitude || !deliveryLongitude) {
      Alert.alert('Erreur', 'Veuillez compléter votre adresse de livraison')
      return
    }

    if (!recipientName.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer le nom du destinataire')
      return
    }

    if (!recipientPhone.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer le numéro du destinataire')
      return
    }

    if (!reservationId) {
      Alert.alert('Erreur', 'Réservation non trouvée')
      return
    }

    haptics.mediumTap()

    try {
      const result = await dispatch(requestDelivery({
        reservation_id: reservationId,
        delivery_address: deliveryAddress,
        delivery_latitude: deliveryLatitude,
        delivery_longitude: deliveryLongitude,
        delivery_instructions: deliveryInstructions || undefined,
        recipient_name: recipientName.trim(),
        recipient_phone: normalizePhone(recipientPhone.trim()),
      })).unwrap()

      haptics.success()
      Alert.alert(
        'Livraison demandée',
        'Votre demande de livraison a été enregistrée. Un livreur sera bientôt assigné.',
        [
          {
            text: 'Suivre ma livraison',
            onPress: () => navigation.replace('DeliveryTracking', { deliveryId: result.id }),
          },
        ]
      )
    } catch (err: any) {
      haptics.error()
      Alert.alert('Erreur', err || 'Impossible de créer la demande de livraison')
    }
  }, [dispatch, reservationId, deliveryAddress, deliveryLatitude, deliveryLongitude, deliveryInstructions, recipientName, recipientPhone, navigation, haptics])

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.colors.cardBackground }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
          Demander une livraison
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Location Section */}
        <View style={[styles.section, { backgroundColor: theme.colors.cardBackground }]}>
          <View style={styles.sectionHeader}>
            <Ionicons name="location" size={20} color={theme.colors.primary[500]} />
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              Adresse de livraison
            </Text>
          </View>

          {/* Use current location button */}
          <TouchableOpacity
            style={[styles.locationButton, { borderColor: theme.colors.primary[500] }]}
            onPress={getCurrentLocation}
            disabled={locationLoading}
          >
            {locationLoading ? (
              <ActivityIndicator size="small" color={theme.colors.primary[500]} />
            ) : (
              <>
                <Ionicons name="navigate" size={20} color={theme.colors.primary[500]} />
                <Text style={[styles.locationButtonText, { color: theme.colors.primary[500] }]}>
                  Utiliser ma position actuelle
                </Text>
              </>
            )}
          </TouchableOpacity>

          {/* Address input */}
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: theme.colors.background,
                color: theme.colors.text,
                borderColor: theme.colors.border,
              },
            ]}
            value={deliveryAddress}
            onChangeText={setDeliveryAddress}
            placeholder="Entrez votre adresse de livraison"
            placeholderTextColor={theme.colors.textTertiary}
            multiline
          />

          {useCurrentLocation && deliveryLatitude && (
            <View style={[styles.coordinatesInfo, { backgroundColor: theme.colors.success + '20' }]}>
              <Ionicons name="checkmark-circle" size={16} color={theme.colors.success} />
              <Text style={[styles.coordinatesText, { color: theme.colors.success }]}>
                Position GPS enregistrée
              </Text>
            </View>
          )}

          {/* Use my info toggle */}
          {user && (
            <View style={[styles.useMyInfoRow, { borderColor: theme.colors.border }]}>
              <View style={styles.useMyInfoContent}>
                <Ionicons name="person" size={18} color={theme.colors.primary[500]} />
                <Text style={[styles.useMyInfoText, { color: theme.colors.text }]}>
                  Utiliser mes informations
                </Text>
              </View>
              <Switch
                value={useMyInfo}
                onValueChange={handleUseMyInfoToggle}
                trackColor={{ false: theme.colors.neutral[300], true: theme.colors.primary[300] }}
                thumbColor={useMyInfo ? theme.colors.primary[500] : theme.colors.neutral[100]}
              />
            </View>
          )}

          {/* Recipient info */}
          <Text style={[styles.label, { color: theme.colors.textSecondary }]}>
            Nom du destinataire *
          </Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: theme.colors.background,
                color: theme.colors.text,
                borderColor: theme.colors.border,
              },
            ]}
            value={recipientName}
            onChangeText={(text) => {
              setRecipientName(text)
              if (useMyInfo) setUseMyInfo(false) // Turn off toggle if user edits
            }}
            placeholder="Nom complet du destinataire"
            placeholderTextColor={theme.colors.textTertiary}
          />

          <Text style={[styles.label, { color: theme.colors.textSecondary }]}>
            Téléphone du destinataire *
          </Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: theme.colors.background,
                color: theme.colors.text,
                borderColor: theme.colors.border,
              },
            ]}
            value={recipientPhone}
            onChangeText={(text) => {
              setRecipientPhone(text)
              if (useMyInfo) setUseMyInfo(false) // Turn off toggle if user edits
            }}
            placeholder="+228 90 12 34 56"
            placeholderTextColor={theme.colors.textTertiary}
            keyboardType="phone-pad"
          />

          {/* Delivery instructions */}
          <Text style={[styles.label, { color: theme.colors.textSecondary }]}>
            Instructions de livraison (optionnel)
          </Text>
          <TextInput
            style={[
              styles.input,
              styles.notesInput,
              {
                backgroundColor: theme.colors.background,
                color: theme.colors.text,
                borderColor: theme.colors.border,
              },
            ]}
            value={deliveryInstructions}
            onChangeText={setDeliveryInstructions}
            placeholder="Ex: Sonner à la porte, appeler en arrivant..."
            placeholderTextColor={theme.colors.textTertiary}
            multiline
            numberOfLines={3}
          />
        </View>

        {/* Estimate button */}
        <TouchableOpacity
          style={[styles.estimateButton, { backgroundColor: theme.colors.accent.orange }]}
          onPress={handleEstimate}
          disabled={estimateLoading || !deliveryLatitude}
        >
          {estimateLoading ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <>
              <Ionicons name="calculator" size={20} color="white" />
              <Text style={styles.estimateButtonText}>Estimer le coût</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Estimate result */}
        {estimate && (
          <View style={[styles.estimateCard, { backgroundColor: theme.colors.cardBackground }]}>
            <Text style={[styles.estimateTitle, { color: theme.colors.text }]}>
              Estimation de livraison
            </Text>

            <View style={styles.estimateRow}>
              <Text style={[styles.estimateLabel, { color: theme.colors.textSecondary }]}>
                Distance
              </Text>
              <Text style={[styles.estimateValue, { color: theme.colors.text }]}>
                {estimate.distance_km.toFixed(1)} km
              </Text>
            </View>

            <View style={styles.estimateRow}>
              <Text style={[styles.estimateLabel, { color: theme.colors.textSecondary }]}>
                Durée estimée
              </Text>
              <Text style={[styles.estimateValue, { color: theme.colors.text }]}>
                {estimate.estimated_time_minutes} min
              </Text>
            </View>

            <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />

            <View style={styles.estimateRow}>
              <Text style={[styles.totalLabel, { color: theme.colors.text }]}>
                Frais de livraison
              </Text>
              <Text style={[styles.totalValue, { color: theme.colors.primary[500] }]}>
                {formatCurrency(estimate.delivery_fee)}
              </Text>
            </View>

            {estimate.free_delivery && (
              <View style={[styles.freeDeliveryBadge, { backgroundColor: theme.colors.success + '20' }]}>
                <Ionicons name="gift" size={16} color={theme.colors.success} />
                <Text style={[styles.freeDeliveryText, { color: theme.colors.success }]}>
                  Livraison gratuite pour cette commande!
                </Text>
              </View>
            )}

            {/* Unavailable warning */}
            {!estimate.is_available && (
              <View style={[styles.unavailableBadge, { backgroundColor: theme.colors.error + '20' }]}>
                <Ionicons name="warning" size={16} color={theme.colors.error} />
                <Text style={[styles.unavailableText, { color: theme.colors.error }]}>
                  {estimate.unavailable_message || 'Livraison non disponible pour cette zone'}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Submit button */}
        <TouchableOpacity
          style={[
            styles.submitButton,
            { backgroundColor: theme.colors.primary[500] },
            (!estimate || requestLoading || !estimate?.is_available) && styles.submitButtonDisabled,
          ]}
          onPress={handleRequestDelivery}
          disabled={!estimate || requestLoading || !estimate?.is_available}
        >
          {requestLoading ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <>
              <Ionicons name="bicycle" size={20} color="white" />
              <Text style={styles.submitButtonText}>Confirmer la livraison</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Info notice */}
        <View style={[styles.infoNotice, { backgroundColor: theme.colors.info + '20' }]}>
          <Ionicons name="information-circle" size={20} color={theme.colors.info} />
          <Text style={[styles.infoText, { color: theme.colors.textSecondary }]}>
            Un livreur sera automatiquement assigné à votre commande. Vous pourrez suivre sa position en temps réel.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const formatCurrency = (amount: number): string => {
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
  section: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 12,
  },
  locationButtonText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
  },
  label: {
    fontSize: 13,
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    fontSize: 14,
  },
  notesInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  coordinatesInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 6,
    marginTop: 8,
  },
  coordinatesText: {
    fontSize: 12,
    marginLeft: 6,
  },
  estimateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 10,
    marginBottom: 16,
  },
  estimateButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  estimateCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  estimateTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  estimateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  estimateLabel: {
    fontSize: 14,
  },
  estimateValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    marginVertical: 12,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  totalValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  freeDeliveryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 8,
    marginTop: 12,
  },
  freeDeliveryText: {
    fontSize: 13,
    fontWeight: '500',
    marginLeft: 8,
  },
  unavailableBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 8,
    marginTop: 12,
  },
  unavailableText: {
    fontSize: 13,
    fontWeight: '500',
    marginLeft: 8,
    flex: 1,
  },
  useMyInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    marginTop: 12,
    borderTopWidth: 1,
  },
  useMyInfoContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  useMyInfoText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  infoNotice: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: 10,
    marginBottom: 24,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    marginLeft: 10,
    lineHeight: 18,
  },
})

export default DeliveryRequestScreen
