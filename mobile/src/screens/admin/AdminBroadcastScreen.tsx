import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  StatusBar,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useTheme } from '../../theme'
import { Typography, Card, Button, Badge } from '../../components/2025'
import apiService from '../../services/api'
import { BroadcastNotification } from '../../types'
import { TEST_IDS } from '../../utils/testIds'

const AdminBroadcastScreen: React.FC = () => {
  const theme = useTheme()
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [selectedChannels, setSelectedChannels] = useState<
    ('database' | 'mail' | 'sms' | 'push')[]
  >(['database'])
  const [selectedRoles, setSelectedRoles] = useState<('consumer' | 'merchant' | 'admin')[]>([])
  const [actionUrl, setActionUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPayload, setShowPayload] = useState(false)
  const [payloadJson, setPayloadJson] = useState('')

  const CHANNELS = [
    { id: 'database' as const, label: 'Base de données', icon: 'server' },
    { id: 'mail' as const, label: 'Email', icon: 'mail' },
    { id: 'sms' as const, label: 'SMS', icon: 'chatbubble' },
    { id: 'push' as const, label: 'Push', icon: 'notifications' },
  ]

  const ROLES = [
    { id: 'consumer' as const, label: 'Consommateurs', icon: 'people' },
    { id: 'merchant' as const, label: 'Commerçants', icon: 'storefront' },
    { id: 'admin' as const, label: 'Administrateurs', icon: 'shield' },
  ]

  const toggleChannel = (channel: typeof selectedChannels[number]) => {
    setSelectedChannels((prev) =>
      prev.includes(channel) ? prev.filter((c) => c !== channel) : [...prev, channel]
    )
  }

  const toggleRole = (role: typeof selectedRoles[number]) => {
    setSelectedRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
    )
  }

  const validateForm = (): string | null => {
    if (!title.trim()) {
      return 'Le titre est requis'
    }
    if (title.length > 120) {
      return 'Le titre ne doit pas dépasser 120 caractères'
    }
    if (!message.trim()) {
      return 'Le message est requis'
    }
    if (message.length > 1000) {
      return 'Le message ne doit pas dépasser 1000 caractères'
    }
    if (selectedChannels.length === 0) {
      return 'Veuillez sélectionner au moins un canal'
    }
    if (payloadJson.trim()) {
      try {
        JSON.parse(payloadJson)
      } catch (e) {
        return 'Le payload JSON est invalide'
      }
    }
    return null
  }

  const handleSend = async () => {
    const validationError = validateForm()
    if (validationError) {
      Alert.alert('Erreur de validation', validationError)
      return
    }

    Alert.alert(
      'Confirmer l\'envoi',
      `Envoyer cette notification ${selectedRoles.length > 0 ? `aux ${selectedRoles.join(', ')}` : 'à tous les utilisateurs'} via ${selectedChannels.join(', ')} ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Envoyer',
          style: 'default',
          onPress: async () => {
            try {
              setLoading(true)

              const data: BroadcastNotification = {
                title: title.trim(),
                message: message.trim(),
                channels: selectedChannels,
              }

              if (selectedRoles.length > 0) {
                data.roles = selectedRoles
              }

              if (actionUrl.trim()) {
                data.action_url = actionUrl.trim()
              }

              if (payloadJson.trim()) {
                try {
                  data.payload = JSON.parse(payloadJson)
                } catch (e) {
                  // Already validated above
                }
              }

              const response = await apiService.sendBroadcastNotification(data)

              Alert.alert(
                'Succès',
                `Notification envoyée à ${response.sent_count} utilisateur(s)`,
                [
                  {
                    text: 'OK',
                    onPress: () => {
                      // Reset form
                      setTitle('')
                      setMessage('')
                      setActionUrl('')
                      setPayloadJson('')
                      setSelectedRoles([])
                      setSelectedChannels(['database'])
                    },
                  },
                ]
              )
            } catch (error: any) {
              console.error('Erreur envoi notification:', error)
              Alert.alert(
                'Erreur',
                error?.response?.data?.message || 'Impossible d\'envoyer la notification'
              )
            } finally {
              setLoading(false)
            }
          },
        },
      ]
    )
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]} testID={TEST_IDS.adminBroadcast}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.primary[500]} />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.colors.primary[500] }]}>
        <View style={styles.headerContent}>
          <View>
            <Typography variant="caption" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
              Administrateur
            </Typography>
            <Typography variant="h2" weight="bold" style={{ color: 'white' }}>
              Envoyer une notification
            </Typography>
          </View>
          <Ionicons name="megaphone" size={32} color="white" />
        </View>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Titre */}
        <Card variant="elevated" style={styles.card}>
          <Typography variant="h4" weight="semibold" style={styles.sectionTitle}>
            Titre de la notification
          </Typography>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: theme.colors.surface.light,
                borderColor: theme.colors.border,
                color: theme.colors.neutral[900],
              },
            ]}
            placeholder="Maximum 120 caractères"
            placeholderTextColor={theme.colors.neutral[400]}
            value={title}
            onChangeText={setTitle}
            maxLength={120}
            testID={TEST_IDS.broadcastTitleInput}
          />
          <Typography
            variant="caption"
            color="secondary"
            style={{ marginTop: 4, textAlign: 'right' }}
          >
            {title.length}/120
          </Typography>
        </Card>

        {/* Message */}
        <Card variant="elevated" style={styles.card}>
          <Typography variant="h4" weight="semibold" style={styles.sectionTitle}>
            Message
          </Typography>
          <TextInput
            style={[
              styles.textArea,
              {
                backgroundColor: theme.colors.surface.light,
                borderColor: theme.colors.border,
                color: theme.colors.neutral[900],
              },
            ]}
            placeholder="Maximum 1000 caractères"
            placeholderTextColor={theme.colors.neutral[400]}
            value={message}
            onChangeText={setMessage}
            maxLength={1000}
            multiline
            numberOfLines={6}
            textAlignVertical="top"
            testID={TEST_IDS.broadcastMessageInput}
          />
          <Typography
            variant="caption"
            color="secondary"
            style={{ marginTop: 4, textAlign: 'right' }}
          >
            {message.length}/1000
          </Typography>
        </Card>

        {/* Canaux */}
        <Card variant="elevated" style={styles.card}>
          <Typography variant="h4" weight="semibold" style={styles.sectionTitle}>
            Canaux de diffusion
          </Typography>
          <View style={styles.optionsGrid}>
            {CHANNELS.map((channel) => {
              const getChannelTestId = () => {
                switch (channel.id) {
                  case 'database': return TEST_IDS.channelDatabase
                  case 'mail': return TEST_IDS.channelMail
                  case 'sms': return TEST_IDS.channelSms
                  case 'push': return TEST_IDS.channelPush
                }
              }
              return (
              <TouchableOpacity
                key={channel.id}
                style={[
                  styles.optionButton,
                  {
                    backgroundColor: selectedChannels.includes(channel.id)
                      ? theme.colors.primary[100]
                      : theme.colors.surface.light,
                    borderColor: selectedChannels.includes(channel.id)
                      ? theme.colors.primary[500]
                      : theme.colors.border,
                  },
                ]}
                onPress={() => toggleChannel(channel.id)}
                testID={getChannelTestId()}
              >
                <Ionicons
                  name={channel.icon as any}
                  size={24}
                  color={
                    selectedChannels.includes(channel.id)
                      ? theme.colors.primary[500]
                      : theme.colors.neutral[400]
                  }
                />
                <Typography
                  variant="small"
                  weight={selectedChannels.includes(channel.id) ? 'semibold' : 'regular'}
                  style={{
                    color: selectedChannels.includes(channel.id)
                      ? theme.colors.primary[500]
                      : theme.colors.neutral[400],
                    marginTop: 4,
                  }}
                >
                  {channel.label}
                </Typography>
              </TouchableOpacity>
              )
            })}
          </View>
        </Card>

        {/* Rôles cibles */}
        <Card variant="elevated" style={styles.card}>
          <Typography variant="h4" weight="semibold" style={styles.sectionTitle}>
            Rôles cibles (optionnel)
          </Typography>
          <Typography variant="caption" color="secondary" style={{ marginBottom: 12 }}>
            Laisser vide pour envoyer à tous les utilisateurs
          </Typography>
          <View style={styles.optionsGrid}>
            {ROLES.map((role) => {
              const getRoleTestId = () => {
                switch (role.id) {
                  case 'consumer': return TEST_IDS.roleConsumer
                  case 'merchant': return TEST_IDS.roleMerchant
                  case 'admin': return TEST_IDS.roleAdmin
                }
              }
              return (
              <TouchableOpacity
                key={role.id}
                style={[
                  styles.optionButton,
                  {
                    backgroundColor: selectedRoles.includes(role.id)
                      ? theme.colors.primary[100]
                      : theme.colors.surface.light,
                    borderColor: selectedRoles.includes(role.id)
                      ? theme.colors.primary[500]
                      : theme.colors.border,
                  },
                ]}
                onPress={() => toggleRole(role.id)}
                testID={getRoleTestId()}
              >
                <Ionicons
                  name={role.icon as any}
                  size={24}
                  color={
                    selectedRoles.includes(role.id)
                      ? theme.colors.primary[500]
                      : theme.colors.neutral[400]
                  }
                />
                <Typography
                  variant="small"
                  weight={selectedRoles.includes(role.id) ? 'semibold' : 'regular'}
                  style={{
                    color: selectedRoles.includes(role.id)
                      ? theme.colors.primary[500]
                      : theme.colors.neutral[400],
                    marginTop: 4,
                  }}
                >
                  {role.label}
                </Typography>
              </TouchableOpacity>
              )
            })}
          </View>
        </Card>

        {/* URL d'action */}
        <Card variant="elevated" style={styles.card}>
          <Typography variant="h4" weight="semibold" style={styles.sectionTitle}>
            URL d'action (optionnel)
          </Typography>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: theme.colors.surface.light,
                borderColor: theme.colors.border,
                color: theme.colors.neutral[900],
              },
            ]}
            placeholder="https://example.com/action"
            placeholderTextColor={theme.colors.neutral[400]}
            value={actionUrl}
            onChangeText={setActionUrl}
            keyboardType="url"
            autoCapitalize="none"
            testID={TEST_IDS.actionUrlInput}
          />
        </Card>

        {/* Payload JSON */}
        <Card variant="elevated" style={styles.card}>
          <TouchableOpacity
            style={styles.sectionHeader}
            onPress={() => setShowPayload(!showPayload)}
          >
            <Typography variant="h4" weight="semibold">
              Payload JSON (optionnel)
            </Typography>
            <Ionicons
              name={showPayload ? 'chevron-up' : 'chevron-down'}
              size={20}
              color={theme.colors.neutral[400]}
            />
          </TouchableOpacity>
          {showPayload && (
            <TextInput
              style={[
                styles.textArea,
                {
                  backgroundColor: theme.colors.surface.light,
                  borderColor: theme.colors.border,
                  color: theme.colors.neutral[900],
                  fontFamily: 'monospace',
                },
              ]}
              placeholder='{"key": "value"}'
              placeholderTextColor={theme.colors.neutral[400]}
              value={payloadJson}
              onChangeText={setPayloadJson}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          )}
        </Card>

        {/* Preview */}
        {(title.trim() || message.trim()) && (
          <Card variant="elevated" style={styles.card}>
            <Typography variant="h4" weight="semibold" style={styles.sectionTitle}>
              Aperçu
            </Typography>
            <View
              style={[
                styles.preview,
                { backgroundColor: theme.colors.primary[50], borderColor: theme.colors.primary[200] },
              ]}
              testID={TEST_IDS.broadcastPreview}
            >
              <View style={styles.previewHeader}>
                <Ionicons name="notifications" size={20} color={theme.colors.primary[500]} />
                <Typography variant="small" weight="semibold" style={{ flex: 1, marginLeft: 8 }}>
                  {title || 'Titre de la notification'}
                </Typography>
              </View>
              <Typography variant="body" style={{ marginTop: 8 }}>
                {message || 'Message de la notification'}
              </Typography>
              {selectedChannels.length > 0 && (
                <View style={styles.previewBadges}>
                  {selectedChannels.map((channel) => (
                    <Badge key={channel} variant="primary" size="sm" style={{ marginRight: 6 }}>
                      {channel}
                    </Badge>
                  ))}
                </View>
              )}
            </View>
          </Card>
        )}

        {/* Bouton d'envoi */}
        <Button
          variant="primary"
          size="lg"
          fullWidth
          onPress={handleSend}
          disabled={loading || !title.trim() || !message.trim() || selectedChannels.length === 0}
          loading={loading}
          testID={TEST_IDS.sendBroadcastButton}
        >
          {loading ? 'Envoi en cours...' : 'Envoyer la notification'}
        </Button>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 50,
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
  card: {
    marginBottom: 16,
    padding: 16,
  },
  sectionTitle: {
    marginBottom: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 120,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
  },
  optionButton: {
    width: '48%',
    margin: '1%',
    padding: 16,
    borderRadius: 8,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  preview: {
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  previewBadges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
  },
})

export default AdminBroadcastScreen
