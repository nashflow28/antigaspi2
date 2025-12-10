import React from 'react'
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
  Platform,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useNavigation } from '@react-navigation/native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useTheme } from '../../theme'
import { useNotificationPreferences } from '../../hooks/useNotificationPreferences'

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
  const insets = useSafeAreaInsets()
  const {
    preferences,
    loading,
    saving,
    error,
    lastSyncedAt,
    hasChanges,
    togglePreference,
    refresh,
    save,
  } = useNotificationPreferences()

  const isInitialLoading = loading && lastSyncedAt === null

  const handleSave = async () => {
    try {
      await save()

      Alert.alert('Succès', 'Préférences mises à jour avec succès', [
        {
          text: 'OK',
          onPress: () => {
            if (navigation.canGoBack()) {
              navigation.goBack()
            } else {
              (navigation as any).navigate('Dashboard')
            }
          },
        },
      ])
    } catch (error: any) {
      const message =
        error instanceof Error ? error.message : 'Impossible de sauvegarder les préférences'
      Alert.alert('Erreur', message)
    }
  }

  if (isInitialLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary[500]} />
      </View>
    )
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar barStyle={theme.isDark ? "light-content" : "dark-content"} backgroundColor={theme.colors.background} />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.isDark ? '#0F1622' : theme.colors.primary[500], paddingTop: insets.top + 12 }]}>
        <TouchableOpacity onPress={() => {
          if (navigation.canGoBack()) {
            navigation.goBack()
          } else {
            (navigation as any).navigate('Dashboard')
          }
        }} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.isDark ? '#E9EDF5' : 'white'} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.isDark ? '#F8FAFF' : 'white' }]}>Paramètres notifications</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={loading && lastSyncedAt !== null}
            onRefresh={refresh}
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
              <TouchableOpacity onPress={refresh} style={styles.retryButton}>
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
            onPress={refresh}
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
        <View style={[styles.preferenceCard, { backgroundColor: theme.colors.cardBackground, borderColor: theme.colors.cardBorder, borderWidth: 1 }]}>
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
                ? (theme.isDark ? '#10B981' : theme.colors.primary[500])
                : (theme.isDark ? theme.withOpacity('#10B981', 0.4) : theme.withOpacity(theme.colors.primary[500], 0.4)),
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
