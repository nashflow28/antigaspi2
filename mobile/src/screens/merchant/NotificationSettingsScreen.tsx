import React, { useState, useEffect } from 'react'
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
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useNavigation } from '@react-navigation/native'
import { useTheme } from '../../theme'
import apiService from '../../services/api'

interface NotificationPreferences {
  email: boolean
  sms: boolean
  push: boolean
}

const NotificationSettingsScreen: React.FC = () => {
  const theme = useTheme()
  const navigation = useNavigation()

  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    email: true,
    sms: true,
    push: true,
  })

  useEffect(() => {
    loadPreferences()
  }, [])

  const loadPreferences = async () => {
    try {
      setLoading(true)
      // Les préférences sont dans le profil utilisateur
      const response = await apiService.get('/auth/me')
      if (response.data.user) {
        setPreferences({
          email: response.data.user.prefers_email_notifications ?? true,
          sms: response.data.user.prefers_sms_notifications ?? true,
          push: response.data.user.prefers_push_notifications ?? true,
        })
      }
    } catch (error) {
      console.error('Erreur chargement préférences:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)

      const response = await apiService.patch('/notifications/preferences', preferences)

      if (response.data.success) {
        Alert.alert('Succès', 'Préférences mises à jour avec succès', [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ])
      }
    } catch (error: any) {
      console.error('Erreur sauvegarde préférences:', error)
      Alert.alert('Erreur', error.response?.data?.message || 'Impossible de sauvegarder les préférences')
    } finally {
      setSaving(false)
    }
  }

  const togglePreference = (key: keyof NotificationPreferences) => {
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

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Info */}
        <View style={[styles.infoCard, { backgroundColor: theme.withOpacity(theme.colors.primary[500], 0.1) }]}>
          <Ionicons name="information-circle" size={24} color={theme.colors.primary[500]} />
          <Text style={[styles.infoText, { color: theme.colors.primary[700] }]}>
            Choisissez comment vous souhaitez recevoir les notifications importantes de votre commerce.
          </Text>
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
          style={[styles.saveButton, { backgroundColor: theme.colors.primary[500] }]}
          onPress={handleSave}
          disabled={saving}
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
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
})

export default NotificationSettingsScreen
