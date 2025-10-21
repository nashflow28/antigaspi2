import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  View,
  FlatList,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  ActivityIndicator,
} from 'react-native'
import { useAppDispatch, useAppSelector } from '../../store/hooks'
import {
  fetchConversations,
  fetchConversationMessages,
  sendMerchantMessage,
  markConversationAsRead,
} from '../../store/slices/messagingSlice'
import { useTheme } from '../../theme'
import { Card, Typography, Button, Badge } from '../../components/2025'
import { TEST_IDS } from '../../utils/testIds'

const MerchantMessagingScreen: React.FC = () => {
  const dispatch = useAppDispatch()
  const theme = useTheme()
  const [selectedConversation, setSelectedConversation] = useState<number | null>(null)
  const [message, setMessage] = useState('')
  const {
    conversations,
    messagesByConversation,
    loadingConversations,
    loadingMessages,
    sendingMessage,
    error,
  } = useAppSelector((state) => state.messaging)
  const currentUserId = useAppSelector((state) => state.auth.user?.id)

  useEffect(() => {
    dispatch(fetchConversations(undefined))
  }, [dispatch])

  useEffect(() => {
    if (selectedConversation !== null) {
      dispatch(fetchConversationMessages({ conversationId: selectedConversation }))
      dispatch(markConversationAsRead(selectedConversation))
    }
  }, [dispatch, selectedConversation])

  const conversationMessages = useMemo(
    () => (selectedConversation !== null ? messagesByConversation[selectedConversation] || [] : []),
    [messagesByConversation, selectedConversation]
  )

  const handleSelectConversation = useCallback(
    (conversationId: number) => {
      setSelectedConversation(conversationId)
    },
    []
  )

  const selectedConversationDetails = useMemo(
    () =>
      selectedConversation !== null
        ? conversations.find(conversation => conversation.id === selectedConversation) ?? null
        : null,
    [conversations, selectedConversation]
  )

  const handleSendMessage = useCallback(() => {
    if (!message.trim()) {
      return
    }

    dispatch(
      sendMerchantMessage({
        conversationId: selectedConversation ?? undefined,
        merchantId: selectedConversationDetails?.merchant_id,
        merchantName: selectedConversationDetails?.merchant_name ?? null,
        message: message.trim(),
      })
    )
    setMessage('')
  }, [dispatch, message, selectedConversation, selectedConversationDetails])

  const renderConversation = useCallback(
    ({ item }: { item: (typeof conversations)[number] }) => (
      <Card
        variant={item.id === selectedConversation ? 'elevated' : 'outlined'}
        style={{
          marginBottom: theme.spacing.sm,
          padding: theme.spacing.md,
        }}
        onPress={() => handleSelectConversation(item.id)}
      >
        <View style={styles.conversationHeader}>
          <Typography variant="h4" weight="bold">
            {item.merchant_name || `Conversation #${item.id}`}
          </Typography>
          {item.unread_count > 0 ? (
            <Badge variant="primary" size="sm">
              {item.unread_count}
            </Badge>
          ) : null}
        </View>
        <Typography variant="body" color="secondary" numberOfLines={1}>
          {item.last_message_preview || 'Aucun message pour le moment'}
        </Typography>
        {item.last_message_at ? (
          <Typography variant="caption" color="secondary">
            {new Date(item.last_message_at).toLocaleString()}
          </Typography>
        ) : null}
      </Card>
    ),
    [handleSelectConversation, selectedConversation, theme.spacing]
  )

  const renderMessage = useCallback(
    ({ item }: { item: typeof conversationMessages[number] }) => (
      <View
        style={[
          styles.messageBubble,
          {
            backgroundColor:
              item.sender_id === currentUserId
                ? theme.colors.surface.default
                : theme.colors.surface.light,
            alignSelf: item.sender_id === currentUserId ? 'flex-end' : 'flex-start',
            borderColor: theme.colors.border,
          },
        ]}
      >
        <Typography variant="body" style={{ marginBottom: theme.spacing.xs }}>
          {item.message}
        </Typography>
        <Typography variant="caption" color="secondary">
          {new Date(item.created_at).toLocaleString()}
        </Typography>
      </View>
    ),
    [conversationMessages, currentUserId, theme.colors.border, theme.colors.surface, theme.spacing]
  )

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      behavior={Platform.select({ ios: 'padding', android: undefined })}
      testID={TEST_IDS.messagingScreen}
    >
      <View style={{ flex: 1, padding: theme.spacing.lg }}>
        <Typography variant="h2" weight="bold" style={{ marginBottom: theme.spacing.md }}>
          Messagerie commerçant
        </Typography>
        {error ? (
          <Typography variant="caption" color="error" style={{ marginBottom: theme.spacing.sm }}>
            {error}
          </Typography>
        ) : null}

        <View style={{ flex: 1, flexDirection: 'row', gap: theme.spacing.lg }}>
          <View style={{ flex: 1 }}>
            <Typography variant="h4" weight="bold" style={{ marginBottom: theme.spacing.sm }}>
              Conversations
            </Typography>
            {loadingConversations ? (
              <ActivityIndicator color={theme.colors.primary[500]} />
            ) : (
              <FlatList
                data={conversations}
                keyExtractor={(item) => `conversation-${item.id}`}
                renderItem={renderConversation}
                contentContainerStyle={{ paddingBottom: theme.spacing.lg }}
              />
            )}
          </View>

          <View style={{ flex: 2 }}>
            <Typography variant="h4" weight="bold" style={{ marginBottom: theme.spacing.sm }}>
              Messages
            </Typography>
            {selectedConversation === null ? (
              <Typography variant="body" color="secondary">
                Sélectionnez une conversation pour afficher les messages.
              </Typography>
            ) : loadingMessages[selectedConversation] ? (
              <ActivityIndicator color={theme.colors.primary[500]} />
            ) : (
              <FlatList
                data={conversationMessages}
                keyExtractor={(item) => `message-${item.id}`}
                renderItem={renderMessage}
                contentContainerStyle={{ paddingBottom: theme.spacing.lg }}
                inverted
              />
            )}
          </View>
        </View>
      </View>

      <View style={{ padding: theme.spacing.lg, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.colors.border }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm }}>
          <TextInput
            value={message}
            onChangeText={setMessage}
            placeholder="Écrire un message"
            style={[
              styles.input,
              {
                borderColor: theme.colors.border,
                backgroundColor: theme.colors.surface.light,
              },
            ]}
            editable={selectedConversation !== null}
          />
          <Button
            variant="primary"
            onPress={handleSendMessage}
            disabled={sendingMessage || selectedConversation === null}
          >
            Envoyer
          </Button>
        </View>
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  conversationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  messageBubble: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  input: {
    flex: 1,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: Platform.select({ ios: 12, android: 8 }),
  },
})

export default MerchantMessagingScreen
