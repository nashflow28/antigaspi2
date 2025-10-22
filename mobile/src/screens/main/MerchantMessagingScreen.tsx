import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useSelector } from 'react-redux'
import { useTheme } from '../../theme'
import messagingService from '../../services/messagingService'
import type { Conversation, ConversationMessage } from '../../types'
import type { RootState } from '../../store'
import { Button, Typography } from '../../components/2025'

interface MerchantMessagingParams {
  merchantId?: number
  merchantName?: string
  conversationId?: number
}

interface MerchantMessagingScreenProps {
  route: { params: MerchantMessagingParams }
  navigation: any
}

const MESSAGE_PAGE_SIZE = 50

const MerchantMessagingScreen: React.FC<MerchantMessagingScreenProps> = ({ route, navigation }) => {
  const { merchantId, merchantName, conversationId } = route?.params ?? {}
  const theme = useTheme()
  const user = useSelector((state: RootState) => state.auth.user)
  const themedStyles = useMemo(() => styles(theme), [theme])

  const [activeConversationId, setActiveConversationId] = useState<number | null>(conversationId ?? null)
  const [conversation, setConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<ConversationMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [sending, setSending] = useState(false)
  const [messageDraft, setMessageDraft] = useState('')
  const [error, setError] = useState<string | null>(null)

  const resolvedTitle = useMemo(() => {
    if (merchantName) {
      return merchantName
    }

    if (conversation?.merchant) {
      const { first_name: firstName, last_name: lastName } = conversation.merchant
      return `${firstName ?? ''} ${lastName ?? ''}`.trim() || 'Discussion'
    }

    return 'Discussion'
  }, [conversation?.merchant, merchantName])

  const loadConversation = useCallback(
    async (showLoader: boolean = true) => {
      if (!merchantId && !conversationId && !activeConversationId) {
        setError("Impossible de charger la conversation. Merci de réessayer depuis la fiche du commerçant.")
        setLoading(false)
        setRefreshing(false)
        return
      }

      try {
        setError(null)
        if (showLoader) {
          setLoading(true)
        } else {
          setRefreshing(true)
        }

        const response = await messagingService.ensureConversation({
          conversationId: activeConversationId ?? conversationId ?? undefined,
          merchantId,
          perPage: MESSAGE_PAGE_SIZE,
        })

        setConversation(response.data.conversation)
        setMessages(response.data.messages)
        setActiveConversationId(response.data.conversation.id)
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Une erreur est survenue lors du chargement de la messagerie.'
        setError(message)
      } finally {
        setLoading(false)
        setRefreshing(false)
      }
    },
    [activeConversationId, conversationId, merchantId]
  )

  useEffect(() => {
    loadConversation(true)
  }, [loadConversation])

  const handleRefresh = useCallback(async () => {
    await loadConversation(false)
  }, [loadConversation])

  const handleSendMessage = useCallback(async () => {
    const trimmedMessage = messageDraft.trim()

    if (!trimmedMessage || !activeConversationId) {
      return
    }

    try {
      setSending(true)
      const response = await messagingService.sendMessage(activeConversationId, trimmedMessage)
      setConversation(response.data.conversation)
      setMessages(prev => [...prev, response.data.message])
      setMessageDraft('')
    } catch (err) {
      const message = err instanceof Error ? err.message : "Impossible d'envoyer votre message."
      setError(message)
      Alert.alert('Erreur', message)
    } finally {
      setSending(false)
    }
  }, [activeConversationId, messageDraft])

  const renderMessage = useCallback(
    ({ item }: { item: ConversationMessage }) => {
      const isMine = item.sender_id === user?.id
      const bubbleStyle = [themedStyles.messageBubble, isMine ? themedStyles.messageBubbleMine : themedStyles.messageBubbleOther]
      const containerStyle = [
        themedStyles.messageContainer,
        isMine ? themedStyles.messageContainerMine : themedStyles.messageContainerOther,
      ]
      const timestamp = new Date(item.created_at)
      const timeLabel = `${timestamp.toLocaleDateString()} • ${timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`

      return (
        <View style={containerStyle}>
          <View style={bubbleStyle}>
            <Typography variant="body" color={isMine ? 'inverse' : 'default'}>
              {item.content}
            </Typography>
            <Typography
              variant="caption"
              color={isMine ? 'inverse' : 'secondary'}
              style={{ marginTop: theme.spacing.xs, opacity: isMine ? 0.8 : 1 }}
            >
              {timeLabel}
            </Typography>
          </View>
        </View>
      )
    },
    [themedStyles, theme.spacing.xs, user?.id]
  )

  const keyExtractor = useCallback((item: ConversationMessage) => `message-${item.id}`, [])

  const headerComponent = (
    <View style={themedStyles.header}>
      <TouchableOpacity
        accessibilityRole="button"
        onPress={() => navigation.goBack()}
        style={themedStyles.headerBackButton}
      >
        <Ionicons name="chevron-back" size={20} color={theme.colors.text} />
      </TouchableOpacity>
      <View style={{ flex: 1 }}>
        <Typography variant="h3" weight="bold">
          {resolvedTitle}
        </Typography>
        {conversation?.merchant?.phone && (
          <Typography variant="caption" color="secondary">
            {conversation.merchant.phone}
          </Typography>
        )}
      </View>
    </View>
  )

  if (loading) {
    return (
      <View style={themedStyles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary[500]} />
        <Typography variant="body" color="secondary" style={{ marginTop: theme.spacing.md }}>
          Chargement de la messagerie…
        </Typography>
      </View>
    )
  }

  return (
    <KeyboardAvoidingView
      style={themedStyles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {headerComponent}

      {error && (
        <View style={themedStyles.errorContainer}>
          <Typography variant="body" color="error">
            {error}
          </Typography>
        </View>
      )}

      <FlatList
        data={messages}
        keyExtractor={keyExtractor}
        renderItem={renderMessage}
        style={themedStyles.list}
        contentContainerStyle={themedStyles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
        ListEmptyComponent={
          <View style={themedStyles.emptyState}>
            <Ionicons name="chatbubbles-outline" size={48} color={theme.colors.neutral[300]} />
            <Typography variant="h4" weight="semibold" style={{ marginTop: theme.spacing.md }}>
              Démarrez la conversation
            </Typography>
            <Typography variant="body" color="secondary" style={{ textAlign: 'center', marginTop: theme.spacing.sm }}>
              Posez une question au commerçant pour organiser votre prochaine réservation.
            </Typography>
          </View>
        }
      />

      <View style={themedStyles.composerContainer}>
        <TextInput
          value={messageDraft}
          onChangeText={setMessageDraft}
          placeholder="Écrivez votre message…"
          placeholderTextColor={theme.colors.neutral[400]}
          multiline
          style={themedStyles.input}
        />
        <Button
          variant="primary"
          size="sm"
          onPress={handleSendMessage}
          disabled={sending || !messageDraft.trim() || !activeConversationId}
          leftIcon={<Ionicons name="send" size={18} color={theme.colors.textInverse} />}
          style={themedStyles.sendButton}
        >
          Envoyer
        </Button>
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = (theme: ReturnType<typeof useTheme>) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
      paddingTop: Platform.OS === 'ios' ? theme.spacing.xl : theme.spacing.lg,
    },
    loadingContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: theme.spacing.lg,
      marginBottom: theme.spacing.md,
    },
    headerBackButton: {
      height: 40,
      width: 40,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.surface.light,
      marginRight: theme.spacing.md,
    },
    errorContainer: {
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.sm,
    },
    list: {
      flex: 1,
    },
    listContent: {
      paddingHorizontal: theme.spacing.lg,
      paddingBottom: theme.spacing.xl,
    },
    messageContainer: {
      flexDirection: 'row',
      marginBottom: theme.spacing.md,
    },
    messageContainerMine: {
      justifyContent: 'flex-end',
    },
    messageContainerOther: {
      justifyContent: 'flex-start',
    },
    messageBubble: {
      maxWidth: '80%',
      padding: theme.spacing.md,
      borderRadius: 16,
      ...theme.shadow('sm'),
    },
    messageBubbleMine: {
      backgroundColor: theme.colors.primary[500],
    },
    messageBubbleOther: {
      backgroundColor: theme.colors.surface.light,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    emptyState: {
      alignItems: 'center',
      paddingVertical: theme.spacing.xl,
    },
    composerContainer: {
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.md,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
      backgroundColor: theme.colors.surface.light,
      flexDirection: 'row',
      alignItems: 'flex-end',
      gap: theme.spacing.md,
    },
    input: {
      flex: 1,
      minHeight: 48,
      maxHeight: 120,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: theme.colors.border,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
      backgroundColor: theme.colors.background,
      color: theme.colors.text,
    },
    sendButton: {
      minWidth: 96,
      alignSelf: 'center',
    },
  })

export default MerchantMessagingScreen
