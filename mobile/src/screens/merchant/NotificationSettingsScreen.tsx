import React, { useState, useEffect, useMemo, useCallback } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StatusBar,
  RefreshControl,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useNavigation } from '@react-navigation/native'
import { useTheme } from '../../theme'
import notificationService, {
  NotificationChannelPreferences,
} from '../../services/notificationService'
import { useAppDispatch, useAppSelector } from '../../store/hooks'
import { refreshProfile } from '../../store/slices/authSlice'

const DEFAULT_PREFERENCES: NotificationChannelPreferences = {
  email: true,
  sms: false,
  push: true,
}

const formatDateTime = (date: Date | null): string => {
  if (!date) {
    return 'Jamais synchronisé'
  }

  try {
    return new Intl.DateTimeFormat('fr-FR', {
      dateStyle: 'short',
      timeStyle: 'short',
    }).format(date)
  } catch (error) {
    return date.toLocaleString()
  }
}

const NotificationSettingsScreen: React.FC = () => {
  const theme = useTheme()
  const navigation = useNavigation()
  const dispatch = useAppDispatch()
  const user = useAppSelector((state) => state.auth.user)

  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [preferences, setPreferences] = useState<NotificationChannelPreferences>(
    DEFAULT_PREFERENCES
  )
  const [initialPreferences, setInitialPreferences] =
    useState<NotificationChannelPreferences>(DEFAULT_PREFERENCES)
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null)
  const [error, setError] = useState<string | null>(null)

  const loadPreferences = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const remotePreferences = await notificationService.loadContactPreferences()

      setPreferences(remotePreferences)
      setInitialPreferences(remotePreferences)
      setLastSyncedAt(new Date())

      await dispatch(refreshProfile()).unwrap()
    } catch (error) {
      console.error('Erreur chargement préférences:', error)
      setError(
        error instanceof Error
          ? error.message
          : "Impossible de récupérer vos préférences pour le moment."
      )
    } finally {
      setLoading(false)
    }
  }, [dispatch])

  useEffect(() => {
    loadPreferences()
  }, [loadPreferences])

  useEffect(() => {
    const handleExternalUpdate = (updated: NotificationChannelPreferences) => {
      setPreferences(updated)
      setInitialPreferences(updated)
      setLastSyncedAt(new Date())
    }

    notificationService.on('contactPreferencesChanged', handleExternalUpdate)

    return () => {
      notificationService.off('contactPreferencesChanged', handleExternalUpdate)
    }
  }, [])

  useEffect(() => {
    if (!user) {
      return
    }

    const syncedPreferences: NotificationChannelPreferences = {
      email: user.prefers_email_notifications ?? DEFAULT_PREFERENCES.email,
      sms: user.prefers_sms_notifications ?? DEFAULT_PREFERENCES.sms,
      push: user.prefers_push_notifications ?? DEFAULT_PREFERENCES.push,
    }

    setPreferences(syncedPreferences)
    setInitialPreferences(syncedPreferences)
  }, [user])

  const hasChanges = useMemo(() => {
    return (
      preferences.email !== initialPreferences.email ||
      preferences.sms !== initialPreferences.sms ||
      preferences.push !== initialPreferences.push
    )
  }, [preferences, initialPreferences])

  const handleSave = async () => {
    try {
      setSaving(true)
      setError(null)

      const updated = await notificationService.saveContactPreferences(preferences)

      setPreferences(updated)
      setInitialPreferences(updated)
      setLastSyncedAt(new Date())

      await dispatch(refreshProfile()).unwrap()

      Alert.alert('Succès', 'Préférences mises à jour avec succès', [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ])
    } catch (error: any) {
      console.error('Erreur sauvegarde préférences:', error)
      const message =
        error instanceof Error
          ? error.message
          : error?.response?.data?.message ||
            'Impossible de sauvegarder les préférences'
      setError(message)
      Alert.alert('Erreur', message)
    } finally {
      setSaving(false)
    }
  }

  const togglePreference = (key: keyof NotificationChannelPreferences) => {
    setPreferences((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary[500]} />
      </View>
    )
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar barStyle="dark-content" backgroundColor={theme.colors.background} />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.colors.primary[500] }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Paramètres notifications</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={loadPreferences}
            tintColor={theme.colors.primary[600]}
            colors={[theme.colors.primary[500]]}
          />
        }
      >
        {/* Info */}
        <View style={[styles.infoCard, { backgroundColor: theme.withOpacity(theme.colors.primary[500], 0.1) }]}>
          <Ionicons name="information-circle" size={24} color={theme.colors.primary[500]} />
          <Text style={[styles.infoText, { color: theme.colors.primary[700] }]}>
            Choisissez comment vous souhaitez recevoir les notifications importantes de votre commerce.
          </Text>
        </View>

        {error && (
          <View style={[styles.errorCard, { backgroundColor: theme.withOpacity(theme.colors.semantic.error, 0.08) }]}>
            <Ionicons name="warning" size={22} color={theme.colors.semantic.error} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.errorTitle, { color: theme.colors.semantic.error }]}>Synchronisation impossible</Text>
              <Text style={[styles.errorMessage, { color: theme.colors.textSecondary }]}>{error}</Text>
              <TouchableOpacity onPress={loadPreferences} style={styles.retryButton}>
                <Text style={[styles.retryText, { color: theme.colors.semantic.error }]}>Réessayer</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <View style={styles.statusRow}>
          <View>
            <Text style={[styles.statusLabel, { color: theme.colors.textSecondary }]}>Dernière synchronisation</Text>
            <Text style={[styles.statusValue, { color: theme.colors.text }]}>{formatDateTime(lastSyncedAt)}</Text>
          </View>
          <TouchableOpacity
            style={[styles.refreshButton, { borderColor: theme.colors.primary[500] }]}
            onPress={loadPreferences}
            disabled={loading}
          >
            <Ionicons
              name="refresh"
              size={18}
              color={loading ? theme.colors.neutral[400] : theme.colors.primary[600]}
            />
            <Text
              style={[
                styles.refreshButtonText,
                { color: loading ? theme.colors.neutral[400] : theme.colors.primary[600] },
              ]}
            >
              Actualiser
            </Text>
          </TouchableOpacity>
        </View>

        {/* Preferences */}
        <View style={[styles.preferenceCard, { backgroundColor: theme.colors.surface.light }]}>
          {/* Email */}
          <View style={styles.preferenceRow}>
            <View style={styles.preferenceLeft}>
              <View style={[styles.preferenceIcon, { backgroundColor: theme.withOpacity(theme.colors.primary[500], 0.1) }]}>
                <Ionicons name="mail-outline" size={24} color={theme.colors.primary[500]} />
              </View>
              <View style={styles.preferenceInfo}>
                <Text style={[styles.preferenceTitle, { color: theme.colors.text }]}>
                  Notifications par email
                </Text>
                <Text style={[styles.preferenceDescription, { color: theme.colors.textSecondary }]}>
                  Recevoir les alertes importantes par email
                </Text>
              </View>
            </View>
            <Switch
              value={preferences.email}
              onValueChange={() => togglePreference('email')}
              disabled={saving}
              trackColor={{
                false: theme.colors.neutral[200],
                true: theme.colors.primary[400],
              }}
              thumbColor={preferences.email ? theme.colors.primary[600] : theme.colors.neutral[50]}
            />
          </View>

          <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />

          {/* SMS */}
          <View style={styles.preferenceRow}>
            <View style={styles.preferenceLeft}>
              <View style={[styles.preferenceIcon, { backgroundColor: theme.withOpacity(theme.colors.primary[500], 0.1) }]}>
                <Ionicons name="chatbox-outline" size={24} color={theme.colors.primary[500]} />
              </View>
              <View style={styles.preferenceInfo}>
                <Text style={[styles.preferenceTitle, { color: theme.colors.text }]}>
                  Notifications par SMS
                </Text>
                <Text style={[styles.preferenceDescription, { color: theme.colors.textSecondary }]}>
                  Recevoir les alertes urgentes par SMS
                </Text>
              </View>
            </View>
            <Switch
              value={preferences.sms}
              onValueChange={() => togglePreference('sms')}
              disabled={saving}
              trackColor={{
                false: theme.colors.neutral[200],
                true: theme.colors.primary[400],
              }}
              thumbColor={preferences.sms ? theme.colors.primary[600] : theme.colors.neutral[50]}
            />
          </View>

          <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />

          {/* Push */}
          <View style={styles.preferenceRow}>
            <View style={styles.preferenceLeft}>
              <View style={[styles.preferenceIcon, { backgroundColor: theme.withOpacity(theme.colors.primary[500], 0.1) }]}>
                <Ionicons name="notifications-outline" size={24} color={theme.colors.primary[500]} />
              </View>
              <View style={styles.preferenceInfo}>
                <Text style={[styles.preferenceTitle, { color: theme.colors.text }]}>
                  Notifications push
                </Text>
                <Text style={[styles.preferenceDescription, { color: theme.colors.textSecondary }]}>
                  Recevoir les notifications dans l'application
                </Text>
              </View>
            </View>
            <Switch
              value={preferences.push}
              onValueChange={() => togglePreference('push')}
              disabled={saving}
              trackColor={{
                false: theme.colors.neutral[200],
                true: theme.colors.primary[400],
              }}
              thumbColor={preferences.push ? theme.colors.primary[600] : theme.colors.neutral[50]}
            />
          </View>
        </View>

        {/* Save button */}
        <TouchableOpacity
          style={[
            styles.saveButton,
            {
              backgroundColor: hasChanges
                ? theme.colors.primary[500]
                : theme.withOpacity(theme.colors.primary[500], 0.4),
            },
          ]}
          onPress={handleSave}
          disabled={saving || !hasChanges}
        >
          {saving ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={24} color="white" />
              <Text style={styles.saveButtonText}>Enregistrer les préférences</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  infoCard: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    gap: 12,
  },
  errorCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    gap: 12,
  },
  errorTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  errorMessage: {
    fontSize: 13,
    lineHeight: 18,
  },
  retryButton: {
    alignSelf: 'flex-start',
    paddingVertical: 6,
  },
  retryText: {
    fontSize: 13,
    fontWeight: '600',
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusLabel: {
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  statusValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    gap: 8,
  },
  refreshButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  preferenceCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  preferenceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  preferenceLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 16,
  },
  preferenceIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  preferenceInfo: {
    flex: 1,
  },
  preferenceTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  preferenceDescription: {
    fontSize: 13,
    lineHeight: 18,
  },
  divider: {
    height: 1,
    marginVertical: 8,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    marginTop: 8,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
})

export default NotificationSettingsScreen
