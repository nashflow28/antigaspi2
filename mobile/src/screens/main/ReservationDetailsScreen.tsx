import React, { useEffect, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Alert,
} from 'react-native'
import { useDispatch, useSelector } from 'react-redux'
import { AppDispatch, RootState } from '../../store'
import { fetchReservation, cancelReservation } from '../../store/slices/reservationsSlice'
import { useToast } from '../../contexts/ToastContext'
import { Ionicons } from '@expo/vector-icons'
import { Image } from 'expo-image'
import { Reservation } from '../../types'
import { useTheme } from '../../theme'
import { getImageUrl } from '../../utils/imageHelpers'
import { formatCurrency } from '../../utils/currencyHelpers'
import { Button, Card, Badge, Typography } from '../../components/2025'

interface Props {
  route: any
  navigation: any
}

const ReservationDetailsScreen: React.FC<Props> = ({ route, navigation }) => {
  const dispatch = useDispatch<AppDispatch>()
  const theme = useTheme()
  const { reservationId } = route.params
  const { showSuccess, showError } = useToast()

  const [reservation, setReservation] = useState<Reservation | null>(null)
  const [loading, setLoading] = useState(true)
  const [cancelling, setCancelling] = useState(false)

  useEffect(() => {
    loadReservation()
  }, [reservationId])

  const loadReservation = async () => {
    try {
      setLoading(true)
      const result = await dispatch(fetchReservation(reservationId))
      if (fetchReservation.fulfilled.match(result)) {
        setReservation(result.payload as Reservation)
      }
    } catch (error: any) {
      showError('Impossible de charger la réservation')
      navigation.goBack()
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    Alert.alert(
      'Annuler la réservation',
      'Êtes-vous sûr de vouloir annuler cette réservation ?',
      [
        { text: 'Non', style: 'cancel' },
        {
          text: 'Oui, annuler',
          style: 'destructive',
          onPress: async () => {
            setCancelling(true)
            try {
              await dispatch(cancelReservation(reservationId))
              showSuccess('Réservation annulée avec succès')
              navigation.goBack() // Retour à l'écran précédent au lieu de navigate
            } catch (error) {
              showError('Impossible d\'annuler la réservation')
            } finally {
              setCancelling(false)
            }
          },
        },
      ],
    )
  }

  if (loading || !reservation) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.colors.background, alignItems: 'center', justifyContent: 'center' }}>
        <Typography variant="body">Chargement...</Typography>
      </View>
    )
  }

  const unitPrice = reservation.product.discounted_price
    ? (typeof reservation.product.discounted_price === 'number'
        ? Math.round(reservation.product.discounted_price || 0)
        : Math.round(parseFloat(reservation.product.discounted_price) || 0))
    : 0
  const totalPrice = unitPrice * reservation.quantity

  const styles = createStyles(theme)

  return (
    <View style={styles.container}>
      <StatusBar barStyle={theme.isDark ? 'light-content' : 'dark-content'} />

      <ScrollView style={styles.scrollView}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
          </TouchableOpacity>
          <Typography variant="h3" weight="semibold" style={{ flex: 1, textAlign: 'center' }}>
            Détails de la réservation
          </Typography>
          <View style={{ width: 24 }} />
        </View>

        {/* Product Info */}
        <Card variant="elevated" style={{ margin: 16 }}>
          <View style={styles.productCard}>
            <Image
              source={{ uri: getImageUrl(reservation.product.image_url) }}
              style={styles.productImage}
              contentFit="cover"
            />
            <View style={styles.productInfo}>
              <Typography variant="body" weight="semibold" numberOfLines={2} style={{ marginBottom: 4 }}>
                {reservation.product.name}
              </Typography>
              <Typography variant="body" color="secondary">
                {reservation.product.merchant?.name}
              </Typography>
            </View>
          </View>
        </Card>

        {/* Reservation Details */}
        <Card variant="elevated" style={{ margin: 16, padding: 16 }}>
          <Typography variant="h4" weight="bold" style={{ marginBottom: 16 }}>
            Informations de réservation
          </Typography>

          <View style={styles.detailRow}>
            <Ionicons name="cube-outline" size={20} color={theme.colors.textSecondary} />
            <Typography variant="body" color="secondary" style={{ flex: 1 }}>
              Quantité :
            </Typography>
            <Typography variant="body" weight="semibold">
              {reservation.quantity}
            </Typography>
          </View>

          <View style={styles.detailRow}>
            <Ionicons name="cash-outline" size={20} color={theme.colors.textSecondary} />
            <Typography variant="body" color="secondary" style={{ flex: 1 }}>
              Prix unitaire :
            </Typography>
            <Typography variant="body" weight="semibold">
              {formatCurrency(unitPrice)}
            </Typography>
          </View>

          <View style={styles.detailRow}>
            <Ionicons name="wallet-outline" size={20} color={theme.colors.textSecondary} />
            <Typography variant="body" color="secondary" style={{ flex: 1 }}>
              Total :
            </Typography>
            <Typography variant="h4" weight="bold" color="primary">
              {formatCurrency(totalPrice)}
            </Typography>
          </View>

          <View style={styles.detailRow}>
            <Ionicons name="card-outline" size={20} color={theme.colors.textSecondary} />
            <Typography variant="body" color="secondary" style={{ flex: 1 }}>
              Paiement :
            </Typography>
            <Typography variant="body" weight="semibold">
              {reservation.latest_payment?.payment_method === 'on_site' || !reservation.latest_payment
                ? 'Sur place'
                : 'En ligne'}
            </Typography>
          </View>

        </Card>

        {/* Timeline des étapes - NOUVELLE SECTION */}
        <Card variant="elevated" style={{ margin: 16, padding: 16 }}>
          <Typography variant="h4" weight="bold" style={{ marginBottom: 16 }}>
            Suivi de la réservation
          </Typography>

          {/* Étape 1: Réservation créée */}
          <View style={styles.timelineStep}>
            <View style={[styles.timelineDot, { backgroundColor: theme.colors.success }]}>
              <Ionicons name="checkmark" size={16} color={theme.colors.textInverse} />
            </View>
            <View style={styles.timelineContent}>
              <Typography variant="body" weight="semibold">Réservation créée</Typography>
              <Typography variant="caption" color="secondary">
                {new Date(reservation.created_at || new Date()).toLocaleDateString('fr-FR', {
                  day: 'numeric',
                  month: 'long',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </Typography>
            </View>
          </View>

          {/* Ligne de connexion */}
          {['confirmed', 'ready', 'completed'].includes(reservation.status) && (
            <View style={[styles.timelineLine, { backgroundColor: theme.colors.success }]} />
          )}
          {reservation.status === 'pending' && (
            <View style={[styles.timelineLine, { backgroundColor: theme.colors.neutral[200] }]} />
          )}

          {/* Étape 2: Confirmation commerçant */}
          <View style={styles.timelineStep}>
            <View style={[
              styles.timelineDot,
              { backgroundColor: ['confirmed', 'ready', 'completed'].includes(reservation.status) ? theme.colors.success : reservation.status === 'pending' ? theme.colors.warning : theme.colors.neutral[300] }
            ]}>
              {['confirmed', 'ready', 'completed'].includes(reservation.status) ? (
                <Ionicons name="checkmark" size={16} color={theme.colors.textInverse} />
              ) : reservation.status === 'pending' ? (
                <Ionicons name="time" size={16} color={theme.colors.textInverse} />
              ) : (
                <Ionicons name="close" size={16} color={theme.colors.textInverse} />
              )}
            </View>
            <View style={styles.timelineContent}>
              <Typography variant="body" weight="semibold">
                {['confirmed', 'ready', 'completed'].includes(reservation.status) ? '✓ Confirmé par le commerçant' : reservation.status === 'pending' ? '⏳ En attente de confirmation' : '✗ Non confirmé'}
              </Typography>
              {reservation.confirmed_at && (
                <Typography variant="caption" color="secondary">
                  {new Date(reservation.confirmed_at).toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'long',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </Typography>
              )}
              {!reservation.confirmed_at && reservation.status === 'pending' && (
                <Typography variant="caption" style={{ color: theme.colors.warning }}>
                  Le commerçant va confirmer votre réservation sous peu
                </Typography>
              )}
            </View>
          </View>

          {/* Ligne de connexion */}
          {['ready', 'completed'].includes(reservation.status) && (
            <View style={[styles.timelineLine, { backgroundColor: theme.colors.success }]} />
          )}
          {['pending', 'confirmed'].includes(reservation.status) && (
            <View style={[styles.timelineLine, { backgroundColor: theme.colors.neutral[200] }]} />
          )}

          {/* Étape 3: Produit retiré */}
          <View style={styles.timelineStep}>
            <View style={[
              styles.timelineDot,
              { backgroundColor: reservation.status === 'completed' ? theme.colors.success : ['ready'].includes(reservation.status) ? theme.colors.primary[500] : theme.colors.neutral[300] }
            ]}>
              {reservation.status === 'completed' ? (
                <Ionicons name="checkmark" size={16} color={theme.colors.textInverse} />
              ) : ['ready'].includes(reservation.status) ? (
                <Ionicons name="cube" size={16} color={theme.colors.textInverse} />
              ) : (
                <Ionicons name="cube-outline" size={16} color={theme.colors.textInverse} />
              )}
            </View>
            <View style={styles.timelineContent}>
              <Typography variant="body" weight="semibold">
                {reservation.status === 'completed' ? '✓ Produit retiré' : ['ready'].includes(reservation.status) ? '📍 Prêt pour retrait' : 'Retrait en attente'}
              </Typography>
              {reservation.completed_at && (
                <Typography variant="caption" color="secondary">
                  {new Date(reservation.completed_at).toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'long',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </Typography>
              )}
              {reservation.status === 'ready' && (
                <Typography variant="caption" style={{ color: theme.colors.primary[600] }}>
                  Présentez votre code QR au commerçant
                </Typography>
              )}
            </View>
          </View>

          {/* Badge de statut global */}
          <View style={{ marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: theme.colors.border }}>
            <Badge
              variant={
                reservation.status === 'pending' ? 'warning' :
                reservation.status === 'confirmed' ? 'success' :
                reservation.status === 'ready' ? 'primary' :
                reservation.status === 'completed' ? 'success' :
                reservation.status === 'cancelled' ? 'error' :
                reservation.status === 'expired' ? 'error' : 'neutral'
              }
              size="md"
              style={{ alignSelf: 'center' }}
            >
              {reservation.status === 'pending' ? '⏳ Confirmation commerçant' :
                reservation.status === 'confirmed' ? '✓ Confirmée - À retirer' :
                reservation.status === 'ready' ? '✓ Prête pour retrait' :
                reservation.status === 'completed' ? '✓ Produit retiré' :
                reservation.status === 'cancelled' ? '✗ Annulée' :
                reservation.status === 'expired' ? '✗ Expirée' : reservation.status}
            </Badge>
          </View>
        </Card>

        {/* Actions */}
        {(reservation.status === 'pending' || reservation.status === 'confirmed') && (
          <View style={{ margin: 16 }}>
            <Button
              variant="destructive"
              size="md"
              onPress={handleCancel}
              disabled={cancelling}
              leftIcon={<Ionicons name="close-circle-outline" size={20} color={theme.colors.error} />}
              style={{ width: '100%' }}
            >
              {cancelling ? 'Annulation...' : 'Annuler la réservation'}
            </Button>
          </View>
        )}
      </ScrollView>
    </View>
  )
}

const createStyles = (theme: ReturnType<typeof useTheme>) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  productCard: {
    flexDirection: 'row',
    padding: 12,
  },
  productImage: {
    width: 100,
    height: 100,
    borderRadius: 8,
    marginRight: 12,
  },
  productInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  // Timeline styles
  timelineStep: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  timelineDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  timelineLine: {
    width: 2,
    height: 40,
    marginLeft: 15,
    marginVertical: 4,
  },
  timelineContent: {
    flex: 1,
    paddingBottom: 4,
  },
})

export default ReservationDetailsScreen
