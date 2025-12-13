import React, { useCallback, useEffect, useMemo, useState, useRef } from 'react'
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
import { useSelector, useDispatch } from 'react-redux'
import { useTheme } from '../../theme'
import type { ConversationMessage } from '../../types'
import type { RootState, AppDispatch } from '../../store'
import { Button, Typography } from '../../components/2025'
import useWebSocket from '../../hooks/useWebSocket'
import {
  ensureConversation,
  sendMessage as sendMessageAction,
  selectMessages,
  selectTypingUsers,
  selectIsUserOnline,
  selectMessagingLoading,
  selectSendingMessage,
  selectMessagingError,
  setActiveConversation,
  clearError,
} from '../../store/slices/messagingSlice'
import { sanitizeMessage, sanitizeUsername } from '../../utils/textSanitizer'

interface MerchantMessagingParams {
  merchantId?: number
  merchantName?: string
  conversationId?: number
}

const MESSAGE_PAGE_SIZE = 50
const TYPING_DEBOUNCE_MS = 1000

const MerchantMessagingScreen = ({ route, navigation }: any) => {
  const { merchantId, merchantName, conversationId } = route?.params ?? {}
  const theme = useTheme()
  const dispatch = useDispatch<AppDispatch>()
  const themedStyles = useMemo(() => styles(theme), [theme])

  // Redux state
  const user = useSelector((state: RootState) => state.auth.user)
  const conversation = useSelector((state: RootState) => {
    const activeId = state.messaging.activeConversationId
    return state.messaging.conversations.find(c => c.id === activeId) || null
  })
  const activeConversationId = useSelector((state: RootState) => state.messaging.activeConversationId)
  const messages = useSelector((state: RootState) => selectMessages(activeConversationId || 0)(state))
  const typingUserIds = useSelector((state: RootState) => selectTypingUsers(activeConversationId || 0)(state))
  const loading = useSelector(selectMessagingLoading)
  const sendingMessage = useSelector(selectSendingMessage)
  const error = useSelector(selectMessagingError)

  // Local state
  const [messageDraft, setMessageDraft] = useState('')
  const [refreshing, setRefreshing] = useState(false)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const flatListRef = useRef<FlatList>(null)

  // WebSocket hook
  const { joinConversation, leaveConversation, sendTypingIndicator, isConnected } = useWebSocket()

  // Check if merchant is online
  const merchantUserId = conversation?.merchant?.id
  const isMerchantOnline = useSelector((state: RootState) =>
    merchantUserId ? selectIsUserOnline(merchantUserId)(state) : false
  )

  // Get typing user name
  const typingUserName = useMemo(() => {
    if (typingUserIds.length === 0) return null
    if (conversation?.merchant && typingUserIds.includes(conversation.merchant.id)) {
      return conversation.merchant.first_name || 'Le commerçant'
    }
    if (conversation?.consumer && typingUserIds.includes(conversation.consumer.id)) {
      return conversation.consumer.first_name || "L'utilisateur"
    }
    return 'Quelqu\'un'
  }, [typingUserIds, conversation])

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

  // Load conversation on mount
  useEffect(() => {
    const loadConversation = async () => {
      if (!merchantId && !conversationId) {
        return
      }

      try {
        await dispatch(
          ensureConversation({
            conversationId: conversationId ?? undefined,
            merchantId,
            perPage: MESSAGE_PAGE_SIZE,
          })
        ).unwrap()
      } catch (err) {
        // Error is handled in Redux state
      }
    }

    loadConversation()

    // Cleanup on unmount
    return () => {
      dispatch(setActiveConversation(null))
      dispatch(clearError())
      // BUG FIX #14: Cleanup typing timeout on unmount to prevent memory leak
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
        typingTimeoutRef.current = null
      }
    }
  }, [dispatch, merchantId, conversationId])

  // Join/leave conversation room for WebSocket updates
  useEffect(() => {
    if (activeConversationId && isConnected) {
      joinConversation(activeConversationId)

      return () => {
        leaveConversation(activeConversationId)
      }
    }
  }, [activeConversationId, isConnected, joinConversation, leaveConversation])

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (messages.length > 0 && flatListRef.current) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true })
      }, 100)
    }
  }, [messages.length])

  const handleRefresh = useCallback(async () => {
    if (!activeConversationId) return

    setRefreshing(true)
    try {
      await dispatch(
        ensureConversation({
          conversationId: activeConversationId,
          perPage: MESSAGE_PAGE_SIZE,
        })
      ).unwrap()
    } catch {
      // Error handled in Redux
    } finally {
      setRefreshing(false)
    }
  }, [dispatch, activeConversationId])

  const handleSendMessage = useCallback(async () => {
    const trimmedMessage = messageDraft.trim()

    if (!trimmedMessage || !activeConversationId) {
      return
    }

    // Stop typing indicator
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
      typingTimeoutRef.current = null
    }
    sendTypingIndicator(activeConversationId, false)

    try {
      await dispatch(
        sendMessageAction({
          conversationId: activeConversationId,
          content: trimmedMessage,
        })
      ).unwrap()
      setMessageDraft('')
    } catch (err) {
      const message = err instanceof Error ? err.message : "Impossible d'envoyer votre message."
      Alert.alert('Erreur', message)
    }
  }, [dispatch, activeConversationId, messageDraft, sendTypingIndicator])

  const handleTextChange = useCallback(
    (text: string) => {
      setMessageDraft(text)

      if (!activeConversationId) return

      // Send typing indicator with debounce
      sendTypingIndicator(activeConversationId, true)

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }

      typingTimeoutRef.current = setTimeout(() => {
        sendTypingIndicator(activeConversationId, false)
        typingTimeoutRef.current = null
      }, TYPING_DEBOUNCE_MS)
    },
    [activeConversationId, sendTypingIndicator]
  )

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
            {/* BUG FIX #7: Sanitize user-generated content for defense-in-depth */}
            <Typography variant="body" color={isMine ? 'inverse' : 'default'}>
              {sanitizeMessage(item.content)}
            </Typography>
            <View style={themedStyles.messageFooter}>
              <Typography
                variant="caption"
                color={isMine ? 'inverse' : 'secondary'}
                style={{ opacity: isMine ? 0.8 : 1 }}
              >
                {timeLabel}
              </Typography>
              {isMine && item.read_at && (
                <Ionicons
                  name="checkmark-done"
                  size={14}
                  color={theme.colors.primary[200]}
                  style={{ marginLeft: 4 }}
                />
              )}
            </View>
          </View>
        </View>
      )
    },
    [themedStyles, theme.colors.primary, user?.id]
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
        <View style={themedStyles.titleRow}>
          <Typography variant="h3" weight="bold">
            {resolvedTitle}
          </Typography>
          {isMerchantOnline && (
            <View style={themedStyles.onlineBadge}>
              <View style={themedStyles.onlineDot} />
              <Typography variant="caption" color="success">
                En ligne
              </Typography>
            </View>
          )}
        </View>
        {conversation?.merchant?.phone && (
          <Typography variant="caption" color="secondary">
            {conversation.merchant.phone}
          </Typography>
        )}
        {typingUserName && (
          <Typography variant="caption" color="primary" style={themedStyles.typingIndicator}>
            {typingUserName} est en train d'écrire...
          </Typography>
        )}
      </View>
    </View>
  )

  if (loading && !conversation) {
    return (
      <View style={themedStyles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary[500]} />
        <Typography variant="body" color="secondary" style={{ marginTop: theme.spacing.md }}>
          Chargement de la messagerie...
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
        ref={flatListRef}
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
        onContentSizeChange={() => {
          if (messages.length > 0) {
            flatListRef.current?.scrollToEnd({ animated: false })
          }
        }}
      />

      <View style={themedStyles.composerContainer}>
        <TextInput
          value={messageDraft}
          onChangeText={handleTextChange}
          placeholder="Écrivez votre message..."
          placeholderTextColor={theme.colors.neutral[400]}
          multiline
          style={themedStyles.input}
        />
        <Button
          variant="primary"
          size="sm"
          onPress={handleSendMessage}
          disabled={sendingMessage || !messageDraft.trim() || !activeConversationId}
          leftIcon={
            sendingMessage ? (
              <ActivityIndicator size="small" color={theme.colors.textInverse} />
            ) : (
              <Ionicons name="send" size={18} color={theme.colors.textInverse} />
            )
          }
          style={themedStyles.sendButton}
        >
          {sendingMessage ? '' : 'Envoyer'}
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
    titleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
    },
    onlineBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: theme.colors.success[50],
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 12,
    },
    onlineDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: theme.colors.success[500],
    },
    typingIndicator: {
      marginTop: 2,
      fontStyle: 'italic',
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
    messageFooter: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: theme.spacing.xs,
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
