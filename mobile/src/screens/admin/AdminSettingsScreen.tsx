import React, { useState, useEffect, useRef } from 'react'
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  StatusBar,
  ActivityIndicator,
  TextInput,
  Switch,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useTheme } from '../../theme'
import { Typography, Card, Button } from '../../components/2025'
import AlertModal from '../../components/AlertModal'
import { useAlert } from '../../hooks/useAlert'
import apiService from '../../services/api'

interface Setting {
  key: string
  value: any
  type: string
  description: string
}

interface SettingsData {
  general?: Setting[]
  commission?: Setting[]
  reservation?: Setting[]
  notifications?: Setting[]
  maintenance?: Setting[]
  limits?: Setting[]
}

const AdminSettingsScreen: React.FC = () => {
  const theme = useTheme()
  const insets = useSafeAreaInsets()
  const { alertProps, showError, showSuccess, showWarning, hideAlert } = useAlert()
  const isMountedRef = useRef(true)

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [settingsData, setSettingsData] = useState<SettingsData | null>(null)
  const [formData, setFormData] = useState<Record<string, any>>({})
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    general: true,
    commission: true,
    reservation: false,
    notifications: false,
    maintenance: false,
    limits: false,
  })

  useEffect(() => {
    isMountedRef.current = true
    loadSettings()

    return () => {
      isMountedRef.current = false
    }
  }, [])

  const loadSettings = async () => {
    try {
      if (isMountedRef.current) {
        setLoading(true)
      }

      const response = await apiService.get<{
        success: boolean
        data: SettingsData
      }>('/admin/settings')

      if (isMountedRef.current && response.success) {
        setSettingsData(response.data)

        // Populate form data
        const newFormData: Record<string, any> = {}
        Object.keys(response.data).forEach(group => {
          const groupSettings = response.data[group as keyof SettingsData]
          if (groupSettings) {
            groupSettings.forEach((setting: Setting) => {
              newFormData[setting.key] = setting.value
            })
          }
        })
        setFormData(newFormData)
      }
    } catch (error: any) {
      console.error('Error fetching settings:', error)
      if (isMountedRef.current) {
        showError('Erreur', error.response?.data?.message || 'Impossible de charger les paramètres')
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false)
        setRefreshing(false)
      }
    }
  }

  const saveSettings = async () => {
    showWarning(
      'Confirmer',
      'Voulez-vous enregistrer les modifications ?',
      [
        { text: 'Annuler', style: 'cancel', onPress: hideAlert },
        {
          text: 'Enregistrer',
          style: 'default',
          onPress: async () => {
            hideAlert()
            try {
              setSaving(true)

              const response = await apiService.put<{
                success: boolean
                message: string
                updated: string[]
                failed: string[]
              }>('/admin/settings', {
                settings: formData
              })

              if (response.success) {
                const updatedCount = response.updated.length
                const failedCount = response.failed.length

                if (updatedCount > 0) {
                  showSuccess(
                    'Succès',
                    `${updatedCount} paramètre(s) mis à jour${failedCount > 0 ? `. ${failedCount} échec(s).` : ''}`,
                    [{ text: 'OK', onPress: hideAlert }]
                  )
                }

                // Refresh settings
                await loadSettings()
              }
            } catch (error: any) {
              console.error('Error saving settings:', error)
              showError('Erreur', error.response?.data?.message || 'Impossible de sauvegarder les paramètres')
            } finally {
              setSaving(false)
            }
          },
        },
      ]
    )
  }

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  const updateFormValue = (key: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [key]: value
    }))
  }

  const formatLabel = (key: string): string => {
    return key
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  const onRefresh = () => {
    setRefreshing(true)
    loadSettings()
  }

  const renderSetting = (setting: Setting) => {
    const value = formData[setting.key]

    if (setting.type === 'boolean') {
      return (
        <View key={setting.key} style={styles.settingRow}>
          <View style={{ flex: 1 }}>
            <Typography variant="body" weight="medium">
              {formatLabel(setting.key)}
            </Typography>
            <Typography variant="caption" color="secondary" style={{ marginTop: 2 }}>
              {setting.description}
            </Typography>
          </View>
          <Switch
            value={Boolean(value)}
            onValueChange={(v) => updateFormValue(setting.key, v)}
            trackColor={{ false: theme.colors.neutral[300], true: theme.colors.primary[300] }}
            thumbColor={value ? theme.colors.primary[500] : theme.colors.neutral[100]}
          />
        </View>
      )
    }

    return (
      <View key={setting.key} style={styles.settingItem}>
        <Typography variant="body" weight="medium">
          {formatLabel(setting.key)}
        </Typography>
        <Typography variant="caption" color="secondary" style={{ marginTop: 2, marginBottom: 8 }}>
          {setting.description}
        </Typography>
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: theme.colors.surface.light,
              borderColor: theme.colors.border,
              color: theme.colors.text,
            }
          ]}
          value={String(value || '')}
          onChangeText={(text) => {
            if (setting.type === 'integer' || setting.type === 'decimal') {
              const numValue = setting.type === 'decimal' ? parseFloat(text) : parseInt(text)
              updateFormValue(setting.key, isNaN(numValue) ? '' : numValue)
            } else {
              updateFormValue(setting.key, text)
            }
          }}
          keyboardType={setting.type === 'integer' || setting.type === 'decimal' ? 'numeric' : 'default'}
          placeholder={setting.description}
          placeholderTextColor={theme.colors.neutral[400]}
        />
      </View>
    )
  }

  const renderSection = (title: string, key: keyof SettingsData, icon: string, settings?: Setting[]) => {
    if (!settings || settings.length === 0) return null

    const isExpanded = expandedSections[key]

    return (
      <Card key={key} variant="elevated" style={styles.sectionCard}>
        <Button
          variant="text"
          onPress={() => toggleSection(key)}
          style={styles.sectionHeader}
        >
          <View style={styles.sectionHeaderContent}>
            <View style={[styles.sectionIconContainer, { backgroundColor: theme.withOpacity(theme.colors.primary[500], 0.1) }]}>
              <Ionicons name={icon as any} size={20} color={theme.colors.primary[500]} />
            </View>
            <View style={{ flex: 1 }}>
              <Typography variant="h4" weight="semibold">
                {title}
              </Typography>
              <Typography variant="caption" color="secondary">
                {settings.length} paramètre(s)
              </Typography>
            </View>
            <Ionicons
              name={isExpanded ? 'chevron-up' : 'chevron-down'}
              size={20}
              color={theme.colors.neutral[400]}
            />
          </View>
        </Button>

        {isExpanded && (
          <View style={styles.sectionContent}>
            {settings.map(renderSetting)}
          </View>
        )}
      </Card>
    )
  }

  if (loading && !settingsData) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary[500]} />
        <Typography variant="body" color="secondary" style={{ marginTop: 12 }}>
          Chargement des paramètres...
        </Typography>
      </View>
    )
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.primary[500]} />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.colors.primary[500], paddingTop: insets.top + 10 }]}>
        <View style={styles.headerContent}>
          <View>
            <Typography variant="caption" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
              Administrateur
            </Typography>
            <Typography variant="h2" weight="bold" style={{ color: 'white' }}>
              Paramètres Système
            </Typography>
          </View>
          <Ionicons name="settings" size={32} color="white" />
        </View>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.colors.primary[500]]}
          />
        }
      >
        {renderSection('Général', 'general', 'information-circle', settingsData?.general)}
        {renderSection('Commission', 'commission', 'cash', settingsData?.commission)}
        {renderSection('Réservation', 'reservation', 'calendar', settingsData?.reservation)}
        {renderSection('Notifications', 'notifications', 'notifications', settingsData?.notifications)}
        {renderSection('Maintenance', 'maintenance', 'construct', settingsData?.maintenance)}
        {renderSection('Limites', 'limits', 'speedometer', settingsData?.limits)}

        {/* Save Button */}
        <Button
          variant="primary"
          size="lg"
          fullWidth
          onPress={saveSettings}
          disabled={saving}
          loading={saving}
          style={{ marginTop: 16, marginBottom: 32 }}
        >
          {saving ? 'Enregistrement...' : 'Enregistrer les modifications'}
        </Button>
      </ScrollView>

      <AlertModal {...alertProps} />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  sectionCard: {
    marginBottom: 16,
    padding: 0,
    overflow: 'hidden',
  },
  sectionHeader: {
    padding: 16,
  },
  sectionHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sectionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionContent: {
    padding: 16,
    paddingTop: 0,
  },
  settingItem: {
    marginBottom: 16,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
})

export default AdminSettingsScreen
