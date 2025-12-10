import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  Platform,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useNavigation } from '@react-navigation/native'
import { useTheme } from '../../theme'
import { Card, Typography, Badge, Button } from '../../components/2025'
import { apiService } from '../../services/api'
import type {
  LoyaltyPoint,
  LoyaltyPointsSummary
} from '../../types'
import { TEST_IDS } from '../../utils/testIds'

const pointLabels: Record<string, string> = {
  purchase: 'Achat',
  review: 'Avis',
  referral: 'Parrainage',
  bonus: 'Bonus',
  redemption: 'Échange'
}

const pointIcons: Record<string, keyof typeof Ionicons.glyphMap> = {
  purchase: 'cart',
  review: 'chatbubbles',
  referral: 'people',
  bonus: 'gift',
  redemption: 'wallet'
}

const createStyles = (theme: ReturnType<typeof useTheme>) =>
  StyleSheet.create({
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
    container: {
      flexGrow: 1,
      padding: theme.spacing.lg,
      backgroundColor: theme.colors.background
    },
    section: {
      marginBottom: theme.spacing.lg
    },
    manualCard: {
      marginTop: theme.spacing.lg
    },
    input: {
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: theme.radius.xl,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
      backgroundColor: theme.colors.surface.light,
      color: theme.colors.text,
      fontSize: theme.typography.fontSize.body.size
    },
    errorText: {
      color: theme.colors.error,
      marginTop: theme.spacing.xs
    },
    helperText: {
      color: theme.colors.textSecondary,
      marginTop: theme.spacing.xs
    },
    manualActions: {
      marginTop: theme.spacing.md
    },
    breakdownRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: theme.spacing.xs,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.colors.divider
    },
    historyItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: theme.spacing.sm,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.colors.divider
    },
    historyDescription: {
      flex: 1,
      marginHorizontal: theme.spacing.md
    },
    emptyState: {
      alignItems: 'center',
      paddingVertical: theme.spacing.xl
    },
    loader: {
      paddingVertical: theme.spacing.xl,
      alignItems: 'center'
    }
  })

const formatPoints = (value: number): string =>
  new Intl.NumberFormat('fr-FR').format(value)

const formatDate = (date: string): string =>
  new Date(date).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })

const LoyaltyScreen: React.FC = () => {
  const theme = useTheme()
  const navigation = useNavigation()
  const styles = useMemo(() => createStyles(theme), [theme])
  const [summary, setSummary] = useState<LoyaltyPointsSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [manualPoints, setManualPoints] = useState('')
  const [description, setDescription] = useState('')
  const [redeemLoading, setRedeemLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const manualPointsValue = useMemo(() => {
    if (!manualPoints) {
      return NaN
    }

    const parsed = Number.parseInt(manualPoints, 10)
    return Number.isNaN(parsed) ? NaN : parsed
  }, [manualPoints])

  const manualValidationMessage = useMemo(() => {
    if (!manualPoints) {
      return ''
    }

    if (Number.isNaN(manualPointsValue)) {
      return 'Veuillez saisir un nombre de points valide.'
    }

    if (manualPointsValue <= 0) {
      return 'Le nombre de points doit être supérieur à 0.'
    }

    if (summary && manualPointsValue > summary.total_points) {
      return 'Vous ne disposez pas d\'assez de points pour cet échange.'
    }

    return ''
  }, [manualPoints, manualPointsValue, summary])

  const manualPreview = useMemo(() => {
    if (!manualPoints) {
      return 'Saisissez le nombre de points à échanger pour calculer le solde restant.'
    }

    if (Number.isNaN(manualPointsValue)) {
      return 'Le nombre de points doit être un entier positif.'
    }

    const remaining = Math.max((summary?.total_points ?? 0) - manualPointsValue, 0)
    return `Il vous restera ${formatPoints(remaining)} point(s) après l'échange.`
  }, [manualPoints, manualPointsValue, summary])

  const fetchPoints = useCallback(async (withLoader = false) => {
    if (withLoader) {
      setLoading(true)
    }

    try {
      setErrorMessage(null)
      const response = await apiService.getLoyaltyPoints()
      setSummary(response.data)
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Impossible de récupérer vos points de fidélité pour le moment."
      setErrorMessage(message)
      Alert.alert('Erreur', message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchPoints(true)
  }, [fetchPoints])

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await fetchPoints()
    setRefreshing(false)
  }, [fetchPoints])

  const handleRedeem = useCallback(async () => {
    if (manualValidationMessage) {
      Alert.alert('Échange impossible', manualValidationMessage)
      return
    }

    if (Number.isNaN(manualPointsValue) || manualPointsValue <= 0) {
      Alert.alert('Échange impossible', 'Veuillez saisir un nombre de points valide.')
      return
    }

    setRedeemLoading(true)

    try {
      await apiService.redeemLoyaltyPoints({
        points: manualPointsValue,
        description: description.trim() || `Échange manuel de ${manualPointsValue} points`
      })

      setDescription('')
      setManualPoints('')
      await fetchPoints()
      Alert.alert('Succès', 'Vos points ont bien été échangés !')
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Impossible d'échanger vos points pour le moment. Réessayez plus tard."
      Alert.alert('Erreur', message)
    } finally {
      setRedeemLoading(false)
    }
  }, [description, fetchPoints, manualPointsValue, manualValidationMessage])

  const renderHistoryItem = (entry: LoyaltyPoint) => {
    const iconName = pointIcons[entry.earned_from] || 'star'
    const isPositive = entry.points >= 0

    return (
      <View key={entry.id} style={styles.historyItem}>
        <Ionicons
          name={isPositive ? iconName : 'remove-circle'}
          size={22}
          color={isPositive ? theme.colors.success : theme.colors.error}
        />
        <View style={styles.historyDescription}>
          <Typography variant="body" weight="medium">
            {entry.description}
          </Typography>
          <Typography variant="caption" color="secondary">
            {formatDate(entry.created_at)}
          </Typography>
        </View>
        <Typography
          variant="body"
          weight="semibold"
          color={isPositive ? 'success' : 'error'}
        >
          {isPositive ? '+' : ''}{entry.points}
        </Typography>
      </View>
    )
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <StatusBar barStyle="light-content" />

      {/* Header avec bouton retour */}
      <View style={[styles.screenHeader, { backgroundColor: theme.colors.primary[500] }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Typography variant="h3" style={{ color: 'white', fontWeight: 'bold', flex: 1, textAlign: 'center' }}>
          Points de fidélité
        </Typography>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={{ backgroundColor: theme.colors.background }}
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.primary[500]}
          />
        }
        testID={TEST_IDS.loyaltyScreen}
      >
      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={theme.colors.primary[500]} />
        </View>
      ) : (
        <>
          <Card variant="elevated" style={styles.section}>
            <Typography variant="h2" weight="bold">
              {formatPoints(summary?.total_points ?? 0)} point(s)
            </Typography>
            <Typography variant="body" color="secondary">
              Total cumulé disponible
            </Typography>

            <View style={{ marginTop: theme.spacing.md, flexDirection: 'row', alignItems: 'center' }}>
              <Badge variant="info" size="sm">
                {summary?.expiring_soon ?? 0} point(s) expirent bientôt
              </Badge>
            </View>

            {errorMessage && (
              <Typography variant="caption" color="error" style={{ marginTop: theme.spacing.sm }}>
                {errorMessage}
              </Typography>
            )}
          </Card>

          <Card variant="flat" style={styles.section}>
            <Typography variant="h3" weight="semibold">
              Répartition des points
            </Typography>

            {summary?.breakdown?.length ? (
              summary.breakdown.map((item) => (
                <View key={item.earned_from} style={styles.breakdownRow}>
                  <Typography variant="body">
                    {pointLabels[item.earned_from] || item.earned_from}
                  </Typography>
                  <Typography variant="body" weight="semibold" color="primary">
                    {formatPoints(Number(item.total))}
                  </Typography>
                </View>
              ))
            ) : (
              <View style={styles.emptyState}>
                <Ionicons
                  name="hourglass"
                  size={28}
                  color={theme.colors.neutral[400]}
                />
                <Typography variant="body" color="secondary" style={{ marginTop: theme.spacing.sm }}>
                  Aucune statistique pour le moment.
                </Typography>
              </View>
            )}
          </Card>

          <Card variant="elevated" style={[styles.section, styles.manualCard]}>
            <Typography variant="h3" weight="semibold">
              Échange manuel
            </Typography>
            <Typography variant="body" color="secondary" style={{ marginTop: theme.spacing.xs }}>
              Convertissez une partie de vos points pour profiter d'une récompense personnalisée.
            </Typography>

            <View style={{ marginTop: theme.spacing.md }}>
              <Typography variant="caption" color="secondary">
                Nombre de points à échanger
              </Typography>
              <TextInput
                value={manualPoints}
                onChangeText={(value) => setManualPoints(value.replace(/[^0-9]/g, ''))}
                keyboardType="number-pad"
                placeholder="Ex. 50"
                style={styles.input}
                maxLength={4}
                accessibilityLabel="Nombre de points à échanger"
              />
              {manualValidationMessage ? (
                <Typography variant="caption" color="error" style={styles.errorText}>
                  {manualValidationMessage}
                </Typography>
              ) : (
                <Typography variant="caption" color="secondary" style={styles.helperText}>
                  {manualPreview}
                </Typography>
              )}
            </View>

            <View style={{ marginTop: theme.spacing.md }}>
              <Typography variant="caption" color="secondary">
                Description (optionnelle)
              </Typography>
              <TextInput
                value={description}
                onChangeText={setDescription}
                placeholder="Ex. Réduction chez Mon épicerie"
                style={[styles.input, { height: 48 }]}
                maxLength={120}
                accessibilityLabel="Description de l'échange"
              />
            </View>

            <View style={styles.manualActions}>
              <Button
                fullWidth
                onPress={handleRedeem}
                loading={redeemLoading}
                disabled={redeemLoading || !!manualValidationMessage || Number.isNaN(manualPointsValue)}
                accessibilityLabel="Valider l'échange de points"
                testID={TEST_IDS.loyaltyRedeemButton}
              >
                Échanger ces points
              </Button>
            </View>
          </Card>

          <Card variant="flat" style={styles.section}>
            <Typography variant="h3" weight="semibold">
              Activité récente
            </Typography>

            {summary?.recent_history?.length ? (
              summary.recent_history.slice(0, 10).map(renderHistoryItem)
            ) : (
              <View style={styles.emptyState}>
                <Ionicons
                  name="sparkles"
                  size={28}
                  color={theme.colors.neutral[400]}
                />
                <Typography variant="body" color="secondary" style={{ marginTop: theme.spacing.sm }}>
                  Aucune activité enregistrée pour l'instant.
                </Typography>
              </View>
            )}
          </Card>
        </>
      )}
      </ScrollView>
    </View>
  )
}

export default LoyaltyScreen
